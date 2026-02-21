import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { invoiceAPI } from '../../services/api';
import { HiOutlineArrowLeft } from 'react-icons/hi';

const statusBadge = (status) => {
    const map = { PAID: 'badge-success', SENT: 'badge-info', DRAFT: 'badge-secondary', OVERDUE: 'badge-danger', PARTIALLY_PAID: 'badge-warning' };
    return <span className={`badge ${map[status] || 'badge-secondary'}`}>{status.replace('_', ' ')}</span>;
};

const InvoiceDetail = () => {
    const { id } = useParams();
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        invoiceAPI.getById(id).then((res) => setInvoice(res.data.data)).catch(console.error).finally(() => setLoading(false));
    }, [id]);

    if (loading) return <div className="loading-spinner" />;
    if (!invoice) return <div className="empty-state"><h3>Invoice not found</h3></div>;

    return (
        <div className="fade-in">
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <Link to="/invoices" className="btn btn-secondary btn-sm"><HiOutlineArrowLeft /></Link>
                    <div>
                        <h1>{invoice.invoiceNumber}</h1>
                        <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>Created {new Date(invoice.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>
                {statusBadge(invoice.status)}
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
        </div>
    );
};

export default InvoiceDetail;
