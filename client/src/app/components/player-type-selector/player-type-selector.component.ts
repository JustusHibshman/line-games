import { Component, computed, input, model } from '@angular/core';

@Component({
  selector: 'app-player-type-selector',
  imports: [],
  templateUrl: './player-type-selector.component.html',
  styleUrl: './player-type-selector.component.scss'
})
export class PlayerTypeSelectorComponent {

    choice  = model<number>();
    disable = input<boolean>(false);
    formID  = input.required<string>();
    
    colorClasses = ["blueC", "grayC", "greenC", "greenC"];
    lhc = computed(() => this.colorClasses[((+ (this.choice() == 0)) * 2 + (+ this.disable()))]);
    dhc = computed(() => this.colorClasses[((+ (this.choice() == 1)) * 2 + (+ this.disable()))]);
    aic = computed(() => this.colorClasses[((+ (this.choice() == 2)) * 2 + (+ this.disable()))]);
    nc  = computed(() => this.colorClasses[((+ (this.choice() == 3)) * 2 + (+ this.disable()))]);

    setValue(n: number): void {
        console.log(this.lhc);
        this.choice.set(n);
    }
}
