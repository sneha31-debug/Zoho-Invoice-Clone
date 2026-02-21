const authService = require('../services/authService');
const prisma = require('../models/prismaClient');

const register = async (req, res, next) => {
    try {
        const result = await authService.register(req.body);
        res.status(201).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

const login = async (req, res, next) => {
    try {
        const result = await authService.login(req.body);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

const getMe = async (req, res, next) => {
    try {
        const user = await authService.getProfile(req.user.id);
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
};

const updateProfile = async (req, res, next) => {
    try {
        const { firstName, lastName, phone } = req.body;
        const user = await prisma.user.update({
            where: { id: req.user.id },
            data: { firstName, lastName, phone },
            include: { organization: true },
        });
        const { password: _, ...userWithoutPassword } = user;
        res.json({ success: true, data: userWithoutPassword });
    } catch (error) { next(error); }
};

const updateOrganization = async (req, res, next) => {
    try {
        const { name, email, phone, address, city, state, zipCode, country, taxId, currency, website } = req.body;
        const org = await prisma.organization.update({
            where: { id: req.user.organizationId },
            data: { name, email, phone, address, city, state, zipCode, country, taxId, currency, website },
        });
        res.json({ success: true, data: org });
    } catch (error) { next(error); }
};

module.exports = { register, login, getMe, updateProfile, updateOrganization };
