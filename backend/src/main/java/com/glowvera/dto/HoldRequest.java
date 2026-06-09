package com.glowvera.dto;

import java.time.LocalDateTime;

public class HoldRequest {
    private Long stylistId;
    private LocalDateTime startTime;
    private Integer durationMinutes;

    // Getters and Setters
    public Long getStylistId() { return stylistId; }
    public void setStylistId(Long stylistId) { this.stylistId = stylistId; }
    public LocalDateTime getStartTime() { return startTime; }
    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }
    public Integer getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(Integer durationMinutes) { this.durationMinutes = durationMinutes; }
}
