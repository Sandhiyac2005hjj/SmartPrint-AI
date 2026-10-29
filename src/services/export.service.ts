import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import { JobCard, Customer } from '../types';

export const exportService = {
  // Export Job Cards table to Excel (.xlsx)
  exportJobCardsToExcel(jobCards: JobCard[], fileName = 'JobCards_Report.xlsx') {
    const data = jobCards.map(jc => ({
      'Job Number': jc.jobNo,
      'Date': jc.jobDate,
      'Delivery Date': jc.expectedDeliveryDate,
      'Customer Name': jc.customerName,
      'Company': jc.company,
      'Phone': jc.phone,
      'Job Type': jc.jobType,
      'Product Name': jc.productName,
      'Quantity': jc.quantity,
      'Paper Size': jc.paperDetails.size,
      'Paper GSM': jc.paperDetails.gsm,
      'Paper Type': jc.paperDetails.paperType,
      'Print Type': jc.printDetails.printType,
      'Sides': jc.printDetails.sides,
      'Lamination': jc.printDetails.lamination,
      'Binding': jc.printDetails.binding,
      'Status': jc.status,
      'Priority': jc.production.priority,
      'Assigned To': jc.production.assignedTo,
      'Bill No': jc.billing.billNo || '',
      'Selling Price': jc.billing.sellingPrice,
      'Advance Paid': jc.billing.advancePaid,
      'Balance Amount': jc.billing.balanceAmount,
      'Payment Status': jc.billing.paymentStatus,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Job Cards');
    XLSX.writeFile(workbook, fileName);
  },

  // Export Customers to Excel
  exportCustomersToExcel(customers: Customer[], fileName = 'Customers_Registry.xlsx') {
    const data = customers.map(c => ({
      'Customer Code': c.customerCode,
      'Name': c.name,
      'Company': c.company,
      'Phone': c.phone,
      'Alternate Phone': c.altPhone || '',
      'Email': c.email || '',
      'GST Number': c.gstNumber || '',
      'Address': c.address,
      'Created Date': new Date(c.createdAt).toLocaleDateString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Customers');
    XLSX.writeFile(workbook, fileName);
  },

  // Export Reports summary to PDF
  exportReportToPDF(title: string, summaryStats: { label: string; value: string | number }[], tableData: any[], fileName = 'Print_Report.pdf') {
    const doc = new jsPDF();

    // Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(15, 23, 42); // Navy 900
    doc.text(title, 14, 20);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 27);
    doc.setDrawColor(220, 225, 230);
    doc.line(14, 31, 196, 31);

    // Summary Cards
    let y = 40;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('Key Metrics Summary', 14, y);
    y += 8;

    doc.setFontSize(10);
    summaryStats.forEach((stat) => {
      doc.setFont('helvetica', 'normal');
      doc.text(`${stat.label}:`, 14, y);
      doc.setFont('helvetica', 'bold');
      doc.text(String(stat.value), 70, y);
      y += 6;
    });

    y += 6;
    doc.line(14, y, 196, y);
    y += 10;

    // Table Header
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Job Activity Overview', 14, y);
    y += 8;

    doc.setFontSize(9);
    doc.setFillColor(240, 244, 249);
    doc.rect(14, y, 182, 8, 'F');
    doc.text('Job No', 16, y + 5.5);
    doc.text('Customer', 45, y + 5.5);
    doc.text('Product', 95, y + 5.5);
    doc.text('Status', 145, y + 5.5);
    doc.text('Amount (₹)', 170, y + 5.5);

    y += 10;
    doc.setFont('helvetica', 'normal');

    tableData.forEach((row) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(String(row.jobNo || ''), 16, y);
      doc.text(String(row.customerName || '').substring(0, 24), 45, y);
      doc.text(String(row.productName || '').substring(0, 22), 95, y);
      doc.text(String(row.status || ''), 145, y);
      doc.text(String(row.amount || 0), 170, y);
      y += 7;
    });

    doc.save(fileName);
  }
};
