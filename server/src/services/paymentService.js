const prisma = require('../models/prismaClient');

const generatePaymentNumber = async (organizationId) => {
    const count = await prisma.payment.count({ where: { organizationId } });
    return `PAY-${String(count + 1).padStart(5, '0')}`;
};

const create = async (organizationId, data) => {
    const paymentNumber = await generatePaymentNumber(organizationId);

    // Sanitize: empty invoiceId → null, ensure amount is a number
    const cleanData = {
        ...data,
        paymentNumber,
        organizationId,
        amount: Number(data.amount),
        invoiceId: data.invoiceId && data.invoiceId !== '' ? data.invoiceId : null,
    };
    if (data.paymentDate) cleanData.paymentDate = new Date(data.paymentDate);

    // Create payment and update invoice balance if linked
    const payment = await prisma.$transaction(async (tx) => {
        const newPayment = await tx.payment.create({
            data: cleanData,
            include: { customer: true, invoice: true },
        });

        if (data.invoiceId) {
            const invoice = await tx.invoice.findUnique({ where: { id: data.invoiceId } });
            if (invoice) {
                const newAmountPaid = invoice.amountPaid + data.amount;
                const newBalanceDue = invoice.totalAmount - newAmountPaid;
                const newStatus = newBalanceDue <= 0 ? 'PAID' : newAmountPaid > 0 ? 'PARTIALLY_PAID' : invoice.status;

                await tx.invoice.update({
                    where: { id: data.invoiceId },
                    data: { amountPaid: newAmountPaid, balanceDue: Math.max(0, newBalanceDue), status: newStatus },
                });

                // Log activity
                await tx.activityLog.create({
                    data: { invoiceId: data.invoiceId, action: 'payment_received', details: `Payment ${paymentNumber} of $${data.amount} received` },
                });
            }
        }
        return newPayment;
    });
    return payment;
};

const findAll = async (organizationId, { page = 1, limit = 20, customerId, method, status }) => {
    const skip = (page - 1) * limit;
    const where = { organizationId };
    if (customerId) where.customerId = customerId;
    if (method) where.method = method;
    if (status) where.status = status;

    const [payments, total] = await Promise.all([
        prisma.payment.findMany({ where, skip, take: Number(limit), include: { customer: true, invoice: true }, orderBy: { createdAt: 'desc' } }),
        prisma.payment.count({ where }),
    ]);
    return { payments, total, page: Number(page), totalPages: Math.ceil(total / limit) };
};

const findById = async (organizationId, id) => {
    const payment = await prisma.payment.findFirst({
        where: { id, organizationId },
        include: { customer: true, invoice: true },
    });
    if (!payment) {
        const error = new Error('Payment not found');
        error.statusCode = 404;
        throw error;
    }
    return payment;
};

const update = async (organizationId, id, data) => {
    await findById(organizationId, id);
    return prisma.payment.update({ where: { id }, data, include: { customer: true, invoice: true } });
};

module.exports = { create, findAll, findById, update };
