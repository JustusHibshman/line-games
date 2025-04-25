import { computed, inject, Injectable, signal, Signal, WritableSignal } from '@angular/core';

import { GameLink } from '@local-types/game-link.type';
import { GameSpec, copyGameSpec } from '@local-types/game-spec.type';
import { GameState, copyGameState } from '@local-types/game-state.type';
import { Move } from '@local-types/move.type';
import { PlayerType } from '@local-types/player-type.type';

import { GameStateService } from '@local-services/game-state.service';
import { ClientAIService } from '@local-services/client-a-i.service';

@Injectable({
  providedIn: 'root'
})
export class GameplayService {

    gsService = inject(GameStateService);
    clientAIService = inject(ClientAIService);

    gameLink: WritableSignal<GameLink>;
    gameSpec: GameSpec | null;
    gameState = signal<GameState | null>(null);
    playerTypes: Array<PlayerType>;
    seats: Array<number> = [];
    gameOver = signal<boolean>(false);
    winner   = signal<number>(-1);
    AITimer: number = 0;

    /* Initializing */

    constructor() {
        this.gameLink = signal<GameLink>(this.emptyGameLink());
        this.gameSpec = null;
        this.gameState.set(null);
        this.playerTypes = [];
    }

    getGameLink() {
        return computed(() => this.gameLink());
    }

    getPlayerTypes(): Array<PlayerType> {
        return [ ...this.playerTypes ];
    }

    setGameLink(gl: GameLink): void {
        this.gameLink.set({ ...gl });
    }

    setGame(gs: GameSpec, pt: Array<PlayerType>, startingSeat: number): void {
        this.gameSpec = copyGameSpec(gs);
        this.gameState.set({
            player: startingSeat,
            turn:   0,
            board: Array.from({length: gs.board.height},
                                () => Array.from({length: gs.board.width}, () => -1)),
            captures: gs.rules.allowCaptures ? Array.from({length: pt.length}, () => 0) : []
        });
        this.playerTypes = [ ...pt ];
        this.gameOver.set(false);
        this.winner.set(-1);

        this.takeAIMovesIfNeeded();
    }

    quitGame(): void {
        this.gameLink.set(this.emptyGameLink());
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
        return computed(() => this.gameState()?.board);
    }

    getWinner() {
        return computed(() => this.winner());
    }

    getCaptures() {
        return computed(() => this.gameState()?.captures);
    }

    zeroIfUndefined(n: number | undefined): number {
        if (n === undefined) {
            return 0;
        }
        return n;
    }

    getPlayer(): Signal<number> {
        return computed(() => this.zeroIfUndefined(this.gameState()?.player));
    }

    isLocalPlayer(player: number | undefined): boolean {
        if (player === undefined) {
            return false;
        }
        return this.seats.indexOf(player) > -1;
    }

    isLegalMove(m: Move): boolean {
        if (this.gameOver()) {
            return false;
        } else if (this.gameState()?.board[m.row][m.col] != -1) {
            return false;
        } else if (this.gameSpec?.board.gravity &&
                   m.row != this.gameSpec?.board.height - 1 &&
                   this.gameState()?.board[m.row + 1][m.col] == -1) {
            return false;
        }
        return true;
    }

    makeMove(m: Move): void {
        let gState: GameState | null = this.gameState();
        if (gState === null) {
            return;
        }
        if (this.gameSpec === null) {
            return;
        }
        let newGS: GameState = copyGameState(gState);
        this.gsService.makeMove(m, newGS, this.gameSpec, this.playerTypes.length);
        this.gameState.set(newGS);
        let winningPlayer = this.gsService.checkForVictor(m, newGS, this.gameSpec);
        if (winningPlayer != -1 || this.gsService.boardFull(newGS, this.gameSpec)) {
            this.gameOver.set(true);
            this.winner.set(winningPlayer);
        }

        this.takeAIMovesIfNeeded();
    }

    takeAIMovesIfNeeded(): void {
        if (this.gameOver()) {
            return;
        }
        let gState: GameState | null = this.gameState();
        if (gState === null) {
            return;
        }
        if (this.gameSpec === null) {
            return;
        }
        if (this.playerTypes[gState.player] != PlayerType.AI) {
            return;
        }
        setTimeout(this.takeAIMovesHelper, 500, gState, this.gameSpec, this);
    }

    takeAIMovesHelper(gState: GameState, gSpec: GameSpec, obj: GameplayService): void {
        let choice: Move =
            obj.clientAIService.primitiveAIChoice(gState, gSpec, obj.playerTypes.length);
        obj.makeMove(choice);
    }
}
