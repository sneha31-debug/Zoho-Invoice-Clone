import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { customerAPI, invoiceAPI, paymentAPI, quoteAPI } from '../../services/api';
import { HiOutlineArrowLeft, HiOutlineDocumentText, HiOutlineCreditCard, HiOutlineClipboardList } from 'react-icons/hi';
import toast from 'react-hot-toast';

const statusBadge = (status) => {
    const map = { PAID: 'badge-success', SENT: 'badge-info', DRAFT: 'badge-secondary', OVERDUE: 'badge-danger', PARTIALLY_PAID: 'badge-warning', ACCEPTED: 'badge-success', DECLINED: 'badge-danger' };
    return <span className={`badge ${map[status] || 'badge-secondary'}`}>{status?.replace('_', ' ')}</span>;
};

const CustomerDetail = () => {
    const { id } = useParams();
    const [customer, setCustomer] = useState(null);
    const [invoices, setInvoices] = useState([]);
    const [payments, setPayments] = useState([]);
    const [quotes, setQuotes] = useState([]);
    const [activeTab, setActiveTab] = useState('invoices');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const custRes = await customerAPI.getById(id);
                setCustomer(custRes.data.data);
                const [invRes, payRes, quoRes] = await Promise.all([
                    invoiceAPI.getAll({ limit: 50 }),
                    paymentAPI.getAll({ limit: 50 }),
                    quoteAPI.getAll({ limit: 50 }),
                ]);
                setInvoices((invRes.data.data.invoices || []).filter((i) => i.customerId === id));
                setPayments((payRes.data.data.payments || []).filter((p) => p.customerId === id));
                setQuotes((quoRes.data.data.quotes || []).filter((q) => q.customerId === id));
            } catch (err) { toast.error('Failed to load customer'); }
            setLoading(false);
        };
        fetchAll();
    }, [id]);

    if (loading) return <div className="loading-spinner" />;
    if (!customer) return <div className="empty-state"><h3>Customer not found</h3></div>;

    const totalBilled = invoices.reduce((s, i) => s + (i.totalAmount || 0), 0);
    const totalPaid = invoices.reduce((s, i) => s + (i.amountPaid || 0), 0);
    const totalOutstanding = invoices.reduce((s, i) => s + (i.balanceDue || 0), 0);

    const tabs = [
        { key: 'invoices', label: 'Invoices', count: invoices.length },
        { key: 'quotes', label: 'Quotes', count: quotes.length },
        { key: 'payments', label: 'Payments', count: payments.length },
    ];

    return (
        <div className="fade-in">
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <Link to="/customers" className="btn btn-secondary btn-sm"><HiOutlineArrowLeft /></Link>
                    <div>
                        <h1>{customer.displayName}</h1>
                        {customer.companyName && <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>{customer.companyName}</span>}
                    </div>
                </div>
            </div>

            {/* Info + Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
                <div className="card" style={{ padding: 16 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>Email</div>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>{customer.email || '—'}</div>
                </div>
                <div className="card" style={{ padding: 16 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>Total Billed</div>
                    <div style={{ fontWeight: 700, fontSize: 20, color: 'var(--primary)' }}>${totalBilled.toLocaleString()}</div>
                </div>
                <div className="card" style={{ padding: 16 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>Paid</div>
                    <div style={{ fontWeight: 700, fontSize: 20, color: 'var(--success)' }}>${totalPaid.toLocaleString()}</div>
                </div>
                <div className="card" style={{ padding: 16 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>Outstanding</div>
                    <div style={{ fontWeight: 700, fontSize: 20, color: totalOutstanding > 0 ? 'var(--danger)' : 'var(--success)' }}>${totalOutstanding.toLocaleString()}</div>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--surface)', padding: 4, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', width: 'fit-content' }}>
                {tabs.map((t) => (
                    <button key={t.key} onClick={() => setActiveTab(t.key)}
                        style={{ padding: '8px 20px', background: activeTab === t.key ? 'var(--primary)' : 'none', border: 'none', color: activeTab === t.key ? '#fff' : 'var(--text-muted)', fontWeight: 500, cursor: 'pointer', borderRadius: 'var(--radius-sm)', fontSize: 13, transition: 'all 0.2s' }}>
                        {t.label} ({t.count})
                    </button>
                ))}
            </div>

            <div className="card">
                {activeTab === 'invoices' && (
                    invoices.length === 0 ? <div className="empty-state"><p>No invoices for this customer</p></div> : (
                        <div className="table-container">
                            <table>
                                <thead><tr><th>Invoice #</th><th>Amount</th><th>Paid</th><th>Balance</th><th>Status</th><th>Date</th></tr></thead>
                                <tbody>
                                    {invoices.map((inv) => (
                                        <tr key={inv.id}>
                                            <td><Link to={`/invoices/${inv.id}`} style={{ color: 'var(--primary)', fontWeight: 600 }}>{inv.invoiceNumber}</Link></td>
                                            <td style={{ fontWeight: 600 }}>${Number(inv.totalAmount).toLocaleString()}</td>
                                            <td>${Number(inv.amountPaid).toLocaleString()}</td>
                                            <td style={{ fontWeight: 600, color: inv.balanceDue > 0 ? 'var(--danger)' : 'var(--success)' }}>${Number(inv.balanceDue).toLocaleString()}</td>
                                            <td>{statusBadge(inv.status)}</td>
                                            <td>{new Date(inv.createdAt).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )
                )}

                {activeTab === 'quotes' && (
                    quotes.length === 0 ? <div className="empty-state"><p>No quotes for this customer</p></div> : (
                        <div className="table-container">
                            <table>
                                <thead><tr><th>Quote #</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
                                <tbody>
                                    {quotes.map((q) => (
                                        <tr key={q.id}>
                                            <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{q.quoteNumber}</td>
                                            <td style={{ fontWeight: 600 }}>${Number(q.totalAmount).toLocaleString()}</td>
                                            <td>{statusBadge(q.status)}</td>
                                            <td>{new Date(q.createdAt).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )
                )}

                {activeTab === 'payments' && (
                    payments.length === 0 ? <div className="empty-state"><p>No payments from this customer</p></div> : (
                        <div className="table-container">
                            <table>
                                <thead><tr><th>Payment #</th><th>Amount</th><th>Mode</th><th>Date</th></tr></thead>
                                <tbody>
                                    {payments.map((p) => (
                                        <tr key={p.id}>
                                            <td style={{ fontWeight: 600 }}>{p.paymentNumber}</td>
                                            <td style={{ fontWeight: 700, color: 'var(--success)' }}>${Number(p.amount).toLocaleString()}</td>
                                            <td>{p.paymentMode}</td>
                                            <td>{new Date(p.paymentDate).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )
                )}
            </div>
        </div>
    );
};

export default CustomerDetail;
