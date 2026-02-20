const prisma = require('../models/prismaClient');

const create = async (organizationId, userId, data) => {
    return prisma.timeEntry.create({
        data: { ...data, organizationId, userId },
        include: { user: { select: { firstName: true, lastName: true } }, customer: true },
    });
};

const findAll = async (organizationId, { page = 1, limit = 20, isBillable, isBilled, userId, customerId }) => {
    const skip = (page - 1) * limit;
    const where = { organizationId };
    if (isBillable !== undefined) where.isBillable = isBillable === 'true';
    if (isBilled !== undefined) where.isBilled = isBilled === 'true';
    if (userId) where.userId = userId;
    if (customerId) where.customerId = customerId;

    const [timeEntries, total] = await Promise.all([
        prisma.timeEntry.findMany({
            where, skip, take: Number(limit),
            include: { user: { select: { firstName: true, lastName: true } }, customer: true },
            orderBy: { date: 'desc' },
        }),
        prisma.timeEntry.count({ where }),
    ]);
    return { timeEntries, total, page: Number(page), totalPages: Math.ceil(total / limit) };
};

const findById = async (organizationId, id) => {
    const entry = await prisma.timeEntry.findFirst({
        where: { id, organizationId },
        include: { user: { select: { firstName: true, lastName: true, email: true } }, customer: true },
    });
    if (!entry) {
        const error = new Error('Time entry not found');
        error.statusCode = 404;
        throw error;
    }
    return entry;
};

const update = async (organizationId, id, data) => {
    await findById(organizationId, id);
    return prisma.timeEntry.update({ where: { id }, data, include: { user: { select: { firstName: true, lastName: true } }, customer: true } });
};

const remove = async (organizationId, id) => {
    await findById(organizationId, id);
    return prisma.timeEntry.delete({ where: { id } });
};

module.exports = { create, findAll, findById, update, remove };
