import { Component, input } from '@angular/core';

@Component({
  selector: 'app-help-hover-box',
  imports: [],
  templateUrl: './help-hover-box.component.html',
  styleUrl: './help-hover-box.component.scss'
})
export class HelpHoverBoxComponent {
    text = input.required<string>();

    color = input<string>("B");
    size  = input<string>("small");

    popupAboveQMark = input<boolean>(false);
}
