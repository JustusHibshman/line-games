import { Component, computed, signal } from '@angular/core';
import { ActionButtonComponent } from '@local-components/action-button/action-button.component';
import { IntegerInputComponent } from '@local-components/integer-input/integer-input.component';
import { NavButtonComponent } from '@local-components/nav-button/nav-button.component';
import { PlayerTypeSelectorComponent } from '@local-components/player-type-selector/player-type-selector.component';
import { TextBoxComponent } from '@local-components/text-box/text-box.component';
import { ToggleSwitchComponent } from '@local-components/toggle-switch/toggle-switch.component';

import { PlayerType } from '@local-types/player-type.type';

@Component({
  selector: 'app-host',
  imports: [ActionButtonComponent, IntegerInputComponent, NavButtonComponent,
            PlayerTypeSelectorComponent, TextBoxComponent, ToggleSwitchComponent],
  templateUrl: './host.component.html',
  styleUrl: './host.component.scss'
})
export class HostComponent {

    width    = signal<number>(13);
    height   = signal<number>(13);
    lineSize: number = 5;
    boardMin = computed(() => Math.min(this.width(), this.height()));

    gravity: boolean = false;
    allowCaptures = signal<boolean>(false);
    winByCaptures = signal<boolean>(false);

    captureSize:     number = 2;
    winningCaptures: number = 5;

    configName = signal<string>("");

    playerTypes = [signal<PlayerType>(PlayerType.Human), signal<PlayerType>(PlayerType.None),
                   signal<PlayerType>(PlayerType.None),  signal<PlayerType>(PlayerType.None),
                   signal<PlayerType>(PlayerType.None),  signal<PlayerType>(PlayerType.None)];
    ptDisabled  = [signal<boolean>(true),
                   computed(() => this.playerTypes[0]() == PlayerType.None || 
                                    this.playerTypes[2]() != PlayerType.None),
                   computed(() => this.playerTypes[1]() == PlayerType.None || 
                                    this.playerTypes[3]() != PlayerType.None),
                   computed(() => this.playerTypes[2]() == PlayerType.None ||
                                    this.playerTypes[4]() != PlayerType.None),
                   computed(() => this.playerTypes[3]() == PlayerType.None ||
                                    this.playerTypes[5]() != PlayerType.None),
                   computed(() => this.playerTypes[4]() == PlayerType.None)]

    saveConfigAsPreset(): void {
        console.log("Save Button Pressed");
    }

    setConfigName(event: any): void {
        this.configName.set(event.target.value);
    }
}
