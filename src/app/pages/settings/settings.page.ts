import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    IonToggle,
    IonSelect,
    IonSelectOption,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
    moon,
    moonOutline,
    sunny,
    sunnyOutline,
    notifications,
    notificationsOutline,
    volumeHigh,
    volumeHighOutline,
    language,
    languageOutline,
    informationCircle,
    informationCircleOutline,
    shield,
    shieldOutline,
    helpCircle,
    helpCircleOutline,
    logoGithub,
    mail,
    mailOutline,
    person,
    personOutline,
    settings,
    settingsOutline,
    thermometer,
    chevronForward,
    refresh
} from 'ionicons/icons';
import { SettingsService, ThemeMode, TempUnit, Language } from '../../core/services/settings.service';

@Component({
    selector: 'app-settings',
    templateUrl: 'settings.page.html',
    styleUrls: ['settings.page.scss'],
    imports: [
        CommonModule,
        IonHeader,
        IonToolbar,
        IonTitle,
        IonContent,
        IonList,
        IonItem,
        IonLabel,
        IonIcon,
        IonToggle,
        IonSelect,
        IonSelectOption,
        IonCard,
        IonCardHeader,
        IonCardTitle,
        IonCardContent
    ]
})
export class SettingsPage {
    settingsService = inject(SettingsService);

    appVersion = '1.0.0';
    buildNumber = '2026.02.03';

    constructor() {
        addIcons({
            moon,
            moonOutline,
            sunny,
            sunnyOutline,
            notifications,
            notificationsOutline,
            volumeHigh,
            volumeHighOutline,
            language,
            languageOutline,
            informationCircle,
            informationCircleOutline,
            shield,
            shieldOutline,
            helpCircle,
            helpCircleOutline,
            logoGithub,
            mail,
            mailOutline,
            person,
            personOutline,
            settings,
            settingsOutline,
            thermometer,
            chevronForward,
            refresh
        });
    }

    onThemeChange(event: any) {
        const theme = event.detail.value as ThemeMode;
        this.settingsService.setTheme(theme);
    }

    toggleDarkMode() {
        this.settingsService.toggleTheme();
    }

    async onNotificationsChange(event: any) {
        const isChecked = event.detail.checked;

        if (isChecked) {
            // Request permission immediately on user interaction
            if ('Notification' in window) {
                const permission = await Notification.requestPermission();
                if (permission !== 'granted') {
                    // Revert UI if permission denied
                    setTimeout(() => {
                        event.target.checked = false;
                        this.settingsService.setPushNotif(false);
                        alert(this.settingsService.t().NOTIFICATIONS + ' blocked. Please enable in browser settings.');
                    }, 100);
                    return;
                }
            }
        }

        this.settingsService.setPushNotif(isChecked);
    }

    onSoundChange(event: any) {
        const isChecked = event.detail.checked;
        this.settingsService.setAlertSound(isChecked);

        if (isChecked) {
            // Unlock Audio logic on User Interaction
            this.settingsService.unlockAudio();
        } else {
            this.settingsService.stopAlert();
        }
    }

    onTemperatureUnitChange(event: any) {
        this.settingsService.setTempUnit(event.detail.value as TempUnit);
    }

    onRefreshIntervalChange(event: any) {
        this.settingsService.setRefreshInterval(Number(event.detail.value));
    }

    onLanguageChange(event: any) {
        this.settingsService.setLanguage(event.detail.value as Language);
    }
}
