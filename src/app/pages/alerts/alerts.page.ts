import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
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
    IonList,
    IonItem,
    IonLabel,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonSegment,
    IonSegmentButton,
    IonBadge
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
    notifications,
    notificationsOutline,
    alertCircle,
    alertCircleOutline,
    warning,
    warningOutline,
    flame,
    flameOutline,
    location,
    locationOutline,
    time,
    timeOutline,
    thermometer,
    checkmarkCircle,
    checkmarkCircleOutline,
    chevronForward,
    trash,
    checkmark,
    shieldCheckmark,
    documentTextOutline
} from 'ionicons/icons';
import { ApiService } from '../../core/services/api.service';
import { SettingsService } from '../../core/services/settings.service';
import { SensorLog } from '../../core/models/sensor.model';

export interface HistoryItem {
    id: number;
    type: 'danger' | 'safe';
    lokasi: string;
    suhu: number;
    waktu: string;
    status_label: string;
}

@Component({
    selector: 'app-alerts',
    templateUrl: 'alerts.page.html',
    styleUrls: ['alerts.page.scss'],
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
        IonList,
        IonItem,
        IonLabel,
        IonItemSliding,
        IonItemOptions,
        IonItemOption,
        IonSegment,
        IonSegmentButton,
        IonBadge
    ]
})
export class AlertsPage implements OnInit {
    private apiService = inject(ApiService);
    public settingsService = inject(SettingsService);
    private router = inject(Router);

    isLoading = signal(true);
    historyLogs = signal<HistoryItem[]>([]);
    selectedFilter = signal<string>('all');

    constructor() {
        addIcons({
            notifications,
            notificationsOutline,
            alertCircle,
            alertCircleOutline,
            warning,
            warningOutline,
            flame,
            flameOutline,
            location,
            locationOutline,
            time,
            timeOutline,
            thermometer,
            checkmarkCircle,
            checkmarkCircleOutline,
            chevronForward,
            trash,
            checkmark,
            shieldCheckmark,
            documentTextOutline
        });
    }

    ngOnInit() {
        this.loadLogs();
    }

    loadLogs() {
        this.isLoading.set(true);

        // Uses getAllSensorLogs to fetch ALL data (Resolves Problem 1)
        this.apiService.getAllSensorLogs().subscribe({
            next: (response) => {
                if (response.data) {
                    const logs: HistoryItem[] = response.data
                        .map((log: SensorLog, index: number) => ({
                            id: log.id || index + 1,
                            type: log.status === 'BAHAYA' ? 'danger' : 'safe',
                            lokasi: log.lokasi,
                            suhu: log.suhu,
                            waktu: log.waktu,
                            status_label: log.status
                        }));

                    // Ensure sorting: Latest -> Oldest
                    logs.sort((a, b) => new Date(b.waktu).getTime() - new Date(a.waktu).getTime());

                    this.historyLogs.set(logs);
                }
                this.isLoading.set(false);
            },
            error: (err) => {
                console.error('Failed to load logs', err);
                this.isLoading.set(false);
            }
        });
    }

    handleRefresh(event: any) {
        this.loadLogs();
        setTimeout(() => event.target.complete(), 1000);
    }

    onFilterChange(event: any) {
        this.selectedFilter.set(event.detail.value);
    }

    get filteredLogs(): HistoryItem[] {
        const filter = this.selectedFilter();
        const all = this.historyLogs();

        switch (filter) {
            case 'danger':
                return all.filter(item => item.type === 'danger');
            case 'safe':
                return all.filter(item => item.type === 'safe');
            default:
                return all;
        }
    }

    getDangerCount(): number {
        return this.historyLogs().filter(item => item.type === 'danger').length;
    }

    getSafeCount(): number {
        return this.historyLogs().filter(item => item.type === 'safe').length;
    }

    openDetail(item: HistoryItem) {
        this.router.navigate(['/alert-detail', item.id], {
            state: { alert: item }
        });
    }

    getIcon(type: string): string {
        return type === 'danger' ? 'flame' : 'checkmark-circle';
    }

    getTimeAgo(waktu: string): string {
        try {
            const date = new Date(waktu);
            const now = new Date();
            const diff = now.getTime() - date.getTime();
            const minutes = Math.floor(diff / 60000);
            const hours = Math.floor(minutes / 60);
            const days = Math.floor(hours / 24);

            if (days > 0) return `${days}d`;
            if (hours > 0) return `${hours}h`;
            if (minutes > 0) return `${minutes}m`;
            return 'now';
        } catch {
            return '';
        }
    }
}
