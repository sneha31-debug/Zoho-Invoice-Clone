const Razorpay = require('razorpay');
const crypto = require('crypto');
const prisma = require('../models/prismaClient');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const createOrder = async (req, res, next) => {
    try {
        const { invoiceId } = req.body;

        const invoice = await prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: { customer: true }
        });

        if (!invoice) {
            const error = new Error('Invoice not found');
            error.statusCode = 404;
            return next(error);
        }

        const options = {
            amount: Math.round(invoice.balanceDue * 100), // amount in the smallest currency unit (paise for INR)
            currency: invoice.currency === 'INR' ? 'INR' : 'USD', // Razorpay supports multiple but INR is default for many
            receipt: invoice.id,
            notes: {
                invoiceId: invoice.id,
                organizationId: req.user.organizationId,
                customerId: invoice.customerId
            }
        };

        const order = await razorpay.orders.create(options);

        res.json({
            success: true,
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: process.env.RAZORPAY_KEY_ID // Frontend needs this to open the checkout
        });
    } catch (error) { next(error); }
};

const handleWebhook = async (req, res, next) => {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];

    const shasum = crypto.createHmac('sha256', secret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest('hex');

    if (digest !== signature) {
        return res.status(400).json({ error: 'Invalid signature' });
    }

    // Handle events
    const event = req.body.event;
    if (event === 'payment.captured') {
        const payload = req.body.payload.payment.entity;
        const notes = payload.notes;
        const { invoiceId, organizationId, customerId } = notes;

        try {
            await prisma.$transaction(async (tx) => {
                // 1. Create Payment record
                await tx.payment.create({
                    data: {
                        paymentNumber: `PAY-${Date.now()}`,
                        amount: payload.amount / 100,
                        method: 'RAZORPAY',
                        status: 'COMPLETED',
                        reference: payload.id,
                        invoiceId: invoiceId,
                        organizationId: organizationId,
                        customerId: customerId,
                    }
                });

                // 2. Update Invoice
                const invoice = await tx.invoice.findUnique({ where: { id: invoiceId } });
                const newAmountPaid = invoice.amountPaid + (payload.amount / 100);
                const newBalanceDue = invoice.totalAmount - newAmountPaid;

                await tx.invoice.update({
                    where: { id: invoiceId },
                    data: {
                        amountPaid: newAmountPaid,
                        balanceDue: newBalanceDue,
                        status: newBalanceDue <= 0 ? 'PAID' : 'PARTIALLY_PAID'
                    }
                });

                // 3. Log activity
                await tx.activityLog.create({
                    data: {
                        action: 'paid',
                        details: `Razorpay payment of ${payload.amount / 100} received. Ref: ${payload.id}`,
                        invoiceId: invoiceId
                    }
                });
            });
        } catch (dbError) {
            console.error('Webhook DB Error:', dbError);
            return res.status(500).json({ error: 'Failed to process payment' });
        }
    }

    res.json({ status: 'ok' });
};

module.exports = { createOrder, handleWebhook };
