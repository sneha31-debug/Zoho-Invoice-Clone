import { useState, useEffect } from 'react';
import { razorpayAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const PaymentModal = ({ invoice, onClose, onSuccess }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Load Razorpay script
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);

        return () => {
            const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
            if (existingScript) document.body.removeChild(existingScript);
        };
    }, []);

    const handlePayment = async () => {
        setLoading(true);
        try {
            const res = await razorpayAPI.createOrder(invoice.id);
            const { orderId, amount, currency, keyId } = res.data;

            const options = {
                key: keyId,
                amount: amount,
                currency: currency,
                name: 'Zoho Invoice Clone',
                description: `Payment for Invoice ${invoice.invoiceNumber}`,
                order_id: orderId,
                handler: function (response) {
                    toast.success('Payment Successful!');
                    onSuccess();
                    onClose();
                },
                prefill: {
                    name: `${user.firstName} ${user.lastName}`,
                    email: user.email,
                    contact: user.phone || '',
                },
                theme: {
                    color: '#4f46e5',
                },
            };

            if (window.Razorpay) {
                const rzp = new window.Razorpay(options);
                rzp.on('payment.failed', function (response) {
                    toast.error(response.error.description);
                });
                rzp.open();
            } else {
                toast.error('Razorpay SDK not loaded yet');
            }
        } catch (err) {
            toast.error('Failed to initialize Razorpay checkout');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 450, textAlign: 'center' }}>
                <div className="modal-header">
                    <h2>Secure Payment (Razorpay)</h2>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>

                <div className="modal-body" style={{ padding: '24px 0' }}>
                    <div className="payment-summary" style={{ marginBottom: 32 }}>
                        <span className="text-muted">Amount to Pay</span>
                        <h1 style={{ margin: '8px 0', color: 'var(--primary)', fontSize: 32 }}>
                            {new Intl.NumberFormat('en-IN', { style: 'currency', currency: invoice.currency }).format(invoice.balanceDue)}
                        </h1>
                        <p className="text-muted" style={{ fontSize: 14 }}>Invoice: {invoice.invoiceNumber}</p>
                    </div>

                    <button
                        onClick={handlePayment}
                        disabled={loading}
                        className="btn btn-primary"
                        style={{ width: '100%', height: 48, fontSize: 16 }}
                    >
                        {loading ? 'Initializing...' : 'Pay with Razorpay'}
                    </button>

                    <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center', gap: 12, opacity: 0.6 }}>
                        <span style={{ fontSize: 12 }}>UPI</span>
                        <span style={{ fontSize: 12 }}>Cards</span>
                        <span style={{ fontSize: 12 }}>Netbanking</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;
