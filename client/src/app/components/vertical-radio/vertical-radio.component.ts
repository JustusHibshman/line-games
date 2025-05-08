import { Component, input, OnInit, output, signal } from '@angular/core';

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

    size  = input<string>("medium");
    color = input<string>("B");

    ngOnInit(): void {
        let d: number | null = this.defaultIdx();
        if (d !== null) {
            this.select(d);
        }
    }

    select(idx: number): void {
        this.chosenIdx.set(idx);
        this.value.emit(this.options()[idx]);
    }
}
