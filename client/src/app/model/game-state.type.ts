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
