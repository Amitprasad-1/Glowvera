import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../services/api.service';
import { CartService, ServiceItem } from '../services/cart.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class HomeComponent implements OnInit {
  private api = inject(ApiService);
  private cart = inject(CartService);
  private router = inject(Router);

  categories: any[] = [];
  services: ServiceItem[] = [];
  filteredServices: ServiceItem[] = [];
  stylists: any[] = [];
  selectedCategoryId: number | null = null;

  ngOnInit() {
    this.loadCategories();
    this.loadServices();
    this.loadStylists();
  }

  loadCategories() {
    this.api.getCategories().subscribe({
      next: (data) => {
        this.categories = data;
        if (data.length > 0) {
          this.selectCategory(data[0].id);
        }
      },
      error: (err) => console.error('Failed to load categories', err)
    });
  }

  loadServices() {
    // Load services for preview
    this.api.getServices('', 0, 50).subscribe({
      next: (page) => {
        this.services = page.content;
        this.filterServices();
      },
      error: (err) => console.error('Failed to load services', err)
    });
  }

  loadStylists() {
    this.api.getStylists().subscribe({
      next: (data) => {
        // Only show active stylists on landing showcase
        this.stylists = data.filter(s => s.isActive);
      },
      error: (err) => console.error('Failed to load stylists', err)
    });
  }

  selectCategory(categoryId: number) {
    this.selectedCategoryId = categoryId;
    this.filterServices();
  }

  filterServices() {
    if (this.selectedCategoryId) {
      this.filteredServices = this.services.filter(s => s.category.id === this.selectedCategoryId);
    } else {
      this.filteredServices = this.services;
    }
  }

  scrollToCategory(categoryId: number) {
    this.selectCategory(categoryId);
    const element = document.getElementById('services-preview');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  addToBooking(service: ServiceItem) {
    this.cart.addService(service);
    this.router.navigate(['/booking']);
  }

  scrollToServicesSection() {
    const element = document.getElementById('services-preview');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  formatTime(timeString: string): string {
    if (!timeString) return '';
    try {
      const parts = timeString.split(':');
      const hours = parseInt(parts[0], 10);
      const minutes = parts[1];
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const formattedHours = hours % 12 || 12;
      return `${formattedHours}:${minutes} ${ampm}`;
    } catch (e) {
      return timeString;
    }
  }

  getStylistImage(name: string): string {
    const images: { [key: string]: string } = {
      'Arjun Mehta': '/stylist_arjun.png',
      'Shreya Sharma': '/stylist_shreya.png',
      'Vikram Singh': '/stylist_vikram.png',
      'Pooja Patel': '/stylist_pooja.png'
    };
    return images[name] || '';
  }
}
