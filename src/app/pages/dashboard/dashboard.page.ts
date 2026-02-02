import { Component, OnInit, OnDestroy, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonGrid,
    IonRow,
    IonCol,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonIcon,
    IonBadge,
    IonSpinner,
    IonButton,
    IonList,
    IonItem,
    IonLabel
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
    thermometer,
    thermometerOutline,
    alertCircle,
    alertCircleOutline,
    checkmarkCircle,
    checkmarkCircleOutline,
    location,
    locationOutline,
    time,
    timeOutline,
    refresh,
    refreshOutline,
    flame,
    flameOutline,
    warning,
    warningOutline,
    shieldCheckmark,
    shieldCheckmarkOutline,
    hardwareChip,
    hardwareChipOutline,
    trendingUp,
    trendingDown
} from 'ionicons/icons';
import { interval, Subscription } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { SettingsService } from '../../core/services/settings.service';
import { SensorLog, DashboardStats } from '../../core/models/sensor.model';

@Component({
    selector: 'app-dashboard',
    templateUrl: 'dashboard.page.html',
    styleUrls: ['dashboard.page.scss'],
    imports: [
        CommonModule,
        IonHeader,
        IonToolbar,
        IonTitle,
        IonContent,
        IonRefresher,
        IonRefresherContent,
        IonGrid,
        IonRow,
        IonCol,
        IonCard,
        IonCardHeader,
        IonCardTitle,
        IonCardContent,
        IonIcon,
        IonBadge,
        IonSpinner,
        IonButton,
        IonList,
        IonItem,
        IonLabel
    ]
})
export class DashboardPage implements OnInit, OnDestroy {
    private apiService = inject(ApiService);
    public settingsService = inject(SettingsService);
    private refreshSubscription?: Subscription;

    // Reactive state
    isLoading = signal(true);
    latestLog = signal<SensorLog | null>(null);
    recentLogs = signal<SensorLog[]>([]);
    stats = signal<DashboardStats | null>(null);
    lastUpdated = signal<Date>(new Date());
    error = signal<string | null>(null);

    // Alert Status Tracking
    private previousStatus: string = '';

    constructor() {
        addIcons({
            thermometer,
            thermometerOutline,
            alertCircle,
            alertCircleOutline,
            checkmarkCircle,
            checkmarkCircleOutline,
            location,
            locationOutline,
            time,
            timeOutline,
            refresh,
            refreshOutline,
            flame,
            flameOutline,
            warning,
            warningOutline,
            shieldCheckmark,
            shieldCheckmarkOutline,
            hardwareChip,
            hardwareChipOutline,
            trendingUp,
            trendingDown
        });

        // Effect to handle dynamic auto-refresh interval
        effect(() => {
            const intervalSec = this.settingsService.settings().autoRefreshInterval;

            // Clean up old subscription
            if (this.refreshSubscription) {
                this.refreshSubscription.unsubscribe();
            }

            // Start new subscription logic
            if (intervalSec > 0) {
                this.refreshSubscription = interval(intervalSec * 1000).subscribe(() => {
                    this.loadDashboardData(false);
                });
            }
        });
    }

    ngOnInit() {
        this.loadDashboardData();
        // Permission request moved to Settings Toggle Interaction for better UX
    }

    ngOnDestroy() {
        this.refreshSubscription?.unsubscribe();
        this.settingsService.stopAlert(); // Ensure sound stops when leaving
    }

    async loadDashboardData(showLoading = true) {
        if (showLoading) {
            this.isLoading.set(true);
        }
        this.error.set(null);

        try {
            // Load latest sensor log
            this.apiService.getLatestSensorLog().subscribe({
                next: (response) => {
                    if (response.success && response.data) {
                        this.latestLog.set(response.data);
                        this.handleAlerts(response.data);
                    }
                },
                error: (err) => console.error('Error loading latest log:', err)
            });

            // Load recent sensor logs
            this.apiService.getSensorLogs(1, 5).subscribe({
                next: (response) => {
                    if (response.data) {
                        this.recentLogs.set(response.data);
                    }
                },
                error: (err) => console.error('Error loading recent logs:', err)
            });

            // Load dashboard stats
            this.apiService.getDashboardStats().subscribe({
                next: (response) => {
                    if (response.success && response.data) {
                        this.stats.set(response.data);
                    }
                },
                error: (err) => console.error('Error loading stats:', err)
            });

            this.lastUpdated.set(new Date());
        } catch (err: any) {
            this.error.set(err.message || 'Failed to load dashboard data');
        } finally {
            this.isLoading.set(false);
        }
    }

    // Logic for Sound & Notifications
    private handleAlerts(log: SensorLog) {
        const isDanger = log.status === 'BAHAYA';
        const settings = this.settingsService.settings();

        // 1. Alert Sound Logic
        // Centralized logic checks 'alertSound' setting internally
        if (isDanger) {
            this.settingsService.playAlert();
        } else {
            this.settingsService.stopAlert();
        }

        // 2. Push Notification Logic
        if (settings.pushNotif && isDanger) {
            // Trigger notification only if transitioning into Danger
            if (this.previousStatus !== 'BAHAYA') {
                this.sendNotification(log);
            }
        }

        this.previousStatus = log.status;
    }

    private sendNotification(log: SensorLog) {
        if ('Notification' in window && Notification.permission === 'granted') {
            const title = this.settingsService.settings().language === 'id' ? '⚠️ BAHAYA TERDETEKSI' : '⚠️ DANGER DETECTED';
            const body = this.settingsService.settings().language === 'id'
                ? `Suhu tinggi (${log.suhu}°C) terdeteksi di ${log.lokasi}!`
                : `High temperature (${log.suhu}°C) detected at ${log.lokasi}!`;

            new Notification(title, {
                body: body,
                icon: 'assets/icon/favicon.png', // Assuming icon exists
                tag: 'fire-alert' // Prevent stacking
            });
        }
    }

    handleRefresh(event: any) {
        this.loadDashboardData(false);
        setTimeout(() => {
            event.target.complete();
        }, 1000);
    }

    // Determine card class based on STATUS (DANGER/SAFE)
    getMoodClass(status?: string): string {
        if (status === 'BAHAYA') return 'status-danger';
        return 'status-safe';
    }

    formatTime(waktu: string): string {
        try {
            const date = new Date(waktu);
            return date.toLocaleTimeString(this.settingsService.settings().language === 'id' ? 'id-ID' : 'en-US', {
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return waktu;
        }
    }

    formatDate(waktu: string): string {
        try {
            const date = new Date(waktu);
            return date.toLocaleDateString(this.settingsService.settings().language === 'id' ? 'id-ID' : 'en-US', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
        } catch {
            return waktu;
        }
    }

    formatLastUpdated(): string {
        return this.lastUpdated().toLocaleTimeString(this.settingsService.settings().language === 'id' ? 'id-ID' : 'en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }
}
