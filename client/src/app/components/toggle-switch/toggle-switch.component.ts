import { Component, input, model, OnChanges, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-toggle-switch',
  imports: [FormsModule],
  templateUrl: './toggle-switch.component.html',
  styleUrl: './toggle-switch.component.scss'
})
export class ToggleSwitchComponent implements OnChanges {
    value        = model<boolean>();
    defaultValue = input<boolean>(false);
    disable      = input<boolean>(false);

    ngOnChanges(changes: SimpleChanges): void {
        if ((changes['disable'] && changes['disable'].currentValue) || 
                (changes['defaultValue'] && 
                 changes['defaultValue'].currentValue != changes['defaultValue'].previousValue)) {
            /* If disabled or the default value changes */
            if (this.value() != this.defaultValue()) {
                /* If we actually need to change */
                this.value.set(this.defaultValue());
            }
        }
    }
}
