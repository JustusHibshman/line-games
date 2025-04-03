import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-nav-button',
  imports: [RouterLink],
  templateUrl: './nav-button.component.html',
  styleUrl: './nav-button.component.scss'
})
export class NavButtonComponent {
    target = input.required<string>();
    text   = input.required<string>();
    live   = input<boolean>(true);
    targetHTML = computed(() => this.live() ? this.target() : 'null');
    classHTML  = computed(() => this.live() ? 'live' : 'dead');
}
