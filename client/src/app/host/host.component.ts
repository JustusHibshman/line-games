import { Component } from '@angular/core';
import { NavButtonComponent } from '@local-components/nav-button/nav-button.component';
import { ToggleSwitchComponent } from '@local-components/toggle-switch/toggle-switch.component';

@Component({
  selector: 'app-host',
  imports: [NavButtonComponent, ToggleSwitchComponent],
  templateUrl: './host.component.html',
  styleUrl: './host.component.scss'
})
export class HostComponent {

}
