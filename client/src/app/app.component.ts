import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { ColorSchemeService } from '@local-services/color-scheme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
    csService = inject(ColorSchemeService);
    colorScheme = this.csService.getColorScheme();
}
