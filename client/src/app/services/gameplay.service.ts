import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';

import { GameLink } from '@local-types/game-link.type';
import { GameSpec, copyGameSpec } from '@local-types/game-spec.type';
import { GameState, copyGameState } from '@local-types/game-state.type';
import { Move } from '@local-types/move.type';
import { PlayerType } from '@local-types/player-type.type';

import * as CryptoJS from 'crypto-js';

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

        if (this.playerTypes[startingSeat] == PlayerType.AI) {
            this.makeMove(this.primitiveAIChoice());
        }
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
        if (this.gameState() === undefined) {
            return;
        }
        let newGS: GameState = copyGameState(this.ensureGameState(this.gameState()));
        this.simulateMove(m, newGS);
        this.gameState.set(newGS);
        let winningPlayer = this.checkForVictor(m, newGS);
        if (winningPlayer != -1) {
            this.gameOver.set(true);
            this.winner.set(winningPlayer);
            return;
        }

        if (this.playerTypes[this.ensureNumber(this.gameState()?.player, -1)] == PlayerType.AI && !this.boardFull()) {
            this.makeMove(this.primitiveAIChoice());
        }

        this.heuristicScores(this.ensureGameState(this.gameState()));
    }

    boardFull(): boolean {
        for (let r = 0; r < this.ensureNumber(this.gameSpec?.board.height, 0); r++) {
            for (let c = 0; c < this.ensureNumber(this.gameSpec?.board.width, 0); c++) {
                if (this.ensure2DArray(this.gameState()?.board)[r][c] == -1) {
                    return false;
                }
            }
        }
        return true;
    }

    /* Modifies gs */
    simulateMove(m: Move, gs: GameState): Array<Move> {
        gs.board[m.row][m.col] = gs.player;
        let ret = this.performCaptures(m, gs); /* Modifies gs */
        gs.player = (gs.player + 1) % this.playerTypes.length;
        gs.turn++;
        return ret;
    }

    /* Modifies gState */
    /* Returns a list of the cells where pieces were captured */
    performCaptures(m: Move, gState: GameState): Array<Move> {
        if (this.gameSpec === null) {
            return [];
        } else if (this.gameSpec.rules.allowCaptures == false) {
            return [];
        }
        let player = gState.board[m.row][m.col];
        let capSize = this.gameSpec.rules.captureSize;
        let captured: Array<Move> = [];

        for (let i = -1; i < 2; i++) {
            for (let j = -1; j < 2; j++) {
                let rAlt = m.row + (capSize + 1) * i;
                let cAlt = m.col + (capSize + 1) * j;
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

    checkForVictor(m: Move, gState: GameState): number {
        if (this.gameSpec === null) {
            return -1;
        }
        let player = gState.board[m.row][m.col];

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
                let rAlt = m.row + k * i * dir;
                let cAlt = m.col + k * j * dir;
                while (rAlt >= 0 && rAlt < this.gameSpec.board.height &&
                       cAlt >= 0 && cAlt < this.gameSpec.board.width) {
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
            if (count >= this.gameSpec.rules.winningLength) {
                return player;
            }
        }

        return -1;
    }

    /*********** AI Utility Functions ***********/

    inBounds(m: Move): boolean {
        return m.row >= 0 && m.col >= 0 && m.row < this.ensureNumber(this.gameSpec?.board.height, 0)
                                        && m.col < this.ensureNumber(this.gameSpec?.board.width, 0);
    }

    unOccupied(m: Move, gs: GameState): boolean {
        return gs.board[m.row][m.col] == -1;
    }

    /* These functions enable use of the default Set class for moves */
    moveToInt(m: Move): number {
        let w = this.ensureNumber(this.gameSpec?.board.width, 0);
        return m.row * w + m.col;
    }

    intToMove(i: number): Move {
        let w = this.ensureNumber(this.gameSpec?.board.width, 0);
        return {
            row: Math.floor(i / w),
            col: i % w
        };
    }

    /* Set Operations */
    union(a: Set<number>, b: Set<number>): Set<number> {
        return new Set<number>([...a, ...b]);
    }

    subtraction(a: Set<number>, b: Set<number>): Set<number> {
        return new Set<number>([...a].filter(x => !b.has(x)));
    }

    intersection(a: Set<number>, b: Set<number>): Set<number> {
        return new Set<number>([...a].filter(x => b.has(x)));
    }

    /* Defining the AI search space */
    
    initialAvailableMoves(): Set<number> {
        if (this.gameSpec === null) {
            return new Set<number>();
        }
        let w = this.gameSpec.board.width;
        let h = this.gameSpec.board.height;
        if (this.gameSpec.board.gravity) {
            /* Return the bottom row */
            return new Set<number>(Array.from({ length: w }, (v, i) => this.moveToInt({row: h - 1, col: i})));
        }

        /* Return four central squares */
        let s = new Set<number>();
        for (let r = Math.floor(h / 2) - 1; r < Math.floor(h / 2) + 1; r++) {
            for (let c = Math.floor(w / 2) - 1; c < Math.floor(w / 2) + 1; c++) {
                s.add(this.moveToInt({row: r, col: c}));
            }
        }
        return s;
    }

    /* m should be the latest move */
    surroundingMoves(m: Move, gs: GameState): Set<number> {
        if (this.gameSpec?.board.gravity) {
            /* The cell immediately above m */
            let above = {row: m.row - 1, col: m.col};
            if (this.inBounds(above) && this.unOccupied(above, gs)) {
                return new Set<number>([this.moveToInt(above)]);
            }
            return new Set<number>();
        }

        let radius = 1;
        /* Add all cells within radius spaces of m */
        let s = new Set<number>();
        for (let r = m.row - radius; r <= m.row + radius; r++) {
            for (let c = m.col - radius; c <= m.col + radius; c++) {
                let m2 = {row: r, col: c};
                if (this.inBounds(m2) && this.unOccupied(m2, gs)) {
                    s.add(this.moveToInt(m2));
                }
            }
        }

        return s;
    }

    hashGameState(gs: GameState): string {
        return CryptoJS.MD5(JSON.stringify(gs)).toString();
    }

    /* AI Decision-Making */

    /* Higher is better -- assumes there is no winner */
    heuristicScores(gs: GameState): Array<number> {
        /* Captures */
        let captureScores = this.normalizedHeuristicNumbers(gs.captures);

        /* Sub-lines */
        let rawLineScores: Array<number> = Array.from({length: this.playerTypes.length}, () => 0);
        let lineSize: number = this.ensureNumber(this.gameSpec?.rules.winningLength, 0);
        let checkSize: number = Math.max(lineSize - 2, 2);
        let w = this.ensureNumber(this.gameSpec?.board.width, 0);
        let h = this.ensureNumber(this.gameSpec?.board.height, 0);
        for (let r = 0; r < h; r++) {
            for (let c = 0; c < w; c++) {
                let rInc = [0,  1, 1, 1];
                let cInc = [1, -1, 0, 1];
                for (let dir = 0; dir < 4; dir++) {
                    if (!this.inBounds({row: r + lineSize * rInc[dir], col: c + lineSize * cInc[dir]})) {
                        continue;
                    }
                    let firstPlayer = -1;
                    let count = 0;
                    for (let step = 0; step < lineSize; step++) {
                        let p = gs.board[r + step * rInc[dir]][c + step * cInc[dir]];
                        if (p != -1) {
                            if (firstPlayer == -1) {
                                firstPlayer = p;
                                count = 1;
                            } else if (firstPlayer == p) {
                                count++;
                            } else {
                                count = 0;
                                break;
                            }
                        }
                    }
                    if (count > 0) {
                        rawLineScores[firstPlayer] += count * count;
                    }
                }
            }
        }
        let lineScores = this.normalizedHeuristicNumbers(rawLineScores);
        return Array.from(captureScores, (v, i) => v + lineScores[i]);
    }

    normalizedHeuristicNumbers(a: Array<number>): Array<number> {
        let sum = 0;
        for (let v of a) {
            sum += v;
        }
        if (sum == 0) {
            return Array.from(a, () => 0);
        }
        let result = Array.from(a, () => 0);
        for (let i = 0; i < a.length; i++) {
            let total = 0;
            let max = 0;
            for (let j = 0; j < a.length; j++) {
                if (i == j) {
                    continue;
                }
                total += a[j] / sum;
                max = Math.max(max, a[j] / sum);
            }
            result[i] = 2 * a[i] - ((total / (a.length - 1)) + max);
        }
        return result;
    }

    primitiveAIChoice(): Move {
        let chosenDepth = Math.max(this.playerTypes.length + 1, 4);
        if (this.ensureNumber(this.gameSpec?.board.width, 0) < 5) {
            chosenDepth += 2;
        }
        if (this.gameSpec?.board.gravity) {
            chosenDepth += 2;
        }

        let choice = this.primitiveAIChoiceHelper(chosenDepth);
        return choice;
    }

    primitiveAIChoiceHelper(depth: number): Move {
        let fullCycle = this.playerTypes.length;
        let pruneAhead = fullCycle;
        if (pruneAhead == 2) {
            pruneAhead = 4;
        }

        let initialNode: SearchTreeNode = {
            hash: this.hashGameState(this.ensureGameState(this.gameState())),
            definiteWinner: null,
            heuristicScores: [],
            state: this.ensureGameState(this.gameState()),
            parents: [],
            children: [],
            movesToChildren: [],
            moves: new Set<number>(),
        };

        if (initialNode.state.turn == 0) {
            initialNode.moves = this.initialAvailableMoves();
        } else {
            let s: Set<number> = new Set<number>();
            if (this.gameSpec?.board.gravity) {
                for (let c = 0; c < this.ensureNumber(this.gameSpec?.board.width, 0); c++) {
                    let r = this.ensureNumber(this.gameSpec?.board.height - 1, 0);
                    while (r >= 0) {
                        if (this.gameState()?.board[r][c] == -1) {
                            s.add(this.moveToInt({row: r, col: c}));
                            break;
                        }
                        r--;
                    }
                }
            } else {
                for (let r = 0; r < this.ensureNumber(this.gameSpec?.board.height, 0); r++) {
                    for (let c = 0; c < this.ensureNumber(this.gameSpec?.board.width, 0); c++) {
                        if (initialNode.state.board[r][c] != -1) {
                            s = this.union(s, this.surroundingMoves({row: r, col: c}, initialNode.state));
                        }
                    }
                }
            }
            initialNode.moves = s;
        }

        let ss: SearchSpace = {
            layers: [[initialNode]],
            hashToCanonical: {},
        };
        ss.hashToCanonical[initialNode.hash] = initialNode;

        /* Alternate between growing and pruning */
        for (let d = 0; d < depth; d++) {
            this.grow(ss);
            this.prune(ss, pruneAhead);
        }

        return this.backwardInduction(ss);
    }

    grow(ss: SearchSpace): void {
        let oldLayer: Array<SearchTreeNode> = ss.layers[ss.layers.length - 1];
        ss.layers.push([]);
        let newLayer: Array<SearchTreeNode> = ss.layers[ss.layers.length - 1];
        for (let i = 0; i < oldLayer.length; i++) {
            let node: SearchTreeNode = oldLayer[i];
            if (node.definiteWinner !== null) {
                /* This sub-search is completed */
                continue;
            }
            let player: number = node.state.player;
            for (let m of node.moves) {
                let newGS: GameState = copyGameState(node.state);
                let capturedCellsArr: Array<Move> = this.simulateMove(this.intToMove(m), newGS);

                let hash: string = this.hashGameState(newGS);
                if (hash in ss.hashToCanonical) {
                    /* We already found a way to get to this game state */
                    let newNode: SearchTreeNode = ss.hashToCanonical[hash];
                    newNode.parents.push(node);
                    node.children.push(newNode);
                    node.movesToChildren.push(this.intToMove(m));
                    continue;
                }

                let capturedCells: Set<number> =
                    new Set(Array.from(capturedCellsArr, (x) => this.moveToInt(x)));
                let enabledCells: Set<number> = this.surroundingMoves(this.intToMove(m), newGS);
                let newMoves = new Set<number>(node.moves);
                newMoves.delete(m);

                let winner = this.checkForVictor(this.intToMove(m), newGS);

                let newNode: SearchTreeNode = {
                    hash: hash,
                    definiteWinner: winner == -1 ? null : winner,
                    heuristicScores: this.heuristicScores(newGS),
                    state: newGS,
                    parents: [node],
                    children: [],
                    movesToChildren: [],
                    moves: this.union(newMoves, this.union(capturedCells, enabledCells)),
                };

                newLayer.push(newNode);
                ss.hashToCanonical[hash] = newNode;
                node.children.push(newNode);
                node.movesToChildren.push(this.intToMove(m));
            }
        }
    }

    prune(ss: SearchSpace, pruneAhead: number): void {

    }

    backwardInduction(ss: SearchSpace): Move {
        let layerIdx = ss.layers.length - 2;
        var chosenMove: Move | null = null;
        while (layerIdx >= 0) {
            let layer = ss.layers[layerIdx];
            for (let i = 0; i < layer.length; i++) {
                let node = layer[i];
                if (node.children.length == 0) {
                    continue;
                }

                let player = node.state.player;
                let bestIdxs = [0];
                let bestWin: number | null  = node.children[0].definiteWinner;
                let bestHeuristic: number   = node.children[0].heuristicScores[player];
                for (let j = 1; j < node.children.length; j++) {
                    let child = node.children[j];
                    if (bestWin === null) {
                        if (child.definiteWinner === null) {
                            if (child.heuristicScores[player] > bestHeuristic) {
                                bestHeuristic = child.heuristicScores[player];
                                bestIdxs = [j];
                            } else if (child.heuristicScores[player] == bestHeuristic) {
                                bestIdxs.push(j);
                            }
                        } else if (child.definiteWinner == player) {
                            bestHeuristic = child.heuristicScores[player];
                            bestWin = player;
                            bestIdxs = [j];
                        }
                    } else if (bestWin == player) {
                        if (child.definiteWinner !== null && child.definiteWinner == player) {
                            bestIdxs.push(j);
                        }
                    } else { /* bestWin == someone else */
                        if (child.definiteWinner === null) {
                            bestWin = null;
                            bestHeuristic = child.heuristicScores[player];
                            bestIdxs = [j];
                        } else if (child.definiteWinner == player) {
                            bestWin = player;
                            bestHeuristic = child.heuristicScores[player];
                            bestIdxs = [j];
                        } else {
                            bestIdxs.push(j);
                        }
                    }
                }
                let chosenIdx = bestIdxs[Math.floor(Math.random() * bestIdxs.length)];
                node.definiteWinner  = node.children[chosenIdx].definiteWinner;
                node.heuristicScores = node.children[chosenIdx].heuristicScores;
                chosenMove = node.movesToChildren[chosenIdx];
            }
            layerIdx--;
        }
        if (chosenMove === null) {
            throw Error("AI asked to find move on full board");
        }
        return chosenMove;
    }
}

type SearchTreeNode = {
    hash: string,
    definiteWinner: number | null,
    heuristicScores: Array<number>,
    state: GameState,
    parents: Array<SearchTreeNode>,
    children: Array<SearchTreeNode>,
    movesToChildren: Array<Move>,
    moves: Set<number>,
};

type SearchSpace = {
    layers: Array<Array<SearchTreeNode>>,
    hashToCanonical: { [key: string]: SearchTreeNode },
};
