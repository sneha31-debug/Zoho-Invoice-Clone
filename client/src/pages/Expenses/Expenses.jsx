import { useState, useEffect } from 'react';
import { expenseAPI } from '../../services/api';
import { HiOutlinePlusCircle, HiOutlineTrash } from 'react-icons/hi';
import toast from 'react-hot-toast';

const categories = ['TRAVEL', 'MEALS', 'SUPPLIES', 'UTILITIES', 'RENT', 'SOFTWARE', 'MARKETING', 'MILEAGE', 'OTHER'];

const Expenses = () => {
    const [data, setData] = useState({ expenses: [], total: 0 });
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ amount: '', category: 'OTHER', merchant: '', description: '', isBillable: false });

    const fetchExpenses = async () => {
        try { const res = await expenseAPI.getAll({ limit: 50 }); setData(res.data.data); }
        catch (err) { toast.error('Failed to load expenses'); }
        setLoading(false);
    };

    useEffect(() => { fetchExpenses(); }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await expenseAPI.create({ ...form, amount: Number(form.amount) });
            toast.success('Expense added');
            setShowModal(false); fetchExpenses();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this expense?')) return;
        try { await expenseAPI.delete(id); toast.success('Deleted'); fetchExpenses(); } catch (err) { toast.error('Failed'); }
    };

    const totalExpenses = data.expenses.reduce((sum, e) => sum + Number(e.amount), 0);

    if (loading) return <div className="loading-spinner" />;

    return (
        <div className="fade-in">
            <div className="page-header">
                <div><h1>Expenses ({data.total})</h1><span style={{ fontSize: 14, color: 'var(--text-muted)' }}>Total: ${totalExpenses.toLocaleString()}</span></div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}><HiOutlinePlusCircle size={18} /> Add Expense</button>
            </div>
            <div className="card">
                {data.expenses.length === 0 ? (
                    <div className="empty-state"><h3>No expenses yet</h3><p>Track your business expenses here.</p></div>
                ) : (
                    <div className="table-container">
                        <table>
                            <thead><tr><th>Date</th><th>Merchant</th><th>Category</th><th>Amount</th><th>Billable</th><th>By</th><th></th></tr></thead>
                            <tbody>
                                {data.expenses.map((e) => (
                                    <tr key={e.id}>
                                        <td>{new Date(e.date || e.createdAt).toLocaleDateString()}</td>
                                        <td style={{ fontWeight: 600 }}>{e.merchant || '—'}</td>
                                        <td><span className="badge badge-info">{e.category.replace(/_/g, ' ')}</span></td>
                                        <td style={{ fontWeight: 600 }}>${Number(e.amount).toFixed(2)}</td>
                                        <td>{e.isBillable ? <span className="badge badge-success">Yes</span> : <span className="badge badge-secondary">No</span>}</td>
                                        <td>{e.user?.firstName} {e.user?.lastName}</td>
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
                        <h2>Add Expense</h2>
                        <form onSubmit={handleCreate}>
                            <div className="form-row">
                                <div className="form-group"><label>Amount *</label><input type="number" min="0.01" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required /></div>
                                <div className="form-group"><label>Category</label>
                                    <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                                        {categories.map((c) => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="form-group"><label>Merchant</label><input value={form.merchant} onChange={(e) => setForm({ ...form, merchant: e.target.value })} /></div>
                            <div className="form-group"><label>Description</label><textarea rows="2" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                            <div className="form-group"><label style={{ display: 'flex', alignItems: 'center', gap: 8 }}><input type="checkbox" checked={form.isBillable} onChange={(e) => setForm({ ...form, isBillable: e.target.checked })} style={{ width: 'auto' }} /> Billable to customer</label></div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Add Expense</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Expenses;
