const prisma = require('../models/prismaClient');
const path = require('path');
const fs = require('fs');

const getOrganization = async (req, res, next) => {
    try {
        const org = await prisma.organization.findUnique({
            where: { id: req.user.organizationId }
        });
        res.json({ success: true, data: org });
    } catch (error) { next(error); }
};

const updateOrganization = async (req, res, next) => {
    try {
        const org = await prisma.organization.update({
            where: { id: req.user.organizationId },
            data: req.body
        });
        res.json({ success: true, data: org });
    } catch (error) { next(error); }
};

const uploadLogo = async (req, res, next) => {
    try {
        if (!req.file) {
            const error = new Error('No file uploaded');
            error.statusCode = 400;
            return next(error);
        }

        const logoUrl = `/public/uploads/${req.file.filename}`;

        // Get current organization to delete old logo if exists
        const org = await prisma.organization.findUnique({
            where: { id: req.user.organizationId },
            select: { logo: true }
        });

        if (org.logo && (org.logo.startsWith('/uploads/') || org.logo.startsWith('/public/uploads/'))) {
            const relPath = org.logo.startsWith('/public/') ? org.logo.replace('/public/', '') : org.logo.replace('/', '');
            const oldPath = path.join(__dirname, '../../public', relPath);
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }

        const updatedOrg = await prisma.organization.update({
            where: { id: req.user.organizationId },
            data: { logo: logoUrl }
        });

        res.json({ success: true, data: updatedOrg });
    } catch (error) { next(error); }
};

const deleteLogo = async (req, res, next) => {
    try {
        const org = await prisma.organization.findUnique({
            where: { id: req.user.organizationId },
            select: { logo: true }
        });

        if (org.logo && (org.logo.startsWith('/uploads/') || org.logo.startsWith('/public/uploads/'))) {
            const relPath = org.logo.startsWith('/public/') ? org.logo.replace('/public/', '') : org.logo.replace('/', '');
            const oldPath = path.join(__dirname, '../../public', relPath);
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }

        const updatedOrg = await prisma.organization.update({
            where: { id: req.user.organizationId },
            data: { logo: null }
        });

        res.json({ success: true, data: updatedOrg });
    } catch (error) { next(error); }
};

module.exports = {
    getOrganization,
    updateOrganization,
    uploadLogo,
    deleteLogo
};
