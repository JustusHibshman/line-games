import { Component, computed, inject, OnInit, signal, Signal, WritableSignal } from '@angular/core';

import { ActionButtonComponent } from '@local-components/action-button/action-button.component';
import { IntegerInputComponent } from '@local-components/integer-input/integer-input.component';
import { NavButtonComponent } from '@local-components/nav-button/nav-button.component';
import { TextBoxComponent } from '@local-components/text-box/text-box.component';
import { ToggleSwitchComponent } from '@local-components/toggle-switch/toggle-switch.component';
import { VerticalRadioComponent } from '@local-components/vertical-radio/vertical-radio.component';

import { GameSpec, copyGameSpec }   from '@local-types/game-spec.type';
import { PlayerType } from '@local-types/player-type.type';

import { SortedPipe } from '@local-pipes/sorted.pipe';

import { SetupService } from '@local-services/setup.service';
import { RulePresetsService } from '@local-services/rule-presets.service';

@Component({
  selector: 'app-host',
  imports: [ActionButtonComponent, IntegerInputComponent, NavButtonComponent,
            ToggleSwitchComponent, VerticalRadioComponent,
            SortedPipe],
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

    PTHUMAN: boolean = false;

    ptChoices = signal<Array<WritableSignal<boolean>>>([]);
    numHumans = computed(() => this.booleanSignalSum(this.ptChoices(), this.PTHUMAN));

    readyToLaunch = computed(() => this.gameName().trim().length > 0 &&
                                   this.rulesReady() && this.numHumans() > 0);

    constructor() {}

    ngOnInit(): void {
        this.setup.quitGame();
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
            let choice: boolean = l.length == 0 ? this.PTHUMAN : l[l.length - 1]();
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

    hostGame(): void {
        let playerTypes = Array.from(this.ptChoices(), (v) => v() ? PlayerType.AI : PlayerType.Human);
        this.setup.hostGame(this.gameName(), this.password(), this.gameSpec, playerTypes);
    }

    goFullscreen(): void {
        let elem = document.documentElement;
        elem.requestFullscreen({ navigationUI: "hide"});
    }
}
