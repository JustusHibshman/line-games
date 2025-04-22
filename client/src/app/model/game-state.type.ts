export type GameState = {
    player:     number;
    turn:       number;
    board:      Array<Array<number>>;
    captures:   Array<number>;
}

export function emptyGameState(): GameState {
    return {
        player:     0,
        turn:       0,
        board:      [],
        captures:   [],
    }
}

export function copyGameState(gs: GameState): GameState {
    return {
        player: gs.player,
        turn:   gs.turn,
        board:  Array.from(gs.board, (a: Array<number>) => [...a]),
        captures: [... gs.captures]
    }
}
