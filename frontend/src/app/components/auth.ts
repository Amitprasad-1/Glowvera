import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auth.html',
  styleUrl: './auth.css'
})
export class AuthComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  isLoginMode = true;
  errorMessage = '';
  successMessage = '';

  showLoginPassword = false;
  showRegisterPassword = false;

  loginData = {
    email: '',
    password: ''
  };

  registerData = {
    name: '',
    email: '',
    password: ''
  };

  toggleLoginPassword() {
    this.showLoginPassword = !this.showLoginPassword;
  }

  toggleRegisterPassword() {
    this.showRegisterPassword = !this.showRegisterPassword;
  }

  onForgotPassword() {
    this.errorMessage = '';
    this.successMessage = '';
    if (!this.loginData.email) {
      this.errorMessage = 'Please enter your email address first in the email field to request a reset.';
      return;
    }
    // Simulate password reset request
    this.successMessage = `A password reset link has been simulated & written to console for ${this.loginData.email}`;
    console.log(`[PASSWORD RESET SIMULATION] Reset link requested for email: ${this.loginData.email}`);
  }

  onLogin() {
    this.errorMessage = '';
    this.successMessage = '';
    
    this.authService.login(this.loginData).subscribe({
      next: (user) => {
        if (user.role === 'ADMIN') {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate(['/booking']);
        }
      },
      error: (err) => {
        if (err.error?.errors && Array.isArray(err.error.errors)) {
          this.errorMessage = err.error.errors.map((e: any) => e.defaultMessage || e.message).join(', ');
        } else {
          this.errorMessage = err.error?.message || 'Invalid email or password. Please try again.';
        }
      }
    });
  }

  onRegister() {
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.register(this.registerData).subscribe({
      next: () => {
        this.router.navigate(['/booking']);
      },
      error: (err) => {
        if (err.error?.errors && Array.isArray(err.error.errors)) {
          this.errorMessage = err.error.errors.map((e: any) => e.defaultMessage || e.message).join(', ');
        } else {
          this.errorMessage = err.error?.message || 'Failed to create account. Email might be in use.';
        }
      }
    });
  }
}
