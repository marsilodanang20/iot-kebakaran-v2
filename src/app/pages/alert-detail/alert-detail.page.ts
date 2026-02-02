import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonIcon,
    IonBadge,
    IonButton,
    IonList,
    IonItem,
    IonLabel
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
    alertCircle,
    flame,
    warning,
    location,
    time,
    thermometer,
    informationCircle,
    arrowBack,
    checkmarkCircle,
    shareOutline,
    call
} from 'ionicons/icons';
import { SettingsService } from '../../core/services/settings.service';

interface AlertDetail {
    id: number;
    type: 'danger' | 'warning' | 'info' | 'safe';
    lokasi: string;
    suhu: number;
    waktu: string;
    isRead?: boolean;
    status_label?: string;
}

@Component({
    selector: 'app-alert-detail',
    templateUrl: 'alert-detail.page.html',
    styleUrls: ['alert-detail.page.scss'],
    imports: [
        CommonModule,
        IonHeader,
        IonToolbar,
        IonTitle,
        IonContent,
        IonButtons,
        IonBackButton,
        IonCard,
        IonCardHeader,
        IonCardTitle,
        IonCardContent,
        IonIcon,
        IonBadge,
        IonButton,
        IonList,
        IonItem,
        IonLabel
    ]
})
export class AlertDetailPage implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    public settingsService = inject(SettingsService);

    alert = signal<AlertDetail | null>(null);

    constructor() {
        addIcons({
            alertCircle,
            flame,
            warning,
            location,
            time,
            thermometer,
            informationCircle,
            arrowBack,
            checkmarkCircle,
            shareOutline,
            call
        });
    }

    ngOnInit() {
        const navigation = this.router.getCurrentNavigation();
        const state = navigation?.extras?.state as { alert?: AlertDetail };

        if (state?.alert) {
            this.alert.set(state.alert);
        } else {
            const id = this.route.snapshot.paramMap.get('id');
            if (id) {
                // Dummy load for deep link (in real app, fetch by ID)
                this.alert.set({
                    id: parseInt(id),
                    type: 'danger',
                    lokasi: 'Server Room',
                    suhu: 0,
                    waktu: new Date().toISOString(),
                    status_label: 'BAHAYA'
                });
            }
        }
    }

    getAlertIcon(type?: string): string {
        switch (type) {
            case 'danger':
                return 'flame';
            case 'warning':
                return 'warning';
            case 'safe':
                return 'checkmark-circle';
            default:
                return 'alert-circle';
        }
    }

    getAlertColor(type?: string): string {
        switch (type) {
            case 'danger':
                return 'danger';
            case 'warning':
                return 'warning';
            case 'safe':
                return 'success';
            default:
                return 'primary';
        }
    }

    formatDateTime(waktu?: string): string {
        if (!waktu) return '--';
        try {
            const date = new Date(waktu);
            return date.toLocaleString(this.settingsService.settings().language === 'id' ? 'id-ID' : 'en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return waktu;
        }
    }

    getTemperatureStatus(suhu?: number): string {
        if (!suhu) return 'Unknown';
        if (suhu >= 50) return 'Critical';
        if (suhu >= 40) return 'Danger';
        if (suhu >= 35) return 'Warning';
        return 'Normal';
    }

    goBack() {
        this.router.navigate(['/alerts']);
    }

    callEmergency() {
        window.location.href = 'tel:112';
    }

    async shareAlert() {
        const alertData = this.alert();
        if (!alertData) return;

        const status = alertData.type === 'danger' ? '🔥 DANGER' : '✅ SAFE';
        const time = this.formatDateTime(alertData.waktu);
        const text = `[IoT Fire Detection]\nStatus: ${status}\nLokasi: ${alertData.lokasi}\nWaktu: ${time}\nSuhu: ${alertData.suhu}°C`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Fire Detection Alert',
                    text: text,
                    url: window.location.href
                });
            } catch (err) {
                console.log('Share failed', err);
            }
        } else {
            // Fallback: Copy to clipboard
            try {
                await navigator.clipboard.writeText(text);
                alert('Alert info copied to clipboard!');
            } catch (err) {
                console.error('Clipboard failed', err);
            }
        }
    }
}
