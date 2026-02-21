const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { PORT } = require('./config/env');
const errorHandler = require('./middlewares/errorHandler');

// Import routes
const authRoutes = require('./routes/authRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const customerRoutes = require('./routes/customerRoutes');
const itemRoutes = require('./routes/itemRoutes');
const quoteRoutes = require('./routes/quoteRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const timeTrackingRoutes = require('./routes/timeTrackingRoutes');
const reportRoutes = require('./routes/reportRoutes');
const creditNoteRoutes = require('./routes/creditNoteRoutes');
const recurringInvoiceRoutes = require('./routes/recurringInvoiceRoutes');

const app = express();

// ─── Global Middleware ───────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// ─── Health Check ────────────────────────────────────────
app.get('/api/v1/health', (req, res) => {
    res.json({ success: true, message: 'Zoho Invoice Clone API is running 🚀' });
});

// ─── API Routes ──────────────────────────────────────────
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/invoices', invoiceRoutes);
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/items', itemRoutes);
app.use('/api/v1/quotes', quoteRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/expenses', expenseRoutes);
app.use('/api/v1/time-tracking', timeTrackingRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/credit-notes', creditNoteRoutes);
app.use('/api/v1/recurring-invoices', recurringInvoiceRoutes);

// ─── Error Handler (must be last) ────────────────────────
app.use(errorHandler);

// Cron jobs
const { startRecurringInvoiceCron } = require('./cron/recurringInvoiceCron');

// ─── Start Server ────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📋 Health check: http://localhost:${PORT}/api/v1/health`);
    startRecurringInvoiceCron();
});

module.exports = app;
