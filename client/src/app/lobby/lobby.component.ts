import { Component, computed, OnInit, signal } from '@angular/core';
import { NgFor } from '@angular/common';

import { ActionButtonComponent } from '@local-components/action-button/action-button.component';
import { IntegerInputComponent } from '@local-components/integer-input/integer-input.component';
import { NavButtonComponent } from '@local-components/nav-button/nav-button.component';

import { PlayerType } from '@local-types/player-type.type';

@Component({
  selector: 'app-lobby',
  imports: [NgFor,
            ActionButtonComponent, IntegerInputComponent, NavButtonComponent],
  templateUrl: './lobby.component.html',
  styleUrl: './lobby.component.scss'
})
export class LobbyComponent implements OnInit {
    players: any = [];
    playerTypeTexts: Array<string> = [];

    /* Whether the seat has been selected */
    seatSelected: any = [];
    visibilityText: any = [];

    colors = ["yellow", "blue", "green", "orange", "purple", "gray"];

    requestedSeats = signal<number>(1);
    requestedSeatsText = computed(() => "Claim " + this.requestedSeats() + " Seat" + 
                                        (this.requestedSeats() == 1 ? "" : "s"));

    awaitingResponse = signal<boolean>(false);
    requestGranted   = signal<boolean>(false);

    ngOnInit(): void {
        /* Placeholder Values */
        this.players = Array.from({length: 6}, () => PlayerType.Human);
        this.players[1] = PlayerType.AI;
        this.players[3] = PlayerType.AI;
        this.playerTypeTexts =
            Array.from(this.players, (t) => t == PlayerType.Human ? "Human" : "AI");

        this.seatSelected = Array.from({length: this.players.length},
                                       () => signal<boolean>(false));
        this.visibilityText =
                Array.from({length: this.players.length},
                           (v, i) => computed(() => this.seatSelected[i]() ? "" : "invisible"));
    }

    requestSeats(): void {
        this.awaitingResponse.set(true);
        this.seatSelected[2].set(true);
    }
}
