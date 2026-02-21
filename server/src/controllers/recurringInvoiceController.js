const service = require('../services/recurringInvoiceService');

const create = async (req, res, next) => {
    try {
        const data = await service.create(req.user.organizationId, req.body);
        res.status(201).json({ success: true, data });
    } catch (error) { next(error); }
};

const getAll = async (req, res, next) => {
    try {
        const data = await service.findAll(req.user.organizationId, req.query);
        res.json({ success: true, data });
    } catch (error) { next(error); }
};

const getById = async (req, res, next) => {
    try {
        const data = await service.findById(req.user.organizationId, req.params.id);
        res.json({ success: true, data });
    } catch (error) { next(error); }
};

const update = async (req, res, next) => {
    try {
        const data = await service.update(req.user.organizationId, req.params.id, req.body);
        res.json({ success: true, data });
    } catch (error) { next(error); }
};

const remove = async (req, res, next) => {
    try {
        await service.remove(req.user.organizationId, req.params.id);
        res.json({ success: true, message: 'Deleted' });
    } catch (error) { next(error); }
};

module.exports = { create, getAll, getById, update, remove };
