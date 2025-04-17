import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { GameSpec, copyGameSpec, emptyGameSpec } from '@local-types/game-spec.type';
import { PlayerType } from '@local-types/player-type.type';

@Injectable({
  providedIn: 'root'
})
export class SetupService {

    router = inject(Router);

    gameID: number = -1;
    userID: number = -1;
    inGame: boolean = false;
    host:   boolean = false;
    gameServerIP: string = "";

    /* These variables are for the mock server experience only */
    hostedGameSpec: GameSpec = emptyGameSpec();
    hostedPlayerTypes: Array<PlayerType> = [];
    /* End of mock server experience variables */

    constructor() { }

    quitGame(): void {
        if (this.host) {
            /* Tell central server to kill previous game */
        }
        this.gameID = -1;
        this.userID = -1;
        this.inGame = false;
        this.host   = false;
        this.gameServerIP = "";
    }

    hostGame(name: string, password: string,
             spec: GameSpec, playerTypes: Array<PlayerType>): void {
        /* TODO: Update with actual http request(s) */

        if (this.inGame) {
            this.quitGame();
        }

        /* Ask central server to initiate new game */

        let success = true;
        if (success) {
            /* Begin mock values */
            this.gameID = 499;
            this.userID = 721;
            this.inGame = true;
            this.host   = true;
            this.gameServerIP = "localhost";
            /* End mock values */
            /* Begin mock variables */
            this.hostedGameSpec = copyGameSpec(spec);
            this.hostedPlayerTypes = Array.from(playerTypes, (v) => v);
            /* End mock variables */

            this.router.navigate(['/lobby']);
        }
    }

    claimSeats(numSeats: number): boolean {
        if (!this.inGame) {
            return false;
        }

        /* Ask the game server for the seats */

        let success = true;

        return success;
    }
}
