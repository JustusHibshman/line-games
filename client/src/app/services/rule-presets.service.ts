import { computed, Injectable, signal } from '@angular/core';

import { GameSpec, copyGameSpec }   from '@local-types/game-spec.type';

@Injectable({
  providedIn: 'root'
})
export class RulePresetsService {

    gameSpec: GameSpec = this.ticTacToeConfig();
    specs: { [id: string]: GameSpec } = {};

    DataPrefix: string = "PRESETS.";

    constructor() {
        try {
            this.loadConfigs();
        }
        catch(e) {
            this.resetConfigs();
        }
    }

    getSpecs(): { [id: string]: GameSpec } {
        let specsCopy: { [id: string]: GameSpec } = {};
        for (let key of Object.keys(this.specs)) {
            specsCopy[key] = copyGameSpec(this.specs[key]);
        }
        return specsCopy;
    }

    getSpecNames(): Array<string> {
        return Object.keys(this.specs).sort(this.stringComp);
    }

    saveConfigAsPreset(name: string, gs: GameSpec): void {
        this.specs[name.trim()] = copyGameSpec(gs);
        localStorage.setItem(this.DataPrefix + 'specs', JSON.stringify(this.specs));
    }

    loadConfigs(): void {
        if (!localStorage[this.DataPrefix + 'specs']) {
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

    stringComp(a: string, b: string): number {
        let aLow = a.toLowerCase();
        let bLow = b.toLowerCase();
        if (aLow < bLow) {
            return -1;
        } else if (aLow > bLow) {
            return 1;
        } else if (a < b) {
            return -1;
        } else if (a > b) {
            return -1;
        }
        return 0;
    }
}
