import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { GameSpec, copyGameSpec } from '@local-types/game-spec.type';
import { PlayerType } from '@local-types/player-type.type';

import { GameLink } from '@local-types/game-link.type';
import { GameplayService } from '@local-services/gameplay.service';

@Injectable({
  providedIn: 'root'
})
export class SetupService {

    router = inject(Router);
    gameplay = inject(GameplayService);

    gameLink: GameLink | undefined;

    /* These variables are for the mock server experience only */
    hostedGameSpec: GameSpec | undefined;
    hostedPlayerTypes: Array<PlayerType> = [];
    /* End of mock server experience variables */

    constructor() { }

    quitGame(): void {
        if (this.gameLink === undefined) {
            return;
        }

        if (this.gameLink.host) {
            /* Tell central server to kill previous game */
        }
        this.gameLink = {
            gameID: -1,
            userID: -1,
            inGame: false,
            host:   false,
            gameServerIP: ""
        };
    }

    hostGame(name: string, password: string,
             spec: GameSpec, playerTypes: Array<PlayerType>): void {
        /* TODO: Update with actual http request(s) */

        if (this.gameLink !== undefined && this.gameLink.inGame) {
            this.quitGame();
        }

        /* Ask central server to initiate new game */

        let success = true;
        if (success) {
            /* Begin mock values */
            this.gameLink = {
                gameID: 499,
                userID: 721,
                inGame: true,
                host:   true,
                gameServerIP: "localhost"
            }
            /* End mock values */
            /* Begin mock variables */
            this.hostedGameSpec = copyGameSpec(spec);
            this.hostedPlayerTypes = Array.from(playerTypes, (v) => v);
            /* End mock variables */

            this.router.navigate(['/lobby']);
        }
    }

    claimSeats(numSeats: number): boolean {
        if (this.gameLink === undefined || !this.gameLink.inGame) {
            return false;
        }

        /* Ask the game server for the seats */

        let success = true;

        return success;
    }
}
