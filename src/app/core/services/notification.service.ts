import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications, ScheduleOptions, LocalNotificationSchema } from '@capacitor/local-notifications';

/**
 * Notification Service
 * 
 * Handles native Android/iOS notifications using Capacitor Local Notifications.
 * 
 * Features:
 * - Native notification on Android status bar and notification tray
 * - Permission handling for Android 13+ (POST_NOTIFICATIONS)
 * - Fallback handling when permission is denied
 * - Support for export success notifications
 */
@Injectable({
    providedIn: 'root'
})
export class NotificationService {

    private notificationId = 1;
    private permissionGranted = false;

    constructor() {
        // Initialize and check permissions on service creation
        this.initializeNotifications();
    }

    /**
     * Initialize notification service and check permissions
     */
    private async initializeNotifications(): Promise<void> {
        if (!this.isNativePlatform()) {
            console.log('NotificationService: Running on web, skipping initialization');
            return;
        }

        try {
            // Check current permission status
            const permStatus = await LocalNotifications.checkPermissions();
            console.log('Notification permission status:', permStatus.display);

            if (permStatus.display === 'granted') {
                this.permissionGranted = true;
            } else if (permStatus.display === 'prompt' || permStatus.display === 'prompt-with-rationale') {
                // Will request permission later when needed
                console.log('Notification permission needs to be requested');
            }
        } catch (error) {
            console.error('Error initializing notifications:', error);
        }
    }

    /**
     * Check if running on native platform
     */
    isNativePlatform(): boolean {
        return Capacitor.isNativePlatform();
    }

    /**
     * Get current platform
     */
    getPlatform(): 'web' | 'android' | 'ios' {
        const platform = Capacitor.getPlatform();
        if (platform === 'android') return 'android';
        if (platform === 'ios') return 'ios';
        return 'web';
    }

    /**
     * Request notification permission (required for Android 13+)
     * Should be called early in app lifecycle (e.g., app.component.ts)
     */
    async requestPermission(): Promise<boolean> {
        if (!this.isNativePlatform()) {
            console.log('NotificationService: Web platform, permission not needed');
            return true;
        }

        try {
            // Check current status first
            const currentStatus = await LocalNotifications.checkPermissions();

            if (currentStatus.display === 'granted') {
                this.permissionGranted = true;
                console.log('Notification permission already granted');
                return true;
            }

            // Request permission
            const result = await LocalNotifications.requestPermissions();
            this.permissionGranted = result.display === 'granted';

            console.log('Notification permission request result:', result.display);
            return this.permissionGranted;
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            return false;
        }
    }

    /**
     * Check if notification permission is granted
     */
    async checkPermission(): Promise<boolean> {
        if (!this.isNativePlatform()) {
            return true;
        }

        try {
            const status = await LocalNotifications.checkPermissions();
            this.permissionGranted = status.display === 'granted';
            return this.permissionGranted;
        } catch (error) {
            console.error('Error checking notification permission:', error);
            return false;
        }
    }

    /**
     * Show export success notification
     * 
     * @param fileType - Type of file exported (PDF, Excel, CSV)
     * @param filename - Name of the exported file
     * @param folderName - Folder where file is saved (default: Documents)
     */
    async showExportSuccessNotification(
        fileType: 'PDF' | 'Excel' | 'CSV',
        filename: string,
        folderName: string = 'Documents'
    ): Promise<NotificationResult> {
        if (!this.isNativePlatform()) {
            console.log('NotificationService: Web platform, skipping native notification');
            return {
                success: false,
                reason: 'web_platform',
                message: 'Native notifications not available on web'
            };
        }

        // Check permission before sending
        const hasPermission = await this.checkPermission();
        if (!hasPermission) {
            console.log('NotificationService: Permission not granted, attempting to request');
            const granted = await this.requestPermission();
            if (!granted) {
                return {
                    success: false,
                    reason: 'permission_denied',
                    message: 'Notification permission denied by user'
                };
            }
        }

        try {
            const notification: LocalNotificationSchema = {
                id: this.getNextNotificationId(),
                title: 'Export Berhasil ✅',
                body: `File ${fileType} "${filename}" berhasil disimpan di folder ${folderName}`,
                sound: 'default',
                smallIcon: 'ic_stat_icon_config_sample', // Default Capacitor icon
                largeIcon: 'ic_launcher',
                iconColor: '#667eea', // Primary app color
                autoCancel: true,
            };

            const scheduleOptions: ScheduleOptions = {
                notifications: [notification]
            };

            await LocalNotifications.schedule(scheduleOptions);

            console.log('Export notification sent successfully:', notification);

            return {
                success: true,
                reason: 'sent',
                message: 'Notification sent successfully',
                notificationId: notification.id
            };
        } catch (error) {
            console.error('Error sending notification:', error);
            return {
                success: false,
                reason: 'error',
                message: `Failed to send notification: ${(error as Error).message}`
            };
        }
    }

    /**
     * Show generic success notification
     */
    async showSuccessNotification(title: string, body: string): Promise<NotificationResult> {
        if (!this.isNativePlatform()) {
            return {
                success: false,
                reason: 'web_platform',
                message: 'Native notifications not available on web'
            };
        }

        const hasPermission = await this.checkPermission();
        if (!hasPermission) {
            const granted = await this.requestPermission();
            if (!granted) {
                return {
                    success: false,
                    reason: 'permission_denied',
                    message: 'Notification permission denied'
                };
            }
        }

        try {
            const notification: LocalNotificationSchema = {
                id: this.getNextNotificationId(),
                title: title,
                body: body,
                sound: 'default',
                smallIcon: 'ic_stat_icon_config_sample',
                autoCancel: true,
            };

            await LocalNotifications.schedule({
                notifications: [notification]
            });

            return {
                success: true,
                reason: 'sent',
                message: 'Notification sent successfully',
                notificationId: notification.id
            };
        } catch (error) {
            console.error('Error sending notification:', error);
            return {
                success: false,
                reason: 'error',
                message: `Failed to send notification: ${(error as Error).message}`
            };
        }
    }

    /**
     * Show error notification
     */
    async showErrorNotification(title: string, body: string): Promise<NotificationResult> {
        if (!this.isNativePlatform()) {
            return {
                success: false,
                reason: 'web_platform',
                message: 'Native notifications not available on web'
            };
        }

        const hasPermission = await this.checkPermission();
        if (!hasPermission) {
            return {
                success: false,
                reason: 'permission_denied',
                message: 'Notification permission denied'
            };
        }

        try {
            const notification: LocalNotificationSchema = {
                id: this.getNextNotificationId(),
                title: `❌ ${title}`,
                body: body,
                sound: 'default',
                smallIcon: 'ic_stat_icon_config_sample',
                autoCancel: true,
            };

            await LocalNotifications.schedule({
                notifications: [notification]
            });

            return {
                success: true,
                reason: 'sent',
                message: 'Notification sent successfully',
                notificationId: notification.id
            };
        } catch (error) {
            console.error('Error sending notification:', error);
            return {
                success: false,
                reason: 'error',
                message: `Failed to send notification: ${(error as Error).message}`
            };
        }
    }

    /**
     * Cancel all pending notifications
     */
    async cancelAllNotifications(): Promise<void> {
        if (!this.isNativePlatform()) return;

        try {
            const pending = await LocalNotifications.getPending();
            if (pending.notifications.length > 0) {
                await LocalNotifications.cancel(pending);
            }
        } catch (error) {
            console.error('Error canceling notifications:', error);
        }
    }

    /**
     * Get unique notification ID
     */
    private getNextNotificationId(): number {
        return this.notificationId++;
    }

    /**
     * Check if permission is currently granted (synchronous check from cache)
     */
    isPermissionGranted(): boolean {
        return this.permissionGranted;
    }
}

// ============================================================
// TYPES
// ============================================================

export interface NotificationResult {
    success: boolean;
    reason: 'sent' | 'web_platform' | 'permission_denied' | 'error';
    message: string;
    notificationId?: number;
}
