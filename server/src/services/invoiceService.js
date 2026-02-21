const prisma = require('../models/prismaClient');
const { logActivity } = require('./activityService');

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

const create = async (organizationId, data, userId) => {
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

    const invoiceData = {
        invoiceNumber, organizationId, customerId,
        dueDate: new Date(dueDate), subtotal, taxAmount,
        discountAmount: Number(discountAmount),
        totalAmount: finalTotal, balanceDue: finalTotal,
    };
    if (notes) invoiceData.notes = notes;
    if (terms) invoiceData.terms = terms;
    if (currency) invoiceData.currency = currency;

    const invoice = await prisma.invoice.create({
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

    await logActivity({
        invoiceId: invoice.id,
        action: 'created',
        details: `Invoice ${invoiceNumber} created for $${finalTotal.toLocaleString()}`,
        userId
    });
    return invoice;
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
            where, skip, take: Number(limit),
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
        include: {
            customer: true,
            items: { include: { item: true } },
            payments: true,
            activityLogs: { orderBy: { createdAt: 'desc' }, include: { user: { select: { firstName: true, lastName: true } } } },
        },
    });
    if (!invoice) {
        const error = new Error('Invoice not found');
        error.statusCode = 404;
        throw error;
    }
    return invoice;
};

const findByIdForPDF = async (organizationId, id) => {
    const invoice = await prisma.invoice.findFirst({
        where: { id, organizationId },
        include: {
            customer: true,
            items: true,
            organization: true,
        },
    });
    if (!invoice) {
        const error = new Error('Invoice not found');
        error.statusCode = 404;
        throw error;
    }
    return invoice;
};

const update = async (organizationId, id, data, userId) => {
    const existing = await findById(organizationId, id);
    const { items, ...invoiceData } = data;

    let result;
    if (items && items.length > 0) {
        const { processedItems, subtotal, taxAmount, totalAmount } = calculateTotals(items);
        const discountAmount = data.discountAmount || 0;
        const finalTotal = totalAmount - discountAmount;

        await prisma.invoiceItem.deleteMany({ where: { invoiceId: id } });
        result = await prisma.invoice.update({
            where: { id },
            data: {
                ...invoiceData, subtotal, taxAmount, discountAmount,
                totalAmount: finalTotal,
                balanceDue: finalTotal - (invoiceData.amountPaid || 0),
                items: {
                    create: processedItems.map((item) => ({
                        description: item.description, quantity: item.quantity,
                        rate: item.rate, taxRate: item.taxRate || 0,
                        amount: item.amount, itemId: item.itemId || null,
                    })),
                },
            },
            include: { items: true, customer: true },
        });
    } else {
        result = await prisma.invoice.update({
            where: { id }, data: invoiceData,
            include: { items: true, customer: true },
        });
    }

    // Auto-log status changes
    if (data.status && data.status !== existing.status) {
        const actionMap = { SENT: 'sent', PAID: 'paid', OVERDUE: 'overdue', VOID: 'voided', VIEWED: 'viewed' };
        const action = actionMap[data.status] || 'updated';
        const detail = data.status === 'PAID'
            ? `Invoice marked as paid — $${(existing.totalAmount || 0).toLocaleString()}`
            : `Invoice status changed to ${data.status}`;
        await logActivity({ invoiceId: id, action, details: detail, userId });
    } else {
        await logActivity({ invoiceId: id, action: 'updated', details: 'Invoice details updated', userId });
    }

    return result;
};

const remove = async (organizationId, id, userId) => {
    const inv = await findById(organizationId, id);
    await logActivity({ invoiceId: id, action: 'deleted', details: `Invoice ${inv.invoiceNumber} deleted`, userId });
    return prisma.invoice.delete({ where: { id } });
};

module.exports = { create, findAll, findById, findByIdForPDF, update, remove };
