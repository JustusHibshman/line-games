import { PlayerType } from './player-type.type';

// NOTE: This type corresponds to a json type in the backend.
export type Seat = {
    userID: BigInt
    type: PlayerType
    seat: number
}
