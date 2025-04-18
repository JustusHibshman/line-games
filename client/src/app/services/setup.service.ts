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

    /* These variables are for the mock server experience only */
    hostedGameSpec: GameSpec | undefined;
    hostedPlayerTypes: Array<PlayerType> = [];
    /* End of mock server experience variables */

    constructor() { }

    quitGame(): void {
        let gameLink = this.gameplay.getGameLink();

        if (gameLink.inGame) {
            if (gameLink.hosting) {
                /* Tell central server to kill previous game */
            }
            this.gameplay.quitGame();
        }
    }

    hostGame(name: string, password: string,
             spec: GameSpec, playerTypes: Array<PlayerType>): void {
        /* TODO: Update with actual http request(s) */

        let gameLink = this.gameplay.getGameLink();

        if (gameLink.inGame) {
            this.quitGame();
        }

        /* Ask central server to initiate new game */

        let success = true;
        if (success) {
            /* Begin mock values */
            this.gameplay.setGameLink({
                gameID:  499,
                userID:  721,
                inGame:  true,
                hosting: true,
                gameServerIP: "localhost"
            });
            /* End mock values */
            /* Begin mock variables */
            this.hostedGameSpec = copyGameSpec(spec);
            this.hostedPlayerTypes = Array.from(playerTypes, (v) => v);
            /* End mock variables */

            this.router.navigate(['/lobby']);
        }
    }

    claimSeats(numSeats: number): boolean {
        let gameLink = this.gameplay.getGameLink();

        if (!gameLink.inGame) {
            return false;
        }

        /* Ask the game server for the seats */

        let success = true;

        return success;
    }
}
