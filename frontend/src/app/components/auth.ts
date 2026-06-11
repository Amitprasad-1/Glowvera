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

  loginData = {
    email: '',
    password: ''
  };

  registerData = {
    name: '',
    email: '',
    password: ''
  };

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
        this.errorMessage = err.error?.message || 'Invalid email or password. Please try again.';
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
        this.errorMessage = err.error?.message || 'Failed to create account. Email might be in use.';
      }
    });
  }
}
