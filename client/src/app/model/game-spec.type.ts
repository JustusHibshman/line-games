import { BoardSpec } from './board-spec.type';
import { RuleSpec }  from './rule-spec.type';

export type GameSpec = {
    board: BoardSpec;
    rules: RuleSpec;
}

export function emptyGameSpec(): GameSpec {
    return {
        board: {
            width: 0,
            height: 0,
            gravity: false,
        },
        rules: {
            winningLength: 0,
            allowCaptures: false,
            winByCaptures: false,
            captureSize:   0,
            winningNumCaptures: 0,
        }
    }
}

export function copyGameSpec(gs: GameSpec): GameSpec {
    return {
        board: {
            width: gs.board.width,
            height: gs.board.height,
            gravity: gs.board.gravity,
        },
        rules: {
            winningLength: gs.rules.winningLength,
            allowCaptures: gs.rules.allowCaptures,
            winByCaptures: gs.rules.winByCaptures,
            captureSize:   gs.rules.captureSize,
            winningNumCaptures: gs.rules.winningNumCaptures,
        }
    }
}
