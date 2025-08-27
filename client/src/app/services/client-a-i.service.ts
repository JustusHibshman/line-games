import { inject, Injectable } from '@angular/core';

import { Game } from '@local-types/game';
import { Move } from '@local-types/move.type';

@Injectable({
  providedIn: 'root'
})
export class ClientAIService {

    primitiveAIChoice(game: Game): Move {

        let chosenDepth = 3;
        if (game.spec.board.width < 8) {
            chosenDepth += 1;
        }
        if (game.spec.board.width < 5) {
            chosenDepth += 2;
        }
        if (game.spec.board.gravity) {
            chosenDepth += 2;
        }

        let choice = this.primitiveAIChoiceHelper(game, chosenDepth);
        return choice;
    }

    constructor() { }

    ////////////// AI Search Space ///////////////

    moveToInt(game: Game, m: Move): number {
        return m.row * game.spec.board.width + m.col;
    }

    intToMove(game: Game, n: number): Move {
        return {
            row: Math.floor(n / game.spec.board.width),
            col: n % game.spec.board.width
        }
    }
    
    gameStartAvailableMoves(game: Game): Set<number> {
        let w = game.spec.board.width;
        let h = game.spec.board.height;
        if (game.spec.board.gravity) {
            /* Return the bottom row */
            return new Set<number>(Array.from({ length: w }, (v, i) =>
                                    this.moveToInt(game, {row: h - 1, col: i})));
        }

        let s = new Set<number>();
        // Return central square
        s.add(this.moveToInt(game, {row: Math.floor(h / 2), col: Math.floor(w / 2)}))

        return s;
    }

    // m should be the latest move
    surroundingMoves(game: Game, m: Move): Set<number> {
        if (game.spec.board.gravity) {
            // The cell immediately above m
            let above = {row: m.row - 1, col: m.col};
            if (game.isLegal(above)) {
                return new Set<number>([this.moveToInt(game, above)]);
            }
            return new Set<number>();
        }

        let radius = 1;
        // Add all cells within radius spaces of m
        let s = new Set<number>();
        for (let r = m.row - radius; r <= m.row + radius; r++) {
            for (let c = m.col - radius; c <= m.col + radius; c++) {
                let m2 = {row: r, col: c};
                if (game.isLegal(m2)) {
                    s.add(this.moveToInt(game, m2));
                }
            }
        }

        return s;
    }

    ////////////// AI Decision-Making ///////////////

    // Higher is Better -- Values are guaranteed to be in the range -13 <= x <= 13
    heuristicScores(game: Game): Array<number> {
        // Captures
        var captureScores: Array<number>;
        if (game.spec.rules.winByCaptures) {
            captureScores = this.normalizeHeuristicNumbers(game.captures());
        } else {
            captureScores = Array.from({length: game.numPlayers}, () => 0);
        }

        // Sub-lines and win chances
        let rawLineScores: Array<number> = Array.from({length: game.numPlayers}, () => 0);
        let rawWinChances:  Array<number> = Array.from({length: game.numPlayers}, () => 0);

        let lineSize: number = game.spec.rules.winningLength;
        let w = game.spec.board.width;
        let h = game.spec.board.height;
        let board: ReadonlyArray<ReadonlyArray<number>> = game.board();
        let captures: ReadonlyArray<number> = game.captures();

        let withinCaptureWinRange: boolean = false;
        let withinCaptureWinRangeByPlayer: Array<boolean> = Array.from({length: game.numPlayers}, () => false);
        if (game.spec.rules.winByCaptures) {
            for (let p = 0; p < game.numPlayers; p++) {
                if (captures[p] == game.spec.rules.winningNumCaptures - 1) {
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
                    if (!game.inBounds({row: r + lineSize * rInc[dir],
                                        col: c + lineSize * cInc[dir]})) {
                        continue;
                    }

                    let firstPlayer: number | null = null;
                    let emptySpot = {row: -1, col: -1};
                    let count = 0;

                    // Check lines
                    for (let step = 0; step < lineSize; step++) {
                        let rCheck = r + step * rInc[dir];
                        let cCheck = c + step * cInc[dir];
                        let p = board[rCheck][cCheck];
                        if (p != game.EMPTY) {
                            if (firstPlayer === null) {
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
                    if (count > 0 && firstPlayer !== null) {
                        rawLineScores[firstPlayer] += count * count * count * count * count;
                        if (count == lineSize - 1 && game.isLegal(emptySpot)) {
                            rawWinChances[firstPlayer] = rawWinChances[firstPlayer] + 1;
                        }
                    }

                    if (withinCaptureWinRange) {
                        // Check captures as potential raw win chances
                        let endRow = r + game.spec.rules.captureSize * rInc[dir];
                        let endCol = c + game.spec.rules.captureSize * cInc[dir];
                        let p1 = board[r][c];
                        let p2 = board[endRow][endCol];
                        if ((p1 == -1) != (p2 == -1)) {
                            // One is empty and the other is not
                            p1 = Math.max(p1, p2);
                            if (withinCaptureWinRangeByPlayer[p1]) {
                                let couldCapture = true;
                                for (let step = 1; step < game.spec.rules.captureSize - 1; step++) {
                                    p2 = board[r + step * rInc[dir]][c + step * cInc[dir]];
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
        let turnsUntilTurn: Array<number> = Array.from({length: game.numPlayers}, () => 0);
        for (let t = 0; t < game.numPlayers; t++) {
            let player = (game.player() + t) % game.numPlayers;
            turnsUntilTurn[player] = t;
        }
        let hadAWinner = false;
        for (let player = 0; player < game.numPlayers; player++) {
            rawWinChances[player] = Math.max(0, rawWinChances[player] - turnsUntilTurn[player]);
            if (rawWinChances[player] > 0) {
                hadAWinner = true;
            }
        }
        let oneHotWinnerVector: Array<number> =
                Array.from({length: game.numPlayers}, () => hadAWinner ? -1 : 0);
        for (let t = 0; t < game.numPlayers; t++) {
            let player = (game.player() + t) % game.numPlayers;
            if (rawWinChances[player] > 0) {
                oneHotWinnerVector[player] = 1;
                break;
            }
        }

        let numNormalizedValues = 2;
        let normalizedRange = 4;
        let winChanceValue  = numNormalizedValues * normalizedRange + 1; // 9

        let result = Array.from(captureScores, (v, i) => v + lineScores[i] + winChanceValue * oneHotWinnerVector[i]);
        for (let r of result) {
            if (Math.abs(r) > 13) {
                console.log("ERROR!!!!!!");
                console.log(result);
            }
        }
        return result;
    }

    // Normalized values are guaranteed to be in the range -2 <= x <= 2
    normalizeHeuristicNumbers(a: ReadonlyArray<number>): Array<number> {
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
    scores(game: Game, stn: SearchTreeNode): Array<number> {
        // Heuristic values are guaranteed to be in the range -13 <= x <= 13
        const WinValue: number = 27; // (13 - -13) + 1   [i.e. more than the full range]
        let result: Array<number> = this.heuristicScores(stn.game);
        if (stn.winner !== null) {
            for (let i = 0; i < game.numPlayers; i++) {
                if (i == stn.winner) {
                    result[i] += WinValue;
                } else {
                    result[i] -= WinValue;
                }
            }
        }
        return result;
    }

    primitiveAIChoiceHelper(game: Game, depth: number): Move {
        let initialNode: SearchTreeNode = {
            winner: null,
            scores: [],
            game: game,
            movedToBy: {row: -1, col: -1},
            moves: this.initialMoves(game),
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
                if (currentDepth < depth && activeNode.winner === null && activeNode.moves.size > 0) {
                    // Prepare the descendents of activeNode
                    ss.layers.push([]);
                    ss.activeIdxs.push(0);
                    let movesCopy = new Set<number>(activeNode.moves);
                    while (movesCopy.size > 0) {
                        let move = this.intToMove(game, this.pop(movesCopy));
                        ss.layers[currentDepth + 1].push(this.childFromMove(activeNode, move));
                    }
                    // TODO: If we were going to prune, this is the place to do it.
                    currentDepth++;
                } else {
                    activeNode.scores = this.scores(game, activeNode);
                    ss.activeIdxs[currentDepth]++;
                }
            }
            currentDepth--;

            // Aggregate score values
            activeNode = ss.layers[currentDepth][ss.activeIdxs[currentDepth]];
            if (activeNode.scores.length == 0) {
                // Definitely has children, because all childless nodes are given scores earlier
                let bestScore = ss.layers[currentDepth + 1][0].scores[activeNode.game.player()];
                bestMove = ss.layers[currentDepth + 1][0].movedToBy;
                let bestIdx = 0;
                for (let i = 1; i < ss.layers[currentDepth + 1].length; i++) {
                    let score = ss.layers[currentDepth + 1][i].scores[activeNode.game.player()];
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

    initialMoves(game: Game): Set<number> {
        if (game.turn() == 0) {
            return new Set<number>(this.gameStartAvailableMoves(game));
        } else {
            let s: Set<number> = new Set<number>();
            let board: ReadonlyArray<ReadonlyArray<number>> = game.board();
            if (game.spec.board.gravity) {
                for (let c = 0; c < game.spec.board.width; c++) {
                    let r = game.spec.board.height - 1;
                    while (r >= 0) {
                        if (board[r][c] == game.EMPTY) {
                            s.add(this.moveToInt(game, {row: r, col: c}));
                            break;
                        }
                        r--;
                    }
                }
            } else {
                for (let r = 0; r < game.spec.board.height; r++) {
                    for (let c = 0; c < game.spec.board.width; c++) {
                        if (board[r][c] != game.EMPTY) {
                            s = this.union(s, this.surroundingMoves(game, {row: r, col: c}));
                        }
                    }
                }
            }
            return s;
        }
    }

    childFromMove(parentNode: SearchTreeNode, m: Move): SearchTreeNode {
        let newG: Game = parentNode.game.copy();
        let capturedCellsArr: Array<Move> =
                newG.makeMove(m);

        let capturedCells: Set<number> =
                new Set(Array.from(capturedCellsArr, (x) => this.moveToInt(newG, x)));
        let enabledCells: Set<number> = this.surroundingMoves(newG, m);
        let newMoves = new Set(parentNode.moves);
        newMoves.delete(this.moveToInt(newG, m));

        let winner = newG.winner();

        return {
            winner: winner,
            scores: [],
            game: newG,
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
    winner: number | null,
    scores: Array<number>,
    game: Game,
    movedToBy: Move,
    moves: Set<number>,
};

type SearchSpace = {
    layers: Array<Array<SearchTreeNode>>,
    activeIdxs: Array<number>,
};
