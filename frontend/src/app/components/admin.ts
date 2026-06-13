import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css'
})
export class AdminComponent implements OnInit {
  private api = inject(ApiService);
  public auth = inject(AuthService);

  activeTab: 'timeline' | 'stylists' | 'services' | 'reminders' | 'clients' = 'timeline';

  // Shared Data
  categories: any[] = [];
  stylists: any[] = [];
  allServicesList: any[] = [];

  // Timeline variables
  timelineDate: string = '';
  timelineAppointments: any[] = [];
  selectedAppointment: any = null;
  hourlyTrack: string[] = [
    '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', 
    '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
  ];

  // Stylist CRUD variables
  stylistForm = {
    id: null as number | null,
    name: '',
    isActive: true,
    workingStart: '09:00',
    workingEnd: '18:00',
    breakStart: '13:00',
    breakEnd: '14:00',
    services: [] as any[]
  };

  // Service CRUD variables
  currentPage = 0;
  servicesPage: any = null;
  serviceForm = {
    id: null as number | null,
    name: '',
    price: 30,
    durationMinutes: 45,
    categoryId: null as number | null
  };

  // Reminder trigger variables
  reminderDate: string = '';
  triggeringReminders = false;
  reminderResult: any = null;

  ngOnInit() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    this.timelineDate = `${year}-${month}-${day}`;
    
    // Default reminder date to tomorrow
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const tYear = tomorrow.getFullYear();
    const tMonth = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const tDay = String(tomorrow.getDate()).padStart(2, '0');
    this.reminderDate = `${tYear}-${tMonth}-${tDay}`;

    this.loadCategories();
    this.loadStylists();
    this.loadAllServicesForSelection();
    this.loadTimelineData();
    this.loadServicesPage(0);
    this.loadClients();
  }

  // --- Date Navigation ---
  prevDay() {
    if (!this.timelineDate) return;
    const parts = this.timelineDate.split('-');
    const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    d.setDate(d.getDate() - 1);
    this.setTimelineDateFromDate(d);
  }

  nextDay() {
    if (!this.timelineDate) return;
    const parts = this.timelineDate.split('-');
    const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    d.setDate(d.getDate() + 1);
    this.setTimelineDateFromDate(d);
  }

  setToday() {
    const d = new Date();
    this.setTimelineDateFromDate(d);
  }

  private setTimelineDateFromDate(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    this.timelineDate = `${year}-${month}-${day}`;
    this.loadTimelineData();
  }

  // --- Data Loaders ---
  loadCategories() {
    this.api.getCategories().subscribe(data => this.categories = data);
  }

  loadStylists() {
    this.api.getStylists().subscribe(data => this.stylists = data);
  }

  loadAllServicesForSelection() {
    this.api.getServices('', 0, 100).subscribe(page => this.allServicesList = page.content);
  }

  loadTimelineData() {
    if (!this.timelineDate) return;
    this.api.getAdminTimeline(this.timelineDate).subscribe(data => {
      this.timelineAppointments = data;
    });
  }

  loadServicesPage(page: number) {
    this.currentPage = page;
    this.api.getServices('', page, 10).subscribe(data => {
      this.servicesPage = data;
    });
  }

  // --- Clients Tab Loaders & Handlers ---
  clientsList: any[] = [];
  selectedClient: any = null;
  selectedClientAppointments: any[] = [];
  clientSearchQuery: string = '';

  expandedClientIds: Set<number> = new Set();
  clientLatestAppointmentMap: { [clientId: number]: any } = {};
  clientAppointmentsMap: { [clientId: number]: any[] } = {};

  loadClients() {
    this.api.getAdminClients().subscribe(data => {
      this.clientsList = data;
      data.forEach(c => {
        this.api.getClientAppointmentsAdmin(c.id).subscribe(appts => {
          if (appts && appts.length > 0) {
            const sortedDesc = [...appts].sort((a: any, b: any) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
            this.clientLatestAppointmentMap[c.id] = sortedDesc[0];

            this.clientAppointmentsMap[c.id] = [...appts].sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
          } else {
            this.clientLatestAppointmentMap[c.id] = null;
            this.clientAppointmentsMap[c.id] = [];
          }
        });
      });
    });
  }

  getFilteredClients(): any[] {
    if (!this.clientSearchQuery.trim()) return this.clientsList;
    const query = this.clientSearchQuery.toLowerCase();
    return this.clientsList.filter(c => 
      c.name.toLowerCase().includes(query) || 
      c.email.toLowerCase().includes(query)
    );
  }

  isClientExpanded(clientId: number): boolean {
    return this.expandedClientIds.has(clientId);
  }

  toggleClientExpanded(clientId: number) {
    if (this.expandedClientIds.has(clientId)) {
      this.expandedClientIds.delete(clientId);
    } else {
      this.expandedClientIds.add(clientId);
    }
  }

  refreshClientAppointments(clientId: number) {
    this.api.getClientAppointmentsAdmin(clientId).subscribe(appts => {
      if (appts && appts.length > 0) {
        const sortedDesc = [...appts].sort((a: any, b: any) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
        this.clientLatestAppointmentMap[clientId] = sortedDesc[0];

        this.clientAppointmentsMap[clientId] = [...appts].sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
      } else {
        this.clientLatestAppointmentMap[clientId] = null;
        this.clientAppointmentsMap[clientId] = [];
      }
    });
  }

  updateClientAppointmentStatus(id: number, status: string, clientId: number) {
    if (confirm(`Are you sure you want to mark this booking as ${status}?`)) {
      this.api.updateAppointmentStatus(id, status).subscribe(() => {
        this.refreshClientAppointments(clientId);
        this.loadTimelineData();
      });
    }
  }

  cancelClientAppointment(id: number, clientId: number) {
    if (confirm('Are you sure you want to cancel this booking as Admin?')) {
      this.api.cancelAppointment(id).subscribe(() => {
        this.refreshClientAppointments(clientId);
        this.loadTimelineData();
      });
    }
  }

  // --- Timeline Calculations ---
  isOutsideWorkingHours(stylist: any, hourStr: string): boolean {
    const checkHour = parseInt(hourStr.split(':')[0], 10);
    const startHour = parseInt(stylist.workingStart.split(':')[0], 10);
    const endHour = parseInt(stylist.workingEnd.split(':')[0], 10);
    return checkHour < startHour || checkHour >= endHour;
  }

  isBreakTime(stylist: any, hourStr: string): boolean {
    const checkHour = parseInt(hourStr.split(':')[0], 10);
    const breakStartHour = parseInt(stylist.breakStart.split(':')[0], 10);
    const breakEndHour = parseInt(stylist.breakEnd.split(':')[0], 10);
    return checkHour >= breakStartHour && checkHour < breakEndHour;
  }

  getAppointmentsForHour(stylistId: number, hourStr: string): any[] {
    const checkHour = parseInt(hourStr.split(':')[0], 10);
    return this.timelineAppointments.filter(appt => {
      if (appt.stylist.id !== stylistId) return false;
      
      const apptStart = new Date(appt.startTime);
      const apptEnd = new Date(appt.endTime);
      
      const startHour = apptStart.getHours();
      const endHour = apptEnd.getHours();
      const endMin = apptEnd.getMinutes();
      
      // If hour falls between start and end time of appointment
      if (checkHour >= startHour && checkHour < endHour) {
        return true;
      }
      // If it ends exactly at some minute of this hour, but checkHour matches start
      if (checkHour === startHour) {
        return true;
      }
      return false;
    });
  }

  getServicesSummary(appt: any): string {
    if (!appt) return '';
    if (appt.services && appt.services.length > 0) {
      return appt.services.map((s: any) => s.name).join(', ');
    }
    return appt.totalPrice ? `Booking (₹${appt.totalPrice})` : 'Booking';
  }

  onViewAppointment(appt: any) {
    this.selectedAppointment = appt;
  }

  cancelAppointment(id: number) {
    if (confirm('Are you sure you want to cancel this booking as Admin?')) {
      this.api.cancelAppointment(id).subscribe(() => {
        this.selectedAppointment = null;
        this.loadTimelineData();
      });
    }
  }

  updateAppointmentStatus(id: number, status: string) {
    if (confirm(`Are you sure you want to mark this booking as ${status}?`)) {
      this.api.updateAppointmentStatus(id, status).subscribe(() => {
        this.selectedAppointment = null;
        this.loadTimelineData();
      });
    }
  }

  // --- Stylist CRUD ---
  onEditStylist(stylist: any) {
    // Copy fields
    this.stylistForm.id = stylist.id;
    this.stylistForm.name = stylist.name;
    this.stylistForm.isActive = stylist.isActive;
    this.stylistForm.workingStart = stylist.workingStart.substring(0, 5);
    this.stylistForm.workingEnd = stylist.workingEnd.substring(0, 5);
    this.stylistForm.breakStart = stylist.breakStart.substring(0, 5);
    this.stylistForm.breakEnd = stylist.breakEnd.substring(0, 5);
    this.stylistForm.services = [...stylist.services];
  }

  isStylistQualifiedFor(serviceId: number): boolean {
    return this.stylistForm.services.some(s => s.id === serviceId);
  }

  toggleStylistServiceSkill(serviceId: number) {
    const exists = this.isStylistQualifiedFor(serviceId);
    if (exists) {
      this.stylistForm.services = this.stylistForm.services.filter(s => s.id !== serviceId);
    } else {
      const service = this.allServicesList.find(s => s.id === serviceId);
      if (service) {
        this.stylistForm.services.push(service);
      }
    }
  }

  saveStylist() {
    // Append seconds for backend Time deserialization (HH:mm:ss)
    const payload = {
      name: this.stylistForm.name,
      isActive: this.stylistForm.isActive,
      workingStart: this.stylistForm.workingStart.length === 5 ? this.stylistForm.workingStart + ':00' : this.stylistForm.workingStart,
      workingEnd: this.stylistForm.workingEnd.length === 5 ? this.stylistForm.workingEnd + ':00' : this.stylistForm.workingEnd,
      breakStart: this.stylistForm.breakStart.length === 5 ? this.stylistForm.breakStart + ':00' : this.stylistForm.breakStart,
      breakEnd: this.stylistForm.breakEnd.length === 5 ? this.stylistForm.breakEnd + ':00' : this.stylistForm.breakEnd,
      services: this.stylistForm.services
    };

    if (this.stylistForm.id) {
      this.api.updateStylist(this.stylistForm.id, payload).subscribe(() => {
        this.loadStylists();
        this.resetStylistForm();
        this.loadTimelineData();
      });
    } else {
      this.api.addStylist(payload).subscribe(() => {
        this.loadStylists();
        this.resetStylistForm();
        this.loadTimelineData();
      });
    }
  }

  deleteStylist(id: number) {
    if (confirm('Are you sure you want to delete this stylist from the roster?')) {
      this.api.deleteStylist(id).subscribe(() => {
        this.loadStylists();
        this.loadTimelineData();
      });
    }
  }

  resetStylistForm() {
    this.stylistForm = {
      id: null,
      name: '',
      isActive: true,
      workingStart: '09:00',
      workingEnd: '18:00',
      breakStart: '13:00',
      breakEnd: '14:00',
      services: []
    };
  }

  // --- Service CRUD ---
  onEditService(service: any) {
    this.serviceForm.id = service.id;
    this.serviceForm.name = service.name;
    this.serviceForm.price = service.price;
    this.serviceForm.durationMinutes = service.durationMinutes;
    this.serviceForm.categoryId = service.category.id;
  }

  saveService() {
    const payload = {
      name: this.serviceForm.name,
      price: this.serviceForm.price,
      durationMinutes: this.serviceForm.durationMinutes,
      category: { id: this.serviceForm.categoryId }
    };

    if (this.serviceForm.id) {
      this.api.updateService(this.serviceForm.id, payload).subscribe(() => {
        this.loadServicesPage(this.currentPage);
        this.loadAllServicesForSelection();
        this.resetServiceForm();
      });
    } else {
      this.api.addService(payload).subscribe(() => {
        this.loadServicesPage(this.currentPage);
        this.loadAllServicesForSelection();
        this.resetServiceForm();
      });
    }
  }

  deleteService(id: number) {
    if (confirm('Are you sure you want to delete this service from catalog?')) {
      this.api.deleteService(id).subscribe(() => {
        this.loadServicesPage(this.currentPage);
        this.loadAllServicesForSelection();
      });
    }
  }

  resetServiceForm() {
    this.serviceForm = {
      id: null,
      name: '',
      price: 30,
      durationMinutes: 45,
      categoryId: this.categories.length > 0 ? this.categories[0].id : null
    };
  }

  // --- Trigger reminders ---
  triggerReminders() {
    this.triggeringReminders = true;
    this.reminderResult = null;
    this.api.triggerCronReminders(this.reminderDate).subscribe({
      next: (res) => {
        this.reminderResult = res;
        this.triggeringReminders = false;
      },
      error: (err) => {
        console.error(err);
        this.triggeringReminders = false;
      }
    });
  }

  // --- Formatting Helpers ---
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

  formatTimeOnly(dateTimeString: string): string {
    if (!dateTimeString) return '';
    const d = new Date(dateTimeString);
    if (isNaN(d.getTime())) return dateTimeString;
    return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  }

  formatDateTime(dateTimeString: string): string {
    if (!dateTimeString) return '';
    const d = new Date(dateTimeString);
    if (isNaN(d.getTime())) return dateTimeString;
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  }
}
