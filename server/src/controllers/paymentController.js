const paymentService = require('../services/paymentService');

const create = async (req, res, next) => {
    try {
        const payment = await paymentService.create(req.user.organizationId, req.body);
        res.status(201).json({ success: true, data: payment });
    } catch (error) { next(error); }
};

const findAll = async (req, res, next) => {
    try {
        const result = await paymentService.findAll(req.user.organizationId, req.query);
        res.json({ success: true, data: result });
    } catch (error) { next(error); }
};

const findById = async (req, res, next) => {
    try {
        const payment = await paymentService.findById(req.user.organizationId, req.params.id);
        res.json({ success: true, data: payment });
    } catch (error) { next(error); }
};

const update = async (req, res, next) => {
    try {
        const payment = await paymentService.update(req.user.organizationId, req.params.id, req.body);
        res.json({ success: true, data: payment });
    } catch (error) { next(error); }
};

module.exports = { create, findAll, findById, update };
