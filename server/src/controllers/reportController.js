const reportService = require('../services/reportService');

const salesSummary = async (req, res, next) => {
    try {
        const data = await reportService.salesSummary(req.user.organizationId, req.query);
        res.json({ success: true, data });
    } catch (error) { next(error); }
};

const expenseSummary = async (req, res, next) => {
    try {
        const data = await reportService.expenseSummary(req.user.organizationId, req.query);
        res.json({ success: true, data });
    } catch (error) { next(error); }
};

const agingReport = async (req, res, next) => {
    try {
        const data = await reportService.agingReport(req.user.organizationId);
        res.json({ success: true, data });
    } catch (error) { next(error); }
};

const taxSummary = async (req, res, next) => {
    try {
        const data = await reportService.taxSummary(req.user.organizationId, req.query);
        res.json({ success: true, data });
    } catch (error) { next(error); }
};

module.exports = { salesSummary, expenseSummary, agingReport, taxSummary };
