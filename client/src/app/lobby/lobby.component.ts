import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';

import { ActionButtonComponent } from '@local-components/action-button/action-button.component';
import { NavButtonComponent } from '@local-components/nav-button/nav-button.component';

import { PlayerType } from '@local-types/player-type.type';

import { BackendService } from '@local-services/backend.service';
import { GameplayService } from '@local-services/gameplay.service';

@Component({
  selector: 'app-lobby',
  imports: [ActionButtonComponent, NavButtonComponent],
  templateUrl: './lobby.component.html',
  styleUrl: './lobby.component.scss'
})
export class LobbyComponent implements OnInit {

    router = inject(Router);
    backendService = inject(BackendService);
    gameplayService = inject(GameplayService);

    seats = signal<Array<boolean>>([]);
    colors = ["E", "F", "A", "B", "C", "D"];

    ngOnInit(): void {
        this.updateSeatsSignal();
    }

    async requestSeat() {
        let success: boolean = await this.backendService.requestAnotherSeat();
        if (success) {
            this.updateSeatsSignal();
        }
    }

    enterGame(): void {
        let success: boolean = this.gameplayService.loadInitialGameDetails();
        if (success) {
            this.router.navigate(['/play']);
        }
    }

    updateSeatsSignal(): void {
        let pTypes: Array<PlayerType> = this.backendService.getSeats();
        this.seats.set(Array.from(pTypes, (v) => (v == PlayerType.Human)));
    }
}
