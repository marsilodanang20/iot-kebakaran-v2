import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as Papa from 'papaparse';
import { SensorLog } from '../models/sensor.model';

@Injectable({
    providedIn: 'root'
})
export class ExportService {

    constructor() { }

    /**
     * Format data for export (flatten and human-readable)
     */
    private formatData(data: SensorLog[]) {
        return data.map(item => ({
            ID: item.id,
            Suhu: `${item.suhu}°C`,
            Lokasi: item.lokasi,
            Status: item.status,
            Waktu: new Date(item.waktu).toLocaleString('id-ID', {
                day: '2-digit', month: 'long', year: 'numeric',
                hour: '2-digit', minute: '2-digit', second: '2-digit'
            }),
        }));
    }

    /**
     * Generate filename based on timestamp
     */
    private getFilename(prefix: string = 'sensor-analytics') {
        const date = new Date().toISOString().split('T')[0];
        const time = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
        return `${prefix}_${date}_${time}`;
    }

    /**
     * Export to CSV
     */
    exportToCsv(data: SensorLog[], filename: string) {
        const formattedData = this.formatData(data);
        const csv = Papa.unparse(formattedData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        this.downloadFile(blob, `${filename}.csv`);
    }

    /**
     * Export to Excel (.xlsx)
     */
    exportToExcel(data: SensorLog[], filename: string) {
        const formattedData = this.formatData(data);
        const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(formattedData);

        // Adjust column width
        const wscols = [
            { wch: 10 }, // ID
            { wch: 10 }, // Suhu
            { wch: 20 }, // Lokasi
            { wch: 10 }, // Status
            { wch: 30 }, // Waktu
        ];
        ws['!cols'] = wscols;

        const wb: XLSX.WorkBook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Sensor Data');

        XLSX.writeFile(wb, `${filename}.xlsx`);
    }

    /**
     * Export to PDF
     */
    exportToPdf(data: SensorLog[], filename: string, periodLabel: string) {
        const doc = new jsPDF();
        const formattedData = this.formatData(data);

        // Title
        doc.setFontSize(18);
        doc.text('Sensor Analytics Report', 14, 22);

        // Metadata
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleString('id-ID')}`, 14, 30);
        doc.text(`Period: ${periodLabel}`, 14, 36);
        doc.text(`Total Records: ${data.length}`, 14, 42);

        // Table
        const headers = [['ID', 'Suhu', 'Lokasi', 'Status', 'Waktu']];
        const rows = formattedData.map(item => [item.ID, item.Suhu, item.Lokasi, item.Status, item.Waktu]);

        autoTable(doc, {
            head: headers,
            body: rows,
            startY: 50,
            theme: 'grid',
            headStyles: { fillColor: [44, 62, 80], textColor: 255 }, // Dark simplified header
            styles: { fontSize: 9 },
            alternateRowStyles: { fillColor: [245, 245, 245] }
        });

        doc.save(`${filename}.pdf`);
    }

    /**
     * Copy to Clipboard
     */
    async copyToClipboard(data: SensorLog[]): Promise<boolean> {
        try {
            const formattedData = this.formatData(data);
            // Use tab delimiter for Excel/Sheets paste compatibility
            const tsv = Papa.unparse(formattedData, { delimiter: '\t' });
            await navigator.clipboard.writeText(tsv);
            return true;
        } catch (err) {
            console.error('Failed to copy: ', err);
            return false;
        }
    }

    /**
     * Helper to trigger download
     */
    private downloadFile(blob: Blob, fileName: string) {
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();

        // Cleanup
        setTimeout(() => {
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        }, 100);
    }
}
