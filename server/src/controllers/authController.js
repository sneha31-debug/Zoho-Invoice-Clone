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

const getUsers = async (req, res, next) => {
    try {
        const users = await prisma.user.findMany({
            where: { organizationId: req.user.organizationId },
            select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true, createdAt: true, phone: true },
            orderBy: { createdAt: 'asc' },
        });
        res.json({ success: true, data: users });
    } catch (error) { next(error); }
};

const inviteUser = async (req, res, next) => {
    try {
        const { email, password, firstName, lastName, role } = req.body;
        const bcrypt = require('bcryptjs');
        const hashed = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: { email, password: hashed, firstName, lastName, role: role || 'STAFF', organizationId: req.user.organizationId },
            select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true, createdAt: true },
        });
        res.status(201).json({ success: true, data: user });
    } catch (error) {
        if (error.code === 'P2002') { const e = new Error('Email already exists'); e.statusCode = 400; return next(e); }
        next(error);
    }
};

const updateUser = async (req, res, next) => {
    try {
        const { role, isActive } = req.body;
        const data = {};
        if (role !== undefined) data.role = role;
        if (isActive !== undefined) data.isActive = isActive;
        const user = await prisma.user.update({
            where: { id: req.params.id },
            data,
            select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true },
        });
        res.json({ success: true, data: user });
    } catch (error) { next(error); }
};

module.exports = { register, login, getMe, updateProfile, updateOrganization, getUsers, inviteUser, updateUser };
