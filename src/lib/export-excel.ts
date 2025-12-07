import * as XLSX from 'xlsx';

export interface PaymentExportData {
  tenant: string;
  room: string;
  period: string;
  months: number;
  amount: number;
  datePaid: string;
  status: string;
  monthlyBreakdown: string;
}

export function exportPaymentsToExcel(
  data: PaymentExportData[],
  filename: string = 'payments-report'
) {
  // Prepare data for Excel
  const excelData = data.map(item => ({
    'Tenant': item.tenant,
    'Room': item.room,
    'Period': item.period,
    'Months': item.months,
    'Amount (TZS)': item.amount,
    'Date Paid': item.datePaid,
    'Status': item.status,
    'Monthly Breakdown': item.monthlyBreakdown,
  }));

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(excelData);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 20 }, // Tenant
    { wch: 12 }, // Room
    { wch: 30 }, // Period
    { wch: 8 },  // Months
    { wch: 15 }, // Amount
    { wch: 12 }, // Date Paid
    { wch: 10 }, // Status
    { wch: 50 }, // Monthly Breakdown
  ];

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Payments');

  // Generate filename with date
  const date = new Date().toISOString().split('T')[0];
  const fullFilename = `${filename}-${date}.xlsx`;

  // Download the file
  XLSX.writeFile(workbook, fullFilename);
}

export interface PaymentDetailExportData {
  tenant: string;
  room: string;
  month: string;
  amount: number;
  datePaid: string;
  status: string;
}

export function exportDetailedPaymentsToExcel(
  data: PaymentDetailExportData[],
  filename: string = 'payments-detailed-report'
) {
  // Prepare data for Excel
  const excelData = data.map(item => ({
    'Tenant': item.tenant,
    'Room': item.room,
    'Month': item.month,
    'Amount (TZS)': item.amount,
    'Date Paid': item.datePaid,
    'Status': item.status,
  }));

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(excelData);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 20 }, // Tenant
    { wch: 12 }, // Room
    { wch: 20 }, // Month
    { wch: 15 }, // Amount
    { wch: 12 }, // Date Paid
    { wch: 10 }, // Status
  ];

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Payments');

  // Add summary sheet
  const totalAmount = data.reduce((sum, item) => sum + item.amount, 0);
  const paidAmount = data.filter(item => item.status === 'paid').reduce((sum, item) => sum + item.amount, 0);
  const pendingAmount = data.filter(item => item.status === 'pending').reduce((sum, item) => sum + item.amount, 0);

  const summaryData = [
    { 'Summary': 'Total Payments', 'Value': data.length },
    { 'Summary': 'Total Amount (TZS)', 'Value': totalAmount },
    { 'Summary': 'Paid Amount (TZS)', 'Value': paidAmount },
    { 'Summary': 'Pending Amount (TZS)', 'Value': pendingAmount },
    { 'Summary': 'Paid Count', 'Value': data.filter(item => item.status === 'paid').length },
    { 'Summary': 'Pending Count', 'Value': data.filter(item => item.status === 'pending').length },
    { 'Summary': 'Report Generated', 'Value': new Date().toLocaleString() },
  ];

  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  summarySheet['!cols'] = [{ wch: 25 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

  // Generate filename with date
  const date = new Date().toISOString().split('T')[0];
  const fullFilename = `${filename}-${date}.xlsx`;

  // Download the file
  XLSX.writeFile(workbook, fullFilename);
}

