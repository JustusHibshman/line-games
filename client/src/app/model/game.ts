import { GameSpec, emptyGameSpec }  from './game-spec.type';
import { GameState, emptyGameState } from './game-state.type';
import { Move } from './move.type';

export class Game {
    readonly spec: GameSpec;
    readonly numPlayers: number;
    readonly EMPTY: number;
    _state: GameState;

    _winner: number | null;
    _numPlaced: number;  // Total number of stones on the board

    constructor(spec: GameSpec, numPlayers: number, firstPlayer: number);
    constructor(toCopy: Game);
    constructor();
    constructor(...arr: any[]) {
        this.EMPTY = -1;
        if (arr.length === 0) {
            this.spec = emptyGameSpec();
            this.numPlayers = 0;
            this._state = emptyGameState();
            this._winner = null;
            this._numPlaced = 0;
        }
        else if (arr.length === 1) {
            let toCopy: Game = arr[0];
            this.spec = toCopy.spec;
            this.numPlayers = toCopy.numPlayers;
            this._state = {
                turn:   toCopy._state.turn,
                player: toCopy._state.player,
                board:  Array.from(toCopy._state.board, (row) => [ ...row ]),
                captures: [...toCopy._state.captures],
            };
            this._winner    = toCopy._winner;
            this._numPlaced = toCopy._numPlaced;
        } else {
            this.spec = arr[0];
            this.numPlayers = arr[1];
            this._state = {
                turn: 0,
                player: arr[2],
                board: Array.from({length: this.spec.board.height}, () =>
                                    Array.from({length: this.spec.board.width}, () => this.EMPTY)),
                captures: Array.from({length: this.numPlayers}, () => 0),
            };
            this._winner = null;
            this._numPlaced = 0;
        }
    }

    gameOver(): boolean {
        return (this._winner !== null) ||
               (this._numPlaced == this.spec.board.width * this.spec.board.height);
    }

    winner(): number | null {
        return this._winner;
    }

    board(): ReadonlyArray<ReadonlyArray<number>> {
        return this._state.board;
    }

    captures(): ReadonlyArray<number> {
        return this._state.captures;
    }

    player(): number {
        return this._state.player;
    }

    turn(): number {
        return this._state.turn;
    }

    inBounds(m: Move): boolean {
        return this._inBounds(m.row, m.col);
    }

    isLegal(m: Move): boolean {
        if (this.gameOver() || !this._inBounds(m.row, m.col) ||
                this._state.board[m.row][m.col] != this.EMPTY) {
            return false;
        }
        if (this.spec.board.gravity && m.row < this.spec.board.height - 1 &&
                this._state.board[m.row + 1][m.col] == this.EMPTY) {
            return false;
        }
        return true;
    }

    copy(): Game {
        return new Game(this);
    }

    // Returns an array of the spaces which opened up due to captures.
    makeMove(m: Move): Array<Move> {
        this._state.board[m.row][m.col] = this._state.player;
        let captured: Array<Move> = this._performCaptures(m);
        this._checkForVictor(m);
        this._state.player = (this._state.player + 1) % this.numPlayers;
        this._state.turn++;
        this._numPlaced = (this._numPlaced + 1) - captured.length;
        return captured;
    }

    /////////////////////// Internal Utility Functions ///////////////////////

    // Assumes m has already been placed on the board by the relevant player
    //
    // Also assumes that all capture information is up to date
    _checkForVictor(m: Move): void {
        let player = this._state.board[m.row][m.col];

        if (this.spec.rules.winByCaptures) {
            if (this._state.captures[player] >= this.spec.rules.winningNumCaptures) {
                this._winner = player;
                return;
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
                let rAlt = m.row + i * dir;
                let cAlt = m.col + j * dir;
                while (this._inBounds(rAlt, cAlt)) {
                    if (this._state.board[rAlt][cAlt] == player) {
                        count++;
                    } else {
                        break;
                    }
                    rAlt += i * dir;
                    cAlt += j * dir;
                }
            }
            if (count >= this.spec.rules.winningLength) {
                this._winner = player;
                return;
            }
        }
    }

    // Assumes m has already been placed on the board by the relevant player
    _performCaptures(m: Move): Array<Move> {
        let captured: Array<Move> = [];
        if (!this.spec.rules.allowCaptures) {
            return captured;
        }

        let player = this._state.board[m.row][m.col];
        let capSize = this.spec.rules.captureSize;

        for (let i = -1; i < 2; i++) {
            for (let j = -1; j < 2; j++) {
                let rAlt = m.row + (capSize + 1) * i;
                let cAlt = m.col + (capSize + 1) * j;

                if (!this._inBounds(rAlt, cAlt)) {
                    continue
                }
                if (this._state.board[rAlt][cAlt] != player) {
                    continue;
                }
                let isCapture = true;
                for (let k = 1; k <= capSize; k++) {
                    rAlt = m.row + k * i;
                    cAlt = m.col + k * j;
                    if (this._state.board[rAlt][cAlt] == player || this._state.board[rAlt][cAlt] == this.EMPTY) {
                        isCapture = false;
                        break;
                    }
                }
                if (!isCapture) {
                    continue;
                }
                this._state.captures[player]++;
                for (let k = 1; k <= capSize; k++) {
                    rAlt = m.row + k * i;
                    cAlt = m.col + k * j;
                    this._state.board[rAlt][cAlt] = this.EMPTY;
                    captured.push({row: rAlt, col: cAlt});
                }
            }
        }
        return captured;
    }

    _inBounds(r: number, c: number): boolean {
        return 0 <= r && r < this.spec.board.height &&
               0 <= c && c < this.spec.board.width;
    }
}
