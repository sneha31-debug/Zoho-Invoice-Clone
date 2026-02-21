const quoteService = require('../services/quoteService');

const create = async (req, res, next) => {
    try {
        const quote = await quoteService.create(req.user.organizationId, req.body, req.user.id);
        res.status(201).json({ success: true, data: quote });
    } catch (error) { next(error); }
};

const findAll = async (req, res, next) => {
    try {
        const result = await quoteService.findAll(req.user.organizationId, req.query);
        res.json({ success: true, data: result });
    } catch (error) { next(error); }
};

const findById = async (req, res, next) => {
    try {
        const quote = await quoteService.findById(req.user.organizationId, req.params.id);
        res.json({ success: true, data: quote });
    } catch (error) { next(error); }
};

const update = async (req, res, next) => {
    try {
        const quote = await quoteService.update(req.user.organizationId, req.params.id, req.body, req.user.id);
        res.json({ success: true, data: quote });
    } catch (error) { next(error); }
};

const remove = async (req, res, next) => {
    try {
        await quoteService.remove(req.user.organizationId, req.params.id, req.user.id);
        res.json({ success: true, message: 'Quote deleted successfully' });
    } catch (error) { next(error); }
};

const convertToInvoice = async (req, res, next) => {
    try {
        const invoice = await quoteService.convertToInvoice(req.user.organizationId, req.params.id, req.body.dueDate, req.user.id);
        res.status(201).json({ success: true, data: invoice });
    } catch (error) { next(error); }
};

module.exports = { create, findAll, findById, update, remove, convertToInvoice };
