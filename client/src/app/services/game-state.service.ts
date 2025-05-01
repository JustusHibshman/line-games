import { Injectable } from '@angular/core';

import { GameSpec } from '@local-types/game-spec.type';
import { GameState } from '@local-types/game-state.type';
import { Move } from '@local-types/move.type';

@Injectable({
  providedIn: 'root'
})
export class GameStateService {

    constructor() { }

    inBounds(m: Move, gSpec: GameSpec): boolean {
        return m.row >= 0 && m.col >= 0 && m.row < gSpec.board.height
                                        && m.col < gSpec.board.width;
    }

    unOccupied(m: Move, gState: GameState): boolean {
        return gState.board[m.row][m.col] == -1;
    }

    isLegal(m: Move, gSpec: GameSpec, gState: GameState): boolean {
        if (gSpec.board.gravity) {
            let below: Move = {row: m.row + 1, col: m.col};
            if (!this.inBounds(below, gSpec) || this.unOccupied(below, gState)) {
                return false;
            }
        }
        return this.inBounds(m, gSpec) && this.unOccupied(m, gState);
    }

    boardFull(gState: GameState, gSpec: GameSpec): boolean {
        for (let r = 0; r < gSpec.board.height; r++) {
            for (let c = 0; c < gSpec.board.width; c++) {
                if (gState.board[r][c] == -1) {
                    return false;
                }
            }
        }
        return true;
    }

    /* Modifies gState */
    makeMove(m: Move, gState: GameState, gSpec: GameSpec, numPlayers: number): Array<Move> {
        gState.board[m.row][m.col] = gState.player;
        let ret = this.performCaptures(m, gState, gSpec); /* Modifies gState */
        gState.player = (gState.player + 1) % numPlayers;
        gState.turn++;
        return ret;
    }

    /* Modifies gState */
    /* Returns a list of the cells where pieces were captured */
    performCaptures(m: Move, gState: GameState, gSpec: GameSpec): Array<Move> {
        if (gSpec.rules.allowCaptures == false) {
            return [];
        }
        let player = gState.board[m.row][m.col];
        let capSize = gSpec.rules.captureSize;
        let captured: Array<Move> = [];

        for (let i = -1; i < 2; i++) {
            for (let j = -1; j < 2; j++) {
                let rAlt = m.row + (capSize + 1) * i;
                let cAlt = m.col + (capSize + 1) * j;
                if (rAlt < 0 || rAlt >= gSpec.board.height) {
                    continue;
                }
                if (cAlt < 0 || cAlt >= gSpec.board.width) {
                    continue;
                }
                if (gState.board[rAlt][cAlt] != player) {
                    continue;
                }
                let isCapture = true;
                for (let k = 1; k <= capSize; k++) {
                    rAlt = m.row + k * i;
                    cAlt = m.col + k * j;
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
                    rAlt = m.row + k * i;
                    cAlt = m.col + k * j;
                    gState.board[rAlt][cAlt] = -1;
                    captured.push({row: rAlt, col: cAlt});
                }
            }
        }
        return captured;
    }

    /* Returns the player ID if they won by making move m
     * Otherwise returns -1
     *
     * Assumes that gState is the state of the board AFTER move m has been made
     */
    checkForVictor(m: Move, gState: GameState, gSpec: GameSpec): number {
        let player = gState.board[m.row][m.col];

        if (gSpec.rules.winByCaptures) {
            if (gState.captures[player] >= gSpec.rules.winningNumCaptures) {
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
                let rAlt = m.row + k * i * dir;
                let cAlt = m.col + k * j * dir;
                while (rAlt >= 0 && rAlt < gSpec.board.height &&
                       cAlt >= 0 && cAlt < gSpec.board.width) {
                    if (gState.board[rAlt][cAlt] == player) {
                        count++;
                    } else {
                        break;
                    }
                    k++;
                    rAlt = m.row + k * i * dir;
                    cAlt = m.col + k * j * dir;
                }
            }
            if (count >= gSpec.rules.winningLength) {
                return player;
            }
        }

        return -1;
    }
}
