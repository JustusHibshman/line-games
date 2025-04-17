import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { GameLink } from '@local-types/game-link.type';
import { GameSpec, copyGameSpec} from '@local-types/game-spec.type';
import { PlayerType } from '@local-types/player-type.type';

@Injectable({
  providedIn: 'root'
})
export class GameplayService {

    router = inject(Router);

    gameLink: GameLink | undefined;

    constructor() { }
}
