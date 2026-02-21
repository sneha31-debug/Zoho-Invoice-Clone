const prisma = require('../models/prismaClient');

const getAll = async (req, res, next) => {
    try {
        const notifications = await prisma.notification.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
        const unreadCount = await prisma.notification.count({
            where: { userId: req.user.id, isRead: false },
        });
        res.json({ success: true, data: { notifications, unreadCount } });
    } catch (error) { next(error); }
};

const markRead = async (req, res, next) => {
    try {
        await prisma.notification.update({
            where: { id: req.params.id },
            data: { isRead: true },
        });
        res.json({ success: true });
    } catch (error) { next(error); }
};

const markAllRead = async (req, res, next) => {
    try {
        await prisma.notification.updateMany({
            where: { userId: req.user.id, isRead: false },
            data: { isRead: true },
        });
        res.json({ success: true });
    } catch (error) { next(error); }
};

module.exports = { getAll, markRead, markAllRead };
