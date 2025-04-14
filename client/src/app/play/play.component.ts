import { Component, OnInit, signal } from '@angular/core';

import { NavButtonComponent } from '@local-components/nav-button/nav-button.component';

import { Game, emptyGame } from '@local-types/game.type';

@Component({
  selector: 'app-play',
  imports: [NavButtonComponent],
  templateUrl: './play.component.html',
  styleUrl: './play.component.scss'
})
export class PlayComponent implements OnInit {
    game = signal<Game>(emptyGame());
    currentPlayer = signal<number>(0);

    colors = ["empty", "yellow", "blue", "green", "orange", "purple", "gray"];

    ngOnInit(): void {
        this.game.set({ ...this.game(), state: { ...this.game().state,
                                                board: [[0,-1,-1], [-1, 1,-1], [-1,-1,-1]]}});
    }

    selectSpot(r: number, c: number): void {
        console.log("Clicked on spot: " + String(r) + ", " + String(c));
        this.currentPlayer.set((this.currentPlayer() + 1) % 6)
    }
}
