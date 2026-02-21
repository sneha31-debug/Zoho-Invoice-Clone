import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { quoteAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { HiOutlineArrowLeft, HiOutlineCheckCircle, HiOutlineTrash, HiOutlinePencil, HiOutlineClock, HiOutlineSwitchHorizontal } from 'react-icons/hi';
import toast from 'react-hot-toast';

const statusBadge = (status) => {
    const map = { ACCEPTED: 'badge-success', SENT: 'badge-info', DRAFT: 'badge-secondary', DECLINED: 'badge-danger', CONVERTED: 'badge-warning', EXPIRED: 'badge-secondary' };
    return <span className={`badge ${map[status] || 'badge-secondary'}`}>{status}</span>;
};

const actionIcon = (action) => {
    const map = { created: '🆕', sent: '📤', accepted: '✅', declined: '❌', converted: '🔄', updated: '✏️', deleted: '🗑️', viewed: '👁️' };
    return map[action] || '📋';
};

const QuoteDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [quote, setQuote] = useState(null);
    const [loading, setLoading] = useState(true);
    const [acting, setActing] = useState(false);

    const fetchQuote = () => {
        quoteAPI.getById(id).then((res) => setQuote(res.data.data)).catch(console.error).finally(() => setLoading(false));
    };

    useEffect(() => { fetchQuote(); }, [id]);

    const handleConvert = async () => {
        const dueDate = prompt('Enter invoice due date (YYYY-MM-DD):');
        if (!dueDate) return;
        setActing(true);
        try {
            const res = await quoteAPI.convert(id, { dueDate: new Date(dueDate).toISOString() });
            toast.success(`Converted to ${res.data.data.invoiceNumber}`);
            navigate(`/invoices/${res.data.data.id}`);
        } catch (err) { toast.error(err.response?.data?.message || 'Failed to convert'); }
        setActing(false);
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this quote?')) return;
        setActing(true);
        try {
            await quoteAPI.delete(id);
            toast.success('Quote deleted');
            navigate('/quotes');
        } catch (err) { toast.error('Failed to delete'); }
        setActing(false);
    };

    if (loading) return <div className="loading-spinner" />;
    if (!quote) return <div className="empty-state"><h3>Quote not found</h3></div>;

    return (
        <div className="fade-in">
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <Link to="/quotes" className="btn btn-secondary btn-sm"><HiOutlineArrowLeft /></Link>
                    <div>
                        <h1>{quote.quoteNumber}</h1>
                        <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>Created {new Date(quote.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {statusBadge(quote.status)}
                    {user?.role !== 'VIEWER' && (
                        <>
                            {quote.status !== 'CONVERTED' && (
                                <button className="btn btn-primary btn-sm" onClick={handleConvert} disabled={acting}>
                                    <HiOutlineSwitchHorizontal /> Convert to Invoice
                                </button>
                            )}
                            <Link to={`/quotes/${id}/edit`} className="btn btn-secondary btn-sm">
                                <HiOutlinePencil /> Edit
                            </Link>
                        </>
                    )}
                    {user?.role !== 'VIEWER' && (
                        <button className="btn btn-danger btn-sm" onClick={handleDelete} disabled={acting}>
                            <HiOutlineTrash /> Delete
                        </button>
                    )}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
                <div className="card">
                    <h4 style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>Customer</h4>
                    <div style={{ fontWeight: 600 }}>{quote.customer?.displayName}</div>
                    <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{quote.customer?.email}</div>
                    <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{quote.customer?.phone}</div>
                </div>
                <div className="card">
                    <h4 style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>Summary</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 14 }}>
                        <span style={{ color: 'var(--text-muted)' }}>Expiry Date</span><span>{new Date(quote.expiryDate).toLocaleDateString()}</span>
                        <span style={{ color: 'var(--text-muted)' }}>Total</span><span style={{ fontWeight: 700 }}>${Number(quote.totalAmount).toLocaleString()}</span>
                    </div>
                </div>
            </div>

            <div className="card">
                <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 700 }}>Line Items</h3>
                <div className="table-container">
                    <table>
                        <thead><tr><th>Description</th><th>Qty</th><th>Rate</th><th>Tax %</th><th>Amount</th></tr></thead>
                        <tbody>
                            {quote.items?.map((item) => (
                                <tr key={item.id}>
                                    <td>{item.description}</td>
                                    <td>{item.quantity}</td>
                                    <td>${Number(item.rate).toFixed(2)}</td>
                                    <td>{item.taxRate}%</td>
                                    <td style={{ fontWeight: 600 }}>${Number(item.amount).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                    <div style={{ width: 280 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14 }}><span>Subtotal</span><span>${Number(quote.subtotal).toFixed(2)}</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14 }}><span>Tax</span><span>${Number(quote.taxAmount).toFixed(2)}</span></div>
                        {quote.discountAmount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14 }}><span>Discount</span><span>-${Number(quote.discountAmount).toFixed(2)}</span></div>}
                        <hr style={{ border: 'none', borderTop: '2px solid var(--border)', margin: '8px 0' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 18, fontWeight: 700 }}><span>Total</span><span>${Number(quote.totalAmount).toFixed(2)}</span></div>
                    </div>
                </div>
            </div>

            {quote.notes && (
                <div className="card" style={{ marginTop: 20 }}>
                    <h4 style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>Notes</h4>
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{quote.notes}</p>
                </div>
            )}

            {/* Custom Fields */}
            {quote.customFields && Object.keys(quote.customFields).length > 0 && (
                <div className="card" style={{ marginTop: 20 }}>
                    <h4 style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase' }}>Additional Information</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                        {Object.entries(quote.customFields).map(([label, value]) => (
                            <div key={label}>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>{label}</div>
                                <div style={{ fontSize: 14, fontWeight: 500 }}>{value}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Activity Timeline */}
            {quote.activityLogs && quote.activityLogs.length > 0 && (
                <div className="card" style={{ marginTop: 20 }}>
                    <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <HiOutlineClock /> Activity Timeline
                    </h3>
                    <div style={{ position: 'relative', paddingLeft: 24 }}>
                        <div style={{ position: 'absolute', left: 8, top: 4, bottom: 4, width: 2, background: 'var(--border)', borderRadius: 1 }} />
                        {quote.activityLogs.map((log, idx) => (
                            <div key={log.id} style={{ position: 'relative', paddingBottom: idx < quote.activityLogs.length - 1 ? 20 : 0 }}>
                                <div style={{
                                    position: 'absolute', left: -20, top: 2, width: 18, height: 18,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10,
                                    background: 'var(--surface)', border: '2px solid var(--border)', borderRadius: '50%',
                                    zIndex: 1,
                                }}>
                                    {actionIcon(log.action)}
                                </div>
                                <div style={{ paddingLeft: 8 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{ fontWeight: 600, fontSize: 13, textTransform: 'capitalize' }}>{log.action}</span>
                                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                            {new Date(log.createdAt).toLocaleString()}
                                        </span>
                                        {log.user && (
                                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                                by {log.user.firstName} {log.user.lastName}
                                            </span>
                                        )}
                                    </div>
                                    {log.details && <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '2px 0 0' }}>{log.details}</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuoteDetail;
