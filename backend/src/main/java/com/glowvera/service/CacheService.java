package com.glowvera.service;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class CacheService {

    // Storage for slot holds: maps a stylistId to their list of active holds
    private final ConcurrentHashMap<Long, List<SlotHold>> holds = new ConcurrentHashMap<>();

    public static class SlotHold {
        private final LocalDateTime startTime;
        private final LocalDateTime endTime;
        private final LocalDateTime expiresAt;

        public SlotHold(LocalDateTime startTime, LocalDateTime endTime, int ttlSeconds) {
            this.startTime = startTime;
            this.endTime = endTime;
            this.expiresAt = LocalDateTime.now().plusSeconds(ttlSeconds);
        }

        public boolean isExpired() {
            return LocalDateTime.now().isAfter(expiresAt);
        }

        public boolean overlaps(LocalDateTime otherStart, LocalDateTime otherEnd) {
            return !isExpired() && (otherStart.isBefore(this.endTime) && otherEnd.isAfter(this.startTime));
        }

        public LocalDateTime getStartTime() {
            return startTime;
        }

        public LocalDateTime getEndTime() {
            return endTime;
        }

        public LocalDateTime getExpiresAt() {
            return expiresAt;
        }
    }

    /**
     * Try to hold a slot for a stylist.
     * Returns true if hold succeeded, false if there is an overlapping active hold.
     */
    public synchronized boolean holdSlot(Long stylistId, LocalDateTime startTime, int durationMinutes, int ttlSeconds) {
        LocalDateTime endTime = startTime.plusMinutes(durationMinutes);
        
        // Ensure no overlapping holds currently exist
        if (isSlotHeld(stylistId, startTime, durationMinutes)) {
            return false;
        }

        holds.computeIfAbsent(stylistId, k -> new ArrayList<>())
             .add(new SlotHold(startTime, endTime, ttlSeconds));
        return true;
    }

    /**
     * Checks if a slot has an active overlapping hold.
     */
    public synchronized boolean isSlotHeld(Long stylistId, LocalDateTime startTime, int durationMinutes) {
        List<SlotHold> stylistHolds = holds.get(stylistId);
        if (stylistHolds == null) {
            return false;
        }

        LocalDateTime endTime = startTime.plusMinutes(durationMinutes);
        
        // Remove expired holds and check for overlaps
        stylistHolds.removeIf(SlotHold::isExpired);
        for (SlotHold hold : stylistHolds) {
            if (hold.overlaps(startTime, endTime)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Explicitly releases a slot hold (e.g. after booking confirmation or cancellation)
     */
    public synchronized void releaseSlot(Long stylistId, LocalDateTime startTime) {
        List<SlotHold> stylistHolds = holds.get(stylistId);
        if (stylistHolds != null) {
            stylistHolds.removeIf(hold -> hold.getStartTime().equals(startTime));
        }
    }

    /**
     * Automatically clean expired holds every 10 seconds.
     */
    @Scheduled(fixedRate = 10000)
    public synchronized void cleanExpiredHolds() {
        holds.forEach((stylistId, list) -> list.removeIf(SlotHold::isExpired));
    }
}
