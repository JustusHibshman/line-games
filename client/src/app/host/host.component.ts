import { Component, computed, inject, OnInit, signal, ChangeDetectorRef, AfterContentChecked } from '@angular/core';
import { KeyValuePipe, NgFor } from '@angular/common';

import { ActionButtonComponent } from '@local-components/action-button/action-button.component';
import { HelpHoverBoxComponent } from '@local-components/help-hover-box/help-hover-box.component';
import { IntegerInputComponent } from '@local-components/integer-input/integer-input.component';
import { NavButtonComponent } from '@local-components/nav-button/nav-button.component';
import { PlayerTypeSelectorComponent } from '@local-components/player-type-selector/player-type-selector.component';
import { TextBoxComponent } from '@local-components/text-box/text-box.component';
import { ToggleSwitchComponent } from '@local-components/toggle-switch/toggle-switch.component';

import { GameSpec, copyGameSpec }   from '@local-types/game-spec.type';
import { PlayerType } from '@local-types/player-type.type';

import { SetupService } from '@local-services/setup.service';
import { RulePresetsService } from '@local-services/rule-presets.service';

@Component({
  selector: 'app-host',
  imports: [KeyValuePipe, NgFor,
            ActionButtonComponent, HelpHoverBoxComponent, NavButtonComponent,
            PlayerTypeSelectorComponent],
  templateUrl: './host.component.html',
  styleUrl: './host.component.scss'
})
export class HostComponent implements OnInit, AfterContentChecked {

    public PlayerTypes = PlayerType;

    setup = inject(SetupService);
    presets = inject(RulePresetsService);

    chosenPreset = signal<string>("[none]");
    rulesReady = signal<boolean>(false);

    gameSpec: GameSpec = this.presets.ticTacToeConfig();
    specs: { [id: string]: GameSpec } = this.presets.getSpecs();

    gameName = signal<string>("<placeholder>");
    password = signal<string>("");

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

    aiComputeTime = signal<number>(4);

    constructor(private changeDetector: ChangeDetectorRef) {}

    ngOnInit(): void {
        this.setup.quitGame();
    }

    ngAfterContentChecked(): void {
        this.changeDetector.detectChanges();
    }

    loadConfig(name: string) {
        if (this.specs[name]) {
            this.gameSpec = this.specs[name];
            this.chosenPreset.set(name);
            this.rulesReady.set(true);
        }
    }

    hostGame(): void {
        /* Filter out the None "players" */
        let numPlayers = 2;
        for (; numPlayers < 6; numPlayers++) {
            if (this.playerTypes[numPlayers]() == PlayerType.None) {
                break;
            }
        }
        let pt: Array<PlayerType> =
            Array.from({length: numPlayers}, (v, i) => this.playerTypes[i]());

        this.setup.hostGame(this.gameName(), this.password(), this.gameSpec, pt);
        this.goFullscreen();
    }

    goFullscreen(): void {
        let elem = document.documentElement;
        elem.requestFullscreen({ navigationUI: "hide"});
    }
}
