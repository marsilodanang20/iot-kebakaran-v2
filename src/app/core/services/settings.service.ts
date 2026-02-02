import { Injectable, signal, effect, computed } from '@angular/core';

export type ThemeMode = 'light' | 'dark' | 'system';
export type TempUnit = 'celsius' | 'fahrenheit';
export type Language = 'id' | 'en';

export interface AppSettings {
    theme: ThemeMode;
    tempUnit: TempUnit;
    autoRefreshInterval: number; // seconds
    language: Language;
    pushNotif: boolean;
    alertSound: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
    theme: 'system',
    tempUnit: 'celsius',
    autoRefreshInterval: 30,
    language: 'id',
    pushNotif: false,
    alertSound: false
};

export const TRANSLATIONS = {
    id: {
        DASHBOARD: 'Dashboard',
        HISTORY: 'Riwayat Log',
        SETTINGS: 'Pengaturan',
        DEVICES: 'Perangkat',
        ANALYTICS: 'Statistik',
        CURRENT_TEMP: 'Suhu Saat Ini',
        LAST_UPDATED: 'Terakhir diperbarui',
        SAFE_READINGS: 'Status Aman',
        DANGER_ALERTS: 'Peringatan Bahaya',
        ACTIVE_DEVICES: 'Perangkat Aktif',
        AVG_TEMP: 'Rata-rata Suhu',
        TEMP_RANGE: 'Rentang Suhu',
        MINIMUM: 'Minimum',
        MAXIMUM: 'Maksimum',
        RECENT_ACTIVITY: 'Aktivitas Terbaru',
        VIEW_ALL: 'Lihat Semua',
        NO_DATA: 'Tidak ada data',
        LOADING: 'Memuat data...',
        Status: {
            SAFE: 'AMAN',
            DANGER: 'BAHAYA',
            WARNING: 'PERINGATAN',
            DANGER_DETECTED: 'Bahaya Terdeteksi',
            SYSTEM_SECURE: 'Sistem Aman',
            TEMP_HIGH_PREFIX: 'Suhu tinggi terdeteksi di',
            TEMP_NORMAL_PREFIX: 'Suhu normal di'
        },
        // Tabs
        TAB_DASHBOARD: 'Dashboard',
        TAB_ANALYTICS: 'Statistik',
        TAB_DEVICES: 'Perangkat',
        TAB_HISTORY: 'Riwayat',
        TAB_SETTINGS: 'Pengaturan',
        // Filters
        FILTER_ALL: 'Semua',
        FILTER_DANGER: 'Bahaya',
        FILTER_SAFE: 'Aman',
        // Settings
        APPEARANCE: 'Tampilan',
        THEME: 'Tema',
        DARK_MODE: 'Mode Gelap',
        DISPLAY_SETTINGS: 'Pengaturan Tampilan',
        TEMP_UNIT: 'Satuan Suhu',
        AUTO_REFRESH: 'Refresh Otomatis',
        LANGUAGE: 'Bahasa',
        ABOUT: 'Tentang',
        VERSION: 'Versi',
        CONTACT_US: 'Hubungi Kami',
        SOURCE_CODE: 'Kode Sumber',
        HELP_SUPPORT: 'Bantuan & Dukungan',
        NOTIFICATIONS: 'Notifikasi',
        PUSH_NOTIF: 'Notifikasi Push',
        ALERT_SOUND: 'Suara Peringatan',
        SECONDS: 'detik',
        MINUTES: 'menit',
        // Detail Page
        LOCATION: 'Lokasi',
        DATE_TIME: 'Waktu & Tanggal',
        DESCRIPTION: 'Deskripsi',
        RECOMMENDATIONS: 'Rekomendasi Tindakan',
        CALL_EMERGENCY: 'Panggil Darurat (112)',
        SHARE_ALERT: 'Bagikan Alert',
        GO_BACK: 'Kembali',
        ALERT_DETAILS: 'Detail Alert',
        ALERT_INFO: 'Informasi Alert'
    },
    en: {
        DASHBOARD: 'Dashboard',
        HISTORY: 'History Logs',
        SETTINGS: 'Settings',
        DEVICES: 'Devices',
        ANALYTICS: 'Analytics',
        CURRENT_TEMP: 'Current Temperature',
        LAST_UPDATED: 'Last updated',
        SAFE_READINGS: 'Safe Status',
        DANGER_ALERTS: 'Danger Alerts',
        ACTIVE_DEVICES: 'Active Devices',
        AVG_TEMP: 'Avg Temperature',
        TEMP_RANGE: 'Temperature Range',
        MINIMUM: 'Minimum',
        MAXIMUM: 'Maximum',
        RECENT_ACTIVITY: 'Recent Activity',
        VIEW_ALL: 'View All',
        NO_DATA: 'No data',
        LOADING: 'Loading data...',
        Status: {
            SAFE: 'SAFE',
            DANGER: 'DANGER',
            WARNING: 'WARNING',
            DANGER_DETECTED: 'Danger Detected',
            SYSTEM_SECURE: 'System Secure',
            TEMP_HIGH_PREFIX: 'High temperature detected at',
            TEMP_NORMAL_PREFIX: 'Normal temperature at'
        },
        // Tabs
        TAB_DASHBOARD: 'Dashboard',
        TAB_ANALYTICS: 'Analytics',
        TAB_DEVICES: 'Devices',
        TAB_HISTORY: 'History',
        TAB_SETTINGS: 'Settings',
        // Filters
        FILTER_ALL: 'All',
        FILTER_DANGER: 'Danger',
        FILTER_SAFE: 'Safe',
        // Settings
        APPEARANCE: 'Appearance',
        THEME: 'Theme',
        DARK_MODE: 'Dark Mode',
        DISPLAY_SETTINGS: 'Display Settings',
        TEMP_UNIT: 'Temperature Unit',
        AUTO_REFRESH: 'Auto Refresh',
        LANGUAGE: 'Language',
        ABOUT: 'About',
        VERSION: 'Version',
        CONTACT_US: 'Contact Us',
        SOURCE_CODE: 'Source Code',
        HELP_SUPPORT: 'Help & Support',
        NOTIFICATIONS: 'Notifications',
        PUSH_NOTIF: 'Push Notifications',
        ALERT_SOUND: 'Alert Sounds',
        SECONDS: 'seconds',
        MINUTES: 'minutes',
        // Detail Page
        LOCATION: 'Location',
        DATE_TIME: 'Date & Time',
        DESCRIPTION: 'Description',
        RECOMMENDATIONS: 'Recommended Actions',
        CALL_EMERGENCY: 'Call Emergency (112)',
        SHARE_ALERT: 'Share Alert',
        GO_BACK: 'Go Back',
        ALERT_DETAILS: 'Alert Details',
        ALERT_INFO: 'Alert Information'
    }
};

@Injectable({
    providedIn: 'root'
})
export class SettingsService {
    private readonly STORAGE_KEY = 'iot-settings-v2';

    // ==========================================
    // HYBRID AUDIO ARCHITECTURE (Mobile Ready)
    // ==========================================
    private audio?: HTMLAudioElement;

    // Guard utama: False saat start, True setelah interaksi user apa pun
    private isAudioActuallyUnlocked = false;

    // State
    settings = signal<AppSettings>(this.loadSettings());

    // Computed
    isDark = signal<boolean>(false);
    t = computed(() => TRANSLATIONS[this.settings().language]);

    constructor() {
        this.calculateIsDark();

        // Effect to sync storage and apply theme
        effect(() => {
            const current = this.settings();
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(current));
            this.applyTheme(current.theme);
        });

        // Effect for system dark mode
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
                if (this.settings().theme === 'system') {
                    this.calculateIsDark();
                    this.applyTheme('system');
                }
            });
        }

        // GLOBAL SILENT LISTENER (Mobile Friendly)
        // Ini akan mengaktifkan audio pada sentuhan pertama di layar
        this.setupSilentGlobalUnlock();
    }

    // ==========================================
    // AUDIO LOGIC
    // ==========================================

    private setupSilentGlobalUnlock() {
        const unlockHandler = () => {
            // Hanya coba unlock jika fitur dinyalakan user
            if (this.settings().alertSound && !this.isAudioActuallyUnlocked) {
                this.initializeAndUnlockAudio();
            }
            // Kita biarkan listener hidup sebentar untuk memastikan unlock berhasil di percobaan berikutnya
            // atau bisa kita remove jika berhasil
            if (this.isAudioActuallyUnlocked) {
                this.removeGlobalListeners(unlockHandler);
            }
        };

        // Dengarkan event interaksi umum
        document.addEventListener('click', unlockHandler);
        document.addEventListener('touchstart', unlockHandler);
        document.addEventListener('keydown', unlockHandler);
    }

    private removeGlobalListeners(handler: any) {
        document.removeEventListener('click', handler);
        document.removeEventListener('touchstart', handler);
        document.removeEventListener('keydown', handler);
    }

    /**
     * Set Toggle
     */
    setAlertSound(enabled: boolean) {
        this.updateSettings({ alertSound: enabled });

        if (enabled) {
            this.initializeAndUnlockAudio();
        } else {
            this.stopAlert();
            // Kita tidak perlu lock kembali (false) agar UX lebih mulus jika dinyalakan lagi
        }
    }

    /**
     * Core Unlock Logic
     */
    private initializeAndUnlockAudio() {
        if (!this.audio) {
            this.audio = new Audio('assets/sound/fire-alarm.mp3');
            this.audio.loop = true;
        }

        // Silent unlock sequence
        this.audio.play().then(() => {
            if (this.audio) {
                this.audio.pause();
                this.audio.currentTime = 0;
            }
            this.isAudioActuallyUnlocked = true;
        }).catch(() => {
            // SILENT CATCH - Tetap relax, tunggu interaksi berikutnya
            this.isAudioActuallyUnlocked = false;
        });
    }

    /**
     * Play Logic
     */
    playAlert() {
        // Strict Guard
        if (!this.settings().alertSound) return;

        // PENTING: Jika belum unlock, jangan paksa play (untuk hindari error console)
        if (!this.isAudioActuallyUnlocked) return;

        if (!this.audio) return;

        if (this.audio.paused) {
            this.audio.play().catch(() => {
                // Silent fallback
                this.isAudioActuallyUnlocked = false;
            });
        }
    }

    /**
     * Stop Logic
     */
    stopAlert() {
        if (!this.audio) return;

        this.audio.pause();
        this.audio.currentTime = 0;
    }


    // ==========================================
    // STANDARD SETTINGS ACTIONS
    // ==========================================

    updateSettings(partial: Partial<AppSettings>) {
        this.settings.update(s => ({ ...s, ...partial }));
    }

    setTheme(theme: ThemeMode) { this.updateSettings({ theme }); }
    setTempUnit(unit: TempUnit) { this.updateSettings({ tempUnit: unit }); }
    setRefreshInterval(seconds: number) { this.updateSettings({ autoRefreshInterval: seconds }); }
    setLanguage(lang: Language) { this.updateSettings({ language: lang }); }
    setPushNotif(enabled: boolean) { this.updateSettings({ pushNotif: enabled }); }

    toggleTheme() {
        const current = this.settings().theme;
        const isDark = this.isDark();
        if (current === 'system') {
            this.setTheme(isDark ? 'light' : 'dark');
        } else {
            this.setTheme(current === 'dark' ? 'light' : 'dark');
        }
    }

    unlockAudio() {
        if (this.settings().alertSound) {
            this.initializeAndUnlockAudio();
        }
    }

    // ==========================================
    // HELPERS & PRIVATE
    // ==========================================

    getTemp(celsius: number): number {
        if (this.settings().tempUnit === 'fahrenheit') {
            return parseFloat(((celsius * 9 / 5) + 32).toFixed(1));
        }
        return celsius;
    }

    getTempUnitLabel(): string {
        return this.settings().tempUnit === 'fahrenheit' ? '°F' : '°C';
    }

    getStatusLabel(dbStatus: string): string {
        const status = dbStatus === 'BAHAYA' ? 'DANGER' : 'SAFE';
        return this.t().Status[status];
    }

    private loadSettings(): AppSettings {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
            try {
                return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
            } catch {
                return DEFAULT_SETTINGS;
            }
        }
        return DEFAULT_SETTINGS;
    }

    private calculateIsDark() {
        const theme = this.settings().theme;
        let isDark = false;
        if (theme === 'system') {
            isDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
        } else {
            isDark = theme === 'dark';
        }
        this.isDark.set(isDark);
    }

    private applyTheme(theme: ThemeMode) {
        this.calculateIsDark();
        const isDark = this.isDark();
        document.documentElement.classList.toggle('ion-palette-dark', isDark);
        document.body.classList.toggle('dark', isDark);
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.setAttribute('content', isDark ? '#000000' : '#ffffff');
        }
    }
}
