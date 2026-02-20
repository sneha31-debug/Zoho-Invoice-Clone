const expenseService = require('../services/expenseService');

const create = async (req, res, next) => {
    try {
        const expense = await expenseService.create(req.user.organizationId, req.user.id, req.body);
        res.status(201).json({ success: true, data: expense });
    } catch (error) { next(error); }
};

const findAll = async (req, res, next) => {
    try {
        const result = await expenseService.findAll(req.user.organizationId, req.query);
        res.json({ success: true, data: result });
    } catch (error) { next(error); }
};

const findById = async (req, res, next) => {
    try {
        const expense = await expenseService.findById(req.user.organizationId, req.params.id);
        res.json({ success: true, data: expense });
    } catch (error) { next(error); }
};

const update = async (req, res, next) => {
    try {
        const expense = await expenseService.update(req.user.organizationId, req.params.id, req.body);
        res.json({ success: true, data: expense });
    } catch (error) { next(error); }
};

const remove = async (req, res, next) => {
    try {
        await expenseService.remove(req.user.organizationId, req.params.id);
        res.json({ success: true, message: 'Expense deleted successfully' });
    } catch (error) { next(error); }
};

module.exports = { create, findAll, findById, update, remove };
