const prisma = require('../models/prismaClient');

const create = async (organizationId, data) => {
    return prisma.item.create({
        data: { ...data, organizationId },
    });
};

const findAll = async (organizationId, { page = 1, limit = 20, search, isActive }) => {
    const skip = (page - 1) * limit;
    const where = { organizationId };

    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (search) {
        where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { sku: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
        ];
    }

    const [items, total] = await Promise.all([
        prisma.item.findMany({ where, skip, take: Number(limit), orderBy: { createdAt: 'desc' } }),
        prisma.item.count({ where }),
    ]);

    return { items, total, page: Number(page), totalPages: Math.ceil(total / limit) };
};

const findById = async (organizationId, id) => {
    const item = await prisma.item.findFirst({ where: { id, organizationId } });
    if (!item) {
        const error = new Error('Item not found');
        error.statusCode = 404;
        throw error;
    }
    return item;
};

const update = async (organizationId, id, data) => {
    await findById(organizationId, id);
    return prisma.item.update({ where: { id }, data });
};

const remove = async (organizationId, id) => {
    await findById(organizationId, id);
    return prisma.item.delete({ where: { id } });
};

module.exports = { create, findAll, findById, update, remove };
