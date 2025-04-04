import { Component, signal } from '@angular/core';
import { NavButtonComponent } from '@local-components/nav-button/nav-button.component';
import { ToggleSwitchComponent } from '@local-components/toggle-switch/toggle-switch.component';

@Component({
  selector: 'app-host',
  imports: [NavButtonComponent, ToggleSwitchComponent],
  templateUrl: './host.component.html',
  styleUrl: './host.component.scss'
})
export class HostComponent {
    gravity:       boolean = false;
    allowCaptures = signal<boolean>(false);
    winByCaptures: boolean = false;

    setGravity(event: boolean): void {
        this.gravity = event;
    }

    setAllowCaptures(event: boolean): void {
        this.allowCaptures.set(event);
    }

    setWinByCaptures(event: boolean): void {
        this.winByCaptures = event;
    }
}
