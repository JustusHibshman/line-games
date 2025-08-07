import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';

import { ActionButtonComponent } from '@local-components/action-button/action-button.component';
import { NavButtonComponent } from '@local-components/nav-button/nav-button.component';
import { TextBoxComponent } from '@local-components/text-box/text-box.component';

import { GameListing } from '@local-types/game-listing.type';
import { GameListings } from '@local-types/game-listings.type';

import { SortedPipe } from '@local-pipes/sorted.pipe';

import { BackendService } from '@local-services/backend.service';

@Component({
  selector: 'app-join',
  imports: [ActionButtonComponent, NavButtonComponent, TextBoxComponent,
            SortedPipe],
  templateUrl: './join.component.html',
  styleUrl: './join.component.scss'
})
export class JoinComponent implements OnInit {

    router = inject(Router);
    backendService = inject(BackendService);

    refreshable = signal<boolean>(true);
    games = signal<Array<GameListing>>([]);
    typed: any = [];
    attemptedRecently = signal<boolean>(false);

    async updateGames() {
        this.refreshable.set(false);
        let gls: GameListings | null = await this.backendService.getGameList();
        if (gls === null) {
            return;
        }
        let games: Array<GameListing> = [];
        for (let i = 0; i < gls.gameIDs.length; i += 1) {
            games.push({gameID: gls.gameIDs[i], name: gls.names[i]});
        }
        games.sort(this.compareListings);
        this.typed = Array.from({ length: games.length }, () => signal<string>(""));
        this.games.set(games);

        // Wait for 1 second before allowing another refresh.
        setTimeout( ( (obj) => (() => { this.refreshable.set(true) }) )(this), 1000);
    }

    ngOnInit(): void {
        this.updateGames();
    }

    allowJoinAttempt(obj: JoinComponent): void {
        obj.attemptedRecently.set(false);
    }

    async joinGame(idx: number) {
        this.attemptedRecently.set(true);
        setTimeout(this.allowJoinAttempt, 2000, this);

        let gameID: BigInt = this.games()[idx].gameID;
        let password: string = this.typed[idx]();

        let success: boolean = await this.backendService.joinGame(gameID, password);
        if (success) {
            this.router.navigate(['/lobby']);
        }
    }

    compareListings(a: GameListing, b: GameListing): number {
        if (a.name < b.name) {
            return -1;
        } else if (b.name < a.name) {
            return 1;
        } else {
            return 0;
        }
    }

    getGameName(g: GameListing): string {
        return g.name;
    }
}
