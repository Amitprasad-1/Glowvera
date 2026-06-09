package com.glowvera.entity;

import jakarta.persistence.*;
import java.time.LocalTime;
import java.util.Set;

@Entity
@Table(name = "stylists")
public class Stylist {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive;

    @Column(name = "working_start", nullable = false)
    private LocalTime workingStart;

    @Column(name = "working_end", nullable = false)
    private LocalTime workingEnd;

    @Column(name = "break_start", nullable = false)
    private LocalTime breakStart;

    @Column(name = "break_end", nullable = false)
    private LocalTime breakEnd;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "stylist_services",
        joinColumns = @JoinColumn(name = "stylist_id"),
        inverseJoinColumns = @JoinColumn(name = "service_id")
    )
    private Set<Service> services;

    public Stylist() {}

    public Stylist(Long id, String name, Boolean isActive, LocalTime workingStart, LocalTime workingEnd, LocalTime breakStart, LocalTime breakEnd, Set<Service> services) {
        this.id = id;
        this.name = name;
        this.isActive = isActive;
        this.workingStart = workingStart;
        this.workingEnd = workingEnd;
        this.breakStart = breakStart;
        this.breakEnd = breakEnd;
        this.services = services;
    }

    public static StylistBuilder builder() {
        return new StylistBuilder();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    public LocalTime getWorkingStart() { return workingStart; }
    public void setWorkingStart(LocalTime workingStart) { this.workingStart = workingStart; }
    public LocalTime getWorkingEnd() { return workingEnd; }
    public void setWorkingEnd(LocalTime workingEnd) { this.workingEnd = workingEnd; }
    public LocalTime getBreakStart() { return breakStart; }
    public void setBreakStart(LocalTime breakStart) { this.breakStart = breakStart; }
    public LocalTime getBreakEnd() { return breakEnd; }
    public void setBreakEnd(LocalTime breakEnd) { this.breakEnd = breakEnd; }
    public Set<Service> getServices() { return services; }
    public void setServices(Set<Service> services) { this.services = services; }

    public static class StylistBuilder {
        private Long id;
        private String name;
        private Boolean isActive;
        private LocalTime workingStart;
        private LocalTime workingEnd;
        private LocalTime breakStart;
        private LocalTime breakEnd;
        private Set<Service> services;

        public StylistBuilder id(Long id) { this.id = id; return this; }
        public StylistBuilder name(String name) { this.name = name; return this; }
        public StylistBuilder isActive(Boolean isActive) { this.isActive = isActive; return this; }
        public StylistBuilder workingStart(LocalTime workingStart) { this.workingStart = workingStart; return this; }
        public StylistBuilder workingEnd(LocalTime workingEnd) { this.workingEnd = workingEnd; return this; }
        public StylistBuilder breakStart(LocalTime breakStart) { this.breakStart = breakStart; return this; }
        public StylistBuilder breakEnd(LocalTime breakEnd) { this.breakEnd = breakEnd; return this; }
        public StylistBuilder services(Set<Service> services) { this.services = services; return this; }
        public Stylist build() {
            return new Stylist(id, name, isActive, workingStart, workingEnd, breakStart, breakEnd, services);
        }
    }
}
