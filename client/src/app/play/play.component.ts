import { Component, computed, inject, signal, Signal } from '@angular/core';

import { NavButtonComponent } from '@local-components/nav-button/nav-button.component';

import { GameState } from '@local-types/game-state.type';
import { Move } from '@local-types/move.type';

import { safe } from '@local-utilities/safe';

import { SetupService } from '@local-services/setup.service';
import { GameplayService } from '@local-services/gameplay.service';
import { ScreenSizeService } from '@local-services/screen-size.service';

@Component({
  selector: 'app-play',
  imports: [NavButtonComponent],
  templateUrl: './play.component.html',
  styleUrl: './play.component.scss'
})
export class PlayComponent {

    setup = inject(SetupService);
    gameplay = inject(GameplayService);
    screenSize = inject(ScreenSizeService);

    rawBoard = this.gameplay.getBoard();
    board = computed(() => safe(this.rawBoard(), [[]]));
    currentPlayer: Signal<number> = this.gameplay.getPlayer();

    winner = computed(() => safe(this.gameplay.getWinner()(), -1));
    captures = this.gameplay.getCaptures();

    colors = ["empty", "E", "F", "A", "B", "C", "D"];

    screenWidth  = this.screenSize.getWidth();
    screenHeight = this.screenSize.getHeight();

    borderWidth: number = 4;
    gridWidth  = computed(() => this.widthCalc(this.screenWidth(), this.screenHeight()) -
                                    this.borderWidth * 2);
    gridHeight = computed(() => this.heightCalc(this.screenWidth(), this.screenHeight()) -
                                    this.borderWidth * 2);

    numRows = computed(() => this.board().length);
    numCols = computed(() => this.board()[0].length);

    hoverX = signal<number | null>(null);
    hoverY = signal<number | null>(null);

    selectSpot(m: Move): void {
        if (!this.gameplay.getGravity()) {
            if (!this.isLegalMove(m)) {
                return;
            }
            this.gameplay.makeMove(m);
            this.endHover();
            return;
        }

        let numRows = this.numRows();;

        for (let r = numRows - 1; r >= 0; r--) {
            let m2 = {row: r, col: m.col};
            if (this.isLegalMove(m2)) {
                this.gameplay.makeMove(m2);
                this.endHover();
                return;
            }
        }
    }

    isLegalMove(m: Move): boolean {
        return this.gameplay.isLegalMove(m) &&
               this.gameplay.isLocalPlayer(this.currentPlayer());
    }

    widthCalc(screenWidth: number, screenHeight: number): number {
        return Math.round(this.rawCellCalc(screenWidth, screenHeight) * this.numCols()) + 2 * this.borderWidth;
    }

    heightCalc(screenWidth: number, screenHeight: number): number {
        return Math.round(this.rawCellCalc(screenWidth, screenHeight) * this.numRows()) + 2 * this.borderWidth;
    }

    cellCalc(screenWidth: number, screenHeight: number): number {
        return Math.floor(this.rawCellCalc(screenWidth, screenHeight));
    }

    rawCellCalc(screenWidth: number, screenHeight: number) {
        // 360 is the minimum width for the main content.
        // 160 is the width of the side menu.
        //
        // These numbers are also hard-coded in ../../styles.scss
        let maxWidth = Math.max(360, screenWidth - 160) - 2 * this.borderWidth;
        let maxHeight = screenHeight - 2 * this.borderWidth;

        let widthLimited  = maxWidth / this.numCols();
        let heightLimited = maxHeight / this.numRows();
        return Math.min(widthLimited, heightLimited);
    }

    beginHover(m: Move): void {
        if (this.gameplay.getGravity()) {
            this.hoverY.set(null);
            let b = this.board();
            for (let r = b.length - 1; r >= 0; r--) {
                if (this.isLegalMove({row: r, col: m.col})) {
                    this.hoverX.set(m.col);
                    this.hoverY.set(r);
                    return;
                }
            }
        }
        else if (this.isLegalMove(m)) {
            this.hoverX.set(m.col);
            this.hoverY.set(m.row);
            return;
        }
        this.endHover();
    }

    endHover(): void {
        this.hoverX.set(null);
        this.hoverY.set(null);
    }

    displayColor(r: number, c: number, player: number): string {
        if (this.empty(r, c)) {
            return this.colors[player + 1];
        }
        return this.colors[this.board()[r][c] + 1];
    }

    hover(r: number, c: number, hoverX: number | null, hoverY: number | null): boolean {
        return r == hoverY && c == hoverX;
    }

    empty(r: number, c: number): boolean {
        return this.board()[r][c] == -1;
    }
}
