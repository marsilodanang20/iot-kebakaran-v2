import { Component, inject, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet, Platform } from '@ionic/angular/standalone';
import { SettingsService } from './core/services/settings.service';
import { NotificationService } from './core/services/notification.service';
import { Capacitor } from '@capacitor/core';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  imports: [IonApp, IonRouterOutlet]
})
export class AppComponent implements OnInit {
  // Inject services
  private settingsService = inject(SettingsService);
  private notificationService = inject(NotificationService);
  private platform = inject(Platform);

  constructor() { }

  async ngOnInit() {
    // Initialize app when platform is ready
    await this.platform.ready();

    // Request notification permission on native platforms (Android 13+)
    if (Capacitor.isNativePlatform()) {
      await this.requestNotificationPermission();
    }
  }

  /**
   * Request notification permission early in app lifecycle
   * Required for Android 13+ (API 33+)
   */
  private async requestNotificationPermission(): Promise<void> {
    try {
      const granted = await this.notificationService.requestPermission();
      if (granted) {
        console.log('Notification permission granted');
      } else {
        console.log('Notification permission denied - will use in-app toasts instead');
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  }
}
