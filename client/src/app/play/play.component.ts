import { Component, computed, inject, OnInit, signal, Signal } from '@angular/core';

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
    currentPlayer: Signal<number> = this.gameplay.getPlayer();
    winner = this.gameplay.getWinner();
    captures = this.gameplay.getCaptures();

    colors = ["empty", "yellow", "blue", "green", "orange", "purple", "gray"];

    ngOnInit(): void {
    }

    transposedBoard = computed(() => this.transpose(this.board()));
    gravityStr = computed(() => this.gameplay.getGravity() ? "hoverable" : ""); 

    transpose(a: Array<Array<number>> | undefined): Array<Array<number>> {
        if (a === undefined || a.length == 0) {
            return [];
        }
        return Array.from({length: a[0].length}, (x, i) =>
                          Array.from({length: a.length},
                                     (y, j) => a[j][i]));
    }

    selectSpot(m: Move): void {
        if (!this.gameplay.getGravity()) {
            if (!this.isLegalMove(m)) {
                return;
            }
            this.gameplay.makeMove(m);
            return;
        }

        let b: Array<Array<number>> | undefined = this.board();
        let numRows = b === undefined ? 0 : b.length;

        for (let r = numRows - 1; r >= 0; r--) {
            let m2 = {row: r, col: m.col};
            if (this.isLegalMove(m2)) {
                this.gameplay.makeMove(m2);
                return;
            }
        }
    }

    isLegalMove(m: Move): boolean {
        return this.gameplay.isLegalMove(m) &&
               this.gameplay.isLocalPlayer(this.currentPlayer());
    }
}
