import { Component, inject, HostListener } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  public auth = inject(AuthService);
  mobileMenuOpen = false;

  // PWA installation properties
  deferredPrompt: any = null;
  showInstallBtn = false;

  @HostListener('window:beforeinstallprompt', ['$event'])
  onBeforeInstallPrompt(e: Event) {
    // Prevent standard Chrome install promo bar from appearing
    e.preventDefault();
    // Stash the event so it can be triggered later
    this.deferredPrompt = e;
    // Show the install button in our UI
    this.showInstallBtn = true;
    console.log('beforeinstallprompt event captured; install button enabled.');
  }

  installPwa() {
    if (!this.deferredPrompt) return;
    // Show Chrome/browser native install dialog
    this.deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    this.deferredPrompt.userChoice.then((choiceResult: { outcome: string }) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the PWA install prompt');
      } else {
        console.log('User dismissed the PWA install prompt');
      }
      this.deferredPrompt = null;
      this.showInstallBtn = false;
    });
  }

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu() {
    this.mobileMenuOpen = false;
  }

  logout() {
    this.auth.logout();
    this.closeMobileMenu();
  }
}
