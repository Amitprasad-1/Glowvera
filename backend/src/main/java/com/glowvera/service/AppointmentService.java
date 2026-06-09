package com.glowvera.service;

import com.glowvera.entity.*;
import com.glowvera.exception.SlotAlreadyBookedException;
import com.glowvera.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Service
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;
    private final StylistRepository stylistRepository;
    private final ServiceRepository serviceRepository;
    private final CacheService cacheService;

    public AppointmentService(
            AppointmentRepository appointmentRepository,
            UserRepository userRepository,
            StylistRepository stylistRepository,
            ServiceRepository serviceRepository,
            CacheService cacheService) {
        this.appointmentRepository = appointmentRepository;
        this.userRepository = userRepository;
        this.stylistRepository = stylistRepository;
        this.serviceRepository = serviceRepository;
        this.cacheService = cacheService;
    }

    /**
     * Compute available 30-minute start times for a stylist on a specific date for a service bundle duration.
     */
    public List<LocalDateTime> getAvailableSlots(Long stylistId, LocalDate date, List<Long> serviceIds) {
        List<LocalDateTime> availableSlots = new ArrayList<>();
        
        Stylist stylist = stylistRepository.findById(stylistId).orElse(null);
        if (stylist == null || !stylist.getIsActive()) {
            return availableSlots;
        }

        // 1. Calculate aggregate duration of selected services
        int totalDuration = 0;
        for (Long sId : serviceIds) {
            com.glowvera.entity.Service service = serviceRepository.findById(sId).orElse(null);
            if (service != null) {
                totalDuration += service.getDurationMinutes();
            }
        }

        if (totalDuration == 0) {
            return availableSlots;
        }

        // 2. Fetch all existing active appointments for this stylist on this day
        LocalDateTime dayStart = date.atStartOfDay();
        LocalDateTime dayEnd = date.atTime(LocalTime.MAX);
        List<Appointment> existingAppointments = appointmentRepository.findActiveAppointmentsByStylistAndDate(stylistId, dayStart, dayEnd);

        // 3. Generate candidate slots at 30-minute intervals within stylist working hours
        LocalTime workStart = stylist.getWorkingStart();
        LocalTime workEnd = stylist.getWorkingEnd();
        
        // Slot candidates are checked sequentially
        LocalTime candidateTime = workStart;
        while (candidateTime.plusMinutes(totalDuration).isBefore(workEnd) || candidateTime.plusMinutes(totalDuration).equals(workEnd)) {
            LocalDateTime candidateStart = date.atTime(candidateTime);
            LocalDateTime candidateEnd = candidateStart.plusMinutes(totalDuration);

            // Check if slot falls in current past time (if booking is for today)
            if (candidateStart.isBefore(LocalDateTime.now())) {
                candidateTime = candidateTime.plusMinutes(30);
                continue;
            }

            // Check stylist break time overlap
            LocalTime breakStart = stylist.getBreakStart();
            LocalTime breakEnd = stylist.getBreakEnd();
            boolean overlapsBreak = candidateTime.isBefore(breakEnd) && candidateTime.plusMinutes(totalDuration).isAfter(breakStart);

            if (overlapsBreak) {
                candidateTime = candidateTime.plusMinutes(30);
                continue;
            }

            // Check overlap with existing appointments
            boolean overlapsAppointment = false;
            for (Appointment appt : existingAppointments) {
                if (candidateStart.isBefore(appt.getEndTime()) && candidateEnd.isAfter(appt.getStartTime())) {
                    overlapsAppointment = true;
                    break;
                }
            }

            if (overlapsAppointment) {
                candidateTime = candidateTime.plusMinutes(30);
                continue;
            }

            // Check overlap with active temporary cache holds (Redis-like cache check)
            boolean overlapsCacheHold = cacheService.isSlotHeld(stylistId, candidateStart, totalDuration);
            if (overlapsCacheHold) {
                candidateTime = candidateTime.plusMinutes(30);
                continue;
            }

            // If it passes all checks, slot is available
            availableSlots.add(candidateStart);
            candidateTime = candidateTime.plusMinutes(30);
        }

        return availableSlots;
    }

    /**
     * Confirms a booking with transaction concurrency controls.
     */
    @Transactional
    public Appointment createAppointment(Long userId, Long stylistId, List<Long> serviceIds, LocalDateTime startTime) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        Stylist stylist = stylistRepository.findById(stylistId)
                .orElseThrow(() -> new IllegalArgumentException("Stylist not found"));

        if (!stylist.getIsActive()) {
            throw new IllegalStateException("Stylist is not active");
        }

        // Verify stylist is qualified for ALL selected services
        List<com.glowvera.entity.Service> services = new ArrayList<>();
        BigDecimal totalPricing = BigDecimal.ZERO;
        int totalDuration = 0;

        for (Long sId : serviceIds) {
            com.glowvera.entity.Service service = serviceRepository.findById(sId)
                    .orElseThrow(() -> new IllegalArgumentException("Service ID not found: " + sId));
            
            if (!stylist.getServices().contains(service)) {
                throw new IllegalStateException("Stylist " + stylist.getName() + " is not qualified for service: " + service.getName());
            }

            services.add(service);
            totalPricing = totalPricing.add(service.getPrice());
            totalDuration += service.getDurationMinutes();
        }

        LocalDateTime endTime = startTime.plusMinutes(totalDuration);

        // Strict Concurrency Guard: DB SELECT-FOR-UPDATE overlap check
        long overlappingCount = appointmentRepository.countOverlappingConfirmedAppointments(stylistId, startTime, endTime);
        if (overlappingCount > 0) {
            throw new SlotAlreadyBookedException("We are sorry, but this time slot was just booked by another client. Please select another slot!");
        }

        // Create appointment with CONFIRMED status
        Appointment appointment = Appointment.builder()
                .user(user)
                .stylist(stylist)
                .startTime(startTime)
                .endTime(endTime)
                .totalPrice(totalPricing)
                .status(AppointmentStatus.CONFIRMED)
                .build();

        Appointment saved = appointmentRepository.save(appointment);

        // Success - release temporary cache hold
        cacheService.releaseSlot(stylistId, startTime);

        return saved;
    }

    /**
     * Cancel an appointment.
     */
    @Transactional
    public void cancelAppointment(Long appointmentId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new IllegalArgumentException("Appointment not found"));
        appointment.setStatus(AppointmentStatus.CANCELLED);
        appointmentRepository.save(appointment);
    }

    /**
     * Fetch all bookings for a specific customer.
     */
    public List<Appointment> getClientAppointments(Long userId) {
        return appointmentRepository.findByUserIdOrderByStartTimeDesc(userId);
    }

    /**
     * Fetch timeline bookings for all stylists for a specific day.
     */
    public List<Appointment> getAdminTimelineAppointments(LocalDate date) {
        LocalDateTime dayStart = date.atStartOfDay();
        LocalDateTime dayEnd = date.atTime(23, 59, 59);
        return appointmentRepository.findAppointmentsInDateRange(dayStart, dayEnd);
    }
}
