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

const createFromBillable = async (req, res, next) => {
    try {
        const prisma = require('../models/prismaClient');
        const { timeEntryIds = [], expenseIds = [], customerId } = req.body;
        const orgId = req.user.organizationId;

        if (!customerId) {
            const e = new Error('Customer is required'); e.statusCode = 400; throw e;
        }
        if (timeEntryIds.length === 0 && expenseIds.length === 0) {
            const e = new Error('Select at least one time entry or expense'); e.statusCode = 400; throw e;
        }

        const items = [];

        // Fetch time entries
        if (timeEntryIds.length > 0) {
            const entries = await prisma.timeEntry.findMany({
                where: { id: { in: timeEntryIds }, organizationId: orgId, isBillable: true, isBilled: false },
            });
            for (const te of entries) {
                items.push({
                    description: `Time: ${te.description || 'Hours worked'} (${te.hours}h)`,
                    quantity: te.hours,
                    rate: te.hourlyRate || 0,
                    taxRate: 0,
                });
            }
        }

        // Fetch expenses
        if (expenseIds.length > 0) {
            const expenses = await prisma.expense.findMany({
                where: { id: { in: expenseIds }, organizationId: orgId, isBillable: true, isBilled: false },
            });
            for (const ex of expenses) {
                items.push({
                    description: `Expense: ${ex.description || ex.merchant || ex.category} (${new Date(ex.date).toLocaleDateString()})`,
                    quantity: 1,
                    rate: ex.amount,
                    taxRate: 0,
                });
            }
        }

        if (items.length === 0) {
            const e = new Error('No eligible billable entries found'); e.statusCode = 400; throw e;
        }

        // Create the invoice via existing service
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30);

        const invoice = await invoiceService.create(orgId, {
            customerId, items, dueDate: dueDate.toISOString(),
            notes: 'Auto-generated from billable time & expenses',
        }, req.user.id);

        // Mark entries as billed
        if (timeEntryIds.length > 0) {
            await prisma.timeEntry.updateMany({
                where: { id: { in: timeEntryIds }, organizationId: orgId },
                data: { isBilled: true },
            });
        }
        if (expenseIds.length > 0) {
            await prisma.expense.updateMany({
                where: { id: { in: expenseIds }, organizationId: orgId },
                data: { isBilled: true },
            });
        }

        res.status(201).json({ success: true, data: invoice });
    } catch (error) { next(error); }
};

module.exports = { create, findAll, findById, update, remove, createFromBillable };
