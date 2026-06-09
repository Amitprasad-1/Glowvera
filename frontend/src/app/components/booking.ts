import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subscription, interval } from 'rxjs';

import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { CartService, ServiceItem } from '../services/cart.service';

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './booking.html',
  styleUrl: './booking.css'
})
export class BookingComponent implements OnInit, OnDestroy {
  public api = inject(ApiService);
  public auth = inject(AuthService);
  private cart = inject(CartService);

  // Cart proxies
  cartServices = this.cart.selectedServices;
  cartTotalPrice = this.cart.totalPrice;
  cartTotalDuration = this.cart.totalDuration;

  categories: any[] = [];
  categoryServices: ServiceItem[] = [];
  allServices: ServiceItem[] = [];
  recommendations: ServiceItem[] = [];
  selectedCategoryId: number | null = null;

  // Booking Flow States
  qualifiedStylists: any[] = [];
  selectedDate: string = '';
  selectedStylistId: number | null = null;
  todayString: string = '';

  availableSlots: string[] = [];
  loadingSlots = false;
  selectedSlot: string | null = null;

  // Temporary Hold Properties
  isHoldActive = false;
  holdTimeRemaining = '05:00';
  holdProgressPct = 100;
  private holdTimerSubscription?: Subscription;
  private holdDurationSeconds = 300; // 5 mins
  private holdSecondsLeft = 300;
  holdError = '';

  // Confirm booking state
  bookingInProgress = false;
  bookingSuccess = false;
  confirmedAppointment: any = null;

  // History list
  myBookings: any[] = [];

  ngOnInit() {
    // Set date minimum to today
    const today = new Date();
    this.todayString = today.toISOString().split('T')[0];

    this.loadCategories();
    this.loadAllServices();
    if (this.auth.isAuthenticated()) {
      this.loadMyBookings();
    }
  }

  ngOnDestroy() {
    this.clearHoldTimer();
  }

  loadCategories() {
    this.api.getCategories().subscribe(data => {
      this.categories = data;
      if (data.length > 0) {
        this.selectCategory(data[0].id);
      }
    });
  }

  loadAllServices() {
    this.api.getServices('', 0, 100).subscribe(page => {
      this.allServices = page.content;
      this.updateRecommendations();
      this.loadQualifiedStylists();
    });
  }

  loadMyBookings() {
    this.api.getMyAppointments().subscribe(data => {
      this.myBookings = data;
    });
  }

  selectCategory(categoryId: number) {
    this.selectedCategoryId = categoryId;
    this.api.getServicesByCategory(categoryId).subscribe(data => {
      this.categoryServices = data;
    });
  }

  isServiceInCart(serviceId: number): boolean {
    return this.cartServices().some(s => s.id === serviceId);
  }

  addServiceToCart(service: ServiceItem) {
    this.cart.addService(service);
    this.updateRecommendations();
    this.loadQualifiedStylists();
    this.resetScheduleAndSlotChoice();
  }

  removeServiceFromCart(serviceId: number) {
    this.cart.removeService(serviceId);
    this.updateRecommendations();
    this.loadQualifiedStylists();
    this.resetScheduleAndSlotChoice();
  }

  updateRecommendations() {
    this.recommendations = this.cart.getRecommendations(this.allServices);
  }

  loadQualifiedStylists() {
    if (this.cartServices().length === 0) {
      this.qualifiedStylists = [];
      return;
    }
    const serviceIds = this.cartServices().map(s => s.id);
    this.api.getFilteredStylists(serviceIds).subscribe(data => {
      this.qualifiedStylists = data;
    });
  }

  resetScheduleAndSlotChoice() {
    this.selectedSlot = null;
    this.clearHoldTimer();
    this.isHoldActive = false;
    this.availableSlots = [];
  }

  onScheduleParamsChange() {
    this.selectedSlot = null;
    this.clearHoldTimer();
    this.isHoldActive = false;
    
    if (!this.selectedDate || !this.selectedStylistId) {
      return;
    }

    this.loadingSlots = true;
    const serviceIds = this.cartServices().map(s => s.id);

    this.api.getAvailableSlots(this.selectedStylistId, this.selectedDate, serviceIds).subscribe({
      next: (slots) => {
        this.availableSlots = slots;
        this.loadingSlots = false;
      },
      error: (err) => {
        console.error(err);
        this.loadingSlots = false;
      }
    });
  }

  onSelectSlot(slot: string) {
    this.selectedSlot = slot;
    this.holdError = '';
    this.clearHoldTimer();

    // Call backend API to hold slot
    this.api.holdSlot(this.selectedStylistId!, slot, this.cartTotalDuration()).subscribe({
      next: (res) => {
        if (res.success) {
          this.startHoldTimer();
        } else {
          this.holdError = res.message;
        }
      },
      error: (err) => {
        this.holdError = err.error?.message || 'Conflict. This slot was locked by another user.';
      }
    });
  }

  startHoldTimer() {
    this.isHoldActive = true;
    this.holdSecondsLeft = this.holdDurationSeconds;
    this.updateHoldTimerText();

    this.holdTimerSubscription = interval(1000).subscribe(() => {
      this.holdSecondsLeft--;
      this.holdProgressPct = (this.holdSecondsLeft / this.holdDurationSeconds) * 100;
      this.updateHoldTimerText();

      if (this.holdSecondsLeft <= 0) {
        this.clearHoldTimer();
        this.isHoldActive = false;
        this.selectedSlot = null;
        this.holdError = 'Hold expired. Please click the time slot again to lock it.';
      }
    });
  }

  updateHoldTimerText() {
    const mins = Math.floor(this.holdSecondsLeft / 60);
    const secs = this.holdSecondsLeft % 60;
    const minsStr = mins < 10 ? '0' + mins : mins.toString();
    const secsStr = secs < 10 ? '0' + secs : secs.toString();
    this.holdTimeRemaining = `${minsStr}:${secsStr}`;
  }

  clearHoldTimer() {
    if (this.holdTimerSubscription) {
      this.holdTimerSubscription.unsubscribe();
      this.holdTimerSubscription = undefined;
    }
  }

  onConfirmBooking() {
    if (!this.selectedSlot || !this.selectedStylistId) return;

    this.bookingInProgress = true;
    this.holdError = '';
    const serviceIds = this.cartServices().map(s => s.id);

    this.api.bookAppointment(this.selectedStylistId, serviceIds, this.selectedSlot).subscribe({
      next: (appt) => {
        this.bookingInProgress = false;
        this.confirmedAppointment = appt;
        this.bookingSuccess = true;
        this.cart.clear();
        this.clearHoldTimer();
        this.isHoldActive = false;
        this.loadMyBookings();
      },
      error: (err) => {
        this.bookingInProgress = false;
        this.holdError = err.error?.message || 'A concurrency conflict occurred. The slot was booked by someone else.';
      }
    });
  }

  cancelBooking(id: number) {
    if (confirm('Are you sure you want to cancel this appointment?')) {
      this.api.cancelAppointment(id).subscribe(() => {
        this.loadMyBookings();
      });
    }
  }

  isUpcoming(dateTimeStr: string): boolean {
    return new Date(dateTimeStr) > new Date();
  }

  resetBookingFlow() {
    this.bookingSuccess = false;
    this.confirmedAppointment = null;
    this.selectedDate = '';
    this.selectedStylistId = null;
    this.resetScheduleAndSlotChoice();
  }

  // Formatting helpers
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

  formatDateTime(dateTimeString: string | null, type: 'full' | 'dateOnly' | 'timeOnly' = 'full'): string {
    if (!dateTimeString) return '';
    const d = new Date(dateTimeString);
    if (isNaN(d.getTime())) return dateTimeString;

    if (type === 'dateOnly') {
      return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    }

    const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    if (type === 'timeOnly') return time;

    return `${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} at ${time}`;
  }
}
