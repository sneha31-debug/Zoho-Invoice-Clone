const itemService = require('../services/itemService');

const create = async (req, res, next) => {
    try {
        const item = await itemService.create(req.user.organizationId, req.body);
        res.status(201).json({ success: true, data: item });
    } catch (error) {
        next(error);
    }
};

const findAll = async (req, res, next) => {
    try {
        const result = await itemService.findAll(req.user.organizationId, req.query);
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

const findById = async (req, res, next) => {
    try {
        const item = await itemService.findById(req.user.organizationId, req.params.id);
        res.json({ success: true, data: item });
    } catch (error) {
        next(error);
    }
};

const update = async (req, res, next) => {
    try {
        const item = await itemService.update(req.user.organizationId, req.params.id, req.body);
        res.json({ success: true, data: item });
    } catch (error) {
        next(error);
    }
};

const remove = async (req, res, next) => {
    try {
        await itemService.remove(req.user.organizationId, req.params.id);
        res.json({ success: true, message: 'Item deleted successfully' });
    } catch (error) {
        next(error);
    }
};

module.exports = { create, findAll, findById, update, remove };
