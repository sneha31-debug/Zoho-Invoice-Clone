import { useState, useEffect } from 'react';
import { expenseAPI, customerAPI, invoiceAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { HiOutlinePlusCircle, HiOutlineTrash, HiOutlineDocumentText } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const categories = ['TRAVEL', 'MEALS', 'SUPPLIES', 'UTILITIES', 'RENT', 'SOFTWARE', 'MARKETING', 'MILEAGE', 'OTHER'];

const Expenses = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    // ... rest of state ...
    const [data, setData] = useState({ expenses: [], total: 0 });
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ amount: '', category: 'OTHER', merchant: '', description: '', isBillable: false, customerId: '' });
    const [selected, setSelected] = useState([]);
    const [converting, setConverting] = useState(false);

    const fetchExpenses = async () => {
        try { const res = await expenseAPI.getAll({ limit: 50 }); setData(res.data.data); }
        catch (err) { toast.error('Failed to load expenses'); }
        setLoading(false);
    };

    useEffect(() => {
        fetchExpenses();
        customerAPI.getAll({ limit: 100 }).then((r) => setCustomers(r.data.data.customers)).catch(() => { });
    }, []);

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

    const toggleSelect = (id) => {
        setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
    };

    const handleConvertToInvoice = async () => {
        const selectedExpenses = data.expenses.filter((e) => selected.includes(e.id) && e.isBillable && !e.isBilled);
        if (selectedExpenses.length === 0) { toast.error('Select unbilled billable expenses'); return; }

        const customerIds = [...new Set(selectedExpenses.map((e) => e.customerId).filter(Boolean))];
        if (customerIds.length === 0) { toast.error('Selected expenses must have a customer assigned'); return; }
        if (customerIds.length > 1) { toast.error('Selected expenses must belong to the same customer'); return; }

        setConverting(true);
        try {
            const res = await invoiceAPI.fromBillable({ expenseIds: selected, customerId: customerIds[0] });
            toast.success(`Invoice ${res.data.data.invoiceNumber} created!`);
            setSelected([]);
            fetchExpenses();
            navigate(`/invoices/${res.data.data.id}`);
        } catch (err) { toast.error(err.response?.data?.message || 'Conversion failed'); }
        setConverting(false);
    };

    const totalExpenses = data.expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const unbilledCount = data.expenses.filter((e) => e.isBillable && !e.isBilled).length;

    if (loading) return <div className="loading-spinner" />;

    return (
        <div className="fade-in">
            <div className="page-header">
                <div>
                    <h1>Expenses ({data.total})</h1>
                    <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>Total: ${totalExpenses.toLocaleString()} · {unbilledCount} unbilled billable</span>
                </div>
                {user?.role !== 'VIEWER' && (
                    <div style={{ display: 'flex', gap: 8 }}>
                        {selected.length > 0 && (
                            <button className="btn btn-primary" onClick={handleConvertToInvoice} disabled={converting}>
                                <HiOutlineDocumentText size={16} /> Convert to Invoice ({selected.length})
                            </button>
                        )}
                        <button className="btn btn-primary" onClick={() => setShowModal(true)}><HiOutlinePlusCircle size={18} /> Add Expense</button>
                    </div>
                )}
            </div>
            <div className="card">
                {data.expenses.length === 0 ? (
                    <div className="empty-state"><h3>No expenses yet</h3><p>Track your business expenses here.</p></div>
                ) : (
                    <div className="table-container">
                        <table>
                            <thead><tr><th style={{ width: 32 }}></th><th>Date</th><th>Merchant</th><th>Category</th><th>Amount</th><th>Customer</th><th>Status</th><th>By</th><th></th></tr></thead>
                            <tbody>
                                {data.expenses.map((e) => (
                                    <tr key={e.id} style={{ opacity: e.isBilled ? 0.5 : 1 }}>
                                        <td>
                                            {user?.role !== 'VIEWER' && e.isBillable && !e.isBilled && (
                                                <input type="checkbox" checked={selected.includes(e.id)} onChange={() => toggleSelect(e.id)} style={{ width: 'auto', cursor: 'pointer' }} />
                                            )}
                                        </td>
                                        <td>{new Date(e.date || e.createdAt).toLocaleDateString()}</td>
                                        <td style={{ fontWeight: 600 }}>{e.merchant || '—'}</td>
                                        <td><span className="badge badge-info">{e.category.replace(/_/g, ' ')}</span></td>
                                        <td style={{ fontWeight: 600 }}>${Number(e.amount).toFixed(2)}</td>
                                        <td>{e.customer?.displayName || '—'}</td>
                                        <td>
                                            {e.isBilled ? <span className="badge badge-secondary">Billed</span>
                                                : e.isBillable ? <span className="badge badge-success">Unbilled</span>
                                                    : <span className="badge badge-secondary">Non-billable</span>}
                                        </td>
                                        <td>{e.user?.firstName} {e.user?.lastName}</td>
                                        <td>
                                            {user?.role !== 'VIEWER' && (
                                                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(e.id)}><HiOutlineTrash /></button>
                                            )}
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
                            <div className="form-group"><label>Customer</label>
                                <select value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })}>
                                    <option value="">No customer</option>
                                    {customers.map((c) => <option key={c.id} value={c.id}>{c.displayName}</option>)}
                                </select>
                            </div>
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
