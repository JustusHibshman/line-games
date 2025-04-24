import { inject, Injectable } from '@angular/core';

import { GameSpec, copyGameSpec, emptyGameSpec } from '@local-types/game-spec.type';
import { GameState, copyGameState } from '@local-types/game-state.type';
import { Move } from '@local-types/move.type';
import { PlayerType } from '@local-types/player-type.type';

import { GameStateService } from '@local-services/game-state.service';

import * as CryptoJS from 'crypto-js';

@Injectable({
  providedIn: 'root'
})
export class ClientAIService {

    gsService = inject(GameStateService);
    gSpec: GameSpec = emptyGameSpec();
    numPlayers: number = 0;

    primitiveAIChoice(gState: GameState, gSpec: GameSpec, numPlayers: number): Move {
        this.setGame(gSpec, numPlayers);

        let chosenDepth = Math.max(this.numPlayers + 1, 4);
        if (this.gSpec.board.width < 5) {
            chosenDepth += 2;
        }
        if (this.gSpec.board.gravity) {
            chosenDepth += 2;
        }

        let choice = this.primitiveAIChoiceHelper(gState, chosenDepth);
        return choice;
    }

    setGame(gSpec: GameSpec, numPlayers: number): void {
        this.gSpec = copyGameSpec(gSpec);
        this.numPlayers = numPlayers;
    }

    constructor() { }

    // These functions enable use of the default Set class for moves
    moveToInt(m: Move): number {
        return m.row * this.gSpec.board.width + m.col;
    }

    intToMove(i: number): Move {
        let w = this.gSpec.board.width;
        return {
            row: Math.floor(i / w),
            col: i % w
        };
    }

    ////////////// Set Operations ///////////////

    union(a: Set<number>, b: Set<number>): Set<number> {
        return new Set<number>([...a, ...b]);
    }

    subtraction(a: Set<number>, b: Set<number>): Set<number> {
        return new Set<number>([...a].filter(x => !b.has(x)));
    }

    intersection(a: Set<number>, b: Set<number>): Set<number> {
        return new Set<number>([...a].filter(x => b.has(x)));
    }

    ////////////// AI Search Space ///////////////
    
    initialAvailableMoves(): Set<number> {
        let w = this.gSpec.board.width;
        let h = this.gSpec.board.height;
        if (this.gSpec.board.gravity) {
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

    // m should be the latest move
    surroundingMoves(m: Move, gState: GameState): Set<number> {
        if (this.gSpec.board.gravity) {
            // The cell immediately above m
            let above = {row: m.row - 1, col: m.col};
            if (this.gsService.inBounds(above, this.gSpec) && this.gsService.unOccupied(above, gState)) {
                return new Set<number>([this.moveToInt(above)]);
            }
            return new Set<number>();
        }

        let radius = 1;
        // Add all cells within radius spaces of m
        let s = new Set<number>();
        for (let r = m.row - radius; r <= m.row + radius; r++) {
            for (let c = m.col - radius; c <= m.col + radius; c++) {
                let m2 = {row: r, col: c};
                if (this.gsService.inBounds(m2, this.gSpec) && this.gsService.unOccupied(m2, gState)) {
                    s.add(this.moveToInt(m2));
                }
            }
        }

        return s;
    }

    hashGameState(gState: GameState): string {
        return CryptoJS.MD5(JSON.stringify(gState)).toString();
    }

    ////////////// AI Decision-Making ///////////////

    // Higher is better -- assumes there is no winner
    heuristicScores(gState: GameState): Array<number> {
        /* Captures */
        var captureScores: Array<number>;
        if (this.gSpec.rules.allowCaptures) {
            captureScores = this.normalizedHeuristicNumbers(gState.captures);
        } else {
            captureScores = Array.from({length: this.numPlayers}, () => 0);
        }

        // Sub-lines
        let rawLineScores: Array<number> = Array.from({length: this.numPlayers}, () => 0);
        let lineSize: number = this.gSpec.rules.winningLength;
        let checkSize: number = Math.max(lineSize - 2, 2);
        let w = this.gSpec.board.width;
        let h = this.gSpec.board.height;
        for (let r = 0; r < h; r++) {
            for (let c = 0; c < w; c++) {
                let rInc = [0,  1, 1, 1];
                let cInc = [1, -1, 0, 1];
                for (let dir = 0; dir < 4; dir++) {
                    if (!this.gsService.inBounds({row: r + lineSize * rInc[dir],
                                                  col: c + lineSize * cInc[dir]}, this.gSpec)) {
                        continue;
                    }
                    let firstPlayer = -1;
                    let count = 0;
                    for (let step = 0; step < lineSize; step++) {
                        let p = gState.board[r + step * rInc[dir]][c + step * cInc[dir]];
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
                        rawLineScores[firstPlayer] += count * count * count * count * count;
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
        let selfWeight = 0.2;
        for (let i = 0; i < a.length; i++) {
            let total = 0;
            let max = 0;
            let weightedSum = (sum - (1 - selfWeight) * a[i]);
            for (let j = 0; j < a.length; j++) {
                if (i == j) {
                    continue;
                }
                total += a[j] / weightedSum;
                max = Math.max(max, a[j] / weightedSum);
            }
            result[i] = (2 * selfWeight * a[i]) - ((total / (a.length - 1)) + max);
        }
        return result;
    }

    primitiveAIChoiceHelper(gState: GameState, depth: number): Move {
        let initialNode: SearchTreeNode = {
            hash: this.hashGameState(gState),
            definiteWinner: null,
            heuristicScores: [],
            state: gState,
            parents: [],
            children: [],
            movesToChildren: [],
            moves: new Set<number>(),
        };

        if (initialNode.state.turn == 0) {
            initialNode.moves = this.initialAvailableMoves();
        } else {
            let s: Set<number> = new Set<number>();
            if (this.gSpec.board.gravity) {
                for (let c = 0; c < this.gSpec.board.width; c++) {
                    let r = this.gSpec.board.height - 1;
                    while (r >= 0) {
                        if (gState.board[r][c] == -1) {
                            s.add(this.moveToInt({row: r, col: c}));
                            break;
                        }
                        r--;
                    }
                }
            } else {
                for (let r = 0; r < this.gSpec.board.height; r++) {
                    for (let c = 0; c < this.gSpec.board.width; c++) {
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

        // Alternate between growing and pruning
        for (let d = 0; d < depth; d++) {
            this.grow(ss);
            this.prune(ss);
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
                // This sub-search is completed
                continue;
            }
            let player: number = node.state.player;
            for (let m of node.moves) {
                let newGS: GameState = copyGameState(node.state);
                let capturedCellsArr: Array<Move> =
                        this.gsService.makeMove(this.intToMove(m), newGS, this.gSpec, this.numPlayers);

                let hash: string = this.hashGameState(newGS);
                if (hash in ss.hashToCanonical) {
                    // We already found a way to get to this game state
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

                let winner = this.gsService.checkForVictor(this.intToMove(m), newGS, this.gSpec);

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

    prune(ss: SearchSpace): void {
        let currentDepth = ss.layers.length;
        if (currentDepth < 3) {
            return;
        }
        if (this.numPlayers == 2 && currentDepth < 4) {
            return;
        }

        let toKeepDenominator = 3 + Math.floor((currentDepth - 3) / 2);
        let priorLayer: Array<SearchTreeNode> = ss.layers[currentDepth - 2];

        for (let i = 0; i < priorLayer.length; i++) {
            let current: SearchTreeNode = priorLayer[i];

            if (current.children.length < toKeepDenominator) {
                continue;
            }
            let numToKeep = Math.ceil(current.children.length / toKeepDenominator);
            let numToRemove = current.children.length - numToKeep;

            let children: Array<ScoredSTN> =
                Array.from(current.children, (v : SearchTreeNode) =>
                                <ScoredSTN> { score: this.singleScore(v.definiteWinner,
                                                                      current.state.player,
                                                                      v.heuristicScores[current.state.player]),
                                              stn: v });
            children = children.sort((a, b) => a.score - b.score);
            let cut:  Array<SearchTreeNode> = Array.from({length: numToRemove}, (v, i) => children[i].stn);
            let keep: Array<SearchTreeNode> = Array.from({length: numToKeep}, (v, i) => children[i + numToRemove].stn);

            current.children = keep;
            for (let chopped of cut) {
                this.snip(chopped, current);
            }
        }
    }

    singleScore(winner: number | null, player: number, hScore: number): number {
        // Normalized Heuristic Scores are by nature constrained to the [-4, 4] range.
        if (winner === null) {
            return hScore;
        } else if (winner == player) {
            return 7 + hScore;
        } else {
            return -7 + hScore;
        }
    }

    // Modifies the order of children and parents in the arrays
    snip(child: SearchTreeNode, parentNode: SearchTreeNode) {
        let idx = child.parents.indexOf(parentNode);
        if (idx != child.parents.length - 1) {
            child.parents[idx] = child.parents[child.parents.length - 1];
        }
        child.parents.pop();
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
                    } else { // bestWin == someone else
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

type ScoredSTN = {
    score: number,
    stn:   SearchTreeNode,
};
