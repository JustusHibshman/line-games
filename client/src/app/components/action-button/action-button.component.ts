import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-action-button',
  imports: [],
  templateUrl: './action-button.component.html',
  styleUrl: './action-button.component.scss'
})
export class ActionButtonComponent {
    text    = input.required<string>();
    disable = input<boolean>(false);
    size    = input<string>("medium");
    color   = input<string>("C");
}
