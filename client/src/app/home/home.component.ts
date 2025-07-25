import { Component, computed, inject, signal, WritableSignal } from '@angular/core';

import { NavButtonComponent } from '@local-components/nav-button/nav-button.component';
import { ToggleSwitchComponent } from '@local-components/toggle-switch/toggle-switch.component';

import { ColorSchemeService } from '@local-services/color-scheme.service';
import { BackendService } from '@local-services/backend.service';
import { ScreenSizeService } from '@local-services/screen-size.service';

@Component({
  selector: 'app-home',
  imports: [NavButtonComponent, ToggleSwitchComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
    backendService = inject(BackendService);
    csService = inject(ColorSchemeService);
    screenSize = inject(ScreenSizeService);

    // Only set once because the home page should not change this status.
    inGame: boolean;

    screenWidth = this.screenSize.getWidth();

    buttonSize = computed(() => this.screenWidth() > 900 ? "huge" : 
                                (this.screenWidth() > 600 ? "large" : "medium"));

    darkMode = this.csService.getDarkModeSignal();

    validSpots: Array<Array<boolean>>;

    height: number;
    width:  number;
    funBackdrop = signal<Array<Array<string>>>([]);

    dotWidth = computed(() => this.dotWidthCalc(this.screenWidth()));

    constructor() {
        // Only set once because the home page should not change this status.
        this.inGame = this.backendService.inGame();

        this.validSpots = this.filledInCircle(23);
        this.height = this.validSpots.length;
        this.width  = this.validSpots[0].length;

        this.funBackdrop.set(Array.from({length: this.height},
                                        () => Array.from({length: this.width}, () => "")));
        setInterval(this.updateBackdrop, 250, this);
    }

    updateBackdrop(context: HomeComponent): void {
        let colors = ["A", "B", "C", "D", "E", "F"];
        let result: Array<Array<string>> = context.funBackdrop();
        let height = result.length;
        for (let r = 0; r < height; r++) {
            let width = result[r].length;
            for (let c = 0; c < width; c++) {
                if (context.canBeSet(r, c)) {
                    if (Math.random() > 0.91) {
                        // Change the color
                        result[r][c] = "solid-" + colors[Math.floor(Math.random() * colors.length)];
                    }
                }
            }
        }
        context.funBackdrop.set(result);
    }

    canBeSet(r: number, c: number): boolean {
        return this.validSpots[r][c];
    }

    dotWidthCalc(w: number): number {
        // TODO: Refactor this to minimize use of constants.
        let totalPadding = 60;
        let availableWidth = Math.min(600, Math.max(360, w - 2 * 160) - totalPadding);
        return 2 * Math.floor(availableWidth / (2 * this.validSpots[0].length));
    }

    filledInCircle(diameter: number): Array<Array<boolean>> {
        let radius = diameter / 2;
        let result = Array.from({length: diameter}, () => Array.from({length: diameter}, () => false));
        let centerX = radius;
        let centerY = radius;
        for (let r = 0; r < diameter; r++) {
            for (let c = 0; c < diameter; c++) {
                let x = c + 0.5;
                let y = r + 0.5;
                let distanceSquared = (centerX - x) * (centerX - x) +
                                      (centerY - y) * (centerY - y);
                if (distanceSquared <= radius * radius) {
                    result[r][c] = true;
                }
            }
        }
        return result;
    }
}
