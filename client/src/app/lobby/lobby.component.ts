import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';

import { ActionButtonComponent } from '@local-components/action-button/action-button.component';
import { IntegerInputComponent } from '@local-components/integer-input/integer-input.component';
import { NavButtonComponent } from '@local-components/nav-button/nav-button.component';

import { PlayerType } from '@local-types/player-type.type';

import { SetupService } from '@local-services/setup.service';

@Component({
  selector: 'app-lobby',
  imports: [ActionButtonComponent, IntegerInputComponent, NavButtonComponent],
  templateUrl: './lobby.component.html',
  styleUrl: './lobby.component.scss'
})
export class LobbyComponent implements OnInit {

    setup = inject(SetupService);

    players: any = [];
    playerTypeTexts: Array<string> = [];
    emptySeats: boolean = true;

    /* Whether the seat has been selected */
    seatSelected = signal<Array<boolean>>([]);
    visibilityText: any = [];

    colors = ["E", "F", "A", "B", "C", "D"];

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

        this.emptySeats = this.setup.hasEmptySeats();

        // TODO: Remove the following code
        let requestSize = 0;
        for (let i = 0; i < this.players.length; i++) {
            if (this.players[i] == PlayerType.Human) {
                requestSize++;
            }
        }
        this.requestedSeats.set(requestSize);
        this.requestSeats();
        this.enterGame();
    }

    requestSeats(): void {
        this.awaitingResponse.set(true);
        let claimed = this.setup.claimSeats(this.requestedSeats());
        if (claimed.length != 0) {
            this.requestGranted.set(true);
            this.seatSelected.set(Array.from({length: this.players.length}, (v, i) => this.contains(i, claimed)));
            this.emptySeats = this.setup.hasEmptySeats();
        }
        this.awaitingResponse.set(false);
    }

    enterGame(): void {
        this.setup.enterGame();
    }

    contains(a: number, l: Array<number>): boolean {
        for (let i = 0; i < l.length; i++) {
            if (a == l[i]) {
                return true;
            }
        }
        return false;
    }
}
