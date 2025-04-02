import { Component } from '@angular/core';
import { NavButtonComponent } from '@local-components/nav-button/nav-button.component';

@Component({
  selector: 'app-home',
  imports: [NavButtonComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {

}
