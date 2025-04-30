import { Injectable, computed, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ColorSchemeService {

    darkMode = signal<boolean>(false);

    constructor() { }

    getDarkModeSignal() {
        return this.darkMode;
    }

    getColorScheme() {
        return computed(() => this.darkMode() ? "dark-theme" : "light-theme");
    }
}
