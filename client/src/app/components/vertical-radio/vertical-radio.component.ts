import { Component, input, OnInit, output, signal, WritableSignal } from '@angular/core';

@Component({
  selector: 'app-vertical-radio',
  imports: [],
  templateUrl: './vertical-radio.component.html',
  styleUrl: './vertical-radio.component.scss'
})
export class VerticalRadioComponent implements OnInit {

    options = input.required<Array<string>>();
    defaultIdx = input<number | null>(null);
    chosenIdx  = signal<number | null>(null);
    value = output<string>();

    unSelectedStyle: Array<WritableSignal<string>> = [];

    size  = input<string>("medium");
    color = input<string>("B");

    ngOnInit(): void {
        let d: number | null = this.defaultIdx();
        if (d !== null) {
            this.select(d);
        }
        this.unSelectedStyle = Array.from(this.options(), () => signal<string>("un-selected"));
    }

    select(idx: number): void {
        let priorValue: number | null = this.chosenIdx();
        if (priorValue !== null) {
            this.unSelectedStyle[priorValue].set("un-selected");
        }
        this.chosenIdx.set(idx);
        this.unSelectedStyle[idx].set("");
        this.value.emit(this.options()[idx]);
    }
}
