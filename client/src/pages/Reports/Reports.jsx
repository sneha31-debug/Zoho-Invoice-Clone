import { useState, useEffect, useCallback } from 'react';
import { reportAPI } from '../../services/api';
import { HiOutlineFilter } from 'react-icons/hi';
import toast from 'react-hot-toast';
import './Reports.css';

const Reports = () => {
    const [sales, setSales] = useState(null);
    const [expenses, setExpenses] = useState(null);
    const [aging, setAging] = useState(null);
    const [tax, setTax] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('sales');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const fetchReports = useCallback(async () => {
        setLoading(true);
        try {
            const params = {};
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;

            const [salesRes, expensesRes, agingRes, taxRes] = await Promise.all([
                reportAPI.sales(params),
                reportAPI.expenses(params),
                reportAPI.aging(),
                reportAPI.tax(params),
            ]);
            setSales(salesRes.data.data);
            setExpenses(expensesRes.data.data);
            setAging(agingRes.data.data);
            setTax(taxRes.data.data);
        } catch (err) {
            toast.error('Failed to load reports');
        }
        setLoading(false);
    }, [startDate, endDate]);

    useEffect(() => { fetchReports(); }, [fetchReports]);

    const handleClearDates = () => { setStartDate(''); setEndDate(''); };

    const tabs = [
        { key: 'sales', label: 'Sales' },
        { key: 'expenses', label: 'Expenses' },
        { key: 'aging', label: 'Aging' },
        { key: 'tax', label: 'Tax' },
    ];

    const maxMonthlyRevenue = sales?.monthly ? Math.max(...sales.monthly.map((m) => m.revenue), 1) : 1;
    const maxMonthlyExpense = expenses?.monthly ? Math.max(...expenses.monthly.map((m) => m.total), 1) : 1;

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1>Reports</h1>
                <div className="date-filter">
                    <HiOutlineFilter size={16} />
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} placeholder="From" />
                    <span style={{ color: 'var(--text-muted)' }}>to</span>
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} placeholder="To" />
                    {(startDate || endDate) && <button className="btn btn-secondary btn-sm" onClick={handleClearDates}>Clear</button>}
                </div>
            </div>

            {loading ? <div className="loading-spinner" /> : (
                <>
                    {/* Summary Cards */}
                    <div className="report-summary-grid">
                        <div className="report-summary-card revenue">
                            <span className="summary-label">Total Revenue</span>
                            <span className="summary-value">${sales?.totalRevenue?.toLocaleString() || 0}</span>
                            <span className="summary-sub">{sales?.invoiceCount || 0} invoices</span>
                        </div>
                        <div className="report-summary-card collected">
                            <span className="summary-label">Collected</span>
                            <span className="summary-value">${sales?.totalPaid?.toLocaleString() || 0}</span>
                            <span className="summary-sub">{sales?.byStatus?.PAID || 0} paid invoices</span>
                        </div>
                        <div className="report-summary-card outstanding">
                            <span className="summary-label">Outstanding</span>
                            <span className="summary-value">${sales?.totalOutstanding?.toLocaleString() || 0}</span>
                            <span className="summary-sub">{aging?.totalOutstanding ? `$${aging.totalOutstanding.toLocaleString()} aging` : '—'}</span>
                        </div>
                        <div className="report-summary-card expenses-card">
                            <span className="summary-label">Total Expenses</span>
                            <span className="summary-value">${expenses?.totalExpenses?.toLocaleString() || 0}</span>
                            <span className="summary-sub">{expenses?.count || 0} expenses</span>
                        </div>
                    </div>

                    {/* Tab Navigation */}
                    <div className="report-tabs">
                        {tabs.map((t) => (
                            <button key={t.key} className={`report-tab ${activeTab === t.key ? 'active' : ''}`} onClick={() => setActiveTab(t.key)}>
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <div className="card">
                        {activeTab === 'sales' && sales && (
                            <div>
                                <h3 className="report-section-title">Monthly Revenue (Last 6 Months)</h3>
                                <div className="chart-bars">
                                    {sales.monthly.map((m, i) => (
                                        <div key={i} className="chart-bar-group">
                                            <div className="chart-bar-container">
                                                <div className="chart-bar revenue-bar" style={{ height: `${(m.revenue / maxMonthlyRevenue) * 100}%` }}>
                                                    <span className="bar-tooltip">${m.revenue.toLocaleString()}</span>
                                                </div>
                                            </div>
                                            <span className="chart-label">{m.month}</span>
                                            <span className="chart-count">{m.count} inv</span>
                                        </div>
                                    ))}
                                </div>
                                <h3 className="report-section-title" style={{ marginTop: 32 }}>Invoice Status Breakdown</h3>
                                <div className="status-grid">
                                    {Object.entries(sales.byStatus).map(([status, count]) => (
                                        <div key={status} className="status-item">
                                            <span className={`badge ${status === 'PAID' ? 'badge-success' : status === 'OVERDUE' ? 'badge-danger' : status === 'SENT' ? 'badge-info' : 'badge-secondary'}`}>{status}</span>
                                            <span className="status-count">{count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'expenses' && expenses && (
                            <div>
                                <h3 className="report-section-title">Expense Breakdown by Category</h3>
                                <div className="category-list">
                                    {Object.entries(expenses.byCategory).sort((a, b) => b[1] - a[1]).map(([cat, amount]) => (
                                        <div key={cat} className="category-row">
                                            <span className="category-name">{cat.replace(/_/g, ' ')}</span>
                                            <div className="category-bar-track">
                                                <div className="category-bar-fill" style={{ width: `${(amount / expenses.totalExpenses) * 100}%` }} />
                                            </div>
                                            <span className="category-amount">${amount.toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                                <h3 className="report-section-title" style={{ marginTop: 32 }}>Monthly Expenses (Last 6 Months)</h3>
                                <div className="chart-bars">
                                    {expenses.monthly.map((m, i) => (
                                        <div key={i} className="chart-bar-group">
                                            <div className="chart-bar-container">
                                                <div className="chart-bar expense-bar" style={{ height: `${(m.total / maxMonthlyExpense) * 100}%` }}>
                                                    <span className="bar-tooltip">${m.total.toLocaleString()}</span>
                                                </div>
                                            </div>
                                            <span className="chart-label">{m.month}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'aging' && aging && (
                            <div>
                                <h3 className="report-section-title">Invoice Aging Summary</h3>
                                <div className="aging-buckets">
                                    {[
                                        { key: 'current', label: 'Current', color: 'var(--success)' },
                                        { key: 'overdue_1_30', label: '1–30 Days', color: 'var(--warning)' },
                                        { key: 'overdue_31_60', label: '31–60 Days', color: '#f97316' },
                                        { key: 'overdue_61_90', label: '61–90 Days', color: 'var(--danger)' },
                                        { key: 'overdue_90_plus', label: '90+ Days', color: '#991b1b' },
                                    ].map((b) => (
                                        <div key={b.key} className="aging-bucket" style={{ borderLeftColor: b.color }}>
                                            <div className="aging-label">{b.label}</div>
                                            <div className="aging-amount" style={{ color: b.color }}>${(aging.totals[b.key] || 0).toLocaleString()}</div>
                                            <div className="aging-count">{aging.buckets[b.key]?.length || 0} invoices</div>
                                        </div>
                                    ))}
                                </div>
                                {Object.values(aging.buckets).flat().length > 0 && (
                                    <>
                                        <h3 className="report-section-title" style={{ marginTop: 32 }}>Overdue Invoices</h3>
                                        <div className="table-container">
                                            <table>
                                                <thead><tr><th>Invoice #</th><th>Customer</th><th>Balance Due</th><th>Due Date</th><th>Days Overdue</th></tr></thead>
                                                <tbody>
                                                    {Object.values(aging.buckets).flat().filter((i) => i.daysOverdue > 0).map((inv) => (
                                                        <tr key={inv.id}>
                                                            <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{inv.invoiceNumber}</td>
                                                            <td>{inv.customer}</td>
                                                            <td style={{ fontWeight: 600 }}>${inv.balanceDue.toLocaleString()}</td>
                                                            <td>{new Date(inv.dueDate).toLocaleDateString()}</td>
                                                            <td><span className="badge badge-danger">{inv.daysOverdue}d</span></td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {activeTab === 'tax' && tax && (
                            <div>
                                <h3 className="report-section-title">Tax Collected Summary</h3>
                                <div className="tax-overview">
                                    <div className="tax-total">
                                        <span className="tax-total-label">Total Tax Collected</span>
                                        <span className="tax-total-value">${tax.totalTaxCollected?.toLocaleString() || 0}</span>
                                    </div>
                                    <span className="tax-count">From {tax.invoiceCount} invoices</span>
                                </div>
                                {Object.keys(tax.byRate).length > 0 && (
                                    <div className="table-container" style={{ marginTop: 24 }}>
                                        <table>
                                            <thead><tr><th>Tax Rate</th><th>Taxable Amount</th><th>Tax Collected</th><th>Line Items</th></tr></thead>
                                            <tbody>
                                                {Object.entries(tax.byRate).map(([rate, info]) => (
                                                    <tr key={rate}>
                                                        <td><span className="badge badge-info">{rate}</span></td>
                                                        <td>${info.taxableAmount.toLocaleString()}</td>
                                                        <td style={{ fontWeight: 600, color: 'var(--success)' }}>${info.taxAmount.toLocaleString()}</td>
                                                        <td>{info.count}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default Reports;
