import { OnDestroy, Component, OnInit, inject, signal } from '@angular/core';
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
    IonChip,
    IonBadge
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
import { interval, Subscription } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { Device } from '../../core/models/sensor.model';

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
        IonChip,
        IonBadge
    ]
})
export class DevicesPage implements OnInit, OnDestroy {
    private apiService = inject(ApiService);
    private refreshSub?: Subscription;

    isLoading = signal(true);
    devices = signal<Device[]>([]);

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

        // Polling every 10 seconds for real-time status
        this.refreshSub = interval(10000).subscribe(() => {
            this.loadDevices(false);
        });
    }

    ngOnDestroy() {
        this.refreshSub?.unsubscribe();
    }

    loadDevices(showLoading = true) {
        if (showLoading) this.isLoading.set(true);

        this.apiService.getDevices().subscribe({
            next: (response) => {
                if (response.data) {
                    this.devices.set(response.data);
                }
                this.isLoading.set(false);
            },
            error: () => {
                this.isLoading.set(false);
            }
        });
    }

    handleRefresh(event: any) {
        this.loadDevices(false);
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
