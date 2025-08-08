import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
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
export class LobbyComponent implements OnInit, OnDestroy {

    router = inject(Router);
    backendService = inject(BackendService);
    gameplayService = inject(GameplayService);

    localHumanClaimed = signal<Array<boolean>>([]);
    empty =             signal<Array<boolean>>([]);
    
    colors = ["E", "F", "A", "B", "C", "D"];
    updaterInterval = 0;

    ngOnInit(): void {
        this.updateSeatsSignal();
        this.updateEmptySeats(this);
        this.updaterInterval = setInterval(this.updateEmptySeats, 1000, this);
    }

    ngOnDestroy(): void {
        clearInterval(this.updaterInterval);
    }

    async requestSeat() {
        let success: boolean = await this.backendService.requestAnotherSeat();
        if (success) {
            this.updateSeatsSignal();
        }
    }

    async updateEmptySeats(obj: LobbyComponent) {
        console.log("Updating Empty Seats Data")
        let emptySeats: Array<number> | null = await obj.backendService.getEmptySeats();
        if (emptySeats === null) {
            return;
        }
        let pTypes: Array<PlayerType> = obj.backendService.getSeats();
        let empty: Array<boolean> = Array.from({length: pTypes.length}, () => false);
        for (var seatIdx of emptySeats) {
            empty[seatIdx] = true;
        }
        obj.empty.set(empty);
    }

    enterGame(): void {
        let success: boolean = this.gameplayService.loadInitialGameDetails();
        if (success) {
            this.router.navigate(['/play']);
        }
    }

    updateSeatsSignal(): void {
        let pTypes: Array<PlayerType> = this.backendService.getSeats();
        this.localHumanClaimed.set(Array.from(pTypes, (v) => (v == PlayerType.Human)));
    }
}
