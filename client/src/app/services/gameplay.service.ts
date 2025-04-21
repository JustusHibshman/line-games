import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { GameLink } from '@local-types/game-link.type';
import { GameSpec, copyGameSpec} from '@local-types/game-spec.type';
import { PlayerType } from '@local-types/player-type.type';

@Injectable({
  providedIn: 'root'
})
export class GameplayService {

    router = inject(Router);

    gameLink: GameLink;
    gameSpec: GameSpec | null;
    playerTypes: Array<PlayerType>;
    seats: Array<number> = [];

    constructor() {
        this.gameLink = this.emptyGameLink();
        this.gameSpec = null;
        this.playerTypes = [];
    }

    getGameLink(): GameLink {
        return { ...this.gameLink };
    }

    getPlayerTypes(): Array<PlayerType> {
        return [ ...this.playerTypes ];
    }

    setGameLink(gl: GameLink): void {
        this.gameLink = { ...gl };
    }

    setGameSpec(gs: GameSpec): void {
        this.gameSpec = copyGameSpec(gs);
    }

    setPlayerTypes(pt: Array<PlayerType>): void {
        this.playerTypes = [ ...pt ];
    }

    quitGame(): void {
        this.gameLink = this.emptyGameLink();
        this.gameSpec = null;
        this.playerTypes = [];
    }

    emptyGameLink(): GameLink {
        return {
            gameID:  null,
            userID:  null,
            inGame:  false,
            hosting: null,
            gameServerIP: null
        };
    }

    setSeats(s: Array<number>): void {
        this.seats = Array.from(s, (v) => v);
    }
}
