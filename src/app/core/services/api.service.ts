import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
    SensorLog,
    Device,
    Alert,
    DashboardStats,
    ApiResponse,
    PaginatedResponse
} from '../models/sensor.model';

@Injectable({
    providedIn: 'root'
})
export class ApiService {
    private http = inject(HttpClient);
    private baseUrl = environment.apiUrl;

    // ==================== REAL API ENDPOINTS ====================

    /**
     * Get latest sensor log (most recent reading)
     * GET /api/sensor/latest
     */
    getLatestSensorLog(): Observable<ApiResponse<SensorLog>> {
        return this.http.get<ApiResponse<SensorLog>>(`${this.baseUrl}/sensor/latest`)
            .pipe(catchError(this.handleError<ApiResponse<SensorLog>>('getLatestSensorLog')));
    }

    /**
     * Get sensor logs (History) - Paginated
     * GET /api/sensor/logs
     */
    getSensorLogs(page: number = 1, perPage: number = 20): Observable<any> {
        const params = new HttpParams()
            .set('page', page.toString())
            .set('per_page', perPage.toString()); // Note: Laravel pagination might ignore per_page if hardcoded in controller

        return this.http.get<any>(`${this.baseUrl}/sensor/logs`, { params })
            .pipe(
                map(response => {
                    // Normalize Laravel pagination response
                    if (response.data && response.data.data) {
                        return {
                            success: true,
                            data: response.data.data, // The actual array
                            meta: response.data // Pination meta
                        };
                    }
                    return response;
                }),
                catchError(this.handleError<any>('getSensorLogs'))
            );
    }

    /**
     * Get ALL sensor logs (Up to 5000 records to cover entire database)
     * Solves "History Limit 100" issue without hardcoding small limit
     */
    getAllSensorLogs(): Observable<ApiResponse<SensorLog[]>> {
        return this.getSensorLogs(1, 5000).pipe(
            map(response => {
                return {
                    success: true,
                    data: response.data || []
                };
            }),
            catchError(this.handleError<ApiResponse<SensorLog[]>>('getAllSensorLogs'))
        );
    }

    // ==================== DERIVED DATA (Client-Side Logic) ====================
    // Since the backend doesn't have dedicated endpoints for these, we derive them from logs

    /**
     * Get dashboard statistics (Calculated on Client)
     */
    getDashboardStats(): Observable<ApiResponse<DashboardStats>> {
        return this.getSensorLogs(1, 50).pipe(
            map(response => {
                const logs: SensorLog[] = response.data || [];

                if (logs.length === 0) {
                    return { success: true, data: this.getEmptyStats() };
                }

                const temps = logs.map(l => Number(l.suhu));
                const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;

                const stats: DashboardStats = {
                    total_devices: new Set(logs.map(l => l.lokasi)).size, // Estimate devices by unique locations
                    active_alerts: logs.filter(l => l.status === 'BAHAYA').length,
                    average_temperature: avgTemp,
                    max_temperature: Math.max(...temps),
                    min_temperature: Math.min(...temps),
                    danger_count: logs.filter(l => l.status === 'BAHAYA').length,
                    safe_count: logs.filter(l => l.status === 'AMAN').length
                };

                return { success: true, data: stats };
            }),
            catchError(this.handleError<ApiResponse<DashboardStats>>('getDashboardStats'))
        );
    }

    /**
     * Get temperature history for charts
     */
    getTemperatureHistory(limit: number = 24): Observable<ApiResponse<SensorLog[]>> {
        return this.getSensorLogs(1, limit).pipe(
            map(response => {
                return { success: true, data: response.data || [] };
            })
        );
    }

    /**
     * Get devices list (Derived from unique locations in logs)
     */
    getDevices(): Observable<ApiResponse<Device[]>> {
        return this.getSensorLogs(1, 100).pipe(
            map(response => {
                const logs: SensorLog[] = response.data || [];
                const uniqueLocs = new Map<string, SensorLog>();

                // Find latest log for each location
                logs.forEach(log => {
                    if (!uniqueLocs.has(log.lokasi) || new Date(log.waktu) > new Date(uniqueLocs.get(log.lokasi)!.waktu)) {
                        uniqueLocs.set(log.lokasi, log);
                    }
                });

                const devices: Device[] = Array.from(uniqueLocs.values()).map((log, index) => ({
                    id: index + 1,
                    name: `Sensor ${log.lokasi}`,
                    lokasi: log.lokasi,
                    status: 'online', // Assumed online if in recent logs
                    suhu_terakhir: log.suhu,
                    last_seen: log.waktu
                }));

                return { success: true, data: devices };
            })
        );
    }

    // ==================== ERROR HANDLING ====================

    private handleError<T>(operation = 'operation') {
        return (error: any): Observable<T> => {
            console.error(`${operation} failed:`, error);
            return of({
                success: false,
                message: error.message || 'An error occurred',
                data: null as any
            } as T);
        };
    }

    private getEmptyStats(): DashboardStats {
        return {
            total_devices: 0,
            active_alerts: 0,
            average_temperature: 0,
            max_temperature: 0,
            min_temperature: 0,
            danger_count: 0,
            safe_count: 0
        };
    }
}
