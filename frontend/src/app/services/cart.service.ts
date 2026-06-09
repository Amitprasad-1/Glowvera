import { Injectable, signal, computed } from '@angular/core';

export interface ServiceItem {
  id: number;
  name: string;
  price: number;
  durationMinutes: number;
  category: { id: number; name: string };
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  // Writable signal for selected services
  selectedServices = signal<ServiceItem[]>([]);

  // Computed signals for aggregate calculations
  totalPrice = computed(() => 
    this.selectedServices().reduce((sum, item) => sum + Number(item.price), 0)
  );

  totalDuration = computed(() => 
    this.selectedServices().reduce((sum, item) => sum + item.durationMinutes, 0)
  );

  constructor() {}

  addService(service: ServiceItem): boolean {
    const exists = this.selectedServices().some(s => s.id === service.id);
    if (!exists) {
      this.selectedServices.update(services => [...services, service]);
      return true;
    }
    return false;
  }

  removeService(serviceId: number) {
    this.selectedServices.update(services => 
      services.filter(s => s.id !== serviceId)
    );
  }

  clear() {
    this.selectedServices.set([]);
  }

  /**
   * Recommendations engine: returns a list of suggested add-on services
   * that are NOT already in the cart.
   */
  getRecommendations(allServices: ServiceItem[]): ServiceItem[] {
    const cartIds = new Set(this.selectedServices().map(s => s.id));
    const recommendations: ServiceItem[] = [];

    // Rule 1: If Haircut (ID 1) is in cart, recommend Hair Spa (ID 2)
    if (cartIds.has(1) && !cartIds.has(2)) {
      const hairSpa = allServices.find(s => s.id === 2);
      if (hairSpa) recommendations.push(hairSpa);
    }

    // Rule 2: If Haircut (ID 1) is in cart, recommend Blowout & Styling (ID 4)
    if (cartIds.has(1) && !cartIds.has(4)) {
      const blowout = allServices.find(s => s.id === 4);
      if (blowout) recommendations.push(blowout);
    }

    // Rule 3: If Beard Trim (ID 5) is in cart, recommend Royal Shave (ID 6)
    if (cartIds.has(5) && !cartIds.has(6)) {
      const royalShave = allServices.find(s => s.id === 6);
      if (royalShave) recommendations.push(royalShave);
    }

    // Rule 4: General recommendation for a Facial treatment (ID 9) if cart has any items but no facials
    const hasFacial = this.selectedServices().some(s => s.category.id === 4);
    if (this.selectedServices().length > 0 && !hasFacial) {
      const facial = allServices.find(s => s.id === 9); // Charcoal facial
      if (facial) recommendations.push(facial);
    }

    return recommendations;
  }
}
