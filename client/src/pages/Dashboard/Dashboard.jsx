import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { invoiceAPI, customerAPI, paymentAPI, expenseAPI, reportAPI } from '../../services/api';
import {
    HiOutlineDocumentText, HiOutlineUsers, HiOutlineCreditCard, HiOutlineCash,
    HiOutlinePlusCircle, HiOutlineTrendingUp, HiOutlineExclamationCircle, HiOutlineCurrencyDollar,
} from 'react-icons/hi';
import './Dashboard.css';

const Dashboard = () => {
    const [stats, setStats] = useState({ invoices: 0, customers: 0, payments: 0, expenses: 0, recentInvoices: [] });
    const [sales, setSales] = useState(null);
    const [recentPayments, setRecentPayments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [inv, cust, pay, exp, salesRes] = await Promise.all([
                    invoiceAPI.getAll({ limit: 5 }),
                    customerAPI.getAll({ limit: 1 }),
                    paymentAPI.getAll({ limit: 5 }),
                    expenseAPI.getAll({ limit: 1 }),
                    reportAPI.sales(),
                ]);
                setStats({
                    invoices: inv.data.data.total,
                    customers: cust.data.data.total,
                    payments: pay.data.data.total,
                    expenses: exp.data.data.total,
                    recentInvoices: inv.data.data.invoices,
                });
                setSales(salesRes.data.data);
                setRecentPayments(pay.data.data.payments || []);
            } catch (err) { console.error(err); }
            setLoading(false);
        };
        fetchAll();
    }, []);

    const statusBadge = (status) => {
        const map = { PAID: 'badge-success', SENT: 'badge-info', DRAFT: 'badge-secondary', OVERDUE: 'badge-danger', PARTIALLY_PAID: 'badge-warning' };
        return <span className={`badge ${map[status] || 'badge-secondary'}`}>{status.replace('_', ' ')}</span>;
    };

    if (loading) return <div className="loading-spinner" />;

    const maxRevenue = sales?.monthly ? Math.max(...sales.monthly.map((m) => m.revenue), 1) : 1;
    const overdueInvoices = stats.recentInvoices.filter((i) => i.status === 'OVERDUE');

    return (
        <div className="dashboard fade-in">
            <div className="page-header">
                <h1>Dashboard</h1>
                <Link to="/invoices/new" className="btn btn-primary"><HiOutlinePlusCircle size={18} /> New Invoice</Link>
            </div>

            {/* Revenue Cards */}
            <div className="revenue-grid">
                <div className="revenue-card primary">
                    <div className="revenue-icon"><HiOutlineCurrencyDollar /></div>
                    <div className="revenue-info">
                        <span className="revenue-label">Total Revenue</span>
                        <span className="revenue-amount">${(sales?.totalRevenue || 0).toLocaleString()}</span>
                    </div>
                </div>
                <div className="revenue-card success">
                    <div className="revenue-icon"><HiOutlineTrendingUp /></div>
                    <div className="revenue-info">
                        <span className="revenue-label">Collected</span>
                        <span className="revenue-amount">${(sales?.totalPaid || 0).toLocaleString()}</span>
                    </div>
                </div>
                <div className="revenue-card warning">
                    <div className="revenue-icon"><HiOutlineExclamationCircle /></div>
                    <div className="revenue-info">
                        <span className="revenue-label">Outstanding</span>
                        <span className="revenue-amount">${(sales?.totalOutstanding || 0).toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(79,70,229,0.1)', color: 'var(--primary)' }}><HiOutlineDocumentText /></div>
                    <div className="stat-value">{stats.invoices}</div>
                    <div className="stat-label">Invoices</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--success)' }}><HiOutlineUsers /></div>
                    <div className="stat-value">{stats.customers}</div>
                    <div className="stat-label">Customers</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--info)' }}><HiOutlineCreditCard /></div>
                    <div className="stat-value">{stats.payments}</div>
                    <div className="stat-label">Payments</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--warning)' }}><HiOutlineCash /></div>
                    <div className="stat-value">{stats.expenses}</div>
                    <div className="stat-label">Expenses</div>
                </div>
            </div>

            {/* Two Column Layout */}
            <div className="dashboard-grid">
                {/* Left: Mini Chart + Overdue */}
                <div className="dashboard-left">
                    {/* Mini Revenue Chart */}
                    {sales?.monthly && (
                        <div className="card">
                            <div className="card-header"><h3>Revenue Trend</h3><Link to="/reports" className="btn btn-secondary btn-sm">Full Reports</Link></div>
                            <div className="mini-chart">
                                {sales.monthly.map((m, i) => (
                                    <div key={i} className="mini-bar-group">
                                        <div className="mini-bar-container">
                                            <div className="mini-bar" style={{ height: `${(m.revenue / maxRevenue) * 100}%` }}>
                                                <span className="mini-tooltip">${m.revenue.toLocaleString()}</span>
                                            </div>
                                        </div>
                                        <span className="mini-label">{m.month.split(' ')[0]}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Overdue Alert */}
                    {overdueInvoices.length > 0 && (
                        <div className="card overdue-card">
                            <div className="card-header"><h3><HiOutlineExclamationCircle style={{ color: 'var(--danger)' }} /> Overdue Invoices</h3></div>
                            {overdueInvoices.map((inv) => (
                                <div key={inv.id} className="overdue-item">
                                    <Link to={`/invoices/${inv.id}`} className="overdue-link">{inv.invoiceNumber}</Link>
                                    <span className="overdue-customer">{inv.customer?.displayName}</span>
                                    <span className="overdue-amount">${Number(inv.balanceDue).toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right: Recent Activity */}
                <div className="dashboard-right">
                    {/* Recent Invoices */}
                    <div className="card">
                        <div className="card-header"><h3>Recent Invoices</h3><Link to="/invoices" className="btn btn-secondary btn-sm">View All</Link></div>
                        {stats.recentInvoices.length === 0 ? (
                            <div className="empty-state"><p>No invoices yet. Create your first one!</p></div>
                        ) : (
                            <div className="activity-list">
                                {stats.recentInvoices.map((inv) => (
                                    <div key={inv.id} className="activity-item">
                                        <div className="activity-icon invoice"><HiOutlineDocumentText /></div>
                                        <div className="activity-details">
                                            <Link to={`/invoices/${inv.id}`} className="activity-title">{inv.invoiceNumber}</Link>
                                            <span className="activity-sub">{inv.customer?.displayName}</span>
                                        </div>
                                        <div className="activity-right">
                                            <span className="activity-amount">${Number(inv.totalAmount).toLocaleString()}</span>
                                            {statusBadge(inv.status)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Recent Payments */}
                    {recentPayments.length > 0 && (
                        <div className="card">
                            <div className="card-header"><h3>Recent Payments</h3><Link to="/payments" className="btn btn-secondary btn-sm">View All</Link></div>
                            <div className="activity-list">
                                {recentPayments.slice(0, 5).map((pay) => (
                                    <div key={pay.id} className="activity-item">
                                        <div className="activity-icon payment"><HiOutlineCreditCard /></div>
                                        <div className="activity-details">
                                            <span className="activity-title">{pay.paymentNumber}</span>
                                            <span className="activity-sub">{pay.paymentMode} • {new Date(pay.paymentDate).toLocaleDateString()}</span>
                                        </div>
                                        <div className="activity-right">
                                            <span className="activity-amount" style={{ color: 'var(--success)' }}>+${Number(pay.amount).toLocaleString()}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
