import { inject, Injectable } from '@angular/core';

import { GameSpec, copyGameSpec, emptyGameSpec } from '@local-types/game-spec.type';
import { GameState, copyGameState } from '@local-types/game-state.type';
import { Move } from '@local-types/move.type';
import { PlayerType } from '@local-types/player-type.type';

import { GameStateService } from '@local-services/game-state.service';

@Injectable({
  providedIn: 'root'
})
export class ClientAIService {

    gsService = inject(GameStateService);
    gSpec: GameSpec = emptyGameSpec();
    numPlayers: number = 0;

    primitiveAIChoice(gState: GameState, gSpec: GameSpec, numPlayers: number): Move {
        this.setGame(gSpec, numPlayers);

        let chosenDepth = 3;
        if (this.gSpec.board.width < 8) {
            chosenDepth += 1;
        }
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

    ////////////// AI Search Space ///////////////
    
    gameStartAvailableMoves(): Set<number> {
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

    ////////////// AI Decision-Making ///////////////

    // Higher is Better -- Values are guaranteed to be in the range -13 <= x <= 13
    heuristicScores(gState: GameState): Array<number> {
        // Captures
        var captureScores: Array<number>;
        if (this.gSpec.rules.winByCaptures) {
            captureScores = this.normalizeHeuristicNumbers(gState.captures);
        } else {
            captureScores = Array.from({length: this.numPlayers}, () => 0);
        }

        // Sub-lines and win chances
        let rawLineScores: Array<number> = Array.from({length: this.numPlayers}, () => 0);
        let rawWinChances:  Array<number> = Array.from({length: this.numPlayers}, () => 0);

        let lineSize: number = this.gSpec.rules.winningLength;
        let w = this.gSpec.board.width;
        let h = this.gSpec.board.height;

        let withinCaptureWinRange: boolean = false;
        let withinCaptureWinRangeByPlayer: Array<boolean> = Array.from({length: this.numPlayers}, () => false);
        if (this.gSpec.rules.winByCaptures) {
            for (let p = 0; p < this.numPlayers; p++) {
                if (gState.captures[p] == this.gSpec.rules.winningNumCaptures - 1) {
                    withinCaptureWinRangeByPlayer[p] = true;
                    withinCaptureWinRange = true;
                }
            }
        }

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
                    let emptySpot = {row: -1, col: -1};
                    let count = 0;

                    // Check lines
                    for (let step = 0; step < lineSize; step++) {
                        let rCheck = r + step * rInc[dir];
                        let cCheck = c + step * cInc[dir];
                        let p = gState.board[rCheck][cCheck];
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
                        } else {
                            emptySpot = {row: rCheck, col: cCheck};
                        }
                    }
                    if (count > 0) {
                        rawLineScores[firstPlayer] += count * count * count * count * count;
                        if (count == lineSize - 1 && this.gsService.isLegal(emptySpot, this.gSpec, gState)) {
                            rawWinChances[firstPlayer] = rawWinChances[firstPlayer] + 1;
                        }
                    }

                    if (withinCaptureWinRange) {
                        // Check captures as potential raw win chances
                        let endRow = r + this.gSpec.rules.captureSize * rInc[dir];
                        let endCol = c + this.gSpec.rules.captureSize * cInc[dir];
                        let p1 = gState.board[r][c];
                        let p2 = gState.board[endRow][endCol];
                        if ((p1 == -1) != (p2 == -1)) {
                            // One is empty and the other is not
                            p1 = Math.max(p1, p2);
                            if (withinCaptureWinRangeByPlayer[p1]) {
                                let couldCapture = true;
                                for (let step = 1; step < this.gSpec.rules.captureSize - 1; step++) {
                                    p2 = gState.board[r + step * rInc[dir]][c + step * cInc[dir]];
                                    if (p2 == -1 || p2 == p1) {
                                        couldCapture = false;
                                        break;
                                    }
                                }
                                if (couldCapture) {
                                    rawWinChances[p1] = rawWinChances[p1] + 1;
                                }
                            }
                        }
                    }
                }
            }
        }
        // Post-process raw line scores
        let lineScores = this.normalizeHeuristicNumbers(rawLineScores);

        // Post-process raw win chances
        let turnsUntilTurn: Array<number> = Array.from({length: this.numPlayers}, () => 0);
        for (let t = 0; t < this.numPlayers; t++) {
            let player = (gState.turn + t) % this.numPlayers;
            turnsUntilTurn[player] = t;
        }
        let hadAWinner = false;
        for (let player = 0; player < this.numPlayers; player++) {
            rawWinChances[player] = Math.max(0, rawWinChances[player] - turnsUntilTurn[player]);
            if (rawWinChances[player] > 0) {
                hadAWinner = true;
            }
        }
        let oneHotWinnerVector: Array<number> =
                Array.from({length: this.numPlayers}, () => hadAWinner ? -1 : 0);
        for (let t = 0; t < this.numPlayers; t++) {
            let player = (gState.turn + t) % this.numPlayers;
            if (rawWinChances[player] > 0) {
                oneHotWinnerVector[player] = 1;
                break;
            }
        }

        let numNormalizedValues = 2;
        let normalizedRange = 4;
        let winChanceValue  = numNormalizedValues * normalizedRange + 1; // 9

        return Array.from(captureScores, (v, i) => v + lineScores[i] + winChanceValue * oneHotWinnerVector[i]);
    }

    // Normalized values are guaranteed to be in the range -2 <= x <= 2
    normalizeHeuristicNumbers(a: Array<number>): Array<number> {
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
            let selfScore   = selfWeight * (a[i] / weightedSum);
            let avgOppScore = total / (a.length - 1);
            let maxOppScore = max;
            result[i] = 2 * selfScore - (maxOppScore + avgOppScore);
        }
        return result;
    }

    // Higher is Better
    scores(stn: SearchTreeNode): Array<number> {
        // Heuristic values are guaranteed to be in the range -13 <= x <= 13
        const WinValue: number = 27; // (13 - -13) + 1   [i.e. more than the full range]
        let result: Array<number> = this.heuristicScores(stn.state);
        if (stn.winner != -1) {
            for (let i = 0; i < this.numPlayers; i++) {
                if (i == stn.winner) {
                    result[i] += WinValue;
                } else {
                    result[i] -= WinValue;
                }
            }
        }
        return result;
    }

    primitiveAIChoiceHelper(gState: GameState, depth: number): Move {
        let initialNode: SearchTreeNode = {
            winner: -1,
            scores: [],
            state: gState,
            movedToBy: {row: -1, col: -1},
            moves: this.initialMoves(gState),
        };

        let ss: SearchSpace = {
            layers: [[initialNode]],
            activeIdxs: [0],
        };

        let currentDepth = 0;
        let bestMove: Move = {row: -1, col: -1};
        var activeNode: SearchTreeNode;
        while (true) {
            while (ss.activeIdxs[currentDepth] < ss.layers[currentDepth].length) {
                // Sibling stepping
                activeNode = ss.layers[currentDepth][ss.activeIdxs[currentDepth]];
                if (currentDepth < depth && activeNode.winner == -1 && activeNode.moves.size > 0) {
                    // Prepare the descendents of activeNode
                    ss.layers.push([]);
                    ss.activeIdxs.push(0);
                    let movesCopy = new Set<number>(activeNode.moves);
                    while (movesCopy.size > 0) {
                        let move = this.intToMove(this.pop(movesCopy));
                        ss.layers[currentDepth + 1].push(this.childFromMove(activeNode, move));
                    }
                    // TODO: If we were going to prune, this is the place to do it.
                    currentDepth++;
                } else {
                    activeNode.scores = this.scores(activeNode);
                    ss.activeIdxs[currentDepth]++;
                }
            }
            currentDepth--;

            // Aggregate score values
            activeNode = ss.layers[currentDepth][ss.activeIdxs[currentDepth]];
            if (activeNode.scores.length == 0) {
                // Definitely has children, because all childless nodes are given scores earlier
                let bestScore = ss.layers[currentDepth + 1][0].scores[activeNode.state.player];
                bestMove = ss.layers[currentDepth + 1][0].movedToBy;
                let bestIdx = 0;
                for (let i = 1; i < ss.layers[currentDepth + 1].length; i++) {
                    let score = ss.layers[currentDepth + 1][i].scores[activeNode.state.player];
                    if (score > bestScore) {
                        bestScore = score;
                        bestMove  = ss.layers[currentDepth + 1][i].movedToBy;
                        bestIdx = i;
                    }
                }
                activeNode.scores = ss.layers[currentDepth + 1][bestIdx].scores;
            }

            if (currentDepth == 0) {
                break;
            }

            ss.activeIdxs[currentDepth]++;
            ss.layers.pop();
            ss.activeIdxs.pop();
        }

        return bestMove;
    }

    initialMoves(gState: GameState): Set<number> {
        if (gState.turn == 0) {
            return new Set<number>(this.gameStartAvailableMoves());
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
                        if (gState.board[r][c] != -1) {
                            s = this.union(s, this.surroundingMoves({row: r, col: c}, gState));
                        }
                    }
                }
            }
            return s;
        }
    }

    childFromMove(parentNode: SearchTreeNode, m: Move): SearchTreeNode {
        let newGS: GameState = copyGameState(parentNode.state);
        let capturedCellsArr: Array<Move> =
                this.gsService.makeMove(m, newGS, this.gSpec, this.numPlayers);

        let capturedCells: Set<number> =
                new Set(Array.from(capturedCellsArr, (x) => this.moveToInt(x)));
        let enabledCells: Set<number> = this.surroundingMoves(m, newGS);
        let newMoves = new Set(parentNode.moves);
        newMoves.delete(this.moveToInt(m));

        let winner = this.gsService.checkForVictor(m, newGS, this.gSpec);

        return {
            winner: winner,
            scores: [],
            state: newGS,
            movedToBy: m,
            moves: this.union(newMoves, this.union(capturedCells, enabledCells)),
        };
    }

    //////////////////////// Set Operations /////////////////////////

    pop(s: Set<number>): number {
        let x = 0;
        for (let y of s) {
            x = y;
            break;
        }
        s.delete(x);
        return x;
    }

    union(a: Set<number>, b: Set<number>): Set<number> {
        if (a.size > b.size) {
            let s = new Set<number>(a);
            for (let x of b) {
                s.add(x);
            }
            return s;
        }
        let s = new Set<number>(b);
        for (let x of a) {
            s.add(x);
        }
        return s;
    }
}

type SearchTreeNode = {
    winner: number,
    scores: Array<number>,
    state: GameState,
    movedToBy: Move,
    moves: Set<number>,
};

type SearchSpace = {
    layers: Array<Array<SearchTreeNode>>,
    activeIdxs: Array<number>,
};
