import { Injectable, signal, effect } from '@angular/core';

export type ThemeMode = 'light' | 'dark' | 'system';

@Injectable({
    providedIn: 'root'
})
export class ThemeService {
    private readonly STORAGE_KEY = 'iot-fire-theme';

    // Reactive signal for theme state
    currentTheme = signal<ThemeMode>(this.getStoredTheme());
    isDarkMode = signal<boolean>(this.calculateIsDark());

    constructor() {
        // Apply theme on initialization
        this.applyTheme();

        // Watch for system theme changes
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
                if (this.currentTheme() === 'system') {
                    this.isDarkMode.set(this.calculateIsDark());
                    this.applyTheme();
                }
            });
        }

        // React to theme changes
        effect(() => {
            const theme = this.currentTheme();
            this.isDarkMode.set(this.calculateIsDark());
            this.applyTheme();
            localStorage.setItem(this.STORAGE_KEY, theme);
        });
    }

    /**
     * Set the theme mode
     */
    setTheme(theme: ThemeMode): void {
        this.currentTheme.set(theme);
    }

    /**
     * Toggle between light and dark mode
     */
    toggleTheme(): void {
        const current = this.currentTheme();
        if (current === 'system') {
            this.setTheme(this.isDarkMode() ? 'light' : 'dark');
        } else {
            this.setTheme(current === 'dark' ? 'light' : 'dark');
        }
    }

    /**
     * Get stored theme from localStorage
     */
    private getStoredTheme(): ThemeMode {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored && ['light', 'dark', 'system'].includes(stored)) {
            return stored as ThemeMode;
        }
        return 'system';
    }

    /**
     * Calculate if dark mode should be active
     */
    private calculateIsDark(): boolean {
        const theme = this.currentTheme();
        if (theme === 'system') {
            return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
        }
        return theme === 'dark';
    }

    /**
     * Apply theme to document
     */
    private applyTheme(): void {
        const isDark = this.isDarkMode();
        document.documentElement.classList.toggle('ion-palette-dark', isDark);
        document.body.classList.toggle('dark', isDark);

        // Update status bar color for mobile
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.setAttribute('content', isDark ? '#1a1a2e' : '#ffffff');
        }
    }
}
