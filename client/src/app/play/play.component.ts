import { Component, inject, OnInit, signal } from '@angular/core';

import { NavButtonComponent } from '@local-components/nav-button/nav-button.component';

import { GameState } from '@local-types/game-state.type';

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

    selectSpot(r: number, c: number): void {
        if (!this.isLegalMove(r, c)) {
            return;
        }
        this.gameplay.makeMove(r, c);
    }

    isLegalMove(r: number, c: number): boolean {
        return this.gameplay.isLegalMove(r, c) &&
               this.gameplay.isLocalPlayer(this.currentPlayer());
    }
}
