import { computed, inject, Injectable, Signal } from '@angular/core';
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

    gameLink: Signal<GameLink> = this.gameplay.getGameLink();

    __MOCK__emptySeats: boolean = true;  /* Mock variable to simulate server response */

    inGame = computed(() => this.gameLink().inGame);

    constructor() { }

    enterGame(): void {
        this.router.navigate(['/play']);
    }

    quitGame(): void {

        if (this.gameLink().inGame) {
            if (this.gameLink().hosting) {
                /* Tell central server to kill previous game */
            }
            this.gameplay.quitGame();
            this.__MOCK__emptySeats = true;
        }
    }

    joinGame(name: string, password: string): void {
        /* TODO: Update with actual http request(s) */

        if (this.gameLink().inGame) {
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
                this.gameplay.setGame(TODO: FILL IN);
            */
            /* End mock values */

            this.router.navigate(['/lobby']);
        }
    }

    hostGame(name: string, password: string,
             spec: GameSpec, playerTypes: Array<PlayerType>): void {
        /* TODO: Update with actual http request(s) */

        if (this.gameLink().inGame) {
            this.quitGame();
        }

        /* Ask central server to initiate new game */

        let startingSeat = Math.floor(Math.random() * playerTypes.length);

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

            this.gameplay.setGame(spec, playerTypes, startingSeat);

            this.router.navigate(['/lobby']);
        }
    }

    claimSeats(numSeats: number): Array<number> {
        if (!this.gameLink().inGame) {
            return [];
        }

        /* Ask the game server for the seats */

        /* Mock Version */
        let success = true;
        if (success) {
            let empty = 0;
            let seats: Array<number> = [];
            let types = this.gameplay.getPlayerTypes();
            for (let i = 0; i < types.length; i++) {
                if (types[i] === PlayerType.Human) {
                    empty++;
                    seats.push(i);
                }
            }
            if (numSeats > empty) {
                return [];
            } else if (numSeats == empty) {
                this.__MOCK__emptySeats = false;
            }
            this.gameplay.setSeats(seats);
            return seats;
        }
        /* End Mock Version */
        return [];
    }

    getPlayerTypes(): Array<PlayerType> {
        return this.gameplay.getPlayerTypes();
    }

    hasEmptySeats(): boolean {
        return this.__MOCK__emptySeats;
    }
}
