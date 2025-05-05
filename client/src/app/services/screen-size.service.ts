import { Injectable, computed, signal, Signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ScreenSizeService {

    constructor() { }

    screenWidth  = signal<number>(0);
    screenHeight = signal<number>(0);

    setWidth(w: number): void {
        this.screenWidth.set(w);
    }

    setHeight(h: number): void {
        this.screenHeight.set(h);
    }

    getWidth(): Signal<number> {
        return computed(() => this.screenWidth());
    }

    getHeight(): Signal<number> {
        return computed(() => this.screenHeight());
    }
}
