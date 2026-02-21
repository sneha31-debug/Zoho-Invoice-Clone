const prisma = require('../models/prismaClient');

const generateInvoiceNumber = async (organizationId) => {
    const count = await prisma.invoice.count({ where: { organizationId } });
    return `INV-${String(count + 1).padStart(5, '0')}`;
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
    const { items, discountAmount = 0, customerId, dueDate, notes, terms, currency } = data;

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

    const invoiceNumber = await generateInvoiceNumber(organizationId);
    const { processedItems, subtotal, taxAmount, totalAmount } = calculateTotals(items);
    const finalTotal = totalAmount - discountAmount;

    // Build only valid Prisma fields
    const invoiceData = {
        invoiceNumber,
        organizationId,
        customerId,
        dueDate: new Date(dueDate),
        subtotal,
        taxAmount,
        discountAmount: Number(discountAmount),
        totalAmount: finalTotal,
        balanceDue: finalTotal,
    };
    if (notes) invoiceData.notes = notes;
    if (terms) invoiceData.terms = terms;
    if (currency) invoiceData.currency = currency;

    return prisma.invoice.create({
        data: {
            ...invoiceData,
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
};

const findAll = async (organizationId, { page = 1, limit = 20, status, customerId, search }) => {
    const skip = (page - 1) * limit;
    const where = { organizationId };

    if (status) where.status = status;
    if (customerId) where.customerId = customerId;
    if (search) {
        where.OR = [
            { invoiceNumber: { contains: search, mode: 'insensitive' } },
            { customer: { displayName: { contains: search, mode: 'insensitive' } } },
        ];
    }

    const [invoices, total] = await Promise.all([
        prisma.invoice.findMany({
            where,
            skip,
            take: Number(limit),
            include: { customer: true, items: true },
            orderBy: { createdAt: 'desc' },
        }),
        prisma.invoice.count({ where }),
    ]);

    return { invoices, total, page: Number(page), totalPages: Math.ceil(total / limit) };
};

const findById = async (organizationId, id) => {
    const invoice = await prisma.invoice.findFirst({
        where: { id, organizationId },
        include: { customer: true, items: { include: { item: true } }, payments: true, activityLogs: true },
    });
    if (!invoice) {
        const error = new Error('Invoice not found');
        error.statusCode = 404;
        throw error;
    }
    return invoice;
};

const update = async (organizationId, id, data) => {
    await findById(organizationId, id);
    const { items, ...invoiceData } = data;

    // If items are provided, recalculate totals and replace line items
    if (items && items.length > 0) {
        const { processedItems, subtotal, taxAmount, totalAmount } = calculateTotals(items);
        const discountAmount = data.discountAmount || 0;
        const finalTotal = totalAmount - discountAmount;

        // Delete existing items and create new ones
        await prisma.invoiceItem.deleteMany({ where: { invoiceId: id } });

        return prisma.invoice.update({
            where: { id },
            data: {
                ...invoiceData,
                subtotal,
                taxAmount,
                discountAmount,
                totalAmount: finalTotal,
                balanceDue: finalTotal - (invoiceData.amountPaid || 0),
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
    }

    return prisma.invoice.update({
        where: { id },
        data: invoiceData,
        include: { items: true, customer: true },
    });
};

const remove = async (organizationId, id) => {
    await findById(organizationId, id);
    return prisma.invoice.delete({ where: { id } });
};

module.exports = { create, findAll, findById, update, remove };
