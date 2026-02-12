import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-admin',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <section>
      <h1>Admin Dashboard</h1>
      <div class="split">
        <nav>
          <ul>
            <li><a [routerLink]="['suggestions']" routerLinkActive="active">Suggestions</a></li>
            <li>
              <a [routerLink]="['published-devices']" routerLinkActive="active"
                >Published Devices</a
              >
            </li>
          </ul>
        </nav>
        <router-outlet></router-outlet>
      </div>
    </section>
  `,
  styleUrl: './admin.css',
})
export class Admin {}
