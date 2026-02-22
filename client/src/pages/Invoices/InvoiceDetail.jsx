import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { invoiceAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { HiOutlineArrowLeft, HiOutlineCheckCircle, HiOutlinePaperAirplane, HiOutlineTrash, HiOutlinePencil, HiOutlineClock, HiOutlinePrinter } from 'react-icons/hi';
import toast from 'react-hot-toast';
import PaymentModal from '../../components/Payment/PaymentModal';

const statusBadge = (status) => {
    const map = { PAID: 'badge-success', SENT: 'badge-info', DRAFT: 'badge-secondary', OVERDUE: 'badge-danger', PARTIALLY_PAID: 'badge-warning' };
    return <span className={`badge ${map[status] || 'badge-secondary'}`}>{status.replace('_', ' ')}</span>;
};

const actionIcon = (action) => {
    const map = { created: '🆕', sent: '📤', paid: '✅', updated: '✏️', deleted: '🗑️', overdue: '⚠️', viewed: '👁️' };
    return map[action] || '📋';
};

const InvoiceDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [acting, setActing] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    const fetchInvoice = () => {
        invoiceAPI.getById(id).then((res) => setInvoice(res.data.data)).catch(console.error).finally(() => setLoading(false));
    };

    useEffect(() => { fetchInvoice(); }, [id]);

    const handleMarkPaid = async () => {
        setActing(true);
        try {
            await invoiceAPI.update(id, { status: 'PAID', amountPaid: invoice.totalAmount, balanceDue: 0 });
            toast.success('Invoice marked as paid');
            fetchInvoice();
        } catch (err) { toast.error('Failed to update'); }
        setActing(false);
    };

    const handleMarkSent = async () => {
        setActing(true);
        try {
            await invoiceAPI.update(id, { status: 'SENT' });
            toast.success('Invoice marked as sent');
            fetchInvoice();
        } catch (err) { toast.error('Failed to update'); }
        setActing(false);
    };

    const handleSendEmail = async () => {
        setActing(true);
        try {
            await invoiceAPI.sendEmail(id);
            toast.success('Invoice sent to customer email');
            fetchInvoice();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to send email');
        }
        setActing(false);
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this invoice? This cannot be undone.')) return;
        setActing(true);
        try {
            await invoiceAPI.delete(id);
            toast.success('Invoice deleted');
            navigate('/invoices');
        } catch (err) { toast.error('Failed to delete'); }
        setActing(false);
    };

    const handleDownloadPDF = async () => {
        setActing(true);
        try {
            const res = await invoiceAPI.downloadPDF(id);
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Invoice-${invoice.invoiceNumber}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success('PDF downloaded');
        } catch (err) {
            toast.error('Failed to download PDF');
            console.error(err);
        }
        setActing(false);
    };

    if (loading) return <div className="loading-spinner" />;
    if (!invoice) return <div className="empty-state"><h3>Invoice not found</h3></div>;

    const brandColor = invoice.organization?.primaryColor || '#4f46e5';

    return (
        <div className="fade-in" style={{ '--primary': brandColor }}>
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <Link to="/invoices" className="btn btn-secondary btn-sm"><HiOutlineArrowLeft /></Link>
                    <div>
                        <h1>{invoice.invoiceNumber}</h1>
                        <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>Created {new Date(invoice.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {statusBadge(invoice.status)}
                    {user?.role !== 'VIEWER' && (
                        <>
                            {invoice.status !== 'PAID' && (
                                <>
                                    <button className="btn btn-primary btn-sm" onClick={() => setShowPaymentModal(true)} disabled={acting}>
                                        <HiOutlinePaperAirplane /> Pay Now
                                    </button>
                                    <button className="btn btn-secondary btn-sm" onClick={handleMarkPaid} disabled={acting}>
                                        <HiOutlineCheckCircle /> Mark Paid
                                    </button>
                                </>
                            )}
                            {['DRAFT', 'SENT', 'VIEWED', 'PARTIALLY_PAID', 'PAID'].includes(String(invoice.status).toUpperCase()) && (
                                <button className="btn btn-secondary btn-sm" onClick={handleSendEmail} disabled={acting}>
                                    <HiOutlinePaperAirplane /> Send Email
                                </button>
                            )}
                            {String(invoice.status).toUpperCase() === 'DRAFT' && (
                                <button className="btn btn-secondary btn-sm" onClick={handleMarkSent} disabled={acting}>
                                    <HiOutlinePaperAirplane /> Mark Sent
                                </button>
                            )}
                            <Link to={`/invoices/${id}/edit`} className="btn btn-secondary btn-sm">
                                <HiOutlinePencil /> Edit
                            </Link>
                        </>
                    )}
                    <button className="btn btn-secondary btn-sm" onClick={handleDownloadPDF} disabled={acting}>
                        <HiOutlinePrinter /> PDF
                    </button>
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
                    <div style={{ fontWeight: 600 }}>{invoice.customer?.displayName}</div>
                    <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{invoice.customer?.email}</div>
                    <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{invoice.customer?.companyName}</div>
                </div>
                <div className="card">
                    <h4 style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>Summary</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 14 }}>
                        <span style={{ color: 'var(--text-muted)' }}>Due Date</span><span>{new Date(invoice.dueDate).toLocaleDateString()}</span>
                        <span style={{ color: 'var(--text-muted)' }}>Total</span><span style={{ fontWeight: 700 }}>${Number(invoice.totalAmount).toLocaleString()}</span>
                        <span style={{ color: 'var(--text-muted)' }}>Paid</span><span>${Number(invoice.amountPaid).toLocaleString()}</span>
                        <span style={{ color: 'var(--text-muted)' }}>Balance Due</span><span style={{ fontWeight: 700, color: invoice.balanceDue > 0 ? 'var(--danger)' : 'var(--success)' }}>${Number(invoice.balanceDue).toLocaleString()}</span>
                    </div>
                </div>
            </div>

            <div className="card">
                <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 700 }}>Line Items</h3>
                <div className="table-container">
                    <table>
                        <thead><tr><th>Description</th><th>Qty</th><th>Rate</th><th>Tax %</th><th>Amount</th></tr></thead>
                        <tbody>
                            {invoice.items?.map((item) => (
                                <tr key={item.id}>
                                    <td>{item.description || item.item?.name}</td>
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
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14 }}><span>Subtotal</span><span>${Number(invoice.subtotal).toFixed(2)}</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14 }}><span>Tax</span><span>${Number(invoice.taxAmount).toFixed(2)}</span></div>
                        {invoice.discountAmount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14 }}><span>Discount</span><span>-${Number(invoice.discountAmount).toFixed(2)}</span></div>}
                        <hr style={{ border: 'none', borderTop: '2px solid var(--border)', margin: '8px 0' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 18, fontWeight: 700 }}><span>Total</span><span>${Number(invoice.totalAmount).toFixed(2)}</span></div>
                    </div>
                </div>
            </div>

            {/* Notes */}
            {invoice.notes && (
                <div className="card" style={{ marginTop: 20 }}>
                    <h4 style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>Notes</h4>
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{invoice.notes}</p>
                </div>
            )}

            {/* Custom Fields */}
            {invoice.customFields && Object.keys(invoice.customFields).length > 0 && (
                <div className="card" style={{ marginTop: 20 }}>
                    <h4 style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase' }}>Additional Information</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                        {Object.entries(invoice.customFields).map(([label, value]) => (
                            <div key={label}>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>{label}</div>
                                <div style={{ fontSize: 14, fontWeight: 500 }}>{value}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Activity Timeline */}
            {invoice.activityLogs && invoice.activityLogs.length > 0 && (
                <div className="card" style={{ marginTop: 20 }}>
                    <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <HiOutlineClock /> Activity Timeline
                    </h3>
                    <div style={{ position: 'relative', paddingLeft: 24 }}>
                        <div style={{ position: 'absolute', left: 8, top: 4, bottom: 4, width: 2, background: 'var(--border)', borderRadius: 1 }} />
                        {invoice.activityLogs.map((log, idx) => (
                            <div key={log.id} style={{ position: 'relative', paddingBottom: idx < invoice.activityLogs.length - 1 ? 20 : 0 }}>
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

            {showPaymentModal && (
                <PaymentModal
                    invoice={invoice}
                    onClose={() => setShowPaymentModal(false)}
                    onSuccess={fetchInvoice}
                />
            )}
        </div>
    );
};

export default InvoiceDetail;
