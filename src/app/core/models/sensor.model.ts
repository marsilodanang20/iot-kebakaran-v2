/**
 * IoT Fire Detection - Data Models
 * Represents data structures from sensor_logs table
 */

export interface SensorLog {
    id: number;
    status: 'AMAN' | 'BAHAYA';
    suhu: number;
    lokasi: string;
    waktu: string;
    created_at?: string;
    updated_at?: string;
}

export interface Device {
    id: number;
    name: string;
    lokasi: string;
    status: 'online' | 'offline';
    last_seen?: string;
    suhu_terakhir?: number;
}

export interface Alert {
    id: number;
    sensor_log_id: number;
    type: 'warning' | 'danger' | 'critical';
    message: string;
    lokasi: string;
    suhu: number;
    waktu: string;
    is_read: boolean;
    created_at?: string;
}

export interface DashboardStats {
    total_devices: number;
    active_alerts: number;
    average_temperature: number;
    max_temperature: number;
    min_temperature: number;
    danger_count: number;
    safe_count: number;
}

export interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data: T;
}

export interface PaginatedResponse<T> {
    success: boolean;
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}
