const prisma = require('../models/prismaClient');

/**
 * Log an activity for an invoice or quote
 * @param {Object} params
 * @param {string} [params.invoiceId]
 * @param {string} [params.quoteId]
 * @param {string} params.action - e.g. "created", "sent", "viewed", "paid", "converted"
 * @param {string} [params.details]
 * @param {string} [params.userId]
 */
const logActivity = async ({ invoiceId, quoteId, action, details, userId }) => {
    return prisma.activityLog.create({
        data: {
            invoiceId: invoiceId || null,
            quoteId: quoteId || null,
            action,
            details: details || null,
            userId: userId || null,
        },
    });
};

/*
# Phase 4 — UI/UX Polish & Bug Fixes
- [x] Fix "Send Email" visibility logic in InvoiceDetail
- [x] Fix Calculation Bug in Create/Edit Invoice
- [x] Logo Refinement
*/

/**
 * Get activity logs for an invoice or quote
 * @param {Object} params
 * @param {string} [params.invoiceId]
 * @param {string} [params.quoteId]
 */
const getActivities = async ({ invoiceId, quoteId }) => {
    const where = {};
    if (invoiceId) where.invoiceId = invoiceId;
    if (quoteId) where.quoteId = quoteId;

    if (!invoiceId && !quoteId) return [];

    return prisma.activityLog.findMany({
        where,
        include: {
            user: {
                select: {
                    firstName: true,
                    lastName: true,
                    email: true
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });
};

module.exports = { logActivity, getActivities };
