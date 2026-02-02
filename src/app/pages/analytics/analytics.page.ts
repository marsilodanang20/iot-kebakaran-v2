import { Component, OnInit, inject, signal, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonIcon,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonSpinner,
    IonList,
    IonItem,
    IonBadge
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
    statsChart,
    statsChartOutline,
    trendingUp,
    trendingDown,
    thermometer,
    time,
    calendar,
    barChart,
    analytics
} from 'ionicons/icons';
import { ApiService } from '../../core/services/api.service';
import { SensorLog } from '../../core/models/sensor.model';

@Component({
    selector: 'app-analytics',
    templateUrl: 'analytics.page.html',
    styleUrls: ['analytics.page.scss'],
    imports: [
        CommonModule,
        IonHeader,
        IonToolbar,
        IonTitle,
        IonContent,
        IonRefresher,
        IonRefresherContent,
        IonCard,
        IonCardHeader,
        IonCardTitle,
        IonCardContent,
        IonIcon,
        IonSegment,
        IonSegmentButton,
        IonLabel,
        IonSpinner,
        IonList,
        IonItem,
        IonBadge
    ]
})
export class AnalyticsPage implements OnInit, AfterViewInit {
    @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

    private apiService = inject(ApiService);

    isLoading = signal(true);
    temperatureHistory = signal<SensorLog[]>([]);
    selectedPeriod = signal<string>('24h');

    // Chart dimensions
    chartWidth = 0;
    chartHeight = 200;

    constructor() {
        addIcons({
            statsChart,
            statsChartOutline,
            trendingUp,
            trendingDown,
            thermometer,
            time,
            calendar,
            barChart,
            analytics
        });
    }

    ngOnInit() {
        this.loadTemperatureHistory();
    }

    ngAfterViewInit() {
        setTimeout(() => this.drawChart(), 100);
    }

    loadTemperatureHistory() {
        this.isLoading.set(true);

        const limit = this.getPeriodLimit();
        this.apiService.getTemperatureHistory(limit).subscribe({
            next: (response) => {
                if (response.data) {
                    this.temperatureHistory.set(response.data);
                    setTimeout(() => this.drawChart(), 100);
                }
                this.isLoading.set(false);
            },
            error: () => {
                this.isLoading.set(false);
            }
        });
    }

    getPeriodLimit(): number {
        switch (this.selectedPeriod()) {
            case '6h': return 12;
            case '24h': return 24;
            case '7d': return 168;
            default: return 24;
        }
    }

    onPeriodChange(event: any) {
        this.selectedPeriod.set(event.detail.value);
        this.loadTemperatureHistory();
    }

    handleRefresh(event: any) {
        this.loadTemperatureHistory();
        setTimeout(() => event.target.complete(), 1000);
    }

    drawChart() {
        if (!this.chartCanvas?.nativeElement) return;

        const canvas = this.chartCanvas.nativeElement;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const data = this.temperatureHistory();
        if (data.length === 0) return;

        // Set canvas size
        const rect = canvas.parentElement?.getBoundingClientRect();
        this.chartWidth = rect?.width || 300;
        canvas.width = this.chartWidth;
        canvas.height = this.chartHeight;

        // Clear canvas
        ctx.clearRect(0, 0, this.chartWidth, this.chartHeight);

        // Get temperature values
        const temps = data.map(d => d.suhu).reverse();
        const maxTemp = Math.max(...temps) + 5;
        const minTemp = Math.min(...temps) - 5;
        const range = maxTemp - minTemp;

        // Chart padding
        const padding = { top: 20, right: 20, bottom: 30, left: 40 };
        const chartW = this.chartWidth - padding.left - padding.right;
        const chartH = this.chartHeight - padding.top - padding.bottom;

        // Draw grid lines
        ctx.strokeStyle = 'rgba(128, 128, 128, 0.2)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const y = padding.top + (chartH / 4) * i;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(this.chartWidth - padding.right, y);
            ctx.stroke();

            // Temperature labels
            const tempValue = maxTemp - (range / 4) * i;
            ctx.fillStyle = 'rgba(128, 128, 128, 0.8)';
            ctx.font = '10px system-ui';
            ctx.textAlign = 'right';
            ctx.fillText(`${tempValue.toFixed(0)}°`, padding.left - 5, y + 4);
        }

        // Create gradient
        const gradient = ctx.createLinearGradient(0, padding.top, 0, this.chartHeight - padding.bottom);
        gradient.addColorStop(0, 'rgba(235, 51, 73, 0.3)');
        gradient.addColorStop(0.5, 'rgba(102, 126, 234, 0.3)');
        gradient.addColorStop(1, 'rgba(17, 153, 142, 0.1)');

        // Draw area
        ctx.beginPath();
        temps.forEach((temp, i) => {
            const x = padding.left + (chartW / (temps.length - 1)) * i;
            const y = padding.top + chartH - ((temp - minTemp) / range) * chartH;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        // Complete area path
        ctx.lineTo(padding.left + chartW, padding.top + chartH);
        ctx.lineTo(padding.left, padding.top + chartH);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();

        // Draw line
        const lineGradient = ctx.createLinearGradient(0, 0, this.chartWidth, 0);
        lineGradient.addColorStop(0, '#667eea');
        lineGradient.addColorStop(0.5, '#764ba2');
        lineGradient.addColorStop(1, '#eb3349');

        ctx.beginPath();
        temps.forEach((temp, i) => {
            const x = padding.left + (chartW / (temps.length - 1)) * i;
            const y = padding.top + chartH - ((temp - minTemp) / range) * chartH;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.strokeStyle = lineGradient;
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();

        // Draw points
        temps.forEach((temp, i) => {
            const x = padding.left + (chartW / (temps.length - 1)) * i;
            const y = padding.top + chartH - ((temp - minTemp) / range) * chartH;

            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fillStyle = temp >= 40 ? '#eb3349' : temp >= 35 ? '#f5576c' : '#667eea';
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.stroke();
        });
    }

    getAverageTemp(): number {
        const data = this.temperatureHistory();
        if (data.length === 0) return 0;
        return data.reduce((sum, d) => sum + d.suhu, 0) / data.length;
    }

    getMaxTemp(): number {
        const data = this.temperatureHistory();
        if (data.length === 0) return 0;
        return Math.max(...data.map(d => d.suhu));
    }

    getMinTemp(): number {
        const data = this.temperatureHistory();
        if (data.length === 0) return 0;
        return Math.min(...data.map(d => d.suhu));
    }

    getDangerCount(): number {
        return this.temperatureHistory().filter(d => d.status === 'BAHAYA').length;
    }

    formatTime(waktu: string): string {
        try {
            const date = new Date(waktu);
            return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        } catch {
            return waktu;
        }
    }
}
