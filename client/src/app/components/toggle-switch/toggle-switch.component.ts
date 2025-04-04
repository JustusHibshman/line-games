import { Component, input, OnChanges, OnInit, output, signal, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-toggle-switch',
  imports: [FormsModule],
  templateUrl: './toggle-switch.component.html',
  styleUrl: './toggle-switch.component.scss'
})
export class ToggleSwitchComponent implements OnInit, OnChanges {
    defaultValue = input<boolean>(false);
    disable      = input<boolean>(false);
    theValue     = signal<boolean>(false);
    choice       = output<boolean>();

    ngOnInit(): void {
        this.theValue.set(this.defaultValue());
        this.choice.emit(this.theValue());
    }

    ngOnChanges(changes: SimpleChanges): void {
        if ((changes['disable'] && changes['disable'].currentValue) || 
                (changes['defaultValue'] && 
                 changes['defaultValue'].currentValue != changes['defaultValue'].previousValue)) {
            /* If disabled or the default value changes */
            if (this.theValue() != this.defaultValue()) {
                /* If we actually need to change */
                this.theValue.set(this.defaultValue());
                this.choice.emit(this.theValue());
            }
        }
    }

    changeFn(): void {
        this.choice.emit(this.theValue());
    }
}
