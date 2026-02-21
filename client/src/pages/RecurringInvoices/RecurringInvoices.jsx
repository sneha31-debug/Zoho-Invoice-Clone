import { useState, useEffect } from 'react';
import { recurringInvoiceAPI, customerAPI } from '../../services/api';
import { HiOutlinePlusCircle, HiOutlineTrash, HiOutlinePause, HiOutlinePlay } from 'react-icons/hi';
import toast from 'react-hot-toast';

const frequencies = ['weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'];

const RecurringInvoices = () => {
    const [data, setData] = useState({ recurringInvoices: [], total: 0 });
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ customerId: '', profileName: '', frequency: 'monthly', startDate: '', endDate: '', totalAmount: '', notes: '' });

    const fetchAll = async () => {
        try {
            const [riRes, custRes] = await Promise.all([
                recurringInvoiceAPI.getAll({ limit: 50 }),
                customerAPI.getAll({ limit: 100 }),
            ]);
            setData(riRes.data.data);
            setCustomers(custRes.data.data.customers || []);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    useEffect(() => { fetchAll(); }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                customerId: form.customerId,
                profileName: form.profileName || undefined,
                frequency: form.frequency,
                startDate: new Date(form.startDate).toISOString(),
                endDate: form.endDate ? new Date(form.endDate).toISOString() : undefined,
                totalAmount: Number(form.totalAmount) || 0,
                notes: form.notes || undefined,
            };
            await recurringInvoiceAPI.create(payload);
            toast.success('Recurring invoice created');
            setShowModal(false);
            setForm({ customerId: '', profileName: '', frequency: 'monthly', startDate: '', endDate: '', totalAmount: '', notes: '' });
            fetchAll();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    };

    const toggleActive = async (ri) => {
        try {
            await recurringInvoiceAPI.update(ri.id, { isActive: !ri.isActive });
            toast.success(ri.isActive ? 'Paused' : 'Activated');
            fetchAll();
        } catch (err) { toast.error('Failed to update'); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this recurring invoice?')) return;
        try { await recurringInvoiceAPI.delete(id); toast.success('Deleted'); fetchAll(); }
        catch (err) { toast.error('Failed to delete'); }
    };

    if (loading) return <div className="loading-spinner" />;

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1>Recurring Invoices</h1>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}><HiOutlinePlusCircle size={18} /> New Recurring</button>
            </div>

            {data.recurringInvoices.length === 0 ? (
                <div className="card"><div className="empty-state"><p>No recurring invoices yet</p></div></div>
            ) : (
                <div className="card">
                    <div className="table-container">
                        <table>
                            <thead><tr><th>Profile</th><th>Customer</th><th>Frequency</th><th>Amount</th><th>Next Invoice</th><th>Status</th><th></th></tr></thead>
                            <tbody>
                                {data.recurringInvoices.map((ri) => (
                                    <tr key={ri.id}>
                                        <td style={{ fontWeight: 600 }}>{ri.profileName}</td>
                                        <td>{ri.customer?.displayName}</td>
                                        <td><span className="badge badge-secondary" style={{ textTransform: 'capitalize' }}>{ri.frequency}</span></td>
                                        <td style={{ fontWeight: 700 }}>${Number(ri.totalAmount).toLocaleString()}</td>
                                        <td>{ri.nextInvoiceDate ? new Date(ri.nextInvoiceDate).toLocaleDateString() : '—'}</td>
                                        <td>
                                            <span className={`badge ${ri.isActive ? 'badge-success' : 'badge-secondary'}`}>
                                                {ri.isActive ? 'Active' : 'Paused'}
                                            </span>
                                        </td>
                                        <td style={{ display: 'flex', gap: 4 }}>
                                            <button className="btn btn-secondary btn-sm" onClick={() => toggleActive(ri)} title={ri.isActive ? 'Pause' : 'Activate'}>
                                                {ri.isActive ? <HiOutlinePause /> : <HiOutlinePlay />}
                                            </button>
                                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(ri.id)}><HiOutlineTrash /></button>
                                        </td>
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
                        <h2>New Recurring Invoice</h2>
                        <form onSubmit={handleCreate}>
                            <div className="form-group">
                                <label>Profile Name</label>
                                <input value={form.profileName} onChange={(e) => setForm({ ...form, profileName: e.target.value })} placeholder="e.g. Monthly Web Hosting" />
                            </div>
                            <div className="form-group">
                                <label>Customer *</label>
                                <select value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })} required>
                                    <option value="">Select customer…</option>
                                    {customers.map((c) => <option key={c.id} value={c.id}>{c.displayName}</option>)}
                                </select>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Frequency *</label>
                                    <select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })}>
                                        {frequencies.map((f) => <option key={f} value={f} style={{ textTransform: 'capitalize' }}>{f}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Amount</label>
                                    <input type="number" step="0.01" min="0" value={form.totalAmount} onChange={(e) => setForm({ ...form, totalAmount: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Start Date *</label>
                                    <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>End Date</label>
                                    <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
                                </div>
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

export default RecurringInvoices;
