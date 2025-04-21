import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';

import { GameLink } from '@local-types/game-link.type';
import { GameSpec, copyGameSpec} from '@local-types/game-spec.type';
import { GameState } from '@local-types/game-state.type';
import { PlayerType } from '@local-types/player-type.type';

@Injectable({
  providedIn: 'root'
})
export class GameplayService {

    router = inject(Router);

    gameLink: GameLink;
    gameSpec: GameSpec | null;
    gameState = signal<GameState | null>(null);
    playerTypes: Array<PlayerType>;
    seats: Array<number> = [];
    gameOver = signal<boolean>(false);
    winner   = signal<number>(-1);

    /* Initializing */

    constructor() {
        this.gameLink = this.emptyGameLink();
        this.gameSpec = null;
        this.gameState.set(null);
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

    setGame(gs: GameSpec, pt: Array<PlayerType>): void {
        this.gameSpec = copyGameSpec(gs);
        this.gameState.set({
            player: 0,
            turn:   0,
            board: Array.from({length: gs.board.height},
                                () => Array.from({length: gs.board.width}, () => -1)),
            captures: gs.rules.allowCaptures ? Array.from({length: pt.length}, () => 0) : []
        });
        this.playerTypes = [ ...pt ];
        this.gameOver.set(false);
        this.winner.set(-1);
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

    /* Playing */

    getBoard() {
        return computed(() => this.ensure2DArray(this.gameState()?.board));
    }

    getWinner() {
        return computed(() => this.winner());
    }

    getCaptures() {
        return computed(() => this.ensure1DArray(this.gameState()?.captures));
    }

    ensureNumber(n: number | null | undefined, backup: number): number {
        if (n === null || n === undefined) {
            return backup;
        }
        return n;
    }

    ensure1DArray(a: Array<number> | null | undefined): Array<number> {
        if (a === null || a === undefined) {
            return [];
        }
        return a;
    }

    ensure2DArray(a: Array<Array<number>> | null | undefined): Array<Array<number>> {
        if (a === null || a === undefined) {
            return [];
        }
        return Array.from(a, (subA) => this.ensure1DArray(subA));
    }

    ensureGameState(gs: GameState | null): GameState {
        if (gs === null) {
            return {
                player: 0,
                turn:   0,
                board: [],
                captures: []
            };
        }
        return {
            player: this.ensureNumber(gs.player, 0),
            turn:   this.ensureNumber(gs.turn, 0),
            board:  this.ensure2DArray(gs.board),
            captures: this.ensure1DArray(gs.captures)
        };
    }

    getPlayer() {
        return computed(() => this.ensureNumber(this.gameState()?.player, 0));
    }

    isLocalPlayer(player: number): boolean {
        return this.seats.indexOf(player) > -1;
    }

    isLegalMove(r: number, c: number): boolean {
        if (this.gameOver()) {
            return false;
        } else if (this.gameState()?.board[r][c] != -1) {
            return false;
        } else if (this.gameSpec?.board.gravity &&
                        (r != this.gameSpec?.board.height - 1 && this.gameState()?.board[r + 1][c] == -1)) {
            return false;
        }
        return true;
    }

    makeMove(r: number, c: number): void {
        if (this.gameState() === undefined) {
            return;
        }
        let newGameState: GameState = this.ensureGameState(this.gameState());
        newGameState.board[r][c] = newGameState.player;
        this.performCaptures(r, c, newGameState); /* Modifies newGameState */
        let winningPlayer = this.checkForVictor(r, c, newGameState);
        if (winningPlayer != -1) {
            this.gameOver.set(true);
            this.winner.set(winningPlayer);
        }

        newGameState.player = (newGameState.player + 1) % this.playerTypes.length;
        newGameState.turn++;
        this.gameState.set(newGameState);
    }

    /* Modifies gState */
    performCaptures(r: number, c: number, gState: GameState): void {
        if (this.gameSpec === null) {
            return;
        } else if (this.gameSpec.rules.allowCaptures == false) {
            return;
        }
        let player = gState.board[r][c];
        let capSize = this.gameSpec.rules.captureSize;

        console.log("Checking for captures");

        for (let i = -1; i < 2; i++) {
            for (let j = -1; j < 2; j++) {
                let rAlt = r + (capSize + 1) * i;
                let cAlt = c + (capSize + 1) * j;
                if (rAlt < 0 || rAlt >= this.gameSpec.board.height) {
                    continue;
                }
                if (cAlt < 0 || cAlt >= this.gameSpec.board.width) {
                    continue;
                }
                if (gState.board[rAlt][cAlt] != player) {
                    continue;
                }
                let isCapture = true;
                for (let k = 1; k <= capSize; k++) {
                    rAlt = r + k * i;
                    cAlt = c + k * j;
                    if (gState.board[rAlt][cAlt] == player || gState.board[rAlt][cAlt] == -1) {
                        isCapture = false;
                        break;
                    }
                }
                if (!isCapture) {
                    continue;
                }
                gState.captures[player]++;
                for (let k = 1; k <= capSize; k++) {
                    rAlt = r + k * i;
                    cAlt = c + k * j;
                    gState.board[rAlt][cAlt] = -1;
                }
            }
        }
    }

    checkForVictor(r: number, c: number, gState: GameState): number {
        if (this.gameSpec === null) {
            return -1;
        }
        let player = gState.board[r][c];

        if (this.gameSpec.rules.winByCaptures) {
            if (gState.captures[player] >= this.gameSpec.rules.winningNumCaptures) {
                return player;
            }
        }

        for (let q = 0; q < 4; q++) {
            /* q is line type:
                0: |
                1: /
                2: --
                3: \
            */
            let i = 0;
            if (q > 0) {
                i = 1;
            }
            let j = q - 2;
            if (q == 0) {
                j = 1;
            }

            let count = 1;
            for (let dir = -1; dir < 2; dir += 2) {
                let k = 1;
                let rAlt = r + k * i * dir;
                let cAlt = c + k * j * dir;
                while (rAlt >= 0 && rAlt < this.gameSpec.board.height &&
                       cAlt >= 0 && cAlt < this.gameSpec.board.width) {
                    if (gState.board[rAlt][cAlt] == player) {
                        count++;
                    } else {
                        break;
                    }
                    k++;
                    rAlt = r + k * i * dir;
                    cAlt = c + k * j * dir;
                }
            }
            if (count >= this.gameSpec.rules.winningLength) {
                return player;
            }
        }

        return -1;
    }
}
