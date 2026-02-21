import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { invoiceAPI, customerAPI, itemAPI } from '../../services/api';
import { HiOutlinePlusCircle, HiOutlineTrash } from 'react-icons/hi';
import toast from 'react-hot-toast';

const CreateInvoice = () => {
    const navigate = useNavigate();
    const [customers, setCustomers] = useState([]);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        customerId: '', dueDate: '', notes: '', discountAmount: 0,
        items: [{ description: '', quantity: 1, rate: 0, taxRate: 0, itemId: '' }],
    });

    useEffect(() => {
        Promise.all([customerAPI.getAll({ limit: 100 }), itemAPI.getAll({ limit: 100 })])
            .then(([c, i]) => { setCustomers(c.data.data.customers); setItems(i.data.data.items); });
    }, []);

    const addLine = () => setForm({ ...form, items: [...form.items, { description: '', quantity: 1, rate: 0, taxRate: 0, itemId: '' }] });
    const removeLine = (i) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });
    const updateLine = (i, field, value) => {
        const newItems = [...form.items];
        newItems[i][field] = value;
        if (field === 'itemId' && value) {
            const itm = items.find((it) => it.id === value);
            if (itm) { newItems[i].description = itm.name; newItems[i].rate = itm.rate; newItems[i].taxRate = itm.taxRate || 0; }
        }
        setForm({ ...form, items: newItems });
    };

    const subtotal = form.items.reduce((s, l) => s + l.quantity * l.rate, 0);
    const tax = form.items.reduce((s, l) => s + l.quantity * l.rate * (l.taxRate / 100), 0);
    const total = subtotal + tax - (form.discountAmount || 0);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                customerId: form.customerId,
                dueDate: new Date(form.dueDate).toISOString(),
                notes: form.notes || undefined,
                discountAmount: Number(form.discountAmount) || 0,
                items: form.items.map((item) => ({
                    description: item.description || '',
                    quantity: Number(item.quantity),
                    rate: Number(item.rate),
                    taxRate: Number(item.taxRate) || 0,
                    itemId: item.itemId && item.itemId !== '' ? item.itemId : undefined,
                })),
            };
            await invoiceAPI.create(payload);
            toast.success('Invoice created!');
            navigate('/invoices');
        } catch (err) { toast.error(err.response?.data?.message || 'Failed to create invoice'); }
        setLoading(false);
    };

    return (
        <div className="fade-in">
            <div className="page-header"><h1>New Invoice</h1></div>
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
                            <label>Due Date *</label>
                            <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} required />
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
                            <thead><tr><th>Item</th><th>Description</th><th style={{ width: 90 }}>Qty</th><th style={{ width: 110 }}>Rate</th><th style={{ width: 90 }}>Tax %</th><th style={{ width: 110 }}>Amount</th><th style={{ width: 50 }}></th></tr></thead>
                            <tbody>
                                {form.items.map((line, i) => (
                                    <tr key={i}>
                                        <td>
                                            <select value={line.itemId} onChange={(e) => updateLine(i, 'itemId', e.target.value)} style={{ width: '100%', padding: '6px 8px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 13 }}>
                                                <option value="">Custom</option>
                                                {items.map((it) => <option key={it.id} value={it.id}>{it.name}</option>)}
                                            </select>
                                        </td>
                                        <td><input style={{ width: '100%', padding: '6px 8px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 13 }} value={line.description} onChange={(e) => updateLine(i, 'description', e.target.value)} placeholder="Description" /></td>
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
                    <div className="card">
                        <div className="form-group"><label>Notes</label><textarea rows="3" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notes visible to customer…" /></div>
                    </div>
                    <div className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}><span>Tax</span><span>${tax.toFixed(2)}</span></div>
                        <div className="form-group" style={{ marginBottom: 8 }}>
                            <label style={{ fontSize: 13 }}>Discount</label>
                            <input type="number" min="0" step="0.01" value={form.discountAmount} onChange={(e) => setForm({ ...form, discountAmount: e.target.value })} />
                        </div>
                        <hr style={{ border: 'none', borderTop: '2px solid var(--border)', margin: '12px 0' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 700 }}><span>Total</span><span>${total.toFixed(2)}</span></div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
                    <button type="button" className="btn btn-secondary" onClick={() => navigate('/invoices')}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Creating…' : 'Create Invoice'}</button>
                </div>
            </form>
        </div>
    );
};

export default CreateInvoice;
