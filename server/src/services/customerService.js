const prisma = require('../models/prismaClient');

const create = async (organizationId, data) => {
    return prisma.customer.create({
        data: { ...data, organizationId },
    });
};

const findAll = async (organizationId, { page = 1, limit = 20, search, isActive }) => {
    const skip = (page - 1) * limit;
    const where = { organizationId };

    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (search) {
        where.OR = [
            { displayName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { companyName: { contains: search, mode: 'insensitive' } },
        ];
    }

    const [customers, total] = await Promise.all([
        prisma.customer.findMany({ where, skip, take: Number(limit), orderBy: { createdAt: 'desc' } }),
        prisma.customer.count({ where }),
    ]);

    return { customers, total, page: Number(page), totalPages: Math.ceil(total / limit) };
};

const findById = async (organizationId, id) => {
    const customer = await prisma.customer.findFirst({
        where: { id, organizationId },
        include: { invoices: true, quotes: true, payments: true },
    });
    if (!customer) {
        const error = new Error('Customer not found');
        error.statusCode = 404;
        throw error;
    }
    return customer;
};

const update = async (organizationId, id, data) => {
    await findById(organizationId, id);
    return prisma.customer.update({ where: { id }, data });
};

const remove = async (organizationId, id) => {
    await findById(organizationId, id);
    return prisma.customer.delete({ where: { id } });
};

module.exports = { create, findAll, findById, update, remove };
