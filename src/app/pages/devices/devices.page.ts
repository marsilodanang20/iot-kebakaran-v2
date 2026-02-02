import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonCard,
    IonCardContent,
    IonIcon,
    IonSpinner,
    IonChip
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
    hardwareChip,
    hardwareChipOutline,
    wifi,
    wifiOutline,
    location,
    locationOutline,
    thermometer,
    time,
    ellipse,
    checkmarkCircle,
    closeCircle,
    pulse
} from 'ionicons/icons';
import { ApiService } from '../../core/services/api.service';
import { SensorLog } from '../../core/models/sensor.model';

interface DeviceInfo {
    id: number;
    name: string;
    lokasi: string;
    status: 'online' | 'offline';
    lastTemp?: number;
    lastStatus?: string;
    lastUpdate?: string;
}

@Component({
    selector: 'app-devices',
    templateUrl: 'devices.page.html',
    styleUrls: ['devices.page.scss'],
    imports: [
        CommonModule,
        IonHeader,
        IonToolbar,
        IonTitle,
        IonContent,
        IonRefresher,
        IonRefresherContent,
        IonCard,
        IonCardContent,
        IonIcon,
        IonSpinner,
        IonChip
    ]
})
export class DevicesPage implements OnInit {
    private apiService = inject(ApiService);

    isLoading = signal(true);
    devices = signal<DeviceInfo[]>([]);

    constructor() {
        addIcons({
            hardwareChip,
            hardwareChipOutline,
            wifi,
            wifiOutline,
            location,
            locationOutline,
            thermometer,
            time,
            ellipse,
            checkmarkCircle,
            closeCircle,
            pulse
        });
    }

    ngOnInit() {
        this.loadDevices();
    }

    loadDevices() {
        this.isLoading.set(true);

        // Since we don't have a dedicated devices endpoint, 
        // we'll derive device info from sensor logs
        this.apiService.getSensorLogs(1, 50).subscribe({
            next: (response) => {
                if (response.data) {
                    const deviceMap = new Map<string, DeviceInfo>();

                    response.data.forEach((log: SensorLog, index: number) => {
                        if (!deviceMap.has(log.lokasi)) {
                            deviceMap.set(log.lokasi, {
                                id: index + 1,
                                name: `Sensor ${log.lokasi}`,
                                lokasi: log.lokasi,
                                status: 'online', // Assume online if we have recent data
                                lastTemp: log.suhu,
                                lastStatus: log.status,
                                lastUpdate: log.waktu
                            });
                        }
                    });

                    this.devices.set(Array.from(deviceMap.values()));
                }
                this.isLoading.set(false);
            },
            error: () => {
                this.isLoading.set(false);
            }
        });
    }

    handleRefresh(event: any) {
        this.loadDevices();
        setTimeout(() => event.target.complete(), 1000);
    }

    getOnlineCount(): number {
        return this.devices().filter(d => d.status === 'online').length;
    }

    getOfflineCount(): number {
        return this.devices().filter(d => d.status === 'offline').length;
    }

    formatTime(waktu?: string): string {
        if (!waktu) return '--';
        try {
            const date = new Date(waktu);
            return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        } catch {
            return waktu;
        }
    }

    formatDate(waktu?: string): string {
        if (!waktu) return '--';
        try {
            const date = new Date(waktu);
            return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
        } catch {
            return waktu;
        }
    }
}
