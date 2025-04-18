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

    joinGame(name: string, password: string): void {
        /* TODO: Update with actual http request(s) */

        let gameLink = this.gameplay.getGameLink();

        if (gameLink.inGame) {
            this.quitGame();
        }

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
            /*
                this.gameplay.setGameSpec(TODO: FILL IN);
                this.gameplay.setPlayerTypes(TODO: FILL IN);
            */
            /* End mock values */

            this.router.navigate(['/lobby']);
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

            this.gameplay.setGameSpec(spec);
            this.gameplay.setPlayerTypes(playerTypes);

            this.router.navigate(['/lobby']);
        }
    }

    claimSeats(numSeats: number): Array<number> {
        let gameLink = this.gameplay.getGameLink();

        if (!gameLink.inGame) {
            return [];
        }

        /* Ask the game server for the seats */

        /* Mock Version */
        let success = true;
        if (success) {
            return Array.from({length: Math.min(numSeats, this.gameplay.getPlayerTypes().length)}, (v, i) => i);
        }
        /* End Mock Version */
        return [];
    }

    getPlayerTypes(): Array<PlayerType> {
        return this.gameplay.getPlayerTypes();
    }
}
