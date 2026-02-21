import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { invoiceAPI } from '../../services/api';
import { HiOutlinePlusCircle, HiOutlineEye, HiOutlineTrash } from 'react-icons/hi';
import toast from 'react-hot-toast';

const statusBadge = (status) => {
    const map = { PAID: 'badge-success', SENT: 'badge-info', DRAFT: 'badge-secondary', OVERDUE: 'badge-danger', PARTIALLY_PAID: 'badge-warning' };
    return <span className={`badge ${map[status] || 'badge-secondary'}`}>{status.replace('_', ' ')}</span>;
};

const Invoices = () => {
    const { user } = useAuth();
    const [data, setData] = useState({ invoices: [], total: 0 });

    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);

    const fetchInvoices = async () => {
        try {
            const res = await invoiceAPI.getAll({ page, limit: 15 });
            setData(res.data.data);
        } catch (err) { toast.error('Failed to load invoices'); }
        setLoading(false);
    };

    useEffect(() => { fetchInvoices(); }, [page]);

    const handleDelete = async (id) => {
        if (!confirm('Delete this invoice?')) return;
        try {
            await invoiceAPI.delete(id);
            toast.success('Invoice deleted');
            fetchInvoices();
        } catch (err) { toast.error('Failed to delete'); }
    };

    if (loading) return <div className="loading-spinner" />;

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1>Invoices ({data.total})</h1>
                {user?.role !== 'VIEWER' && (
                    <Link to="/invoices/new" className="btn btn-primary"><HiOutlinePlusCircle size={18} /> New Invoice</Link>
                )}
            </div>
            <div className="card">
                {data.invoices.length === 0 ? (
                    <div className="empty-state">
                        <h3>No invoices yet</h3>
                        <p>Create your first invoice to get started.</p>
                        {user?.role !== 'VIEWER' && <Link to="/invoices/new" className="btn btn-primary">Create Invoice</Link>}
                    </div>
                ) : (
                    <div className="table-container">
                        <table>
                            <thead><tr><th>Invoice #</th><th>Customer</th><th>Amount</th><th>Balance</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
                            <tbody>
                                {data.invoices.map((inv) => (
                                    <tr key={inv.id}>
                                        <td><Link to={`/invoices/${inv.id}`} style={{ color: 'var(--primary)', fontWeight: 600 }}>{inv.invoiceNumber}</Link></td>
                                        <td>{inv.customer?.displayName}</td>
                                        <td style={{ fontWeight: 600 }}>${Number(inv.totalAmount).toLocaleString()}</td>
                                        <td>${Number(inv.balanceDue).toLocaleString()}</td>
                                        <td>{statusBadge(inv.status)}</td>
                                        <td>{new Date(inv.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <Link to={`/invoices/${inv.id}`} className="btn btn-secondary btn-sm"><HiOutlineEye /></Link>
                                                {user?.role !== 'VIEWER' && (
                                                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(inv.id)}><HiOutlineTrash /></button>
                                                )}
                                            </div>
                                        </td>
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

export default Invoices;
