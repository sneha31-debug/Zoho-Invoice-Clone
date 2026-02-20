const prisma = require('../models/prismaClient');

const create = async (organizationId, userId, data) => {
    return prisma.expense.create({
        data: { ...data, organizationId, userId },
        include: { user: { select: { firstName: true, lastName: true, email: true } }, customer: true },
    });
};

const findAll = async (organizationId, { page = 1, limit = 20, category, isBillable, userId }) => {
    const skip = (page - 1) * limit;
    const where = { organizationId };
    if (category) where.category = category;
    if (isBillable !== undefined) where.isBillable = isBillable === 'true';
    if (userId) where.userId = userId;

    const [expenses, total] = await Promise.all([
        prisma.expense.findMany({
            where, skip, take: Number(limit),
            include: { user: { select: { firstName: true, lastName: true } }, customer: true },
            orderBy: { date: 'desc' },
        }),
        prisma.expense.count({ where }),
    ]);
    return { expenses, total, page: Number(page), totalPages: Math.ceil(total / limit) };
};

const findById = async (organizationId, id) => {
    const expense = await prisma.expense.findFirst({
        where: { id, organizationId },
        include: { user: { select: { firstName: true, lastName: true, email: true } }, customer: true },
    });
    if (!expense) {
        const error = new Error('Expense not found');
        error.statusCode = 404;
        throw error;
    }
    return expense;
};

const update = async (organizationId, id, data) => {
    await findById(organizationId, id);
    return prisma.expense.update({ where: { id }, data, include: { user: { select: { firstName: true, lastName: true } }, customer: true } });
};

const remove = async (organizationId, id) => {
    await findById(organizationId, id);
    return prisma.expense.delete({ where: { id } });
};

module.exports = { create, findAll, findById, update, remove };
