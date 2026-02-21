import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { quoteAPI, customerAPI } from '../../services/api';
import { HiOutlinePlusCircle, HiOutlineTrash, HiOutlineArrowLeft } from 'react-icons/hi';
import toast from 'react-hot-toast';

const EditQuote = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        customerId: '',
        expiryDate: '',
        notes: '',
        items: [{ description: '', quantity: 1, rate: 0, taxRate: 0 }],
        customFields: []
    });

    useEffect(() => {
        const load = async () => {
            try {
                const [qRes, cRes] = await Promise.all([
                    quoteAPI.getById(id),
                    customerAPI.getAll({ limit: 100 })
                ]);
                const q = qRes.data.data;
                const date = q.expiryDate ? new Date(q.expiryDate).toISOString().split('T')[0] : '';

                // Convert customFields object to array for the form
                const cfArray = q.customFields ? Object.entries(q.customFields).map(([label, value]) => ({ label, value })) : [];

                setForm({
                    customerId: q.customerId,
                    expiryDate: date,
                    notes: q.notes || '',
                    items: q.items.map(i => ({
                        description: i.description,
                        quantity: i.quantity,
                        rate: i.rate,
                        taxRate: i.taxRate
                    })),
                    customFields: cfArray
                });
                setCustomers(cRes.data.data.customers);
            } catch (err) {
                toast.error('Failed to load quote data');
                navigate('/quotes');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id, navigate]);

    const addLine = () => setForm({ ...form, items: [...form.items, { description: '', quantity: 1, rate: 0, taxRate: 0 }] });
    const removeLine = (i) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });
    const updateLine = (i, f, v) => {
        const newItems = [...form.items];
        newItems[i][f] = v;
        setForm({ ...form, items: newItems });
    };

    const addCustomField = () => setForm({ ...form, customFields: [...form.customFields, { label: '', value: '' }] });
    const removeCustomField = (i) => setForm({ ...form, customFields: form.customFields.filter((_, idx) => idx !== i) });
    const updateCustomField = (i, field, value) => {
        const newFields = [...form.customFields];
        newFields[i][field] = value;
        setForm({ ...form, customFields: newFields });
    };

    const subtotal = form.items.reduce((s, l) => s + l.quantity * l.rate, 0);
    const tax = form.items.reduce((s, l) => s + l.quantity * l.rate * (l.taxRate / 100), 0);
    const total = subtotal + tax;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                customerId: form.customerId,
                expiryDate: form.expiryDate ? new Date(form.expiryDate).toISOString() : undefined,
                notes: form.notes || undefined,
                items: form.items.map((item) => ({
                    description: item.description || '',
                    quantity: Number(item.quantity),
                    rate: Number(item.rate),
                    taxRate: Number(item.taxRate) || 0,
                })),
                customFields: form.customFields.length > 0
                    ? Object.fromEntries(form.customFields.filter(f => f.label).map(f => [f.label, f.value]))
                    : {},
            };
            await quoteAPI.update(id, payload);
            toast.success('Quote updated!');
            navigate(`/quotes/${id}`);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update quote');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="loading-spinner" />;

    return (
        <div className="fade-in">
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <Link to={`/quotes/${id}`} className="btn btn-secondary btn-sm"><HiOutlineArrowLeft /></Link>
                    <h1>Edit Quote</h1>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="card" style={{ marginBottom: 20 }}>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Customer *</label>
                            <select value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })} required>
                                <option value="">Select customer…</option>
                                {customers.map((c) => <option key={c.id} value={c.id}>{c.displayName}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Expiry Date</label>
                            <input type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} />
                        </div>
                    </div>
                </div>

                <div className="card" style={{ marginBottom: 20 }}>
                    <div className="card-header" style={{ marginBottom: 16 }}>
                        <h3>Line Items</h3>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={addLine}><HiOutlinePlusCircle /> Add Item</button>
                    </div>
                    <div className="table-container">
                        <table>
                            <thead><tr><th>Description</th><th style={{ width: 90 }}>Qty</th><th style={{ width: 110 }}>Rate</th><th style={{ width: 90 }}>Tax %</th><th style={{ width: 110 }}>Amount</th><th style={{ width: 50 }}></th></tr></thead>
                            <tbody>
                                {form.items.map((line, i) => (
                                    <tr key={i}>
                                        <td><input style={{ width: '100%', padding: '6px 8px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 13 }} value={line.description} onChange={(e) => updateLine(i, 'description', e.target.value)} placeholder="Description" required /></td>
                                        <td><input type="number" min="0.01" step="0.01" style={{ width: '100%', padding: '6px 8px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 13 }} value={line.quantity} onChange={(e) => updateLine(i, 'quantity', Number(e.target.value))} /></td>
                                        <td><input type="number" min="0" step="0.01" style={{ width: '100%', padding: '6px 8px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 13 }} value={line.rate} onChange={(e) => updateLine(i, 'rate', Number(e.target.value))} /></td>
                                        <td><input type="number" min="0" step="0.01" style={{ width: '100%', padding: '6px 8px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 13 }} value={line.taxRate} onChange={(e) => updateLine(i, 'taxRate', Number(e.target.value))} /></td>
                                        <td style={{ fontWeight: 600, fontSize: 13 }}>${(line.quantity * line.rate).toFixed(2)}</td>
                                        <td>{form.items.length > 1 && <button type="button" className="btn btn-danger btn-sm" onClick={() => removeLine(i)}><HiOutlineTrash /></button>}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 320px', gap: 20 }}>
                    <div className="card">
                        <div className="form-group"><label>Notes</label><textarea rows="3" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notes visible to customer…" /></div>
                    </div>

                    <div className="card">
                        <div className="card-header" style={{ marginBottom: 12 }}>
                            <h3 style={{ fontSize: 14 }}>Custom Fields</h3>
                            <button type="button" className="btn btn-secondary btn-sm" onClick={addCustomField}><HiOutlinePlusCircle /> Add</button>
                        </div>
                        {form.customFields.map((f, i) => (
                            <div key={i} className="form-row" style={{ gridTemplateColumns: '1fr 1fr 40px', gap: 8, marginBottom: 8 }}>
                                <input placeholder="Label" value={f.label} onChange={(e) => updateCustomField(i, 'label', e.target.value)} style={{ padding: '6px 8px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 12 }} />
                                <input placeholder="Value" value={f.value} onChange={(e) => updateCustomField(i, 'value', e.target.value)} style={{ padding: '6px 8px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 12 }} />
                                <button type="button" className="btn btn-danger btn-sm" onClick={() => removeCustomField(i)}><HiOutlineTrash /></button>
                            </div>
                        ))}
                        {form.customFields.length === 0 && <p style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center' }}>No custom fields added</p>}
                    </div>

                    <div className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}><span>Tax</span><span>${tax.toFixed(2)}</span></div>
                        <hr style={{ border: 'none', borderTop: '2px solid var(--border)', margin: '12px 0' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 700 }}><span>Total</span><span>${total.toFixed(2)}</span></div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
                    <button type="button" className="btn btn-secondary" onClick={() => navigate(`/quotes/${id}`)}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Update Quote'}</button>
                </div>
            </form>
        </div>
    );
};

export default EditQuote;
