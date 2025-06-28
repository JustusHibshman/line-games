import { computed, inject, Injectable,
         signal, Signal, WritableSignal } from '@angular/core';

import { Game } from '@local-types/game';
import { GameSpec } from '@local-types/game-spec.type';
import { Move } from '@local-types/move.type';
import { PlayerType } from '@local-types/player-type.type';

import { BackendService } from '@local-services/backend.service';
import { ClientAIService } from '@local-services/client-a-i.service';

@Injectable({
  providedIn: 'root'
})
export class GameplayService {

    backendService = inject(BackendService);
    clientAIService = inject(ClientAIService);

    game: WritableSignal<Game>;
    lastVerifiedServerTurn: number;
    performingServerUpdate: boolean;

    // Initializing
    constructor() {
        this.game = signal<Game>(new Game());
        this.lastVerifiedServerTurn = -1;
        this.performingServerUpdate = false;
        try {
            this.loadData();
        }
        catch(e) {
            // Overwrite bad values with whatever is present
            this.saveData();
        }
        // Check every second to see if we need to make an AI move.
        setInterval(((x) => (() => GameplayService.aiMoveChecker(x)))(this), 1000);
        // Check every second to coordinate the move history.
        setInterval(((x) => (() => GameplayService.serverUpdates(x)))(this), 1000);
    }
    static readonly dataPrefix: string = "GAMEPLAY_SERVICE.";
    saveData(): void {
        localStorage.setItem(GameplayService.dataPrefix + 'lVSTurn', JSON.stringify(this.lastVerifiedServerTurn));
        localStorage.setItem(GameplayService.dataPrefix + 'game', JSON.stringify(this.game()));
    }
    loadData(): void {
        this.lastVerifiedServerTurn = JSON.parse(localStorage[GameplayService.dataPrefix + 'lVSTurn']);
        // The use of new Game() is necessary to restore the presence of methods
        //  like .winner()
        this.game.set(new Game(JSON.parse(localStorage[GameplayService.dataPrefix + 'game'])));
    }

    getGravity(): boolean {
        let g: Game | null = this.game();
        if (g === null) {
            return false;
        }
        return g.spec.board.gravity;
    }

    static aiMoveChecker(obj: GameplayService): void {
        let g: Game | null = obj.game();
        if (g === null) {
            return
        }
        let p: number = g.player();
        let pt: Array<PlayerType> = obj.backendService.getSeats();
        if (pt.length <= p) {
            return
        }
        if (pt[p] != PlayerType.AI) {
            return
        }
        let choice: Move =
            obj.clientAIService.primitiveAIChoice(obj.game());
        obj.makeMove(choice);
    }

    static async serverUpdates(obj: GameplayService) {
        if (obj.performingServerUpdate) {
            return
        }
        obj.performingServerUpdate = true;
        if (!obj.backendService.inGame()) {
            obj.performingServerUpdate = false;
            return
        }
        let g: Game | null = obj.game();
        if (g === null) {
            obj.performingServerUpdate = false;
            return
        }
        let nextToVerify: number = obj.lastVerifiedServerTurn + 1;
        if (g.turn() > nextToVerify) {
            // This turn was local and has been completed. Try pushing.
            let m: Move = g.pastMove(nextToVerify);
            await obj.backendService.submitMove(nextToVerify, m);
            let recorded: Move | null = await obj.backendService.requestMove(nextToVerify);
            if (recorded === null) {
                obj.performingServerUpdate = false;
                return;
            }
            obj.lastVerifiedServerTurn += 1;
        } else {
            // The local moves have all been recorded in the server. Try pulling.
            let recorded: Move | null = await obj.backendService.requestMove(nextToVerify);
            if (recorded === null) {
                obj.performingServerUpdate = false;
                return;
            }
            // We found a move. Apply it locally.
            obj.makeMove(recorded);
            obj.lastVerifiedServerTurn += 1;
        }
        obj.performingServerUpdate = false;
    }

    // Returns true iff game initialized successfully
    loadInitialGameDetails(): boolean {
        var playerTypes: Array<PlayerType> = this.backendService.getSeats();
        var spec: GameSpec | null = this.backendService.getSpec();

        if (spec === null || playerTypes.length == 0) {
            return false;
        }

        this.lastVerifiedServerTurn = -1;
        this.game.set(new Game(spec, playerTypes.length));
        this.saveData();
        return true;
    }

    quitGame(): void {
        this.game.set(new Game());
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

    isLocalHuman(player: number | undefined): boolean {
        if (player === undefined || !this.backendService.inGame()) {
            return false;
        }
        let pt: Array<PlayerType> = this.backendService.getSeats();
        return pt.length > player && pt[player] == PlayerType.Human;
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
    }
}
