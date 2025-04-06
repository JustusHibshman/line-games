import { Component, computed, signal } from '@angular/core';
import { ActionButtonComponent } from '@local-components/action-button/action-button.component';
import { NavButtonComponent } from '@local-components/nav-button/nav-button.component';
import { PlayerTypeSelectorComponent } from '@local-components/player-type-selector/player-type-selector.component';
import { TextBoxComponent } from '@local-components/text-box/text-box.component';
import { ToggleSwitchComponent } from '@local-components/toggle-switch/toggle-switch.component';

@Component({
  selector: 'app-host',
  imports: [ActionButtonComponent, NavButtonComponent, PlayerTypeSelectorComponent,
            TextBoxComponent, ToggleSwitchComponent],
  templateUrl: './host.component.html',
  styleUrl: './host.component.scss'
})
export class HostComponent {
    gravity: boolean = false;
    allowCaptures = signal<boolean>(false);
    winByCaptures: boolean = false;

    configName = signal<string>("");

    playerTypes = [signal<number>(0), signal<number>(0), signal<number>(3),
                   signal<number>(3), signal<number>(3), signal<number>(3)];
    ptDisabled  = [signal<boolean>(true), signal<boolean>(true),
                   computed(() => this.playerTypes[1]() == 3 || this.playerTypes[3]() != 3),
                   computed(() => this.playerTypes[2]() == 3 || this.playerTypes[4]() != 3),
                   computed(() => this.playerTypes[3]() == 3 || this.playerTypes[5]() != 3),
                   computed(() => this.playerTypes[4]() == 3)]

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
