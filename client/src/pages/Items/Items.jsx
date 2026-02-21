import { useState, useEffect } from 'react';
import { itemAPI } from '../../services/api';
import { HiOutlinePlusCircle, HiOutlinePencil, HiOutlineTrash } from 'react-icons/hi';
import toast from 'react-hot-toast';

const Items = () => {
    const [data, setData] = useState({ items: [], total: 0 });
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ name: '', description: '', rate: '', unit: '', sku: '', taxRate: '' });

    const fetchItems = async () => {
        try { const res = await itemAPI.getAll({ limit: 50 }); setData(res.data.data); }
        catch (err) { toast.error('Failed to load items'); }
        setLoading(false);
    };

    useEffect(() => { fetchItems(); }, []);

    const openCreate = () => { setEditing(null); setForm({ name: '', description: '', rate: '', unit: '', sku: '', taxRate: '' }); setShowModal(true); };
    const openEdit = (item) => { setEditing(item); setForm({ name: item.name, description: item.description || '', rate: item.rate, unit: item.unit || '', sku: item.sku || '', taxRate: item.taxRate || '' }); setShowModal(true); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = { ...form, rate: Number(form.rate), taxRate: Number(form.taxRate) || 0 };
        try {
            if (editing) { await itemAPI.update(editing.id, payload); toast.success('Item updated'); }
            else { await itemAPI.create(payload); toast.success('Item created'); }
            setShowModal(false); fetchItems();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this item?')) return;
        try { await itemAPI.delete(id); toast.success('Deleted'); fetchItems(); } catch (err) { toast.error('Failed to delete'); }
    };

    if (loading) return <div className="loading-spinner" />;

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1>Items ({data.total})</h1>
                <button className="btn btn-primary" onClick={openCreate}><HiOutlinePlusCircle size={18} /> Add Item</button>
            </div>
            <div className="card">
                {data.items.length === 0 ? (
                    <div className="empty-state"><h3>No items yet</h3><p>Add products or services to your catalog.</p><button className="btn btn-primary" onClick={openCreate}>Add Item</button></div>
                ) : (
                    <div className="table-container">
                        <table>
                            <thead><tr><th>Name</th><th>SKU</th><th>Rate</th><th>Unit</th><th>Tax %</th><th>Actions</th></tr></thead>
                            <tbody>
                                {data.items.map((item) => (
                                    <tr key={item.id}>
                                        <td style={{ fontWeight: 600 }}>{item.name}</td>
                                        <td>{item.sku || '—'}</td>
                                        <td style={{ fontWeight: 600 }}>${Number(item.rate).toFixed(2)}</td>
                                        <td>{item.unit || '—'}</td>
                                        <td>{item.taxRate || 0}%</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <button className="btn btn-secondary btn-sm" onClick={() => openEdit(item)}><HiOutlinePencil /></button>
                                                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item.id)}><HiOutlineTrash /></button>
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
                        <h2>{editing ? 'Edit Item' : 'New Item'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group"><label>Name *</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
                            <div className="form-group"><label>Description</label><textarea rows="2" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                            <div className="form-row">
                                <div className="form-group"><label>Rate *</label><input type="number" min="0" step="0.01" value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} required /></div>
                                <div className="form-group"><label>Unit</label><input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="hrs, pcs, etc." /></div>
                            </div>
                            <div className="form-row">
                                <div className="form-group"><label>SKU</label><input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></div>
                                <div className="form-group"><label>Tax Rate %</label><input type="number" min="0" step="0.01" value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: e.target.value })} /></div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">{editing ? 'Save Changes' : 'Create Item'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Items;
