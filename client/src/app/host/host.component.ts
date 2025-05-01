import { Component, computed, inject, OnInit, signal } from '@angular/core';

import { ActionButtonComponent } from '@local-components/action-button/action-button.component';
import { DropdownMenuComponent } from '@local-components/dropdown-menu/dropdown-menu.component';
import { IntegerInputComponent } from '@local-components/integer-input/integer-input.component';
import { NavButtonComponent } from '@local-components/nav-button/nav-button.component';
import { TextBoxComponent } from '@local-components/text-box/text-box.component';
import { VerticalRadioComponent } from '@local-components/vertical-radio/vertical-radio.component';

import { GameSpec, copyGameSpec }   from '@local-types/game-spec.type';
import { PlayerType } from '@local-types/player-type.type';

import { SetupService } from '@local-services/setup.service';
import { RulePresetsService } from '@local-services/rule-presets.service';

@Component({
  selector: 'app-host',
  imports: [ActionButtonComponent, DropdownMenuComponent,
            IntegerInputComponent, NavButtonComponent, VerticalRadioComponent],
  templateUrl: './host.component.html',
  styleUrl: './host.component.scss'
})
export class HostComponent implements OnInit {

    public PlayerTypes = PlayerType;

    setup = inject(SetupService);
    presets = inject(RulePresetsService);

    chosenPreset = signal<string>("");
    rulesReady = signal<boolean>(false);

    gameSpec: GameSpec = this.presets.ticTacToeConfig();
    specs: { [id: string]: GameSpec } = this.presets.getSpecs();
    specNames: Array<string> = this.presets.getSpecNames();

    gameName = signal<string>("<placeholder>");
    password = signal<string>("");

    numPlayers = signal<number>(2);
    numHumans  = signal<number>(0);
    numSelected = signal<number>(0);

    playerTypes = signal<Array<PlayerType>>([]);

    aiComputeTime = signal<number>(4);

    constructor() {}

    ngOnInit(): void {
        this.setup.quitGame();
        this.resizePlayerTypes();
    }

    resizePlayerTypes(): void {
        let l = this.playerTypes();
        while (l.length > this.numPlayers()) {
            if (l[l.length - 1] == PlayerType.Human) {
                this.numHumans.set(this.numHumans() - 1);
            }
            if (l[l.length - 1] != PlayerType.None) {
                this.numSelected.set(this.numSelected() - 1);
            }
            l.pop();
        }
        while (l.length < this.numPlayers()) {
            l.push(PlayerType.None);
        }
        this.playerTypes.set(l);
    }

    setPlayerType(idx: number, value: string) {
        let l = this.playerTypes();
        if (l[idx] == PlayerType.None) {
            this.numSelected.set(this.numSelected() + 1);
        }
        if (value == "Human") {
            if (l[idx] != PlayerType.Human) {
                this.numHumans.set(this.numHumans() + 1);
            }
            l[idx] = PlayerType.Human;
        } else {
            if (l[idx] == PlayerType.Human) {
                this.numHumans.set(this.numHumans() - 1);
            }
            l[idx] = PlayerType.AI;
        }
        this.playerTypes.set(l);
    }

    loadConfig(name: string) {
        if (this.specs[name]) {
            this.gameSpec = this.specs[name];
            this.chosenPreset.set(name);
            this.rulesReady.set(true);
        }
    }

    hostGame(): void {
        this.setup.hostGame(this.gameName(), this.password(), this.gameSpec, this.playerTypes());
    }

    goFullscreen(): void {
        let elem = document.documentElement;
        elem.requestFullscreen({ navigationUI: "hide"});
    }
}
