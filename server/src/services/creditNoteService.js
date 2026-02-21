const prisma = require('../models/prismaClient');

const generateNumber = async (organizationId) => {
    const count = await prisma.creditNote.count({ where: { organizationId } });
    return `CN-${String(count + 1).padStart(5, '0')}`;
};

const create = async (organizationId, data) => {
    const creditNoteNumber = await generateNumber(organizationId);
    const cleanData = {
        creditNoteNumber,
        organizationId,
        customerId: data.customerId,
        amount: Number(data.amount),
        reason: data.reason || null,
        notes: data.notes || null,
    };
    if (data.invoiceId && data.invoiceId !== '') cleanData.invoiceId = data.invoiceId;
    if (data.date) cleanData.date = new Date(data.date);

    return prisma.creditNote.create({
        data: cleanData,
        include: { customer: true, invoice: true },
    });
};

const findAll = async (organizationId, { page = 1, limit = 20 }) => {
    const skip = (page - 1) * limit;
    const [creditNotes, total] = await Promise.all([
        prisma.creditNote.findMany({
            where: { organizationId },
            skip, take: Number(limit),
            include: { customer: true, invoice: true },
            orderBy: { createdAt: 'desc' },
        }),
        prisma.creditNote.count({ where: { organizationId } }),
    ]);
    return { creditNotes, total, page: Number(page), totalPages: Math.ceil(total / limit) };
};

const findById = async (organizationId, id) => {
    const cn = await prisma.creditNote.findFirst({
        where: { id, organizationId },
        include: { customer: true, invoice: true },
    });
    if (!cn) { const e = new Error('Credit note not found'); e.statusCode = 404; throw e; }
    return cn;
};

const remove = async (organizationId, id) => {
    await findById(organizationId, id);
    return prisma.creditNote.delete({ where: { id } });
};

module.exports = { create, findAll, findById, remove };
