import { GameSpec,  emptyGameSpec }   from './game-spec.type';
import { GameState, emptyGameState }  from './game-state.type';
import { PlayerType } from './player-type.type';

export type Game = {
    players: Array<PlayerType>;
    spec: GameSpec;
    state: GameState;
}

export function emptyGame(): Game {
    return {
        players: [],
        spec: emptyGameSpec(),
        state: emptyGameState()
    }
}
