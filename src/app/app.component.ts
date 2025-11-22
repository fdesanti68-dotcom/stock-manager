import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
    MatListModule
  ],
  template: `
    <mat-toolbar color="primary">
      <button mat-icon-button (click)="drawer.toggle()">
        <mat-icon>menu</mat-icon>
      </button>
      <span>Stocks Manager v2</span>
    </mat-toolbar>

    <mat-drawer-container class="container-drawer" autosize>
      <mat-drawer #drawer mode="side" opened>
        <mat-nav-list>
          <a mat-list-item routerLink="/dashboard" routerLinkActive="active" (click)="drawer.close()">
            <mat-icon matListItemIcon>dashboard</mat-icon>
            <span matListItemTitle>Dashboard</span>
          </a>
          <a mat-list-item routerLink="/investments" routerLinkActive="active" (click)="drawer.close()">
            <mat-icon matListItemIcon>trending_up</mat-icon>
            <span matListItemTitle>Investimentos</span>
          </a>
          <a mat-list-item routerLink="/settings" routerLinkActive="active" (click)="drawer.close()">
            <mat-icon matListItemIcon>settings</mat-icon>
            <span matListItemTitle>Configurações</span>
          </a>
        </mat-nav-list>
      </mat-drawer>

      <div class="content">
        <router-outlet></router-outlet>
      </div>
    </mat-drawer-container>
  `,
  styles: [`
    .container-drawer {
      height: calc(100vh - 64px);
    }

    .content {
      padding: 20px;
      min-height: 100%;
    }

    mat-drawer {
      width: 250px;
    }

    .active {
      background-color: rgba(0, 0, 0, 0.04);
    }
  `]
})
export class AppComponent {
  title = 'stock-manager-v2';
}
