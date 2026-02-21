const prisma = require('../models/prismaClient');

const create = async (organizationId, data) => {
    const count = await prisma.recurringInvoice.count({ where: { organizationId } });
    const profileName = data.profileName || `Recurring-${count + 1}`;

    return prisma.recurringInvoice.create({
        data: {
            profileName,
            organizationId,
            customerId: data.customerId,
            frequency: data.frequency || 'monthly',
            startDate: new Date(data.startDate),
            endDate: data.endDate ? new Date(data.endDate) : null,
            nextInvoiceDate: new Date(data.startDate),
            currency: data.currency || 'USD',
            subtotal: Number(data.subtotal) || 0,
            taxAmount: Number(data.taxAmount) || 0,
            totalAmount: Number(data.totalAmount) || 0,
            notes: data.notes || null,
            terms: data.terms || null,
            isActive: true,
        },
        include: { customer: true },
    });
};

const findAll = async (organizationId, { page = 1, limit = 20 }) => {
    const skip = (page - 1) * limit;
    const [recurringInvoices, total] = await Promise.all([
        prisma.recurringInvoice.findMany({
            where: { organizationId },
            skip, take: Number(limit),
            include: { customer: true },
            orderBy: { createdAt: 'desc' },
        }),
        prisma.recurringInvoice.count({ where: { organizationId } }),
    ]);
    return { recurringInvoices, total, page: Number(page), totalPages: Math.ceil(total / limit) };
};

const findById = async (organizationId, id) => {
    const ri = await prisma.recurringInvoice.findFirst({
        where: { id, organizationId },
        include: { customer: true },
    });
    if (!ri) { const e = new Error('Recurring invoice not found'); e.statusCode = 404; throw e; }
    return ri;
};

const update = async (organizationId, id, data) => {
    await findById(organizationId, id);
    const updateData = {};
    if (data.profileName) updateData.profileName = data.profileName;
    if (data.frequency) updateData.frequency = data.frequency;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.startDate) updateData.startDate = new Date(data.startDate);
    if (data.endDate) updateData.endDate = new Date(data.endDate);
    if (data.notes !== undefined) updateData.notes = data.notes;

    return prisma.recurringInvoice.update({
        where: { id },
        data: updateData,
        include: { customer: true },
    });
};

const remove = async (organizationId, id) => {
    await findById(organizationId, id);
    return prisma.recurringInvoice.delete({ where: { id } });
};

module.exports = { create, findAll, findById, update, remove };
