import { Injectable, inject } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as Papa from 'papaparse';
import { SensorLog } from '../models/sensor.model';
import { NotificationService } from './notification.service';

/**
 * Export Service
 * 
 * Handles file export for both Web (browser) and Android (Capacitor) platforms.
 * Integrated with NotificationService for Android native notifications.
 * 
 * Platform Detection:
 * - Web Browser: Uses standard download via anchor element
 * - Android/iOS: Uses Capacitor Filesystem API + Native Notifications
 * 
 * Supported Formats:
 * - CSV (UTF-8 encoding)
 * - Excel (.xlsx)
 * - PDF (with autoTable)
 * - Clipboard (web API)
 */
@Injectable({
    providedIn: 'root'
})
export class ExportService {

    private notificationService = inject(NotificationService);

    constructor() { }

    // ============================================================
    // PLATFORM DETECTION
    // ============================================================

    /**
     * Check if running on native mobile platform (Android/iOS)
     */
    isNativePlatform(): boolean {
        return Capacitor.isNativePlatform();
    }

    /**
     * Get current platform name
     */
    getPlatform(): 'web' | 'android' | 'ios' {
        const platform = Capacitor.getPlatform();
        if (platform === 'android') return 'android';
        if (platform === 'ios') return 'ios';
        return 'web';
    }

    // ============================================================
    // DATA FORMATTING
    // ============================================================

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
     * Generate dynamic filename based on period
     * Format: analytics_<period>.<ext>
     */
    private getFilename(period: string = '24h'): string {
        return `analytics_${period}`;
    }

    // ============================================================
    // CSV EXPORT
    // ============================================================

    /**
     * Export data to CSV file
     * Works on both Web and Android/iOS
     */
    async exportToCsv(data: SensorLog[], period: string = '24h'): Promise<ExportResult> {
        const filename = `${this.getFilename(period)}.csv`;

        try {
            const formattedData = this.formatData(data);
            const csv = Papa.unparse(formattedData);

            if (this.isNativePlatform()) {
                const result = await this.saveFileNative(csv, filename, 'text/csv');

                // Send native notification if export was successful
                if (result.success) {
                    await this.notificationService.showExportSuccessNotification('CSV', filename, 'Documents');
                }

                return result;
            } else {
                return this.downloadFileWeb(csv, filename, 'text/csv;charset=utf-8;');
            }
        } catch (error) {
            console.error('CSV Export error:', error);
            return {
                success: false,
                message: `Failed to export CSV: ${(error as Error).message}`,
                platform: this.getPlatform()
            };
        }
    }

    // ============================================================
    // EXCEL EXPORT
    // ============================================================

    /**
     * Export data to Excel (.xlsx) file
     * Works on both Web and Android/iOS
     */
    async exportToExcel(data: SensorLog[], period: string = '24h'): Promise<ExportResult> {
        const filename = `${this.getFilename(period)}.xlsx`;

        try {
            const formattedData = this.formatData(data);
            const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(formattedData);

            // Adjust column widths
            const wscols = [
                { wch: 10 },  // ID
                { wch: 12 },  // Suhu
                { wch: 25 },  // Lokasi
                { wch: 12 },  // Status
                { wch: 35 },  // Waktu
            ];
            ws['!cols'] = wscols;

            const wb: XLSX.WorkBook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Sensor Data');

            if (this.isNativePlatform()) {
                // Generate Excel as Base64 for native
                const excelBase64 = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
                const result = await this.saveFileNativeBase64(excelBase64, filename, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

                // Send native notification if export was successful
                if (result.success) {
                    await this.notificationService.showExportSuccessNotification('Excel', filename, 'Documents');
                }

                return result;
            } else {
                // Web: Use standard XLSX.writeFile
                XLSX.writeFile(wb, filename);
                return {
                    success: true,
                    message: 'Excel file downloaded successfully',
                    filename: filename,
                    platform: 'web'
                };
            }
        } catch (error) {
            console.error('Excel Export error:', error);
            return {
                success: false,
                message: `Failed to export Excel: ${(error as Error).message}`,
                platform: this.getPlatform()
            };
        }
    }

    // ============================================================
    // PDF EXPORT
    // ============================================================

    /**
     * Export data to PDF file
     * Works on both Web and Android/iOS
     */
    async exportToPdf(data: SensorLog[], period: string = '24h', periodLabel?: string): Promise<ExportResult> {
        const filename = `${this.getFilename(period)}.pdf`;

        try {
            const doc = new jsPDF();
            const formattedData = this.formatData(data);

            // Title
            doc.setFontSize(18);
            doc.setTextColor(40, 40, 40);
            doc.text('Sensor Analytics Report', 14, 22);

            // Subtitle - App name
            doc.setFontSize(11);
            doc.setTextColor(102, 126, 234); // Primary color
            doc.text('IoT Fire Detection System', 14, 28);

            // Metadata
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(`Generated on: ${new Date().toLocaleString('id-ID')}`, 14, 36);
            if (periodLabel) {
                doc.text(`Period: ${periodLabel}`, 14, 42);
            }
            doc.text(`Total Records: ${data.length}`, 14, periodLabel ? 48 : 42);

            // Statistics summary
            const avgTemp = data.length > 0 ? data.reduce((sum, d) => sum + d.suhu, 0) / data.length : 0;
            const maxTemp = data.length > 0 ? Math.max(...data.map(d => d.suhu)) : 0;
            const minTemp = data.length > 0 ? Math.min(...data.map(d => d.suhu)) : 0;
            const dangerCount = data.filter(d => d.status === 'BAHAYA').length;

            const startY = periodLabel ? 56 : 50;
            doc.setFontSize(9);
            doc.setTextColor(80);
            doc.text(`📊 Statistics: Avg: ${avgTemp.toFixed(1)}°C | Max: ${maxTemp}°C | Min: ${minTemp}°C | Danger Events: ${dangerCount}`, 14, startY);

            // Table
            const headers = [['ID', 'Suhu', 'Lokasi', 'Status', 'Waktu']];
            const rows = formattedData.map(item => [
                String(item.ID),
                item.Suhu,
                item.Lokasi,
                item.Status,
                item.Waktu
            ]);

            autoTable(doc, {
                head: headers,
                body: rows,
                startY: startY + 8,
                theme: 'grid',
                headStyles: {
                    fillColor: [102, 126, 234],
                    textColor: 255,
                    fontStyle: 'bold',
                    fontSize: 9
                },
                bodyStyles: {
                    fontSize: 8
                },
                alternateRowStyles: {
                    fillColor: [245, 247, 250]
                },
                columnStyles: {
                    0: { halign: 'center', cellWidth: 15 },
                    1: { halign: 'center', cellWidth: 20 },
                    2: { halign: 'left', cellWidth: 40 },
                    3: { halign: 'center', cellWidth: 20 },
                    4: { halign: 'left', cellWidth: 50 }
                },
                didDrawCell: (cellData) => {
                    // Highlight danger status cells
                    if (cellData.section === 'body' && cellData.column.index === 3) {
                        const cellText = cellData.cell.text[0];
                        if (cellText === 'BAHAYA') {
                            doc.setFillColor(254, 226, 226);
                            doc.rect(cellData.cell.x, cellData.cell.y, cellData.cell.width, cellData.cell.height, 'F');
                            doc.setTextColor(220, 38, 38);
                            doc.setFontSize(8);
                            doc.text(cellText, cellData.cell.x + cellData.cell.width / 2, cellData.cell.y + cellData.cell.height / 2 + 2, { align: 'center' });
                        }
                    }
                }
            });

            // Footer
            const pageCount = doc.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(150);
                doc.text(
                    `Page ${i} of ${pageCount} | IoT Fire Detection - Sensor Analytics Report`,
                    doc.internal.pageSize.getWidth() / 2,
                    doc.internal.pageSize.getHeight() - 10,
                    { align: 'center' }
                );
            }

            if (this.isNativePlatform()) {
                // Generate PDF as Base64 for native
                const pdfBase64 = doc.output('datauristring').split(',')[1];
                const result = await this.saveFileNativeBase64(pdfBase64, filename, 'application/pdf');

                // Send native notification if export was successful
                if (result.success) {
                    await this.notificationService.showExportSuccessNotification('PDF', filename, 'Documents');
                }

                return result;
            } else {
                // Web: Use standard save
                doc.save(filename);
                return {
                    success: true,
                    message: 'PDF file downloaded successfully',
                    filename: filename,
                    platform: 'web'
                };
            }
        } catch (error) {
            console.error('PDF Export error:', error);
            return {
                success: false,
                message: `Failed to export PDF: ${(error as Error).message}`,
                platform: this.getPlatform()
            };
        }
    }

    // ============================================================
    // CLIPBOARD
    // ============================================================

    /**
     * Copy data to clipboard (works on both Web and Native)
     * Uses Web API which is supported in Capacitor WebView
     */
    async copyToClipboard(data: SensorLog[]): Promise<ExportResult> {
        try {
            const formattedData = this.formatData(data);
            // Use tab delimiter for Excel/Sheets paste compatibility
            const tsv = Papa.unparse(formattedData, { delimiter: '\t' });
            await navigator.clipboard.writeText(tsv);
            return {
                success: true,
                message: 'Data copied to clipboard',
                platform: this.getPlatform()
            };
        } catch (err) {
            console.error('Failed to copy:', err);
            return {
                success: false,
                message: `Failed to copy data: ${(err as Error).message}`,
                platform: this.getPlatform()
            };
        }
    }

    // ============================================================
    // NATIVE FILE SAVING (Android/iOS)
    // ============================================================

    /**
     * Save text file on native platform (CSV, etc.)
     */
    private async saveFileNative(content: string, filename: string, mimeType: string): Promise<ExportResult> {
        try {
            const result = await Filesystem.writeFile({
                path: filename,
                data: content,
                directory: Directory.Documents,
                encoding: Encoding.UTF8
            });

            console.log('File saved at:', result.uri);

            return {
                success: true,
                message: `File saved to Documents: ${filename}`,
                filename: filename,
                filePath: result.uri,
                platform: this.getPlatform() as 'android' | 'ios'
            };
        } catch (error) {
            console.error('Native file save error:', error);

            // Try fallback to ExternalStorage for older Android
            try {
                const result = await Filesystem.writeFile({
                    path: filename,
                    data: content,
                    directory: Directory.ExternalStorage,
                    encoding: Encoding.UTF8
                });

                return {
                    success: true,
                    message: `File saved to External Storage: ${filename}`,
                    filename: filename,
                    filePath: result.uri,
                    platform: this.getPlatform() as 'android' | 'ios'
                };
            } catch (fallbackError) {
                console.error('Fallback save also failed:', fallbackError);
                throw error; // Re-throw original error if fallback fails
            }
        }
    }

    /**
     * Save Base64 encoded file on native platform (PDF, XLSX)
     */
    private async saveFileNativeBase64(base64Content: string, filename: string, mimeType: string): Promise<ExportResult> {
        try {
            const result = await Filesystem.writeFile({
                path: filename,
                data: base64Content,
                directory: Directory.Documents
            });

            console.log('File saved at:', result.uri);

            return {
                success: true,
                message: `File saved to Documents: ${filename}`,
                filename: filename,
                filePath: result.uri,
                platform: this.getPlatform() as 'android' | 'ios'
            };
        } catch (error) {
            console.error('Native Base64 file save error:', error);

            // Try fallback to ExternalStorage for older Android
            try {
                const result = await Filesystem.writeFile({
                    path: filename,
                    data: base64Content,
                    directory: Directory.ExternalStorage
                });

                return {
                    success: true,
                    message: `File saved to External Storage: ${filename}`,
                    filename: filename,
                    filePath: result.uri,
                    platform: this.getPlatform() as 'android' | 'ios'
                };
            } catch (fallbackError) {
                console.error('Fallback save also failed:', fallbackError);
                throw error; // Re-throw original error if fallback fails
            }
        }
    }

    // ============================================================
    // WEB FILE DOWNLOAD
    // ============================================================

    /**
     * Download file on web platform using anchor element
     */
    private downloadFileWeb(content: string, filename: string, mimeType: string): ExportResult {
        try {
            const blob = new Blob([content], { type: mimeType });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);

            link.href = url;
            link.download = filename;
            link.style.display = 'none';

            document.body.appendChild(link);
            link.click();

            // Cleanup
            setTimeout(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }, 100);

            return {
                success: true,
                message: 'File downloaded successfully',
                filename: filename,
                platform: 'web'
            };
        } catch (error) {
            console.error('Web download error:', error);
            return {
                success: false,
                message: `Failed to download file: ${(error as Error).message}`,
                platform: 'web'
            };
        }
    }

    // ============================================================
    // PERMISSION HANDLING
    // ============================================================

    /**
     * Request file system permissions (required for some Android versions)
     */
    async requestPermissions(): Promise<boolean> {
        if (!this.isNativePlatform()) {
            return true; // Web doesn't need permissions
        }

        try {
            const permStatus = await Filesystem.requestPermissions();
            return permStatus.publicStorage === 'granted';
        } catch (error) {
            console.error('Permission request error:', error);
            return false;
        }
    }

    /**
     * Check if file system permissions are granted
     */
    async checkPermissions(): Promise<boolean> {
        if (!this.isNativePlatform()) {
            return true; // Web doesn't need permissions
        }

        try {
            const permStatus = await Filesystem.checkPermissions();
            return permStatus.publicStorage === 'granted';
        } catch (error) {
            console.error('Permission check error:', error);
            return false;
        }
    }
}

// ============================================================
// TYPES
// ============================================================

export interface ExportResult {
    success: boolean;
    message: string;
    filename?: string;
    filePath?: string;
    platform: 'web' | 'android' | 'ios';
}
