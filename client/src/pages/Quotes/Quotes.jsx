import { useState, useEffect } from 'react';
import { quoteAPI, customerAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { HiOutlinePlusCircle, HiOutlineTrash, HiOutlineSwitchHorizontal } from 'react-icons/hi';
import toast from 'react-hot-toast';

const statusBadge = (status) => {
    const map = { ACCEPTED: 'badge-success', SENT: 'badge-info', DRAFT: 'badge-secondary', DECLINED: 'badge-danger', CONVERTED: 'badge-warning', EXPIRED: 'badge-secondary' };
    return <span className={`badge ${map[status] || 'badge-secondary'}`}>{status}</span>;
};

const Quotes = () => {
    const { user } = useAuth();
    const [data, setData] = useState({ quotes: [], total: 0 });

    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ customerId: '', expiryDate: '', items: [{ description: '', quantity: 1, rate: 0, taxRate: 0 }] });

    const fetchQuotes = async () => {
        try { const res = await quoteAPI.getAll({ limit: 50 }); setData(res.data.data); }
        catch (err) { toast.error('Failed to load quotes'); }
        setLoading(false);
    };

    useEffect(() => {
        fetchQuotes();
        customerAPI.getAll({ limit: 100 }).then((res) => setCustomers(res.data.data.customers)).catch(() => { });
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                customerId: form.customerId,
                expiryDate: form.expiryDate ? new Date(form.expiryDate).toISOString() : undefined,
                items: form.items.map((item) => ({
                    description: item.description || '',
                    quantity: Number(item.quantity),
                    rate: Number(item.rate),
                    taxRate: Number(item.taxRate) || 0,
                })),
            };
            await quoteAPI.create(payload);
            toast.success('Quote created');
            setShowModal(false); fetchQuotes();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    };

    const handleConvert = async (id) => {
        const dueDate = prompt('Enter invoice due date (YYYY-MM-DD):');
        if (!dueDate) return;
        try {
            const res = await quoteAPI.convert(id, { dueDate: new Date(dueDate).toISOString() });
            toast.success(`Converted to ${res.data.data.invoiceNumber}`);
            fetchQuotes();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed to convert'); }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this quote?')) return;
        try { await quoteAPI.delete(id); toast.success('Deleted'); fetchQuotes(); } catch (err) { toast.error('Failed'); }
    };

    const addLine = () => setForm({ ...form, items: [...form.items, { description: '', quantity: 1, rate: 0, taxRate: 0 }] });
    const updateLine = (i, f, v) => { const items = [...form.items]; items[i][f] = v; setForm({ ...form, items }); };

    if (loading) return <div className="loading-spinner" />;

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1>Quotes ({data.total})</h1>
                {user?.role !== 'VIEWER' && (
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}><HiOutlinePlusCircle size={18} /> New Quote</button>
                )}
            </div>
            <div className="card">
                {data.quotes.length === 0 ? (
                    <div className="empty-state">
                        <h3>No quotes yet</h3>
                        <p>Create a quote to send to your customer.</p>
                        {user?.role !== 'VIEWER' && <button className="btn btn-primary" onClick={() => setShowModal(true)}>Create Quote</button>}
                    </div>
                ) : (
                    <div className="table-container">
                        <table>
                            <thead><tr><th>Quote #</th><th>Customer</th><th>Amount</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
                            <tbody>
                                {data.quotes.map((q) => (
                                    <tr key={q.id}>
                                        <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{q.quoteNumber}</td>
                                        <td>{q.customer?.displayName}</td>
                                        <td style={{ fontWeight: 600 }}>${Number(q.totalAmount).toLocaleString()}</td>
                                        <td>{statusBadge(q.status)}</td>
                                        <td>{new Date(q.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                {user?.role !== 'VIEWER' && q.status !== 'CONVERTED' && (
                                                    <button className="btn btn-primary btn-sm" onClick={() => handleConvert(q.id)} title="Convert to Invoice"><HiOutlineSwitchHorizontal /></button>
                                                )}
                                                {user?.role !== 'VIEWER' && (
                                                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(q.id)}><HiOutlineTrash /></button>
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

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
                        <h2>New Quote</h2>
                        <form onSubmit={handleCreate}>
                            <div className="form-row">
                                <div className="form-group"><label>Customer *</label>
                                    <select value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })} required>
                                        <option value="">Select…</option>
                                        {customers.map((c) => <option key={c.id} value={c.id}>{c.displayName}</option>)}
                                    </select>
                                </div>
                                <div className="form-group"><label>Expiry Date</label><input type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} /></div>
                            </div>
                            <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Line Items</h4>
                            {form.items.map((line, i) => (
                                <div key={i} className="form-row" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
                                    <input placeholder="Description" value={line.description} onChange={(e) => updateLine(i, 'description', e.target.value)} style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 13 }} />
                                    <input type="number" placeholder="Qty" value={line.quantity} onChange={(e) => updateLine(i, 'quantity', Number(e.target.value))} style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 13 }} />
                                    <input type="number" placeholder="Rate" value={line.rate} onChange={(e) => updateLine(i, 'rate', Number(e.target.value))} style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 13 }} />
                                    <input type="number" placeholder="Tax %" value={line.taxRate} onChange={(e) => updateLine(i, 'taxRate', Number(e.target.value))} style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 13 }} />
                                </div>
                            ))}
                            <button type="button" className="btn btn-secondary btn-sm" onClick={addLine} style={{ marginBottom: 16 }}><HiOutlinePlusCircle /> Add Line</button>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Create Quote</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Quotes;
