const cron = require('node-cron');
const prisma = require('../models/prismaClient');

/**
 * Advance a date by the given frequency.
 */
const advanceDate = (date, frequency) => {
    const d = new Date(date);
    switch (frequency) {
        case 'weekly': d.setDate(d.getDate() + 7); break;
        case 'biweekly': d.setDate(d.getDate() + 14); break;
        case 'monthly': d.setMonth(d.getMonth() + 1); break;
        case 'quarterly': d.setMonth(d.getMonth() + 3); break;
        case 'yearly': d.setFullYear(d.getFullYear() + 1); break;
        default: d.setMonth(d.getMonth() + 1); break;
    }
    return d;
};

/**
 * Generate a unique invoice number for the organization.
 */
const generateInvoiceNumber = async (organizationId) => {
    const count = await prisma.invoice.count({ where: { organizationId } });
    return `INV-${String(count + 1).padStart(5, '0')}`;
};

/**
 * Process all due recurring invoices.
 * Finds active profiles where nextInvoiceDate <= now (and endDate hasn't passed),
 * creates a real Invoice for each, and advances nextInvoiceDate.
 */
const processRecurringInvoices = async () => {
    const now = new Date();
    console.log(`⏰ [Recurring Cron] Running at ${now.toISOString()}`);

    try {
        const dueProfiles = await prisma.recurringInvoice.findMany({
            where: {
                isActive: true,
                nextInvoiceDate: { lte: now },
                OR: [
                    { endDate: null },
                    { endDate: { gte: now } },
                ],
            },
            include: { customer: true },
        });

        if (dueProfiles.length === 0) {
            console.log('  ✅ No recurring invoices due.');
            return;
        }

        console.log(`  📋 Found ${dueProfiles.length} recurring invoice(s) to generate.`);

        for (const profile of dueProfiles) {
            try {
                const invoiceNumber = await generateInvoiceNumber(profile.organizationId);
                const dueDate = advanceDate(profile.nextInvoiceDate, profile.frequency);

                // Create the real invoice
                const invoice = await prisma.invoice.create({
                    data: {
                        invoiceNumber,
                        organizationId: profile.organizationId,
                        customerId: profile.customerId,
                        dueDate,
                        subtotal: profile.subtotal,
                        taxAmount: profile.taxAmount,
                        totalAmount: profile.totalAmount,
                        balanceDue: profile.totalAmount,
                        currency: profile.currency,
                        notes: profile.notes ? `[Auto-generated from ${profile.profileName}] ${profile.notes}` : `Auto-generated from ${profile.profileName}`,
                        terms: profile.terms || null,
                        status: 'DRAFT',
                    },
                });

                // Log the activity
                await prisma.activityLog.create({
                    data: {
                        invoiceId: invoice.id,
                        action: 'created',
                        details: `Auto-generated from recurring profile "${profile.profileName}" (${profile.frequency})`,
                    },
                });

                // Advance nextInvoiceDate
                const nextDate = advanceDate(profile.nextInvoiceDate, profile.frequency);

                // If next date exceeds endDate, deactivate the profile
                const shouldDeactivate = profile.endDate && nextDate > profile.endDate;

                await prisma.recurringInvoice.update({
                    where: { id: profile.id },
                    data: {
                        nextInvoiceDate: nextDate,
                        isActive: shouldDeactivate ? false : true,
                    },
                });

                console.log(`  ✅ Created ${invoiceNumber} for ${profile.customer.displayName} ($${profile.totalAmount}) — next: ${nextDate.toLocaleDateString()}`);
            } catch (err) {
                console.error(`  ❌ Failed to process profile "${profile.profileName}" (${profile.id}):`, err.message);
            }
        }
    } catch (err) {
        console.error('  ❌ Recurring cron error:', err.message);
    }
};

/**
 * Start the cron scheduler.
 * Runs every hour at minute 0 — checks for due recurring invoices.
 */
const startRecurringInvoiceCron = () => {
    // Run every hour at :00
    cron.schedule('0 * * * *', processRecurringInvoices);
    console.log('🔄 Recurring invoice cron scheduled (runs every hour)');

    // Also run once at startup to catch any missed invoices
    setTimeout(processRecurringInvoices, 5000);
};

module.exports = { startRecurringInvoiceCron, processRecurringInvoices };
