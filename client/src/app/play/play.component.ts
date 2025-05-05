import { Component, computed, HostListener, inject, OnInit, signal, Signal } from '@angular/core';

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

    rawBoard = this.gameplay.getBoard();
    board = computed(() => this.safeBoard(this.rawBoard()));
    currentPlayer: Signal<number> = this.gameplay.getPlayer();
    winner = this.gameplay.getWinner();
    captures = this.gameplay.getCaptures();

    colors = ["empty", "B", "C", "F", "E", "D", "A"];

    screenWidth = signal<number>(0);
    screenHeight = signal<number>(0);

    borderWidth: number = 4;
    // cellPadding: number = 10; -- not needed -- grid takes care of sizing cells

    gridWidth  = computed(() => this.widthCalc(this.screenWidth(), this.screenHeight()) -
                                    this.borderWidth * 2);
    gridHeight = computed(() => this.heightCalc(this.screenWidth(), this.screenHeight()) -
                                    this.borderWidth * 2);
    // not needed -- grid takes care of sizing cells
    // cellSize   = computed(() => this.cellCalc(this.screenWidth(), this.screenHeight()) -
    //                                 (this.borderWidth + this.cellPadding) * 2);
    gridStyle  = computed(() => "width: " + this.gridWidth() + "px; height: " + this.gridHeight() + 
                                "px; grid-template-columns: repeat(" + this.numCols() + ", 1fr);");

    numRows = computed(() => this.board().length);
    numCols = computed(() => this.board()[0].length);

    hoverX = signal<number | null>(null);
    hoverY = signal<number | null>(null);

    ngOnInit() {
        this.screenWidth.set(window.innerWidth);
        this.screenHeight.set(window.innerHeight);
    }

    @HostListener('window:resize', ['$event'])
    onWindowResize() {
        this.screenWidth.set(window.innerWidth);
        this.screenHeight.set(window.innerHeight);
    }

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
        let maxWidth = screenWidth - (160 + 2 * this.borderWidth);
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

    hoverAs(shouldHover: boolean) {
        if (shouldHover) {
            return this.colors[this.currentPlayer() + 1];
        } else {
            return "";
        }
    }

    safeBoard(b: Array<Array<number>> | undefined): Array<Array<number>> {
        if (b === undefined) {
            return [[]];
        }
        return b;
    }
}
