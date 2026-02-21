const invoiceService = require('../services/invoiceService');

const create = async (req, res, next) => {
    try {
        const invoice = await invoiceService.create(req.user.organizationId, req.body, req.user.id);
        res.status(201).json({ success: true, data: invoice });
    } catch (error) { next(error); }
};

const findAll = async (req, res, next) => {
    try {
        const result = await invoiceService.findAll(req.user.organizationId, req.query);
        res.json({ success: true, data: result });
    } catch (error) { next(error); }
};

const findById = async (req, res, next) => {
    try {
        const invoice = await invoiceService.findById(req.user.organizationId, req.params.id);
        res.json({ success: true, data: invoice });
    } catch (error) { next(error); }
};

const update = async (req, res, next) => {
    try {
        const invoice = await invoiceService.update(req.user.organizationId, req.params.id, req.body, req.user.id);
        res.json({ success: true, data: invoice });
    } catch (error) { next(error); }
};

const remove = async (req, res, next) => {
    try {
        await invoiceService.remove(req.user.organizationId, req.params.id, req.user.id);
        res.json({ success: true, message: 'Invoice deleted successfully' });
    } catch (error) { next(error); }
};

module.exports = { create, findAll, findById, update, remove };
