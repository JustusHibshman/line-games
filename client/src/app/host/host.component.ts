import { Component, computed, inject, OnInit, signal, Signal, WritableSignal } from '@angular/core';
import { Router } from '@angular/router';

import { ActionButtonComponent } from '@local-components/action-button/action-button.component';
import { IntegerInputComponent } from '@local-components/integer-input/integer-input.component';
import { NavButtonComponent } from '@local-components/nav-button/nav-button.component';
import { TextBoxComponent } from '@local-components/text-box/text-box.component';
import { ToggleSwitchComponent } from '@local-components/toggle-switch/toggle-switch.component';
import { VerticalRadioComponent } from '@local-components/vertical-radio/vertical-radio.component';

import { GameSpec, copyGameSpec }   from '@local-types/game-spec.type';
import { PlayerType } from '@local-types/player-type.type';

import { SortedPipe } from '@local-pipes/sorted.pipe';

import { BackendService } from '@local-services/backend.service';
import { GameplayService } from '@local-services/gameplay.service';
import { RulePresetsService } from '@local-services/rule-presets.service';

@Component({
  selector: 'app-host',
  imports: [ActionButtonComponent, IntegerInputComponent, NavButtonComponent,
            /* [Multiplayer disabled] TextBoxComponent, ToggleSwitchComponent, */
            VerticalRadioComponent, SortedPipe],
  templateUrl: './host.component.html',
  styleUrl: './host.component.scss'
})
export class HostComponent implements OnInit {

    public PlayerTypes = PlayerType;

    router = inject(Router);
    backendService = inject(BackendService);
    gameplayService = inject(GameplayService);
    presets = inject(RulePresetsService);

    error = signal<string>("");

    chosenPreset = signal<string>("");
    rulesReady = signal<boolean>(false);

    gameSpec: GameSpec = this.presets.ticTacToeConfig();
    specs: { [id: string]: GameSpec } = this.presets.getSpecs();
    specNames: Array<string> = this.presets.getSpecNames();

    gameName = signal<string>("");
    password = signal<string>("");

    numPlayers = signal<number>(2);

    PTHUMAN: boolean = false;

    ptChoices = signal<Array<WritableSignal<boolean>>>([]);
    numHumans = computed(() => this.booleanSignalSum(this.ptChoices(), this.PTHUMAN));

    /* Multiplayer disabled
    readyToLaunch = computed(() => this.numHumans() == 1 ||
                                    (this.gameName().trim().length > 0 &&
                                     this.rulesReady() && this.numHumans() > 0));
    */
    readyToLaunch = computed(() => this.rulesReady());

    constructor() {}

    ngOnInit(): void {
        this.resizePlayerTypes();
    }

    resizePlayerTypes(): void {
        // l is a reference to the array. Thus changes to l will change the
        //  array referenced by ptChoices.
        let l = this.ptChoices();
        while (l.length > this.numPlayers()) {
            l.pop();
        }
        while (l.length < this.numPlayers()) {
            /* Multiplayer disabled
            let choice: boolean = l.length == 0 ? this.PTHUMAN : l[l.length - 1]();
            */
            let choice: boolean = l.length == 0 ? this.PTHUMAN : !this.PTHUMAN;
            l.push(signal<boolean>(choice));
        }
        // Here we copy the array, which makes the reference change, which in turn
        //  causes downstream signals to update.
        this.ptChoices.update((old) => [...old]);
    }

    booleanSignalSum(signals: Array<WritableSignal<boolean>>, target: boolean): number {
        return  signals.reduce((sum: number, theBool: WritableSignal<boolean>) =>
                                sum + (theBool() == target ? 1 : 0), 0);
    }

    loadConfig(name: string) {
        if (this.specs[name]) {
            this.gameSpec = this.specs[name];
            this.chosenPreset.set(name);
            this.rulesReady.set(true);
        }
    }

    async hostGame() {
        this.gameplayService.quitGame();

        this.error.set("");
        let playerTypes = Array.from(this.ptChoices(), (v) => v() ? PlayerType.AI : PlayerType.Human);
        let success: boolean =
                await this.backendService.createGame(this.gameName(), this.password(),
                                                     this.gameSpec, playerTypes);

        if (success) {
            if (this.numHumans() == 1) {
                // Only one human player, no need to go to the lobby.
                success = this.gameplayService.loadInitialGameDetails();
                if (success) {
                    this.router.navigate(["/play"]);
                } else {
                    this.error.set("Error launching game -- try again.");
                }
            } else {
                this.router.navigate(["/lobby"]);
            }
        } else {
            this.error.set("Error creating game -- try again.");
        }
    }
}
