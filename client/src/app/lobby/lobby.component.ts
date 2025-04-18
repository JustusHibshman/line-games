import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { NgFor } from '@angular/common';

import { ActionButtonComponent } from '@local-components/action-button/action-button.component';
import { IntegerInputComponent } from '@local-components/integer-input/integer-input.component';
import { NavButtonComponent } from '@local-components/nav-button/nav-button.component';

import { PlayerType } from '@local-types/player-type.type';

import { SetupService } from '@local-services/setup.service';

@Component({
  selector: 'app-lobby',
  imports: [NgFor,
            ActionButtonComponent, IntegerInputComponent, NavButtonComponent],
  templateUrl: './lobby.component.html',
  styleUrl: './lobby.component.scss'
})
export class LobbyComponent implements OnInit {

    setup = inject(SetupService);

    players: any = [];
    playerTypeTexts: Array<string> = [];

    /* Whether the seat has been selected */
    seatSelected = signal<Array<boolean>>([]);
    visibilityText: any = [];

    colors = ["yellow", "blue", "green", "orange", "purple", "gray"];

    requestedSeats = signal<number>(1);
    requestedSeatsText = computed(() => "Claim " + this.requestedSeats() + " Seat" + 
                                        (this.requestedSeats() == 1 ? "" : "s"));

    awaitingResponse = signal<boolean>(false);
    requestGranted   = signal<boolean>(false);

    ngOnInit(): void {
        /* Placeholder Values */
        this.players = this.setup.getPlayerTypes();
        this.playerTypeTexts =
            Array.from(this.players, (t) => t == PlayerType.Human ? "Human" : "AI");

        this.seatSelected.set(Array.from({length: this.players.length},
                                         () => false));
        this.visibilityText =
                Array.from({length: this.players.length},
                           (v, i) => computed(() => this.seatSelected()[i] ? "" : "invisible"));
    }

    requestSeats(): void {
        this.awaitingResponse.set(true);
        let claimed = this.setup.claimSeats(this.requestedSeats());
        if (claimed.length != 0) {
            this.requestGranted.set(true);
            this.seatSelected.set(Array.from({length: this.players.length}, (v, i) => i in claimed));
        }
        this.awaitingResponse.set(false);
    }
}
