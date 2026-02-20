const customerService = require('../services/customerService');

const create = async (req, res, next) => {
    try {
        const customer = await customerService.create(req.user.organizationId, req.body);
        res.status(201).json({ success: true, data: customer });
    } catch (error) {
        next(error);
    }
};

const findAll = async (req, res, next) => {
    try {
        const result = await customerService.findAll(req.user.organizationId, req.query);
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

const findById = async (req, res, next) => {
    try {
        const customer = await customerService.findById(req.user.organizationId, req.params.id);
        res.json({ success: true, data: customer });
    } catch (error) {
        next(error);
    }
};

const update = async (req, res, next) => {
    try {
        const customer = await customerService.update(req.user.organizationId, req.params.id, req.body);
        res.json({ success: true, data: customer });
    } catch (error) {
        next(error);
    }
};

const remove = async (req, res, next) => {
    try {
        await customerService.remove(req.user.organizationId, req.params.id);
        res.json({ success: true, message: 'Customer deleted successfully' });
    } catch (error) {
        next(error);
    }
};

module.exports = { create, findAll, findById, update, remove };
