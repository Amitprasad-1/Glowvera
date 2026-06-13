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
  styleUrl: './booking.css',
  host: {
    '[class.modal-open]': 'showPaymentModal'
  }
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
  bookingDays: { dateString: string, dayName: string, dayNum: string, month: string }[] = [];

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

  // Payment gateway simulation properties
  showPaymentModal = false;
  paymentProcessing = false;
  paymentData = { cardNumber: '', cardName: '', expiry: '', cvv: '' };
  paymentError = '';

  // UPI Payment Properties
  activePaymentMethod: 'card' | 'upi' = 'card';
  upiId: string = '';

  // History list
  myBookings: any[] = [];

  getLocalYYYYMMDD(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  ngOnInit() {
    // Set date minimum to today
    const today = new Date();
    this.todayString = this.getLocalYYYYMMDD(today);

    this.generateBookingDays();
    this.loadCategories();
    this.loadAllServices();
    if (this.auth.isAuthenticated()) {
      this.loadMyBookings();
    }
  }

  generateBookingDays() {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const dateString = this.getLocalYYYYMMDD(d);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNum = d.getDate().toString();
      const month = d.toLocaleDateString('en-US', { month: 'short' });
      days.push({ dateString, dayName, dayNum, month });
    }
    this.bookingDays = days;
  }

  selectBookingDate(dateString: string) {
    this.selectedDate = dateString;
    this.resetScheduleAndSlotChoice();
    this.onScheduleParamsChange();
  }

  selectStylist(stylistId: number) {
    this.selectedStylistId = stylistId;
    this.resetScheduleAndSlotChoice();
    this.onScheduleParamsChange();
  }

  getMorningSlots(): string[] {
    return this.availableSlots.filter(slot => {
      try {
        const timePart = slot.split('T')[1];
        const hour = parseInt(timePart.split(':')[0], 10);
        return hour < 12;
      } catch (e) {
        return false;
      }
    });
  }

  getAfternoonSlots(): string[] {
    return this.availableSlots.filter(slot => {
      try {
        const timePart = slot.split('T')[1];
        const hour = parseInt(timePart.split(':')[0], 10);
        return hour >= 12;
      } catch (e) {
        return false;
      }
    });
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

  initiatePayment() {
    if (!this.selectedSlot || !this.selectedStylistId) return;
    this.showPaymentModal = true;
    this.paymentError = '';
    this.paymentProcessing = false;
    this.paymentData = { cardNumber: '', cardName: '', expiry: '', cvv: '' };
    this.activePaymentMethod = 'card';
    this.upiId = '';
  }

  selectPaymentMethod(method: 'card' | 'upi') {
    this.activePaymentMethod = method;
    this.paymentError = '';
  }

  getUpiString(): string {
    const amount = this.cartTotalPrice();
    return `upi://pay?pa=glowvera@upi&pn=Glowvera%20Salon&am=${amount}&cu=INR&tn=Glowvera%20Salon%20Booking`;
  }

  getQrCodeUrl(): string {
    return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(this.getUpiString())}`;
  }

  processSimulatedUpiPayment() {
    if (!this.upiId.trim() || !this.upiId.includes('@')) {
      this.paymentError = 'Please enter a valid UPI ID (e.g. name@upi or mobile@upi)';
      return;
    }
    this.paymentProcessing = true;
    this.paymentError = '';

    // Simulate merchant checking transaction status on UPI gateway
    setTimeout(() => {
      this.bookingInProgress = true;
      const serviceIds = this.cartServices().map(s => s.id);
      
      this.api.bookAppointment(this.selectedStylistId!, serviceIds, this.selectedSlot!).subscribe({
        next: (appt) => {
          this.bookingInProgress = false;
          this.paymentProcessing = false;
          this.showPaymentModal = false;
          this.confirmedAppointment = appt;
          this.bookingSuccess = true;
          this.cart.clear();
          this.clearHoldTimer();
          this.isHoldActive = false;
          this.loadMyBookings();
        },
        error: (err) => {
          this.bookingInProgress = false;
          this.paymentProcessing = false;
          this.paymentError = err.error?.message || 'UPI transaction verification failed. Slot concurrency failure.';
        }
      });
    }, 2000);
  }

  processSimulatedPayment() {
    if (!this.selectedSlot || !this.selectedStylistId) return;

    // Basic client-side validation checks
    const cardNumClean = this.paymentData.cardNumber.replace(/\s+/g, '');
    if (!/^\d{13,19}$/.test(cardNumClean)) {
      this.paymentError = 'Invalid card number format. Expected 13 to 19 digits.';
      return;
    }
    if (!/^(0[1-9]|1[0-2])\/[0-9]{2}$/.test(this.paymentData.expiry)) {
      this.paymentError = 'Invalid expiry date format. Expected MM/YY.';
      return;
    }
    if (!/^\d{3,4}$/.test(this.paymentData.cvv)) {
      this.paymentError = 'Invalid CVV. Expected 3 or 4 digits.';
      return;
    }
    if (!this.paymentData.cardName.trim()) {
      this.paymentError = 'Cardholder name is required.';
      return;
    }

    this.paymentProcessing = true;
    this.paymentError = '';

    // Simulate merchant processing connection
    setTimeout(() => {
      this.bookingInProgress = true;
      const serviceIds = this.cartServices().map(s => s.id);
      
      this.api.bookAppointment(this.selectedStylistId!, serviceIds, this.selectedSlot!).subscribe({
        next: (appt) => {
          this.bookingInProgress = false;
          this.paymentProcessing = false;
          this.showPaymentModal = false;
          this.confirmedAppointment = appt;
          this.bookingSuccess = true;
          this.cart.clear();
          this.clearHoldTimer();
          this.isHoldActive = false;
          this.loadMyBookings();
        },
        error: (err) => {
          this.bookingInProgress = false;
          this.paymentProcessing = false;
          this.paymentError = err.error?.message || 'Transaction declined. Slot booking concurrency failure.';
        }
      });
    }, 1500);
  }

  confirmPayAfterService() {
    if (!this.selectedSlot || !this.selectedStylistId) return;

    this.bookingInProgress = true;
    this.holdError = '';
    const serviceIds = this.cartServices().map(s => s.id);

    this.api.bookAppointment(this.selectedStylistId!, serviceIds, this.selectedSlot!).subscribe({
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
        this.holdError = err.error?.message || 'Conflict. This slot was locked by another user.';
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

  scrollToScheduler() {
    setTimeout(() => {
      const element = document.getElementById('schedule-section');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
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
