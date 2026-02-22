import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { invoiceAPI, customerAPI, itemAPI } from '../../services/api';
import { HiOutlineArrowLeft, HiOutlinePlusCircle, HiOutlineTrash } from 'react-icons/hi';
import toast from 'react-hot-toast';

const EditInvoice = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [invoice, setInvoice] = useState(null);
    const [customers, setCustomers] = useState([]);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ customerId: '', dueDate: '', notes: '', terms: '', discountAmount: 0, items: [] });

    useEffect(() => {
        const fetch = async () => {
            try {
                const [invRes, custRes, itemRes] = await Promise.all([
                    invoiceAPI.getById(id),
                    customerAPI.getAll({ limit: 100 }),
                    itemAPI.getAll({ limit: 100 }),
                ]);
                const inv = invRes.data.data;
                setInvoice(inv);
                setCustomers(custRes.data.data.customers || []);
                setItems(itemRes.data.data.items || []);
                setForm({
                    customerId: inv.customerId,
                    dueDate: inv.dueDate ? new Date(inv.dueDate).toISOString().split('T')[0] : '',
                    notes: inv.notes || '',
                    terms: inv.terms || '',
                    discountAmount: inv.discountAmount || 0,
                    items: inv.items.map((i) => ({
                        description: i.description || '', quantity: i.quantity, rate: i.rate, taxRate: i.taxRate || 0, itemId: i.itemId || '',
                    })),
                });
            } catch (err) { console.error(err); toast.error('Failed to load invoice'); }
            setLoading(false);
        };
        fetch();
    }, [id]);

    const addLine = () => setForm({ ...form, items: [...form.items, { description: '', quantity: 1, rate: 0, taxRate: 0, itemId: '' }] });
    const removeLine = (i) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });
    const updateLine = (i, field, value) => {
        const newItems = [...form.items];
        newItems[i][field] = value;
        // Auto-fill from item catalog
        if (field === 'itemId' && value) {
            const catalogItem = items.find((it) => it.id === value);
            if (catalogItem) {
                newItems[i].description = catalogItem.name;
                newItems[i].rate = catalogItem.rate;
                newItems[i].taxRate = catalogItem.taxRate || 0;
            }
        }
        setForm({ ...form, items: newItems });
    };

    const subtotal = form.items.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.rate) || 0), 0);
    const tax = form.items.reduce((s, i) => s + ((Number(i.quantity) || 0) * (Number(i.rate) || 0)) * ((Number(i.taxRate) || 0) / 100), 0);
    const total = subtotal + tax - (Number(form.discountAmount) || 0);

    const handleSave = async (e) => {
        e.preventDefault();
        if (form.items.length === 0) { toast.error('Add at least one line item'); return; }
        setSaving(true);
        try {
            const payload = {
                customerId: form.customerId,
                dueDate: new Date(form.dueDate).toISOString(),
                notes: form.notes || undefined,
                terms: form.terms || undefined,
                discountAmount: Number(form.discountAmount),
                items: form.items.map((i) => ({
                    description: i.description, quantity: Number(i.quantity),
                    rate: Number(i.rate), taxRate: Number(i.taxRate) || 0,
                    itemId: i.itemId || undefined,
                })),
            };
            await invoiceAPI.update(id, payload);
            toast.success('Invoice updated');
            navigate(`/invoices/${id}`);
        } catch (err) { toast.error(err.response?.data?.message || 'Failed to update'); }
        setSaving(false);
    };

    if (loading) return <div className="loading-spinner" />;
    if (!invoice) return <div className="empty-state"><h3>Invoice not found</h3></div>;

    return (
        <div className="fade-in">
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <Link to={`/invoices/${id}`} className="btn btn-secondary btn-sm"><HiOutlineArrowLeft /></Link>
                    <h1>Edit {invoice.invoiceNumber}</h1>
                </div>
            </div>

            <form onSubmit={handleSave}>
                <div className="card" style={{ marginBottom: 20 }}>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Customer *</label>
                            <select value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })} required>
                                <option value="">Select…</option>
                                {customers.map((c) => <option key={c.id} value={c.id}>{c.displayName}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Due Date *</label>
                            <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label>Discount</label>
                            <input type="number" step="0.01" min="0" value={form.discountAmount} onChange={(e) => setForm({ ...form, discountAmount: e.target.value })} />
                        </div>
                    </div>
                </div>

                <div className="card" style={{ marginBottom: 20 }}>
                    <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 700 }}>Line Items</h3>
                    {form.items.map((line, i) => (
                        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.5fr 2fr 1fr 1fr 1fr auto', gap: 8, marginBottom: 8, alignItems: 'end' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label style={{ fontSize: 11 }}>Item</label>
                                <select value={line.itemId} onChange={(e) => updateLine(i, 'itemId', e.target.value)} style={{ fontSize: 13 }}>
                                    <option value="">Manual</option>
                                    {items.map((it) => <option key={it.id} value={it.id}>{it.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label style={{ fontSize: 11 }}>Description</label>
                                <input value={line.description} onChange={(e) => updateLine(i, 'description', e.target.value)} style={{ fontSize: 13 }} />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label style={{ fontSize: 11 }}>Qty</label>
                                <input type="number" min="1" value={line.quantity} onChange={(e) => updateLine(i, 'quantity', e.target.value)} style={{ fontSize: 13 }} />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label style={{ fontSize: 11 }}>Rate</label>
                                <input type="number" step="0.01" value={line.rate} onChange={(e) => updateLine(i, 'rate', e.target.value)} style={{ fontSize: 13 }} />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label style={{ fontSize: 11 }}>Tax %</label>
                                <input type="number" step="0.01" value={line.taxRate} onChange={(e) => updateLine(i, 'taxRate', e.target.value)} style={{ fontSize: 13 }} />
                            </div>
                            <button type="button" className="btn btn-danger btn-sm" onClick={() => removeLine(i)} style={{ height: 34 }}><HiOutlineTrash /></button>
                        </div>
                    ))}
                    <button type="button" className="btn btn-secondary btn-sm" onClick={addLine} style={{ marginTop: 8 }}><HiOutlinePlusCircle /> Add Line</button>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
                        <div style={{ width: 280 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14 }}><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14 }}><span>Tax</span><span>${tax.toFixed(2)}</span></div>
                            {Number(form.discountAmount) > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14 }}><span>Discount</span><span>-${Number(form.discountAmount).toFixed(2)}</span></div>}
                            <hr style={{ border: 'none', borderTop: '2px solid var(--border)', margin: '8px 0' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 18, fontWeight: 700 }}><span>Total</span><span>${total.toFixed(2)}</span></div>
                        </div>
                    </div>
                </div>

                <div className="card" style={{ marginBottom: 20 }}>
                    <div className="form-row">
                        <div className="form-group"><label>Notes</label><textarea rows="2" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
                        <div className="form-group"><label>Terms</label><textarea rows="2" value={form.terms} onChange={(e) => setForm({ ...form, terms: e.target.value })} /></div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                    <Link to={`/invoices/${id}`} className="btn btn-secondary">Cancel</Link>
                    <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
                </div>
            </form>
        </div>
    );
};

export default EditInvoice;
