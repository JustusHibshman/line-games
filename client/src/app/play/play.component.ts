import { Component, inject, OnInit, signal } from '@angular/core';

import { NavButtonComponent } from '@local-components/nav-button/nav-button.component';

import { GameState } from '@local-types/game-state.type';
import { Move } from '@local-types/move.type';

import { SetupService } from '@local-services/setup.service';
import { GameplayService } from '@local-services/gameplay.service';

@Component({
  selector: 'app-play',
  imports: [NavButtonComponent],
  templateUrl: './play.component.html',
  styleUrl: './play.component.scss'
})
export class PlayComponent implements OnInit {

    setup = inject(SetupService);
    gameplay = inject(GameplayService);

    board = this.gameplay.getBoard();
    currentPlayer = this.gameplay.getPlayer();
    winner = this.gameplay.getWinner();
    captures = this.gameplay.getCaptures();

    colors = ["empty", "yellow", "blue", "green", "orange", "purple", "gray"];

    ngOnInit(): void {
    }

    selectSpot(m: Move): void {
        if (!this.isLegalMove(m)) {
            return;
        }
        this.gameplay.makeMove(m);
    }

    isLegalMove(m: Move): boolean {
        return this.gameplay.isLegalMove(m) &&
               this.gameplay.isLocalPlayer(this.currentPlayer());
    }
}
