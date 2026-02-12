import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-admin',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <section>
      <a [routerLink]="['/']" class="back-link"> <span>&larr;</span> Back to Home </a>
      <h1>Admin Dashboard</h1>
      <nav>
        <ul>
          <li><a [routerLink]="['suggestions']" routerLinkActive="active">Suggestions</a></li>
          <li>
            <a [routerLink]="['published-devices']" routerLinkActive="active">Published Devices</a>
          </li>
        </ul>
      </nav>
      <div class="content">
        <router-outlet></router-outlet>
      </div>
    </section>
  `,
  styleUrl: './admin.css',
})
export class Admin {}
