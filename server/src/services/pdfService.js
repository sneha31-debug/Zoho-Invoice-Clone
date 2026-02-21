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

        // Header
        doc.fillColor('#444444')
            .fontSize(24)
            .text('INVOICE', 50, 50, { align: 'right' });

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
        doc.moveTo(50, 130).lineTo(550, 130).stroke();

        // Invoice Info
        doc.fontSize(10)
            .text(`Invoice Number: ${invoiceNumber}`, 50, 150)
            .text(`Invoice Date: ${new Date(issueDate).toLocaleDateString()}`, 50, 165)
            .text(`Due Date: ${new Date(dueDate).toLocaleDateString()}`, 50, 180);

        // Bill To
        doc.fontSize(12).text('BILL TO', 350, 150);
        doc.fontSize(10)
            .text(customer.displayName, 350, 165)
            .text(customer.email || '', 350, 180)
            .text(customer.billingAddress || '', 350, 195);

        // Table Header
        const tableTop = 250;
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('Description', 50, tableTop);
        doc.text('Qty', 300, tableTop, { width: 50, align: 'right' });
        doc.text('Rate', 370, tableTop, { width: 80, align: 'right' });
        doc.text('Amount', 470, tableTop, { width: 80, align: 'right' });

        doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

        let y = tableTop + 25;
        doc.font('Helvetica');

        // Table Rows
        items.forEach(item => {
            doc.text(item.description || '', 50, y, { width: 230 });
            doc.text(item.quantity.toString(), 300, y, { width: 50, align: 'right' });
            doc.text(`${item.rate.toFixed(2)}`, 370, y, { width: 80, align: 'right' });
            doc.text(`${item.amount.toFixed(2)}`, 470, y, { width: 80, align: 'right' });
            y += 20;
        });

        // Horizontal Line
        doc.moveTo(400, y).lineTo(550, y).stroke();
        y += 10;

        // Totals
        doc.text('Subtotal', 400, y, { width: 70, align: 'right' });
        doc.text(`${subtotal.toFixed(2)}`, 470, y, { width: 80, align: 'right' });
        y += 15;

        if (taxAmount > 0) {
            doc.text('Tax', 400, y, { width: 70, align: 'right' });
            doc.text(`${taxAmount.toFixed(2)}`, 470, y, { width: 80, align: 'right' });
            y += 15;
        }

        if (discountAmount > 0) {
            doc.text('Discount', 400, y, { width: 70, align: 'right' });
            doc.text(`- ${discountAmount.toFixed(2)}`, 470, y, { width: 80, align: 'right' });
            y += 15;
        }

        doc.font('Helvetica-Bold');
        doc.text('Total', 400, y, { width: 70, align: 'right' });
        doc.text(`${currency} ${totalAmount.toFixed(2)}`, 470, y, { width: 80, align: 'right' });
        y += 20;

        doc.fillColor('#444444').text('Balance Due', 400, y, { width: 70, align: 'right' });
        doc.text(`${currency} ${balanceDue.toFixed(2)}`, 470, y, { width: 80, align: 'right' });

        // Notes & Terms
        if (notes || terms) {
            y += 50;
            if (notes) {
                doc.fontSize(10).font('Helvetica-Bold').text('Notes', 50, y);
                doc.font('Helvetica').fontSize(9).text(notes, 50, y + 12, { width: 300 });
                y += 40;
            }
            if (terms) {
                doc.fontSize(10).font('Helvetica-Bold').text('Terms & Conditions', 50, y);
                doc.font('Helvetica').fontSize(9).text(terms, 50, y + 12, { width: 300 });
            }
        }

        // Footer
        doc.fontSize(10)
            .text('Thank you for your business!', 50, 700, { align: 'center', width: 500 });

        doc.end();
    });
};

module.exports = { generateInvoicePDF };
