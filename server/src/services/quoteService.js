const prisma = require('../models/prismaClient');

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

const create = async (organizationId, data) => {
    const { items, discountAmount = 0, ...quoteData } = data;
    if (!items || items.length === 0) {
        const error = new Error('At least one line item is required');
        error.statusCode = 400;
        throw error;
    }

    const quoteNumber = await generateQuoteNumber(organizationId);
    const { processedItems, subtotal, taxAmount, totalAmount } = calculateTotals(items);

    return prisma.quote.create({
        data: {
            ...quoteData,
            quoteNumber,
            organizationId,
            subtotal,
            taxAmount,
            discountAmount,
            totalAmount: totalAmount - discountAmount,
            items: {
                create: processedItems.map((item) => ({
                    description: item.description,
                    quantity: item.quantity,
                    rate: item.rate,
                    taxRate: item.taxRate || 0,
                    amount: item.amount,
                    itemId: item.itemId || null,
                })),
            },
        },
        include: { items: true, customer: true },
    });
};

const findAll = async (organizationId, { page = 1, limit = 20, status, customerId }) => {
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
        include: { customer: true, items: { include: { item: true } } },
    });
    if (!quote) {
        const error = new Error('Quote not found');
        error.statusCode = 404;
        throw error;
    }
    return quote;
};

const update = async (organizationId, id, data) => {
    await findById(organizationId, id);
    const { items, ...quoteData } = data;

    if (items && items.length > 0) {
        const { processedItems, subtotal, taxAmount, totalAmount } = calculateTotals(items);
        const discountAmount = data.discountAmount || 0;
        await prisma.quoteItem.deleteMany({ where: { quoteId: id } });
        return prisma.quote.update({
            where: { id },
            data: {
                ...quoteData, subtotal, taxAmount, discountAmount, totalAmount: totalAmount - discountAmount,
                items: {
                    create: processedItems.map((i) => ({
                        description: i.description, quantity: i.quantity, rate: i.rate,
                        taxRate: i.taxRate || 0, amount: i.amount, itemId: i.itemId || null,
                    })),
                },
            },
            include: { items: true, customer: true },
        });
    }
    return prisma.quote.update({ where: { id }, data: quoteData, include: { items: true, customer: true } });
};

const remove = async (organizationId, id) => {
    await findById(organizationId, id);
    return prisma.quote.delete({ where: { id } });
};

// Convert an accepted quote into an invoice
const convertToInvoice = async (organizationId, quoteId, dueDate) => {
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

    return invoice;
};

module.exports = { create, findAll, findById, update, remove, convertToInvoice };
