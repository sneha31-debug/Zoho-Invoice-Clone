import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { invoiceAPI } from '../../services/api';
import { HiOutlineDocumentText, HiOutlineDownload, HiOutlineCreditCard } from 'react-icons/hi';
import PaymentModal from '../../components/Payment/PaymentModal';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const GuestInvoiceView = () => {
    const { id } = useParams();
    const { t, i18n } = useTranslation();
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    const fetchInvoice = () => {
        invoiceAPI.getPublicInvoice(id)
            .then((res) => {
                const inv = res.data.data;
                setInvoice(inv);
                // Set language based on organization preference
                if (inv.organization.defaultLanguage) {
                    i18n.changeLanguage(inv.organization.defaultLanguage);
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchInvoice(); }, [id]);

    const handleDownloadPDF = async () => {
        try {
            const res = await invoiceAPI.downloadPDF(id);
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Invoice-${invoice.invoiceNumber}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success('PDF downloaded');
        } catch (err) {
            toast.error('Failed to download PDF');
        }
    };

    if (loading) return <div className="loading-spinner" />;
    if (!invoice) return <div className="empty-state"><h3>Invoice not found or expired</h3></div>;

    const template = invoice.organization.invoiceTemplate || 'CLASSIC';
    const brandColor = invoice.organization.primaryColor || '#4f46e5';

    return (
        <div
            style={{ maxWidth: 900, margin: '40px auto', padding: '0 20px', '--primary': brandColor }}
            className={`fade-in invoice-template-${template.toLowerCase()}`}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ background: 'var(--primary)', color: 'white', width: 40, height: 40, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <HiOutlineDocumentText size={24} />
                    </div>
                    <h1 style={{ fontSize: 24, fontWeight: 700 }}>{invoice.organization.name}</h1>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button className="btn btn-secondary" onClick={handleDownloadPDF}>
                        <HiOutlineDownload /> {t('download_pdf')}
                    </button>
                    {invoice.status !== 'PAID' && (
                        <button className="btn btn-primary" onClick={() => setShowPaymentModal(true)}>
                            <HiOutlineCreditCard /> {t('pay_online')}
                        </button>
                    )}
                </div>
            </div>

            <div className="card" style={{ padding: 40 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 40 }}>
                    <div>
                        <h2 style={{ fontSize: 32, fontWeight: 800, color: 'var(--primary)', marginBottom: 4 }}>{t('invoice').toUpperCase()}</h2>
                        <div style={{ fontSize: 18, color: 'var(--text-secondary)' }}>#{invoice.invoiceNumber}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 14, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t('amount_due')}</div>
                        <div style={{ fontSize: 32, fontWeight: 800 }}>{invoice.currency} {Number(invoice.balanceDue).toLocaleString()}</div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginBottom: 40 }}>
                    <div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>{t('billed_to')}</div>
                        <div style={{ fontSize: 16, fontWeight: 600 }}>{invoice.customer.displayName}</div>
                        <div style={{ color: 'var(--text-secondary)' }}>{invoice.customer.email}</div>
                        <div style={{ color: 'var(--text-secondary)', marginTop: 4 }}>{invoice.customer.billingAddress}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ marginBottom: 12 }}>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t('invoice_date')}</div>
                            <div style={{ fontWeight: 600 }}>{new Date(invoice.createdAt).toLocaleDateString()}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t('due_date')}</div>
                            <div style={{ fontWeight: 600, color: 'var(--danger)' }}>{new Date(invoice.dueDate).toLocaleDateString()}</div>
                        </div>
                    </div>
                </div>

                <div className="table-container" style={{ border: 'none' }}>
                    <table style={{ borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid var(--border)' }}>
                                <th style={{ padding: '12px 0', textAlign: 'left' }}>{t('description')}</th>
                                <th style={{ padding: '12px 0', textAlign: 'center', width: 100 }}>{t('qty')}</th>
                                <th style={{ padding: '12px 0', textAlign: 'right', width: 120 }}>{t('rate')}</th>
                                <th style={{ padding: '12px 0', textAlign: 'right', width: 120 }}>{t('amount')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoice.items.map((item) => (
                                <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '16px 0' }}>
                                        <div style={{ fontWeight: 600 }}>{item.description}</div>
                                    </td>
                                    <td style={{ padding: '16px 0', textAlign: 'center' }}>{item.quantity}</td>
                                    <td style={{ padding: '16px 0', textAlign: 'right' }}>{Number(item.rate).toFixed(2)}</td>
                                    <td style={{ padding: '16px 0', textAlign: 'right', fontWeight: 600 }}>{Number(item.amount).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 32 }}>
                    <div style={{ width: 300 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                            <span style={{ color: 'var(--text-muted)' }}>{t('subtotal')}</span>
                            <span>{Number(invoice.subtotal).toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                            <span style={{ color: 'var(--text-muted)' }}>{t('tax')} ({invoice.items[0]?.taxRate || 0}%)</span>
                            <span>{Number(invoice.taxAmount).toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0', borderTop: '2px solid var(--border)', marginTop: 8, fontSize: 20, fontWeight: 800 }}>
                            <span>{t('total')}</span>
                            <span style={{ color: 'var(--primary)' }}>{invoice.currency} {Number(invoice.totalAmount).toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {invoice.notes && (
                    <div style={{ marginTop: 40, padding: 24, background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>{t('notes')}</div>
                        <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{invoice.notes}</div>
                    </div>
                )}
            </div>

            {showPaymentModal && (
                <PaymentModal
                    invoice={invoice}
                    onClose={() => setShowPaymentModal(false)}
                    onSuccess={fetchInvoice}
                />
            )}

            <div style={{ textAlign: 'center', marginTop: 40, color: 'var(--text-muted)', fontSize: 14 }}>
                {t('footer_powered_by')}
            </div>
        </div>
    );
};

export default GuestInvoiceView;
