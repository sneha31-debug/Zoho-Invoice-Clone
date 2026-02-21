const cron = require('node-cron');
const prisma = require('../models/prismaClient');

/**
 * Check for overdue invoices and mark them as OVERDUE.
 * Creates notifications for org admins/managers.
 */
const processOverdueInvoices = async () => {
    const now = new Date();
    console.log(`⏰ [Overdue Cron] Running at ${now.toISOString()}`);

    try {
        // Find invoices past due date that are still SENT or PARTIALLY_PAID
        const overdueInvoices = await prisma.invoice.findMany({
            where: {
                dueDate: { lt: now },
                status: { in: ['SENT', 'PARTIALLY_PAID'] },
            },
            include: { customer: { select: { displayName: true } }, organization: { select: { id: true } } },
        });

        if (overdueInvoices.length === 0) {
            console.log('  ✅ No newly overdue invoices.');
            return;
        }

        console.log(`  ⚠️  Found ${overdueInvoices.length} overdue invoice(s).`);

        for (const inv of overdueInvoices) {
            // Mark as overdue
            await prisma.invoice.update({
                where: { id: inv.id },
                data: { status: 'OVERDUE' },
            });

            // Log activity
            await prisma.activityLog.create({
                data: {
                    invoiceId: inv.id,
                    action: 'overdue',
                    details: `Invoice is ${Math.floor((now - new Date(inv.dueDate)) / 86400000)} days past due`,
                },
            });

            // Create notifications for all admins/managers in the org
            const orgUsers = await prisma.user.findMany({
                where: {
                    organizationId: inv.organizationId,
                    isActive: true,
                    role: { in: ['ADMIN', 'MANAGER'] },
                },
                select: { id: true },
            });

            for (const user of orgUsers) {
                await prisma.notification.create({
                    data: {
                        type: 'overdue',
                        title: `Invoice ${inv.invoiceNumber} is overdue`,
                        message: `Invoice for ${inv.customer?.displayName || 'customer'} — $${inv.balanceDue.toLocaleString()} is past due.`,
                        userId: user.id,
                        organizationId: inv.organizationId,
                    },
                });
            }

            console.log(`  📌 Marked ${inv.invoiceNumber} as OVERDUE, notified ${orgUsers.length} user(s).`);
        }
    } catch (err) {
        console.error('  ❌ Overdue cron error:', err.message);
    }
};

/**
 * Start the overdue invoice cron.
 * Runs daily at 8:00 AM.
 */
const startOverdueInvoiceCron = () => {
    cron.schedule('0 8 * * *', processOverdueInvoices);
    console.log('📌 Overdue invoice cron scheduled (runs daily at 8 AM)');

    // Run once at startup after a delay
    setTimeout(processOverdueInvoices, 8000);
};

module.exports = { startOverdueInvoiceCron, processOverdueInvoices };
