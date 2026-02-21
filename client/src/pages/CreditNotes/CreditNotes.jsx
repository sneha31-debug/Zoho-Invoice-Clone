import { useState, useEffect } from 'react';
import { creditNoteAPI, customerAPI, invoiceAPI } from '../../services/api';
import { HiOutlinePlusCircle, HiOutlineTrash } from 'react-icons/hi';
import toast from 'react-hot-toast';

const CreditNotes = () => {
    const [data, setData] = useState({ creditNotes: [], total: 0 });
    const [customers, setCustomers] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ customerId: '', invoiceId: '', amount: '', reason: '', notes: '' });

    const fetchAll = async () => {
        try {
            const [cnRes, custRes, invRes] = await Promise.all([
                creditNoteAPI.getAll({ limit: 50 }),
                customerAPI.getAll({ limit: 100 }),
                invoiceAPI.getAll({ limit: 100 }),
            ]);
            setData(cnRes.data.data);
            setCustomers(custRes.data.data.customers || []);
            setInvoices(invRes.data.data.invoices || []);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    useEffect(() => { fetchAll(); }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                customerId: form.customerId,
                amount: Number(form.amount),
                reason: form.reason || undefined,
                notes: form.notes || undefined,
                invoiceId: form.invoiceId && form.invoiceId !== '' ? form.invoiceId : undefined,
            };
            await creditNoteAPI.create(payload);
            toast.success('Credit note created');
            setShowModal(false);
            setForm({ customerId: '', invoiceId: '', amount: '', reason: '', notes: '' });
            fetchAll();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this credit note?')) return;
        try { await creditNoteAPI.delete(id); toast.success('Deleted'); fetchAll(); }
        catch (err) { toast.error('Failed to delete'); }
    };

    if (loading) return <div className="loading-spinner" />;

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1>Credit Notes</h1>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}><HiOutlinePlusCircle size={18} /> New Credit Note</button>
            </div>

            {data.creditNotes.length === 0 ? (
                <div className="card"><div className="empty-state"><p>No credit notes yet</p></div></div>
            ) : (
                <div className="card">
                    <div className="table-container">
                        <table>
                            <thead><tr><th>CN #</th><th>Customer</th><th>Invoice</th><th>Amount</th><th>Reason</th><th>Date</th><th></th></tr></thead>
                            <tbody>
                                {data.creditNotes.map((cn) => (
                                    <tr key={cn.id}>
                                        <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{cn.creditNoteNumber}</td>
                                        <td>{cn.customer?.displayName}</td>
                                        <td>{cn.invoice?.invoiceNumber || '—'}</td>
                                        <td style={{ fontWeight: 700, color: 'var(--success)' }}>${Number(cn.amount).toLocaleString()}</td>
                                        <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{cn.reason || '—'}</td>
                                        <td>{new Date(cn.date).toLocaleDateString()}</td>
                                        <td><button className="btn btn-danger btn-sm" onClick={() => handleDelete(cn.id)}><HiOutlineTrash /></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h2>New Credit Note</h2>
                        <form onSubmit={handleCreate}>
                            <div className="form-group">
                                <label>Customer *</label>
                                <select value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })} required>
                                    <option value="">Select customer…</option>
                                    {customers.map((c) => <option key={c.id} value={c.id}>{c.displayName}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Linked Invoice (optional)</label>
                                <select value={form.invoiceId} onChange={(e) => setForm({ ...form, invoiceId: e.target.value })}>
                                    <option value="">None</option>
                                    {invoices.filter((i) => i.customerId === form.customerId).map((i) => <option key={i.id} value={i.id}>{i.invoiceNumber} — ${Number(i.totalAmount).toLocaleString()}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Amount *</label>
                                <input type="number" step="0.01" min="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>Reason</label>
                                <input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="e.g. Overcharge refund" />
                            </div>
                            <div className="form-group">
                                <label>Notes</label>
                                <textarea rows="2" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                            </div>
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CreditNotes;
