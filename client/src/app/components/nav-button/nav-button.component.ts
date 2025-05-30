import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-nav-button',
  imports: [RouterLink],
  templateUrl: './nav-button.component.html',
  styleUrl: './nav-button.component.scss'
})
export class NavButtonComponent {
    target  = input.required<string>();
    text    = input.required<string>();
    color   = input<string>("B");
    size    = input<string>("huge");
    disable = input<boolean>(false);
    pale    = input<boolean>(false);
}
