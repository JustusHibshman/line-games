import { Component, inject, OnInit, signal } from '@angular/core';

import { ActionButtonComponent } from '@local-components/action-button/action-button.component';
import { NavButtonComponent } from '@local-components/nav-button/nav-button.component';
import { TextBoxComponent } from '@local-components/text-box/text-box.component';

import { GameListing } from '@local-types/game-listing.type';

import { SortedPipe } from '@local-pipes/sorted.pipe';

import { SetupService } from '@local-services/setup.service';

@Component({
  selector: 'app-join',
  imports: [ActionButtonComponent, NavButtonComponent, TextBoxComponent,
            SortedPipe],
  templateUrl: './join.component.html',
  styleUrl: './join.component.scss'
})
export class JoinComponent implements OnInit {
    setup = inject(SetupService);

    games: Array<GameListing> = [
        { gameID: 0, name: "Placeholder" },
        { gameID: 1, name: "Fried Chicken" },
        { gameID: 17, name: "Lucky 17"},
    ];

    test = ["Hello", "Abc", "1dchess", "Zeta"];

    typed: any = [];

    ngOnInit(): void {
        this.games.sort(this.compareListings)
        this.typed = Array.from({ length: this.games.length }, () => signal<string>(""));
        this.setup.quitGame();
    }

    joinGame(idx: number): void {
        console.log("Attempted to join game " + String(idx));
        console.log("Current password entry: " + this.typed[idx]());
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
