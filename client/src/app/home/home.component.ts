import { Component, inject, signal, WritableSignal } from '@angular/core';

import { NavButtonComponent } from '@local-components/nav-button/nav-button.component';

import { SetupService } from '@local-services/setup.service';

@Component({
  selector: 'app-home',
  imports: [NavButtonComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
    setup = inject(SetupService);

    validSpots = [
                    [1,1,0,0,0,0,1,1,0,1,1,0,0,0,1,1,0,1,1,1,1,1,0,0,0,1,1,1,1,0],
                    [1,1,0,0,0,0,1,1,0,1,1,0,0,0,1,1,0,1,1,1,1,1,0,0,1,1,1,1,1,1],
                    [1,1,0,0,0,0,1,1,0,1,1,1,0,0,1,1,0,1,1,0,0,0,0,1,1,1,0,0,1,1],
                    [1,1,0,0,0,0,1,1,0,1,1,1,1,0,1,1,0,1,1,1,1,0,0,0,1,1,1,1,0,0],
                    [1,1,0,0,0,0,1,1,0,1,1,0,1,1,1,1,0,1,1,1,1,0,0,0,0,1,1,1,1,0],
                    [1,1,0,0,0,0,1,1,0,1,1,0,0,1,1,1,0,1,1,0,0,0,0,1,1,0,0,1,1,1],
                    [1,1,1,1,1,0,1,1,0,1,1,0,0,0,1,1,0,1,1,1,1,1,0,1,1,1,1,1,1,0],
                    [1,1,1,1,1,0,1,1,0,1,1,0,0,0,1,1,0,1,1,1,1,1,0,0,1,1,1,1,0,0],
                 ];
    height: number = this.validSpots.length;
    width:  number = this.validSpots[0].length;
    funBackdrop = signal<Array<Array<string>>>([]);

    constructor() {
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
                        result[r][c] = "color" + colors[Math.floor(Math.random() * colors.length)];
                    }
                }
            }
        }
        context.funBackdrop.set(result);
    }

    canBeSet(r: number, c: number): boolean {
        return this.validSpots[r][c] == 1;
        let thickness = 2;
        return r < thickness || r + thickness >= this.height ||
               c < thickness || c + thickness >= this.width;
    }
}
