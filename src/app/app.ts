import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink],
  template: `
    <main class="main">
      <header>
        <div>
          <h1>{{ title() }}</h1>
        </div>
        <div class="divider" role="separator" aria-label="Divider"></div>
        <nav class="pill-group">
          @for (item of [
            { title: 'Home', link: ['/'] },
            { title: 'Login', link: ['/login'] },
            { title: 'Admin', link: ['/admin'] },
          ]; track item.title) {
            <a
              class="pill"
              [routerLink]="item.link"
            >
              <span>{{ item.title }}</span>
            </a>
          }
        </nav>
      </header>
      <router-outlet />
    </main>`,
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('Screens');
}
