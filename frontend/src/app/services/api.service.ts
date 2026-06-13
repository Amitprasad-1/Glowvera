import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private get baseUrl(): string {
    const hostname = window.location.hostname;
    // Cloud hosting check (e.g., Vercel deployment)
    if (hostname && hostname.includes('vercel.app')) {
      // NOTE: Replace this with your actual hosted Render/Railway backend URL once deployed
      return 'https://glowvera-backend.onrender.com/api';
    }
    // Local network check (e.g., physical phone connecting to PC IP)
    if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `http://${hostname}:8080/api`;
    }
    // Local developer fallback
    return 'http://localhost:8080/api';
  }

  constructor(private http: HttpClient, private auth: AuthService) {}

  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    const token = this.auth.token();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  // --- Category APIs ---
  getCategories(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/services/categories`);
  }

  createCategory(category: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/admin/categories`, category, { headers: this.getHeaders() });
  }

  // --- Service APIs ---
  getServices(search: string = '', page: number = 0, size: number = 10): Observable<any> {
    let params = new HttpParams()
      .set('search', search)
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<any>(`${this.baseUrl}/services`, { params });
  }

  getServicesByCategory(categoryId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/services/category/${categoryId}`);
  }

  addService(service: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/admin/services`, service, { headers: this.getHeaders() });
  }

  updateService(id: number, service: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/admin/services/${id}`, service, { headers: this.getHeaders() });
  }

  deleteService(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/admin/services/${id}`, { headers: this.getHeaders() });
  }

  // --- Stylist APIs ---
  getStylists(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/stylists`);
  }

  getFilteredStylists(serviceIds: number[]): Observable<any[]> {
    let params = new HttpParams();
    serviceIds.forEach(id => {
      params = params.append('serviceIds', id.toString());
    });
    return this.http.get<any[]>(`${this.baseUrl}/stylists/filter`, { params });
  }

  addStylist(stylist: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/admin/stylists`, stylist, { headers: this.getHeaders() });
  }

  updateStylist(id: number, stylist: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/admin/stylists/${id}`, stylist, { headers: this.getHeaders() });
  }

  deleteStylist(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/admin/stylists/${id}`, { headers: this.getHeaders() });
  }

  // --- Booking APIs ---
  getAvailableSlots(stylistId: number, date: string, serviceIds: number[]): Observable<string[]> {
    let params = new HttpParams()
      .set('stylistId', stylistId.toString())
      .set('date', date);
    serviceIds.forEach(id => {
      params = params.append('serviceIds', id.toString());
    });
    return this.http.get<string[]>(`${this.baseUrl}/appointments/slots`, { params });
  }

  holdSlot(stylistId: number, startTime: string, durationMinutes: number): Observable<any> {
    const body = { stylistId, startTime, durationMinutes };
    return this.http.post<any>(`${this.baseUrl}/appointments/hold`, body, { headers: this.getHeaders() });
  }

  bookAppointment(stylistId: number, serviceIds: number[], startTime: string, paymentMethod?: string, paymentStatus?: string): Observable<any> {
    const body = { stylistId, serviceIds, startTime, paymentMethod, paymentStatus };
    return this.http.post<any>(`${this.baseUrl}/appointments/book`, body, { headers: this.getHeaders() });
  }

  updateAppointmentStatus(id: number, status: string): Observable<any> {
    let params = new HttpParams().set('status', status);
    return this.http.put<any>(`${this.baseUrl}/admin/appointments/${id}/status`, {}, { headers: this.getHeaders(), params });
  }

  getMyAppointments(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/appointments/my`, { headers: this.getHeaders() });
  }

  cancelAppointment(id: number): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/appointments/${id}/cancel`, {}, { headers: this.getHeaders() });
  }

  // --- Admin Booking Grid Timeline APIs ---
  getAdminAppointments(page: number = 0, size: number = 15): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<any>(`${this.baseUrl}/admin/appointments`, { headers: this.getHeaders(), params });
  }

  getAdminTimeline(date: string): Observable<any[]> {
    const params = new HttpParams().set('date', date);
    return this.http.get<any[]>(`${this.baseUrl}/admin/appointments/timeline`, { headers: this.getHeaders(), params });
  }

  getAdminClients(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/admin/clients`, { headers: this.getHeaders() });
  }

  getClientAppointmentsAdmin(clientId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/admin/clients/${clientId}/appointments`, { headers: this.getHeaders() });
  }

  triggerCronReminders(date?: string): Observable<any> {
    let params = new HttpParams();
    if (date) {
      params = params.set('date', date);
    }
    return this.http.post<any>(`${this.baseUrl}/admin/trigger-reminders`, {}, { headers: this.getHeaders(), params });
  }
}
