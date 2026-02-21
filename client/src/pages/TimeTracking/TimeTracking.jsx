import { useState, useEffect } from 'react';
import { timeAPI, customerAPI, invoiceAPI } from '../../services/api';
import { HiOutlinePlusCircle, HiOutlineTrash, HiOutlineDocumentText } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const TimeTracking = () => {
    const navigate = useNavigate();
    const [data, setData] = useState({ timeEntries: [], total: 0 });
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ hours: '', description: '', hourlyRate: '', isBillable: true, customerId: '' });
    const [selected, setSelected] = useState([]);
    const [converting, setConverting] = useState(false);

    const fetchEntries = async () => {
        try { const res = await timeAPI.getAll({ limit: 50 }); setData(res.data.data); }
        catch (err) { toast.error('Failed to load time entries'); }
        setLoading(false);
    };

    useEffect(() => {
        fetchEntries();
        customerAPI.getAll({ limit: 100 }).then((r) => setCustomers(r.data.data.customers)).catch(() => { });
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await timeAPI.create({ ...form, hours: Number(form.hours), hourlyRate: Number(form.hourlyRate) || 0 });
            toast.success('Time entry added');
            setShowModal(false); fetchEntries();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete?')) return;
        try { await timeAPI.delete(id); toast.success('Deleted'); fetchEntries(); } catch (err) { toast.error('Failed'); }
    };

    const toggleSelect = (id) => {
        setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
    };

    const handleConvertToInvoice = async () => {
        const selectedEntries = data.timeEntries.filter((e) => selected.includes(e.id) && e.isBillable && !e.isBilled);
        if (selectedEntries.length === 0) { toast.error('Select unbilled billable entries'); return; }

        // Group by customer
        const customerIds = [...new Set(selectedEntries.map((e) => e.customerId).filter(Boolean))];
        if (customerIds.length === 0) { toast.error('Selected entries must have a customer assigned'); return; }
        if (customerIds.length > 1) { toast.error('Selected entries must belong to the same customer'); return; }

        setConverting(true);
        try {
            const res = await invoiceAPI.fromBillable({ timeEntryIds: selected, customerId: customerIds[0] });
            toast.success(`Invoice ${res.data.data.invoiceNumber} created!`);
            setSelected([]);
            fetchEntries();
            navigate(`/invoices/${res.data.data.id}`);
        } catch (err) { toast.error(err.response?.data?.message || 'Conversion failed'); }
        setConverting(false);
    };

    const totalHours = data.timeEntries.reduce((s, e) => s + Number(e.hours), 0);
    const totalAmount = data.timeEntries.reduce((s, e) => s + Number(e.hours) * Number(e.hourlyRate), 0);
    const unbilledCount = data.timeEntries.filter((e) => e.isBillable && !e.isBilled).length;

    if (loading) return <div className="loading-spinner" />;

    return (
        <div className="fade-in">
            <div className="page-header">
                <div>
                    <h1>Time Tracking ({data.total})</h1>
                    <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>{totalHours}hrs — ${totalAmount.toLocaleString()} · {unbilledCount} unbilled</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    {selected.length > 0 && (
                        <button className="btn btn-primary" onClick={handleConvertToInvoice} disabled={converting}>
                            <HiOutlineDocumentText size={16} /> Convert to Invoice ({selected.length})
                        </button>
                    )}
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}><HiOutlinePlusCircle size={18} /> Log Time</button>
                </div>
            </div>
            <div className="card">
                {data.timeEntries.length === 0 ? (
                    <div className="empty-state"><h3>No time entries</h3><p>Log your working hours here.</p></div>
                ) : (
                    <div className="table-container">
                        <table>
                            <thead><tr><th style={{ width: 32 }}></th><th>Date</th><th>Description</th><th>Customer</th><th>Hours</th><th>Rate</th><th>Amount</th><th>Status</th><th></th></tr></thead>
                            <tbody>
                                {data.timeEntries.map((e) => (
                                    <tr key={e.id} style={{ opacity: e.isBilled ? 0.5 : 1 }}>
                                        <td>
                                            {e.isBillable && !e.isBilled && (
                                                <input type="checkbox" checked={selected.includes(e.id)} onChange={() => toggleSelect(e.id)} style={{ width: 'auto', cursor: 'pointer' }} />
                                            )}
                                        </td>
                                        <td>{new Date(e.date || e.createdAt).toLocaleDateString()}</td>
                                        <td style={{ fontWeight: 500 }}>{e.description}</td>
                                        <td>{e.customer?.displayName || '—'}</td>
                                        <td style={{ fontWeight: 600 }}>{e.hours}h</td>
                                        <td>${Number(e.hourlyRate).toFixed(2)}/hr</td>
                                        <td style={{ fontWeight: 600 }}>${(Number(e.hours) * Number(e.hourlyRate)).toFixed(2)}</td>
                                        <td>
                                            {e.isBilled ? <span className="badge badge-secondary">Billed</span>
                                                : e.isBillable ? <span className="badge badge-success">Unbilled</span>
                                                    : <span className="badge badge-secondary">Non-billable</span>}
                                        </td>
                                        <td><button className="btn btn-danger btn-sm" onClick={() => handleDelete(e.id)}><HiOutlineTrash /></button></td>
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
                        <h2>Log Time</h2>
                        <form onSubmit={handleCreate}>
                            <div className="form-group"><label>Description *</label><input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required /></div>
                            <div className="form-row">
                                <div className="form-group"><label>Hours *</label><input type="number" min="0.25" step="0.25" value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} required /></div>
                                <div className="form-group"><label>Hourly Rate</label><input type="number" min="0" step="0.01" value={form.hourlyRate} onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })} /></div>
                            </div>
                            <div className="form-group"><label>Customer</label>
                                <select value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })}>
                                    <option value="">No customer</option>
                                    {customers.map((c) => <option key={c.id} value={c.id}>{c.displayName}</option>)}
                                </select>
                            </div>
                            <div className="form-group"><label style={{ display: 'flex', alignItems: 'center', gap: 8 }}><input type="checkbox" checked={form.isBillable} onChange={(e) => setForm({ ...form, isBillable: e.target.checked })} style={{ width: 'auto' }} /> Billable</label></div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Log Time</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TimeTracking;
