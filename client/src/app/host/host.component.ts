import { Component, signal } from '@angular/core';
import { ActionButtonComponent } from '@local-components/action-button/action-button.component';
import { NavButtonComponent } from '@local-components/nav-button/nav-button.component';
import { TextBoxComponent } from '@local-components/text-box/text-box.component';
import { ToggleSwitchComponent } from '@local-components/toggle-switch/toggle-switch.component';

@Component({
  selector: 'app-host',
  imports: [ActionButtonComponent, NavButtonComponent, 
            TextBoxComponent, ToggleSwitchComponent],
  templateUrl: './host.component.html',
  styleUrl: './host.component.scss'
})
export class HostComponent {
    gravity:       boolean = false;
    allowCaptures = signal<boolean>(false);
    winByCaptures: boolean = false;

    configName    = signal<string>("");

    setGravity(event: boolean): void {
        this.gravity = event;
    }

    setAllowCaptures(event: boolean): void {
        this.allowCaptures.set(event);
    }

    setWinByCaptures(event: boolean): void {
        this.winByCaptures = event;
    }

    saveConfigAsPreset(): void {
        console.log("Save Button Pressed");
    }

    setConfigName(event: any): void {
        this.configName.set(event.target.value);
    }
}
