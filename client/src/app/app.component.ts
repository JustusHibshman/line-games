import { Component, HostListener, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { ColorSchemeService } from '@local-services/color-scheme.service';
import { ScreenSizeService } from '@local-services/screen-size.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
    csService = inject(ColorSchemeService);
    colorScheme = this.csService.getColorScheme();
    screenSize = inject(ScreenSizeService);

    constructor() { }

    ngOnInit() {
        this.screenSize.setWidth(document.body.clientWidth);
        this.screenSize.setHeight(document.body.clientHeight);
    }

    @HostListener('window:resize', ['$event'])
    onWindowResize() {
        this.screenSize.setWidth(document.body.clientWidth);
        this.screenSize.setHeight(document.body.clientHeight);
    }
}
