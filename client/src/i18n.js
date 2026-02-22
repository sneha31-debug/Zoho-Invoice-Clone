import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
    en: {
        translation: {
            "invoice": "Invoice",
            "billed_to": "Billed To",
            "invoice_date": "Invoice Date",
            "due_date": "Due Date",
            "amount_due": "Amount Due",
            "description": "Description",
            "qty": "Qty",
            "rate": "Rate",
            "amount": "Amount",
            "subtotal": "Subtotal",
            "tax": "Tax",
            "total": "Total",
            "pay_online": "Pay Online",
            "download_pdf": "Download PDF",
            "notes": "Notes",
            "footer_powered_by": "Powered by Zoho Clone Invoicing",
            "items": "Line Items",
            "status_paid": "Paid",
            "status_sent": "Sent",
            "status_draft": "Draft",
            "status_overdue": "Overdue"
        }
    },
    es: {
        translation: {
            "invoice": "Factura",
            "billed_to": "Facturado a",
            "invoice_date": "Fecha de factura",
            "due_date": "Fecha de vencimiento",
            "amount_due": "Monto adeudado",
            "description": "Descripción",
            "qty": "Cant",
            "rate": "Tarifa",
            "amount": "Monto",
            "subtotal": "Subtotal",
            "tax": "Impuesto",
            "total": "Total",
            "pay_online": "Pagar en línea",
            "download_pdf": "Descargar PDF",
            "notes": "Notas",
            "footer_powered_by": "Desarrollado por Zoho Clone Invoicing",
            "items": "Líneas de factura",
            "status_paid": "Pagado",
            "status_sent": "Enviado",
            "status_draft": "Borrador",
            "status_overdue": "Atrasado"
        }
    },
    fr: {
        translation: {
            "invoice": "Facture",
            "billed_to": "Facturé à",
            "invoice_date": "Date de la facture",
            "due_date": "Date d'échéance",
            "amount_due": "Montant dû",
            "description": "Description",
            "qty": "Qté",
            "rate": "Taux",
            "amount": "Montant",
            "subtotal": "Sous-total",
            "tax": "Taxe",
            "total": "Total",
            "pay_online": "Payer en ligne",
            "download_pdf": "Télécharger le PDF",
            "notes": "Notes",
            "footer_powered_by": "Propulsé par Zoho Clone Invoicing",
            "items": "Articles",
            "status_paid": "Payé",
            "status_sent": "Envoyé",
            "status_draft": "Brouillon",
            "status_overdue": "En retard"
        }
    }
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false
        }
    });

export default i18n;
