import { Component, computed, inject, OnInit, signal, ChangeDetectorRef, AfterContentChecked } from '@angular/core';
import { KeyValuePipe, NgFor } from '@angular/common';

import { ActionButtonComponent } from '@local-components/action-button/action-button.component';
import { IntegerInputComponent } from '@local-components/integer-input/integer-input.component';
import { NavButtonComponent } from '@local-components/nav-button/nav-button.component';
import { PlayerTypeSelectorComponent } from '@local-components/player-type-selector/player-type-selector.component';
import { TextBoxComponent } from '@local-components/text-box/text-box.component';
import { ToggleSwitchComponent } from '@local-components/toggle-switch/toggle-switch.component';

import { GameSpec, copyGameSpec }   from '@local-types/game-spec.type';
import { PlayerType } from '@local-types/player-type.type';

import { SetupService } from '@local-services/setup.service';

@Component({
  selector: 'app-host',
  imports: [KeyValuePipe, NgFor,
            ActionButtonComponent, IntegerInputComponent, NavButtonComponent,
            PlayerTypeSelectorComponent, TextBoxComponent, ToggleSwitchComponent],
  templateUrl: './host.component.html',
  styleUrl: './host.component.scss'
})
export class HostComponent implements OnInit, AfterContentChecked {

    public PlayerTypes = PlayerType;

    setup = inject(SetupService);

    DataPrefix: string = "HOST.";

    specs: { [id: string]: GameSpec } = {};

    constructor(private changeDetector: ChangeDetectorRef) {}

    ngOnInit(): void {
        try {
            this.loadConfigs();
        }
        catch(e) {
            this.resetConfigs();
        }
        this.setup.quitGame();
    }

    ngAfterContentChecked(): void {
        this.changeDetector.detectChanges();
    }

    gameSpec: GameSpec = this.ticTacToeConfig();

    configName = signal<string>("");
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

    hostGame(): void {
        /* Filter out the None "players" */
        console.log(Array.from(this.playerTypes, (v) => v()));
        let numPlayers = 2;
        for (; numPlayers < 6; numPlayers++) {
            if (this.playerTypes[numPlayers]() == PlayerType.None) {
                break;
            }
        }
        let pt: Array<PlayerType> =
            Array.from({length: numPlayers}, (v, i) => this.playerTypes[i]());

        this.setup.hostGame(this.gameName(), this.password(), this.gameSpec, pt);
    }

    saveConfigAsPreset(): void {
        this.specs[this.configName().trim()] = copyGameSpec(this.gameSpec);
        localStorage.setItem('specs', JSON.stringify(this.specs));
    }

    loadConfig(specName: string): void {
        if (!this.specs[specName]) {
            console.log("No GameSpec '" + specName + "' in localStorage!");
        } else {
            this.gameSpec = copyGameSpec(this.specs[specName]);
        }
    }

    loadConfigs(): void {
        if (!localStorage['specs']) {
            this.specs = {};
            this.specs['Tic-Tac-Toe'] = this.ticTacToeConfig();
            this.specs['Link Four'] = this.linkFourConfig();
            this.specs['Pente'] = this.penteConfig();
            localStorage.setItem(this.DataPrefix + 'specs', JSON.stringify(this.specs));
        } else {
            let specsString = localStorage.getItem(this.DataPrefix + 'specs');
            this.specs = specsString ? JSON.parse(specsString) : {};
        }
    }

    resetConfigs(): void {
        localStorage.removeItem(this.DataPrefix + 'specs');
        this.loadConfigs();
    }

    ticTacToeConfig(): GameSpec {
        return {
            board: {
                width: 3,
                height: 3,
                gravity: false,
            },
            rules: {
                winningLength: 3,
                allowCaptures: false,
                winByCaptures: false,
                captureSize:   0,
                winningNumCaptures: 0,
            },
        }
    }

    linkFourConfig(): GameSpec {
        return {
            board: {
                width: 7,
                height: 6,
                gravity: true,
            },
            rules: {
                winningLength: 4,
                allowCaptures: false,
                winByCaptures: false,
                captureSize:   0,
                winningNumCaptures: 0,
            },
        }
    }

    penteConfig(): GameSpec {
        return {
            board: {
                width: 13,
                height: 13,
                gravity: false,
            },
            rules: {
                winningLength: 5,
                allowCaptures: true,
                winByCaptures: true,
                captureSize:   2,
                winningNumCaptures: 5,
            },
        }
    }
}
