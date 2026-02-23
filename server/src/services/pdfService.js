const PDFDocument = require('pdfkit');

/**
 * Generate PDF for an invoice
 * @param {Object} invoice - Invoice object with customer and organization info
 * @returns {Promise<Buffer>} - PDF Buffer
 */
const generateInvoicePDF = (invoice) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });
        let buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        const { organization, customer, invoiceNumber, issueDate, dueDate, items, totalAmount, subtotal, taxAmount, discountAmount, balanceDue, currency, notes, terms } = invoice;
        const brandColor = organization.primaryColor || '#4f46e5';
        const lang = organization.defaultLanguage || 'en';

        // Translation fallback for PDF
        const translations = {
            en: { invoice: 'INVOICE', billed_to: 'BILL TO', date: 'Date', due: 'Due Date', desc: 'Description', qty: 'Qty', rate: 'Rate', amt: 'Amount', sub: 'Subtotal', tax: 'Tax', disc: 'Discount', total: 'Total', balance: 'Balance Due', notes: 'Notes', terms: 'Terms' },
            es: { invoice: 'FACTURA', billed_to: 'FACTURADO A', date: 'Fecha', due: 'Vencimiento', desc: 'Descripción', qty: 'Cant', rate: 'Tarifa', amt: 'Monto', sub: 'Subtotal', tax: 'Impuesto', disc: 'Descuento', total: 'Total', balance: 'Saldo Pendiente', notes: 'Notas', terms: 'Términos' },
            fr: { invoice: 'FACTURE', billed_to: 'FACTURÉ À', date: 'Date', due: 'Échéance', desc: 'Description', qty: 'Qté', rate: 'Taux', amt: 'Montant', sub: 'Sous-total', tax: 'Taxe', disc: 'Remise', total: 'Total', balance: 'Solde Dû', notes: 'Notes', terms: 'Conditions' },
            de: { invoice: 'RECHNUNG', billed_to: 'RECHNUNG AN', date: 'Datum', due: 'Fällig am', desc: 'Beschreibung', qty: 'Menge', rate: 'Rate', amt: 'Betrag', sub: 'Zwischensumme', tax: 'Steuer', disc: 'Rabatt', total: 'Gesamt', balance: 'Restbetrag', notes: 'Notizen', terms: 'Bedingungen' },
            hi: { invoice: 'इनवॉइस', billed_to: 'बिल प्राप्तकर्ता', date: 'तारीख', due: 'नियत तारीख', desc: 'विवरण', qty: 'मात्रा', rate: 'दर', amt: 'कुल', sub: 'उप-कुल', tax: 'कर', disc: 'छूट', total: 'कुल राशि', balance: 'शेष राशि', notes: 'नोट्स', terms: 'शर्तें' }
        };
        const t = translations[lang] || translations.en;

        // Header
        doc.fillColor(brandColor)
            .fontSize(24)
            .text(t.invoice, 50, 50, { align: 'right' });

        doc.fillColor('#000000')
            .fontSize(14)
            .text(organization.name, 50, 50, { align: 'left' });

        if (organization.address) {
            doc.fontSize(10)
                .text(organization.address, 50, 70);
        }
        doc.text(`${organization.city || ''}, ${organization.state || ''} ${organization.zipCode || ''}`, 50, 85);
        doc.text(organization.country || '', 50, 100);

        // Horizontal Line
        doc.moveTo(50, 130).lineTo(550, 130).strokeColor(brandColor).stroke();

        // Invoice Info
        doc.fontSize(10).fillColor('#444444')
            .text(`#{t.invoice} ${invoiceNumber}`, 50, 150)
            .text(`${t.date}: ${new Date(issueDate).toLocaleDateString()}`, 50, 165)
            .text(`${t.due}: ${new Date(dueDate).toLocaleDateString()}`, 50, 180);

        // Bill To
        doc.fontSize(12).fillColor(brandColor).text(t.billed_to, 350, 150);
        doc.fontSize(10).fillColor('#000000')
            .text(customer.displayName, 350, 165)
            .text(customer.email || '', 350, 180)
            .text(customer.billingAddress || '', 350, 195);

        // Table Header
        const tableTop = 250;
        doc.fontSize(10).font('Helvetica-Bold').fillColor(brandColor);
        doc.text(t.desc, 50, tableTop);
        doc.text(t.qty, 300, tableTop, { width: 50, align: 'right' });
        doc.text(t.rate, 370, tableTop, { width: 80, align: 'right' });
        doc.text(t.amt, 470, tableTop, { width: 80, align: 'right' });

        doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).strokeColor(brandColor).stroke();

        let y = tableTop + 25;
        doc.font('Helvetica').fillColor('#000000');

        // Table Rows
        items.forEach(item => {
            doc.text(item.description || '', 50, y, { width: 230 });
            doc.text(item.quantity.toString(), 300, y, { width: 50, align: 'right' });
            doc.text(`${item.rate.toFixed(2)}`, 370, y, { width: 80, align: 'right' });
            doc.text(`${item.amount.toFixed(2)}`, 470, y, { width: 80, align: 'right' });
            y += 20;
        });

        // Horizontal Line
        doc.moveTo(400, y).lineTo(550, y).strokeColor('#e2e8f0').stroke();
        y += 10;

        // Totals
        doc.text(t.sub, 400, y, { width: 70, align: 'right' });
        doc.text(`${subtotal.toFixed(2)}`, 470, y, { width: 80, align: 'right' });
        y += 15;

        if (taxAmount > 0) {
            doc.text(t.tax, 400, y, { width: 70, align: 'right' });
            doc.text(`${taxAmount.toFixed(2)}`, 470, y, { width: 80, align: 'right' });
            y += 15;
        }

        if (discountAmount > 0) {
            doc.text(t.disc, 400, y, { width: 70, align: 'right' });
            doc.text(`- ${discountAmount.toFixed(2)}`, 470, y, { width: 80, align: 'right' });
            y += 15;
        }

        doc.font('Helvetica-Bold').fillColor(brandColor);
        doc.text(t.total, 400, y, { width: 70, align: 'right' });
        doc.text(`${currency} ${totalAmount.toFixed(2)}`, 470, y, { width: 80, align: 'right' });
        y += 20;

        doc.fillColor('#444444').text(t.balance, 400, y, { width: 70, align: 'right' });
        doc.text(`${currency} ${balanceDue.toFixed(2)}`, 470, y, { width: 80, align: 'right' });

        // Notes & Terms
        if (notes || terms) {
            y += 50;
            if (notes) {
                doc.fontSize(10).font('Helvetica-Bold').fillColor(brandColor).text(t.notes, 50, y);
                doc.font('Helvetica').fontSize(9).fillColor('#444444').text(notes, 50, y + 12, { width: 300 });
                y += 40;
            }
            if (terms) {
                doc.fontSize(10).font('Helvetica-Bold').fillColor(brandColor).text(t.terms, 50, y);
                doc.font('Helvetica').fontSize(9).fillColor('#444444').text(terms, 50, y + 12, { width: 300 });
            }
        }

        // Footer
        doc.fontSize(10)
            .text('Thank you for your business!', 50, 700, { align: 'center', width: 500 });

        doc.end();
    });
};

module.exports = { generateInvoicePDF };
