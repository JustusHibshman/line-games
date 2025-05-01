import { Component, computed, input, model, OnChanges, output, signal, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-integer-input',
  imports: [FormsModule],
  templateUrl: './integer-input.component.html',
  styleUrl: './integer-input.component.scss'
})
export class IntegerInputComponent implements OnChanges{
    min     = input<number>(1);
    max     = input<number | null>(null);
    value   = model.required<number>();

    size    = input<string>("medium");
    color   = input<string>("B");

    disable = input<boolean>(false);
    status  = computed(() => this.disable() ? "dead" : "live");

    mayHaveChanged = output<void>();

    increment(): void {
        let m: number | null = this.max();
        if (m === null || this.value() < m) {
            this.value.set(this.value() + 1);
            this.mayHaveChanged.emit();
        }
    }

    decrement(): void {
        if (this.value() > this.min()) {
            this.value.set(this.value() - 1);
            this.mayHaveChanged.emit();
        }
    }

    checkLegal(): void {
        this.value.set(Math.round(this.value()));
        let m: number | null = this.max();
        if (m !== null && this.value() > m) {
            this.value.set(m);
        } else if (this.value() < this.min()) {
            this.value.set(this.min());
        }
        this.mayHaveChanged.emit();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['min'] || changes['max']) {
            this.checkLegal();
        }
    }
}
