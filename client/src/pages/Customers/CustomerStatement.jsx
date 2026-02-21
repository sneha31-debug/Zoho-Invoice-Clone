import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { customerAPI, invoiceAPI } from '../../services/api';
import { HiOutlineArrowLeft, HiOutlinePrinter } from 'react-icons/hi';

const CustomerStatement = () => {
    const { id } = useParams();
    const [customer, setCustomer] = useState(null);
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        const fetch = async () => {
            try {
                const [custRes, invRes] = await Promise.all([
                    customerAPI.getById(id),
                    invoiceAPI.getAll({ customerId: id, limit: 200 }),
                ]);
                setCustomer(custRes.data.data);
                setInvoices(invRes.data.data.invoices || []);
            } catch (err) { console.error(err); }
            setLoading(false);
        };
        fetch();
    }, [id]);

    if (loading) return <div className="loading-spinner" />;
    if (!customer) return <div className="empty-state"><h3>Customer not found</h3></div>;

    const filtered = invoices.filter((inv) => {
        if (startDate && new Date(inv.createdAt) < new Date(startDate)) return false;
        if (endDate && new Date(inv.createdAt) > new Date(endDate + 'T23:59:59')) return false;
        return true;
    });

    const totalBilled = filtered.reduce((s, i) => s + i.totalAmount, 0);
    const totalPaid = filtered.reduce((s, i) => s + i.amountPaid, 0);
    const balanceDue = filtered.reduce((s, i) => s + i.balanceDue, 0);

    return (
        <div className="fade-in">
            <div className="page-header" style={{ flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <Link to={`/customers/${id}`} className="btn btn-secondary btn-sm"><HiOutlineArrowLeft /></Link>
                    <div>
                        <h1>Statement — {customer.displayName}</h1>
                        <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>{customer.companyName || customer.email}</span>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                        style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '6px 10px', color: 'var(--text-primary)', fontSize: 13 }} />
                    <span style={{ color: 'var(--text-muted)' }}>to</span>
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                        style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '6px 10px', color: 'var(--text-primary)', fontSize: 13 }} />
                    <button className="btn btn-secondary btn-sm" onClick={() => window.print()}><HiOutlinePrinter /> Print</button>
                </div>
            </div>

            {/* Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
                <div className="card" style={{ padding: 20, textAlign: 'center' }}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total Billed</div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--primary)' }}>${totalBilled.toLocaleString()}</div>
                </div>
                <div className="card" style={{ padding: 20, textAlign: 'center' }}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total Paid</div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--success)' }}>${totalPaid.toLocaleString()}</div>
                </div>
                <div className="card" style={{ padding: 20, textAlign: 'center' }}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Balance Due</div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: balanceDue > 0 ? 'var(--danger)' : 'var(--success)' }}>${balanceDue.toLocaleString()}</div>
                </div>
            </div>

            {/* Invoice Table */}
            <div className="card">
                <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 700 }}>Invoice Details ({filtered.length})</h3>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr><th>Invoice #</th><th>Date</th><th>Due Date</th><th>Status</th><th>Total</th><th>Paid</th><th>Balance</th></tr>
                        </thead>
                        <tbody>
                            {filtered.map((inv) => (
                                <tr key={inv.id}>
                                    <td><Link to={`/invoices/${inv.id}`} style={{ fontWeight: 600, color: 'var(--primary)' }}>{inv.invoiceNumber}</Link></td>
                                    <td>{new Date(inv.createdAt).toLocaleDateString()}</td>
                                    <td>{new Date(inv.dueDate).toLocaleDateString()}</td>
                                    <td><span className={`badge ${inv.status === 'PAID' ? 'badge-success' : inv.status === 'OVERDUE' ? 'badge-danger' : 'badge-secondary'}`}>{inv.status}</span></td>
                                    <td style={{ fontWeight: 600 }}>${Number(inv.totalAmount).toLocaleString()}</td>
                                    <td>${Number(inv.amountPaid).toLocaleString()}</td>
                                    <td style={{ fontWeight: 600, color: inv.balanceDue > 0 ? 'var(--danger)' : 'var(--success)' }}>${Number(inv.balanceDue).toLocaleString()}</td>
                                </tr>
                            ))}
                            {filtered.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No invoices found</td></tr>}
                        </tbody>
                        <tfoot>
                            <tr style={{ fontWeight: 700, borderTop: '2px solid var(--border)' }}>
                                <td colSpan={4} style={{ textAlign: 'right' }}>Totals:</td>
                                <td>${totalBilled.toLocaleString()}</td>
                                <td>${totalPaid.toLocaleString()}</td>
                                <td style={{ color: balanceDue > 0 ? 'var(--danger)' : 'var(--success)' }}>${balanceDue.toLocaleString()}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CustomerStatement;
