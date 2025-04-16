import { Component, inject } from '@angular/core';

import { NavButtonComponent } from '@local-components/nav-button/nav-button.component';

import { SetupService } from '@local-services/setup.service';

@Component({
  selector: 'app-home',
  imports: [NavButtonComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
    setup = inject(SetupService);
}
