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

    constructor() {
        this.gameLink = this.emptyGameLink();
    }

    getGameLink(): GameLink {
        return { ...this.gameLink };
    }

    setGameLink(gl: GameLink): void {
        this.gameLink = { ...gl };
    }

    quitGame(): void {
        this.gameLink = this.emptyGameLink();
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
}
