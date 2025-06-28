import { GameSpec } from './game-spec.type';
import { Seat } from './seat.type';

// NOTE: This type corresponds to a json type in the backend.
export type GameMembership = {
    gameID: number;
    assignedSeats: Array<Seat>;
    spec: GameSpec;
    numPlayers: number;
}
