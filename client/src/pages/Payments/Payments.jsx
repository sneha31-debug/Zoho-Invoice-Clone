import { useState, useEffect } from 'react';
import { paymentAPI, customerAPI, invoiceAPI } from '../../services/api';
import { HiOutlinePlusCircle } from 'react-icons/hi';
import toast from 'react-hot-toast';

const Payments = () => {
    const [data, setData] = useState({ payments: [], total: 0 });
    const [customers, setCustomers] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ customerId: '', invoiceId: '', amount: '', method: 'BANK_TRANSFER', notes: '' });

    const fetchPayments = async () => {
        try { const res = await paymentAPI.getAll({ limit: 50 }); setData(res.data.data); }
        catch (err) { toast.error('Failed to load payments'); }
        setLoading(false);
    };

    useEffect(() => {
        fetchPayments();
        customerAPI.getAll({ limit: 100 }).then((r) => setCustomers(r.data.data.customers)).catch(() => { });
        invoiceAPI.getAll({ limit: 100 }).then((r) => setInvoices(r.data.data.invoices)).catch(() => { });
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await paymentAPI.create({ ...form, amount: Number(form.amount) });
            toast.success('Payment recorded');
            setShowModal(false); fetchPayments();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    };

    const methodLabel = (m) => m.replace(/_/g, ' ');

    if (loading) return <div className="loading-spinner" />;

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1>Payments ({data.total})</h1>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}><HiOutlinePlusCircle size={18} /> Record Payment</button>
            </div>
            <div className="card">
                {data.payments.length === 0 ? (
                    <div className="empty-state"><h3>No payments yet</h3><p>Record a payment to track incoming money.</p></div>
                ) : (
                    <div className="table-container">
                        <table>
                            <thead><tr><th>Payment #</th><th>Customer</th><th>Invoice</th><th>Amount</th><th>Method</th><th>Status</th><th>Date</th></tr></thead>
                            <tbody>
                                {data.payments.map((p) => (
                                    <tr key={p.id}>
                                        <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{p.paymentNumber}</td>
                                        <td>{p.customer?.displayName}</td>
                                        <td>{p.invoice?.invoiceNumber || '—'}</td>
                                        <td style={{ fontWeight: 600, color: 'var(--success)' }}>${Number(p.amount).toLocaleString()}</td>
                                        <td><span className="badge badge-secondary">{methodLabel(p.method)}</span></td>
                                        <td><span className={`badge ${p.status === 'COMPLETED' ? 'badge-success' : 'badge-warning'}`}>{p.status}</span></td>
                                        <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h2>Record Payment</h2>
                        <form onSubmit={handleCreate}>
                            <div className="form-group"><label>Customer *</label>
                                <select value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })} required>
                                    <option value="">Select…</option>
                                    {customers.map((c) => <option key={c.id} value={c.id}>{c.displayName}</option>)}
                                </select>
                            </div>
                            <div className="form-group"><label>Invoice (optional)</label>
                                <select value={form.invoiceId} onChange={(e) => setForm({ ...form, invoiceId: e.target.value })}>
                                    <option value="">No linked invoice</option>
                                    {invoices.map((inv) => <option key={inv.id} value={inv.id}>{inv.invoiceNumber} — ${Number(inv.balanceDue).toFixed(2)} due</option>)}
                                </select>
                            </div>
                            <div className="form-row">
                                <div className="form-group"><label>Amount *</label><input type="number" min="0.01" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required /></div>
                                <div className="form-group"><label>Method</label>
                                    <select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
                                        <option value="BANK_TRANSFER">Bank Transfer</option><option value="CREDIT_CARD">Credit Card</option>
                                        <option value="CASH">Cash</option><option value="CHECK">Check</option><option value="PAYPAL">PayPal</option><option value="STRIPE">Stripe</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group"><label>Notes</label><textarea rows="2" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Record Payment</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Payments;
