package com.glowvera.dto;

import java.time.LocalDateTime;
import java.util.List;

public class BookingRequest {
    private Long stylistId;
    private List<Long> serviceIds;
    private LocalDateTime startTime;

    // Getters and Setters
    public Long getStylistId() { return stylistId; }
    public void setStylistId(Long stylistId) { this.stylistId = stylistId; }
    public List<Long> getServiceIds() { return serviceIds; }
    public void setServiceIds(List<Long> serviceIds) { this.serviceIds = serviceIds; }
    public LocalDateTime getStartTime() { return startTime; }
    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }
}
