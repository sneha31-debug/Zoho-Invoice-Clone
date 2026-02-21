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

        const logoUrl = `/uploads/${req.file.filename}`;

        // Get current organization to delete old logo if exists
        const org = await prisma.organization.findUnique({
            where: { id: req.user.organizationId },
            select: { logo: true }
        });

        if (org.logo && org.logo.startsWith('/uploads/')) {
            const oldPath = path.join(__dirname, '../../public', org.logo);
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }

        const updatedOrg = await prisma.organization.update({
            where: { id: req.user.organizationId },
            data: { logo: logoUrl }
        });

        res.json({ success: true, data: updatedOrg });
    } catch (error) { next(error); }
};

module.exports = {
    getOrganization,
    updateOrganization,
    uploadLogo
};
