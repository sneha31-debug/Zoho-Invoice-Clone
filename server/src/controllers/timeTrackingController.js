const timeTrackingService = require('../services/timeTrackingService');

const create = async (req, res, next) => {
    try {
        const entry = await timeTrackingService.create(req.user.organizationId, req.user.id, req.body);
        res.status(201).json({ success: true, data: entry });
    } catch (error) { next(error); }
};

const findAll = async (req, res, next) => {
    try {
        const result = await timeTrackingService.findAll(req.user.organizationId, req.query);
        res.json({ success: true, data: result });
    } catch (error) { next(error); }
};

const findById = async (req, res, next) => {
    try {
        const entry = await timeTrackingService.findById(req.user.organizationId, req.params.id);
        res.json({ success: true, data: entry });
    } catch (error) { next(error); }
};

const update = async (req, res, next) => {
    try {
        const entry = await timeTrackingService.update(req.user.organizationId, req.params.id, req.body);
        res.json({ success: true, data: entry });
    } catch (error) { next(error); }
};

const remove = async (req, res, next) => {
    try {
        await timeTrackingService.remove(req.user.organizationId, req.params.id);
        res.json({ success: true, message: 'Time entry deleted successfully' });
    } catch (error) { next(error); }
};

module.exports = { create, findAll, findById, update, remove };
