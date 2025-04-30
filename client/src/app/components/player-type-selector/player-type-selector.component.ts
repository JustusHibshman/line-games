import { Component, computed, input, model } from '@angular/core';
import { PlayerType } from '@local-types/player-type.type';

@Component({
  selector: 'app-player-type-selector',
  imports: [],
  templateUrl: './player-type-selector.component.html',
  styleUrl: './player-type-selector.component.scss'
})
export class PlayerTypeSelectorComponent {

    public PlayerTypes = PlayerType;

    choice  = model.required<PlayerType>();
    disable = input<boolean>(false);
    formID  = input.required<string>();

    size    = input<string>("medium");
    
    colorClasses = ["content-B", "disabled", "content-C", "content-C"];
    hc  = computed(() => this.colorClasses[
            (+ (this.choice() == PlayerType.Human)) * 2 + (+ this.disable())]);
    aic = computed(() => this.colorClasses[
            (+ (this.choice() == PlayerType.AI)) * 2    + (+ this.disable())]);
    nc  = computed(() => this.colorClasses[
            (+ (this.choice() == PlayerType.None)) * 2  + (+ this.disable())]);
    borderClass = computed(() => this.colorClasses[
            (+ (this.choice() != PlayerType.None)) * 2  + (+ this.disable())]);

    setValue(t: PlayerType): void {
        this.choice.set(t);
    }
}
