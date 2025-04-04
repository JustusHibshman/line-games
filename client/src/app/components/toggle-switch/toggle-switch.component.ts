import { Component, input, OnInit, output, signal } from '@angular/core';

@Component({
  selector: 'app-toggle-switch',
  imports: [],
  templateUrl: './toggle-switch.component.html',
  styleUrl: './toggle-switch.component.scss'
})
export class ToggleSwitchComponent implements OnInit {
    defaultValue = input<boolean>(false);
    disable      = input<boolean>(false);
    value        = signal<boolean>(false);
    choice       = output<boolean>();

    ngOnInit(): void {
        this.value.set(this.defaultValue());
        this.choice.emit(this.value());
    }

    toggle(): void {
        if (this.disable()) {
            this.value.set(this.defaultValue());
        } else {
            this.value.set(!this.value());
        }
        this.choice.emit(this.value());
    }
}
