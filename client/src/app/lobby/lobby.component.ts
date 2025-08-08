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
    ai =                signal<Array<boolean>>([]);
    hasEmptySeat = computed(() => this.hasATrue(this.empty()));
    
    colors = ["E", "F", "A", "B", "C", "D"];
    updaterInterval = 0;

    ngOnInit(): void {
        this.updateSeatsSignal();
        this.updateSeats(this);
        this.updaterInterval = setInterval(this.updateSeats, 1500, this);
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

    async updateSeats(obj: LobbyComponent) {
        let emptySeats: Array<number> | null = await obj.backendService.getEmptySeats();
        let aiSeats:    Array<number> | null = await obj.backendService.getAISeats();
        let pTypes: Array<PlayerType> = obj.backendService.getSeats();

        let empty:  Array<boolean> = Array.from({length: pTypes.length}, () => false);
        let ai:     Array<boolean> = Array.from({length: pTypes.length}, () => false);
        if (emptySeats !== null) {
            for (var seatIdx of emptySeats) {
                empty[seatIdx] = true;
            }
        }
        if (aiSeats !== null) {
            for (var seatIdx of aiSeats) {
                ai[seatIdx] = true;
            }
        }
        obj.empty.set(empty);
        obj.ai.set(ai);
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

    hasATrue(a: Array<boolean>): boolean {
        for (var val of a) {
            if (val) {
                return true;
            }
        }
        return false;
    }
}
