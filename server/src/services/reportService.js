const prisma = require('../models/prismaClient');

const salesSummary = async (organizationId) => {
    const invoices = await prisma.invoice.findMany({ where: { organizationId } });

    const totalRevenue = invoices.reduce((s, i) => s + i.totalAmount, 0);
    const totalPaid = invoices.reduce((s, i) => s + i.amountPaid, 0);
    const totalOutstanding = invoices.reduce((s, i) => s + i.balanceDue, 0);
    const invoiceCount = invoices.length;

    const byStatus = {};
    invoices.forEach((i) => {
        byStatus[i.status] = (byStatus[i.status] || 0) + 1;
    });

    // Monthly revenue (last 6 months)
    const monthly = [];
    for (let m = 5; m >= 0; m--) {
        const start = new Date();
        start.setMonth(start.getMonth() - m, 1);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setMonth(end.getMonth() + 1);

        const monthInvoices = invoices.filter((i) => {
            const d = new Date(i.createdAt);
            return d >= start && d < end;
        });
        monthly.push({
            month: start.toLocaleString('default', { month: 'short', year: 'numeric' }),
            revenue: monthInvoices.reduce((s, i) => s + i.totalAmount, 0),
            collected: monthInvoices.reduce((s, i) => s + i.amountPaid, 0),
            count: monthInvoices.length,
        });
    }

    return { totalRevenue, totalPaid, totalOutstanding, invoiceCount, byStatus, monthly };
};

const expenseSummary = async (organizationId) => {
    const expenses = await prisma.expense.findMany({ where: { organizationId } });

    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const byCategory = {};
    expenses.forEach((e) => {
        byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
    });

    // Monthly expenses (last 6 months)
    const monthly = [];
    for (let m = 5; m >= 0; m--) {
        const start = new Date();
        start.setMonth(start.getMonth() - m, 1);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setMonth(end.getMonth() + 1);

        const monthExpenses = expenses.filter((e) => {
            const d = new Date(e.date || e.createdAt);
            return d >= start && d < end;
        });
        monthly.push({
            month: start.toLocaleString('default', { month: 'short', year: 'numeric' }),
            total: monthExpenses.reduce((s, e) => s + e.amount, 0),
            count: monthExpenses.length,
        });
    }

    return { totalExpenses, byCategory, monthly, count: expenses.length };
};

const agingReport = async (organizationId) => {
    const now = new Date();
    const invoices = await prisma.invoice.findMany({
        where: { organizationId, balanceDue: { gt: 0 } },
        include: { customer: { select: { displayName: true } } },
        orderBy: { dueDate: 'asc' },
    });

    const buckets = { current: [], overdue_1_30: [], overdue_31_60: [], overdue_61_90: [], overdue_90_plus: [] };
    const totals = { current: 0, overdue_1_30: 0, overdue_31_60: 0, overdue_61_90: 0, overdue_90_plus: 0 };

    invoices.forEach((inv) => {
        const due = new Date(inv.dueDate);
        const daysOverdue = Math.floor((now - due) / (1000 * 60 * 60 * 24));
        const entry = {
            id: inv.id, invoiceNumber: inv.invoiceNumber,
            customer: inv.customer?.displayName, balanceDue: inv.balanceDue,
            dueDate: inv.dueDate, daysOverdue: Math.max(0, daysOverdue),
        };

        if (daysOverdue <= 0) { buckets.current.push(entry); totals.current += inv.balanceDue; }
        else if (daysOverdue <= 30) { buckets.overdue_1_30.push(entry); totals.overdue_1_30 += inv.balanceDue; }
        else if (daysOverdue <= 60) { buckets.overdue_31_60.push(entry); totals.overdue_31_60 += inv.balanceDue; }
        else if (daysOverdue <= 90) { buckets.overdue_61_90.push(entry); totals.overdue_61_90 += inv.balanceDue; }
        else { buckets.overdue_90_plus.push(entry); totals.overdue_90_plus += inv.balanceDue; }
    });

    return { buckets, totals, totalOutstanding: Object.values(totals).reduce((s, v) => s + v, 0) };
};

const taxSummary = async (organizationId) => {
    const invoices = await prisma.invoice.findMany({
        where: { organizationId },
        include: { items: true },
    });

    let totalTaxCollected = 0;
    const byRate = {};

    invoices.forEach((inv) => {
        totalTaxCollected += inv.taxAmount;
        inv.items.forEach((item) => {
            const rate = item.taxRate || 0;
            if (rate > 0) {
                const key = `${rate}%`;
                if (!byRate[key]) byRate[key] = { rate, taxableAmount: 0, taxAmount: 0, count: 0 };
                byRate[key].taxableAmount += item.amount;
                byRate[key].taxAmount += item.amount * (rate / 100);
                byRate[key].count += 1;
            }
        });
    });

    return { totalTaxCollected, byRate, invoiceCount: invoices.length };
};

module.exports = { salesSummary, expenseSummary, agingReport, taxSummary };
