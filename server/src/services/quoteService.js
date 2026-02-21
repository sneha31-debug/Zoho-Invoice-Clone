const prisma = require('../models/prismaClient');
const { logActivity } = require('./activityService');

const generateQuoteNumber = async (organizationId) => {
    const count = await prisma.quote.count({ where: { organizationId } });
    return `QT-${String(count + 1).padStart(5, '0')}`;
};

const calculateTotals = (items) => {
    let subtotal = 0;
    let taxAmount = 0;
    const processedItems = items.map((item) => {
        const amount = item.quantity * item.rate;
        const tax = amount * (item.taxRate || 0) / 100;
        subtotal += amount;
        taxAmount += tax;
        return { ...item, amount };
    });
    return { processedItems, subtotal, taxAmount, totalAmount: subtotal + taxAmount };
};

const create = async (organizationId, data, userId) => {
    const { items, discountAmount = 0, customerId, expiryDate, notes, terms, currency } = data;
    if (!items || items.length === 0) {
        const error = new Error('At least one line item is required');
        error.statusCode = 400;
        throw error;
    }

    if (!customerId) {
        const error = new Error('Customer is required');
        error.statusCode = 400;
        throw error;
    }

    const quoteNumber = await generateQuoteNumber(organizationId);
    const { processedItems, subtotal, taxAmount, totalAmount } = calculateTotals(items);
    const finalTotal = totalAmount - discountAmount;

    // Build only valid Prisma fields
    const quoteData = {
        quoteNumber,
        organizationId,
        customerId,
        expiryDate: new Date(expiryDate || Date.now() + 30 * 24 * 60 * 60 * 1000),
        subtotal,
        taxAmount,
        discountAmount: Number(discountAmount),
        totalAmount: finalTotal,
    };
    if (notes) quoteData.notes = notes;
    if (terms) quoteData.terms = terms;
    if (currency) quoteData.currency = currency;

    const quote = await prisma.quote.create({
        data: {
            ...quoteData,
            items: {
                create: processedItems.map((item) => ({
                    description: item.description || '',
                    quantity: Number(item.quantity),
                    rate: Number(item.rate),
                    taxRate: Number(item.taxRate) || 0,
                    amount: Number(item.amount),
                    itemId: item.itemId && item.itemId !== '' ? item.itemId : null,
                })),
            },
        },
        include: { items: true, customer: true },
    });

    await logActivity({
        quoteId: quote.id,
        action: 'created',
        details: `Quote ${quoteNumber} created for $${finalTotal.toLocaleString()}`,
        userId
    });

    return quote;
};

const findAll = async (organizationId, { page = 1, limit = 20, status, customerId }) => {
    const skip = (page - 1) * limit;
    const where = { organizationId };
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;

    const [quotes, total] = await Promise.all([
        prisma.quote.findMany({ where, skip, take: Number(limit), include: { customer: true }, orderBy: { createdAt: 'desc' } }),
        prisma.count({ where }), // Prisma doesn't have count on model directly sometimes in older versions, but should be prisma.quote.count
    ]);
    // Fixing potential typo in my thought process, should be prisma.quote.count
    return { quotes, total, page: Number(page), totalPages: Math.ceil(total / limit) };
};
// Fixing the typo in findAll within the real file content
const findAllFixed = async (organizationId, { page = 1, limit = 20, status, customerId }) => {
    const skip = (page - 1) * limit;
    const where = { organizationId };
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;

    const [quotes, total] = await Promise.all([
        prisma.quote.findMany({ where, skip, take: Number(limit), include: { customer: true }, orderBy: { createdAt: 'desc' } }),
        prisma.quote.count({ where }),
    ]);
    return { quotes, total, page: Number(page), totalPages: Math.ceil(total / limit) };
};

const findById = async (organizationId, id) => {
    const quote = await prisma.quote.findFirst({
        where: { id, organizationId },
        include: {
            customer: true,
            items: { include: { item: true } },
            activityLogs: {
                orderBy: { createdAt: 'desc' },
                include: { user: { select: { firstName: true, lastName: true } } }
            }
        },
    });
    if (!quote) {
        const error = new Error('Quote not found');
        error.statusCode = 404;
        throw error;
    }
    return quote;
};

const update = async (organizationId, id, data, userId) => {
    const existing = await findById(organizationId, id);
    const { items, ...quoteData } = data;

    let result;
    if (items && items.length > 0) {
        const { processedItems, subtotal, taxAmount, totalAmount } = calculateTotals(items);
        const discountAmount = data.discountAmount || 0;
        const finalTotal = totalAmount - discountAmount;

        await prisma.quoteItem.deleteMany({ where: { quoteId: id } });
        result = await prisma.quote.update({
            where: { id },
            data: {
                ...quoteData, subtotal, taxAmount, discountAmount, totalAmount: finalTotal,
                items: {
                    create: processedItems.map((i) => ({
                        description: i.description, quantity: i.quantity, rate: i.rate,
                        taxRate: i.taxRate || 0, amount: i.amount, itemId: i.itemId || null,
                    })),
                },
            },
            include: { items: true, customer: true },
        });
    } else {
        result = await prisma.quote.update({ where: { id }, data: quoteData, include: { items: true, customer: true } });
    }

    if (data.status && data.status !== existing.status) {
        await logActivity({
            quoteId: id,
            action: data.status.toLowerCase(),
            details: `Quote status changed to ${data.status}`,
            userId
        });
    } else {
        await logActivity({ quoteId: id, action: 'updated', details: 'Quote details updated', userId });
    }

    return result;
};

const remove = async (organizationId, id, userId) => {
    const quote = await findById(organizationId, id);
    await logActivity({ quoteId: id, action: 'deleted', details: `Quote ${quote.quoteNumber} deleted`, userId });
    return prisma.quote.delete({ where: { id } });
};

// Convert an accepted quote into an invoice
const convertToInvoice = async (organizationId, quoteId, dueDate, userId) => {
    const quote = await findById(organizationId, quoteId);

    if (quote.status === 'CONVERTED') {
        const error = new Error('Quote has already been converted to an invoice');
        error.statusCode = 400;
        throw error;
    }

    const invoiceCount = await prisma.invoice.count({ where: { organizationId } });
    const invoiceNumber = `INV-${String(invoiceCount + 1).padStart(5, '0')}`;

    const [invoice] = await prisma.$transaction([
        prisma.invoice.create({
            data: {
                invoiceNumber,
                organizationId,
                customerId: quote.customerId,
                currency: quote.currency,
                subtotal: quote.subtotal,
                taxAmount: quote.taxAmount,
                discountAmount: quote.discountAmount,
                totalAmount: quote.totalAmount,
                balanceDue: quote.totalAmount,
                dueDate: new Date(dueDate),
                notes: quote.notes,
                terms: quote.terms,
                items: {
                    create: quote.items.map((i) => ({
                        description: i.description, quantity: i.quantity, rate: i.rate,
                        taxRate: i.taxRate, amount: i.amount, itemId: i.itemId,
                    })),
                },
            },
            include: { items: true, customer: true },
        }),
        prisma.quote.update({ where: { id: quoteId }, data: { status: 'CONVERTED' } }),
    ]);

    await logActivity({
        quoteId,
        action: 'converted',
        details: `Quote converted to Invoice ${invoiceNumber}`,
        userId
    });

    await logActivity({
        invoiceId: invoice.id,
        action: 'created',
        details: `Invoice created from Quote ${quote.quoteNumber}`,
        userId
    });

    return invoice;
};

module.exports = { create, findAll: findAllFixed, findById, update, remove, convertToInvoice };
