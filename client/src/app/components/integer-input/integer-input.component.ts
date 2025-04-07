import { Component, computed, input, model, OnChanges, signal, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-integer-input',
  imports: [FormsModule],
  templateUrl: './integer-input.component.html',
  styleUrl: './integer-input.component.scss'
})
export class IntegerInputComponent implements OnChanges{
    disable = input<boolean>(false);
    min     = input<number>(1);
    max     = input.required<number>();
    value   = model.required<number>();
    status  = computed(() => this.disable() ? "dead" : "live");
    /* text    = signal<string>(String(this.value)); */

    increment(): void {
        if (this.value() < this.max()) {
            this.value.set(this.value() + 1);
        }
    }

    decrement(): void {
        if (this.value() > this.min()) {
            this.value.set(this.value() - 1);
        }
    }

    checkLegal(): void {
        this.value.set(Math.round(this.value()));
        if (this.value() > this.max()) {
            this.value.set(this.max());
        } else if (this.value() < this.min()) {
            this.value.set(this.min());
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['min'] || changes['max']) {
            this.checkLegal();
        }
    }
}
