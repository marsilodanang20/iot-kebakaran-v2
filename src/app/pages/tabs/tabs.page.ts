import { Component, inject } from '@angular/core';
import {
    IonTabs,
    IonTabBar,
    IonTabButton,
    IonIcon,
    IonLabel
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
    home,
    homeOutline,
    statsChart,
    statsChartOutline,
    hardwareChip,
    hardwareChipOutline,
    notifications,
    notificationsOutline,
    settings,
    settingsOutline,
    time,
    timeOutline
} from 'ionicons/icons';
import { SettingsService } from '../../core/services/settings.service';

@Component({
    selector: 'app-tabs',
    templateUrl: 'tabs.page.html',
    styleUrls: ['tabs.page.scss'],
    imports: [
        IonTabs,
        IonTabBar,
        IonTabButton,
        IonIcon,
        IonLabel
    ]
})
export class TabsPage {
    settingsService = inject(SettingsService);

    constructor() {
        addIcons({
            home,
            homeOutline,
            statsChart,
            statsChartOutline,
            hardwareChip,
            hardwareChipOutline,
            notifications,
            notificationsOutline,
            settings,
            settingsOutline,
            time,
            timeOutline
        });
    }
}
