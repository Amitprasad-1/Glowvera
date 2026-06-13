package com.glowvera.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "appointments")
public class Appointment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "stylist_id", nullable = false)
    private Stylist stylist;

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime;

    @Column(name = "total_price", nullable = false)
    private BigDecimal totalPrice;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AppointmentStatus status;

    @Column(name = "payment_method")
    private String paymentMethod;

    @Column(name = "payment_status")
    private String paymentStatus;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "appointment_services",
        joinColumns = @JoinColumn(name = "appointment_id"),
        inverseJoinColumns = @JoinColumn(name = "service_id")
    )
    private java.util.Set<Service> services = new java.util.HashSet<>();

    public Appointment() {}

    public Appointment(Long id, User user, Stylist stylist, LocalDateTime startTime, LocalDateTime endTime, BigDecimal totalPrice, AppointmentStatus status, String paymentMethod, String paymentStatus, java.util.Set<Service> services) {
        this.id = id;
        this.user = user;
        this.stylist = stylist;
        this.startTime = startTime;
        this.endTime = endTime;
        this.totalPrice = totalPrice;
        this.status = status;
        this.paymentMethod = paymentMethod;
        this.paymentStatus = paymentStatus;
        this.services = services != null ? services : new java.util.HashSet<>();
    }

    public static AppointmentBuilder builder() {
        return new AppointmentBuilder();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public Stylist getStylist() { return stylist; }
    public void setStylist(Stylist stylist) { this.stylist = stylist; }
    public LocalDateTime getStartTime() { return startTime; }
    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }
    public LocalDateTime getEndTime() { return endTime; }
    public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }
    public BigDecimal getTotalPrice() { return totalPrice; }
    public void setTotalPrice(BigDecimal totalPrice) { this.totalPrice = totalPrice; }
    public AppointmentStatus getStatus() { return status; }
    public void setStatus(AppointmentStatus status) { this.status = status; }
    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
    public String getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }
    public java.util.Set<Service> getServices() { return services; }
    public void setServices(java.util.Set<Service> services) { this.services = services; }

    public static class AppointmentBuilder {
        private Long id;
        private User user;
        private Stylist stylist;
        private LocalDateTime startTime;
        private LocalDateTime endTime;
        private BigDecimal totalPrice;
        private AppointmentStatus status;
        private String paymentMethod;
        private String paymentStatus;
        private java.util.Set<Service> services = new java.util.HashSet<>();

        public AppointmentBuilder id(Long id) { this.id = id; return this; }
        public AppointmentBuilder user(User user) { this.user = user; return this; }
        public AppointmentBuilder stylist(Stylist stylist) { this.stylist = stylist; return this; }
        public AppointmentBuilder startTime(LocalDateTime startTime) { this.startTime = startTime; return this; }
        public AppointmentBuilder endTime(LocalDateTime endTime) { this.endTime = endTime; return this; }
        public AppointmentBuilder totalPrice(BigDecimal totalPrice) { this.totalPrice = totalPrice; return this; }
        public AppointmentBuilder status(AppointmentStatus status) { this.status = status; return this; }
        public AppointmentBuilder paymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; return this; }
        public AppointmentBuilder paymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; return this; }
        public AppointmentBuilder services(java.util.Set<Service> services) { this.services = services; return this; }
        public Appointment build() {
            return new Appointment(id, user, stylist, startTime, endTime, totalPrice, status, paymentMethod, paymentStatus, services);
        }
    }
}
