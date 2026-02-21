import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { invoiceAPI, customerAPI, paymentAPI, expenseAPI } from '../../services/api';
import { HiOutlineDocumentText, HiOutlineUsers, HiOutlineCreditCard, HiOutlineCash, HiOutlinePlusCircle } from 'react-icons/hi';
import './Dashboard.css';

const Dashboard = () => {
    const [stats, setStats] = useState({ invoices: 0, customers: 0, payments: 0, expenses: 0, recentInvoices: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [inv, cust, pay, exp] = await Promise.all([
                    invoiceAPI.getAll({ limit: 5 }),
                    customerAPI.getAll({ limit: 1 }),
                    paymentAPI.getAll({ limit: 1 }),
                    expenseAPI.getAll({ limit: 1 }),
                ]);
                setStats({
                    invoices: inv.data.data.total,
                    customers: cust.data.data.total,
                    payments: pay.data.data.total,
                    expenses: exp.data.data.total,
                    recentInvoices: inv.data.data.invoices,
                });
            } catch (err) { console.error(err); }
            setLoading(false);
        };
        fetchStats();
    }, []);

    const statusBadge = (status) => {
        const map = { PAID: 'badge-success', SENT: 'badge-info', DRAFT: 'badge-secondary', OVERDUE: 'badge-danger', PARTIALLY_PAID: 'badge-warning' };
        return <span className={`badge ${map[status] || 'badge-secondary'}`}>{status.replace('_', ' ')}</span>;
    };

    if (loading) return <div className="loading-spinner" />;

    return (
        <div className="dashboard fade-in">
            <div className="page-header">
                <h1>Dashboard</h1>
                <Link to="/invoices/new" className="btn btn-primary"><HiOutlinePlusCircle size={18} /> New Invoice</Link>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(79,70,229,0.1)', color: 'var(--primary)' }}><HiOutlineDocumentText /></div>
                    <div className="stat-value">{stats.invoices}</div>
                    <div className="stat-label">Total Invoices</div>
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

            <div className="card" style={{ marginTop: 24 }}>
                <div className="card-header">
                    <h3>Recent Invoices</h3>
                    <Link to="/invoices" className="btn btn-secondary btn-sm">View All</Link>
                </div>
                {stats.recentInvoices.length === 0 ? (
                    <div className="empty-state"><p>No invoices yet. Create your first one!</p></div>
                ) : (
                    <div className="table-container">
                        <table>
                            <thead><tr><th>Invoice #</th><th>Customer</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
                            <tbody>
                                {stats.recentInvoices.map((inv) => (
                                    <tr key={inv.id}>
                                        <td><Link to={`/invoices/${inv.id}`} style={{ color: 'var(--primary)', fontWeight: 600 }}>{inv.invoiceNumber}</Link></td>
                                        <td>{inv.customer?.displayName}</td>
                                        <td style={{ fontWeight: 600 }}>${Number(inv.totalAmount).toLocaleString()}</td>
                                        <td>{statusBadge(inv.status)}</td>
                                        <td>{new Date(inv.createdAt).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
