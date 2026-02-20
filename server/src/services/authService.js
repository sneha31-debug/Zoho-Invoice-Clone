const prisma = require('../models/prismaClient');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/env');

const generateToken = (user) => {
    return jwt.sign(
        { id: user.id, email: user.email, organizationId: user.organizationId, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
};

const register = async ({ email, password, firstName, lastName, phone, organizationName }) => {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        const error = new Error('User with this email already exists');
        error.statusCode = 400;
        throw error;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create organization and user in a transaction
    const result = await prisma.$transaction(async (tx) => {
        const organization = await tx.organization.create({
            data: { name: organizationName || `${firstName}'s Organization` },
        });

        const user = await tx.user.create({
            data: {
                email,
                password: hashedPassword,
                firstName,
                lastName,
                phone,
                role: 'ADMIN',
                organizationId: organization.id,
            },
        });

        return { user, organization };
    });

    const token = generateToken(result.user);
    const { password: _, ...userWithoutPassword } = result.user;

    return { user: userWithoutPassword, organization: result.organization, token };
};

const login = async ({ email, password }) => {
    const user = await prisma.user.findUnique({
        where: { email },
        include: { organization: true },
    });

    if (!user) {
        const error = new Error('Invalid email or password');
        error.statusCode = 401;
        throw error;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        const error = new Error('Invalid email or password');
        error.statusCode = 401;
        throw error;
    }

    if (!user.isActive) {
        const error = new Error('Account is inactive. Contact your administrator.');
        error.statusCode = 403;
        throw error;
    }

    const token = generateToken(user);
    const { password: _, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, token };
};

const getProfile = async (userId) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { organization: true },
    });

    if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
};

module.exports = { register, login, getProfile };
