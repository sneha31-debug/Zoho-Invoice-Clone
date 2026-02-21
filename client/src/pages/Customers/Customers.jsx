import { useState, useEffect } from 'react';
import { customerAPI } from '../../services/api';
import { HiOutlinePlusCircle, HiOutlinePencil, HiOutlineTrash } from 'react-icons/hi';
import toast from 'react-hot-toast';

const Customers = () => {
    const [data, setData] = useState({ customers: [], total: 0 });
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ displayName: '', email: '', phone: '', companyName: '', billingAddress: '' });

    const fetchCustomers = async () => {
        try {
            const res = await customerAPI.getAll({ limit: 50 });
            setData(res.data.data);
        } catch (err) { toast.error('Failed to load customers'); }
        setLoading(false);
    };

    useEffect(() => { fetchCustomers(); }, []);

    const openCreate = () => { setEditing(null); setForm({ displayName: '', email: '', phone: '', companyName: '', billingAddress: '' }); setShowModal(true); };
    const openEdit = (c) => { setEditing(c); setForm({ displayName: c.displayName, email: c.email || '', phone: c.phone || '', companyName: c.companyName || '', billingAddress: c.billingAddress || '' }); setShowModal(true); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editing) { await customerAPI.update(editing.id, form); toast.success('Customer updated'); }
            else { await customerAPI.create(form); toast.success('Customer created'); }
            setShowModal(false); fetchCustomers();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this customer?')) return;
        try { await customerAPI.delete(id); toast.success('Deleted'); fetchCustomers(); } catch (err) { toast.error('Failed to delete'); }
    };

    if (loading) return <div className="loading-spinner" />;

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1>Customers ({data.total})</h1>
                <button className="btn btn-primary" onClick={openCreate}><HiOutlinePlusCircle size={18} /> Add Customer</button>
            </div>
            <div className="card">
                {data.customers.length === 0 ? (
                    <div className="empty-state"><h3>No customers yet</h3><p>Add your first customer to get started.</p><button className="btn btn-primary" onClick={openCreate}>Add Customer</button></div>
                ) : (
                    <div className="table-container">
                        <table>
                            <thead><tr><th>Name</th><th>Company</th><th>Email</th><th>Phone</th><th>Created</th><th>Actions</th></tr></thead>
                            <tbody>
                                {data.customers.map((c) => (
                                    <tr key={c.id}>
                                        <td style={{ fontWeight: 600 }}>{c.displayName}</td>
                                        <td>{c.companyName || '—'}</td>
                                        <td>{c.email || '—'}</td>
                                        <td>{c.phone || '—'}</td>
                                        <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <button className="btn btn-secondary btn-sm" onClick={() => openEdit(c)}><HiOutlinePencil /></button>
                                                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.id)}><HiOutlineTrash /></button>
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
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h2>{editing ? 'Edit Customer' : 'New Customer'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group"><label>Display Name *</label><input value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} required /></div>
                            <div className="form-row">
                                <div className="form-group"><label>Email</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                                <div className="form-group"><label>Phone</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                            </div>
                            <div className="form-group"><label>Company Name</label><input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} /></div>
                            <div className="form-group"><label>Billing Address</label><textarea rows="2" value={form.billingAddress} onChange={(e) => setForm({ ...form, billingAddress: e.target.value })} /></div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">{editing ? 'Save Changes' : 'Create Customer'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Customers;
