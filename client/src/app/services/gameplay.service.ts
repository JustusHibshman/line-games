import { computed, inject, Injectable,
         signal, Signal, WritableSignal } from '@angular/core';

import { Game } from '@local-types/game';
import { GameLink } from '@local-types/game-link.type';
import { GameSpec, copyGameSpec } from '@local-types/game-spec.type';
import { Move } from '@local-types/move.type';
import { PlayerType } from '@local-types/player-type.type';

import { ClientAIService } from '@local-services/client-a-i.service';

@Injectable({
  providedIn: 'root'
})
export class GameplayService {

    clientAIService = inject(ClientAIService);

    gameLink: WritableSignal<GameLink>;
    game: WritableSignal<Game>;
    playerTypes: Array<PlayerType>;
    seats: Array<number> = [];

    // Initializing

    constructor() {
        this.gameLink = signal<GameLink>(this.emptyGameLink());
        this.playerTypes = [];
        this.game = signal<Game>(new Game());
        try {
            this.loadData();
        }
        catch(e) {
            // Overwrite bad values with whatever is present
            this.saveData();
        }
    }

    DataPrefix: string = "GP_SERVICE.";

    saveData(): void {
        localStorage.setItem(this.DataPrefix + 'gameLink',    JSON.stringify(this.gameLink()));
        localStorage.setItem(this.DataPrefix + 'game',   JSON.stringify(this.game()));
        localStorage.setItem(this.DataPrefix + 'playerTypes', JSON.stringify(this.playerTypes));
        localStorage.setItem(this.DataPrefix + 'seats',  JSON.stringify(this.seats));
    }

    loadData(): void {
        this.gameLink.set( JSON.parse(localStorage[this.DataPrefix + 'gameLink']));
        // The use of new Game() is necessary to restore the presence of methods
        //  like .winner()
        this.game.set(new Game(JSON.parse(localStorage[this.DataPrefix + 'game'])));
        this.playerTypes = JSON.parse(localStorage[this.DataPrefix + 'playerTypes']);
        this.seats =       JSON.parse(localStorage[this.DataPrefix + 'seats']);
    }

    getGameLink() {
        return computed(() => this.gameLink());
    }

    getPlayerTypes(): Array<PlayerType> {
        return [ ...this.playerTypes ];
    }

    getGravity(): boolean {
        let g: Game | null = this.game();
        if (g === null) {
            return false;
        }
        return g.spec.board.gravity;
    }

    setGameLink(gl: GameLink): void {
        this.gameLink.set({ ...gl });
        this.saveData();
    }

    setGame(gs: GameSpec, pt: Array<PlayerType>, startingSeat: number): void {
        this.game.set(new Game(copyGameSpec(gs), pt.length, startingSeat));
        this.playerTypes = [ ...pt ];

        this.saveData();

        this.takeAIMovesIfNeeded();
    }

    quitGame(): void {
        this.gameLink.set(this.emptyGameLink());
        this.game.set(new Game());
        this.playerTypes = [];
        this.saveData();
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
        this.saveData();
    }

    /* Playing */

    getBoard() {
        return computed(() => this.game().board());
    }

    getWinner() {
        return computed(() => this.game().winner());
    }

    getCaptures() {
        return computed(() => this.game().captures());
    }

    getPlayer(): Signal<number> {
        return computed(() => this.game().player());
    }

    isLocalPlayer(player: number | undefined): boolean {
        if (player === undefined) {
            return false;
        }
        return this.seats.indexOf(player) > -1;
    }

    isLegalMove(m: Move): boolean {
        let g: Game | null = this.game();
        if (g === null) {
            return false;
        }
        return g.isLegal(m);
    }

    makeMove(m: Move): void {
        let g: Game | null = this.game();
        if (g === null) {
            return;
        }
        g.makeMove(m);
        this.game.set(g.copy());  // Ensures downstream signals are updated

        this.saveData();

        this.takeAIMovesIfNeeded();
    }

    takeAIMovesIfNeeded(): void {
        let g: Game | null = this.game();
        if (g === null) {
            return;
        }
        if (g.gameOver()) {
            return;
        }
        if (this.playerTypes[g.player()] != PlayerType.AI) {
            return;
        }

        setTimeout(this.takeAIMovesHelper, 500, g, this);
    }

    takeAIMovesHelper(g: Game, obj: GameplayService): void {
        let choice: Move =
            obj.clientAIService.primitiveAIChoice(g);
        obj.makeMove(choice);
    }
}
