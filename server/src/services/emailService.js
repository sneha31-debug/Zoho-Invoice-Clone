const nodemailer = require('nodemailer');
const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, NODE_ENV } = require('../config/env');

// Configure transporter - only if SMTP_HOST is provided
let transporter = null;
if (SMTP_HOST) {
    transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT || 587,
        secure: SMTP_PORT == 465,
        auth: SMTP_USER ? {
            user: SMTP_USER,
            pass: SMTP_PASS
        } : undefined
    });
}

/**
 * Send an invoice via email with PDF attachment
 * @param {Object} invoice - Invoice object with customer and organization details
 * @param {Buffer} pdfBuffer - The generated PDF buffer
 * @param {String} recipientEmail - Optional different recipient
 */
const sendInvoiceEmail = async (invoice, pdfBuffer, recipientEmail) => {
    const to = recipientEmail || invoice.customer.email;
    const orgName = invoice.organization.name;

    if (!to) {
        throw new Error('No recipient email provided');
    }

    const mailOptions = {
        from: `"${orgName}" <no-reply@zoho-clone.com>`,
        to,
        subject: `Invoice ${invoice.invoiceNumber} from ${orgName}`,
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                <h2 style="color: #4f46e5;">Invoice ${invoice.invoiceNumber}</h2>
                <p>Hi ${invoice.customer.displayName},</p>
                <p>Please find the attached invoice for <strong>${invoice.currency} ${invoice.totalAmount.toLocaleString()}</strong>.</p>
                <p>The due date is <strong>${new Date(invoice.dueDate).toLocaleDateString()}</strong>.</p>
                <div style="margin: 30px 0;">
                    <a href="http://localhost:3000/public/invoice/${invoice.id}" style="background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">View & Pay Online</a>
                </div>
                <p style="color: #64748b; font-size: 14px;">Regards,<br>${orgName}</p>
            </div>
        `,
        attachments: [
            {
                filename: `Invoice-${invoice.invoiceNumber}.pdf`,
                content: pdfBuffer
            }
        ]
    };

    if (transporter) {
        try {
            return await transporter.sendMail(mailOptions);
        } catch (error) {
            console.error('❌ SMTP Error:', error.message);
            if (NODE_ENV === 'production') throw error;
            // Fallback for dev: log and continue
        }
    }

    console.log('---------------------------------------------------------');
    console.log(`📧 [DEV MODE] Email to: ${to}`);
    console.log(`📝 Subject: ${mailOptions.subject}`);
    console.log(`🔗 Link: http://localhost:3000/public/invoice/${invoice.id}`);
    console.log('---------------------------------------------------------');

    return { messageId: 'dev-mode-fake-id' };
};

module.exports = { sendInvoiceEmail };
