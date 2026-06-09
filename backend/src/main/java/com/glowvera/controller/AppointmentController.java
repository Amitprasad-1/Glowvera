package com.glowvera.controller;

import com.glowvera.dto.BookingRequest;
import com.glowvera.dto.HoldRequest;
import com.glowvera.entity.Appointment;
import com.glowvera.entity.User;
import com.glowvera.repository.AppointmentRepository;
import com.glowvera.repository.UserRepository;
import com.glowvera.service.AppointmentService;
import com.glowvera.service.CacheService;
import com.glowvera.service.ReminderCronService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class AppointmentController {

    private final AppointmentService appointmentService;
    private final CacheService cacheService;
    private final ReminderCronService reminderCronService;
    private final UserRepository userRepository;
    private final AppointmentRepository appointmentRepository;

    public AppointmentController(
            AppointmentService appointmentService,
            CacheService cacheService,
            ReminderCronService reminderCronService,
            UserRepository userRepository,
            AppointmentRepository appointmentRepository) {
        this.appointmentService = appointmentService;
        this.cacheService = cacheService;
        this.reminderCronService = reminderCronService;
        this.userRepository = userRepository;
        this.appointmentRepository = appointmentRepository;
    }

    // Public: Fetch available time slots
    @GetMapping("/appointments/slots")
    public ResponseEntity<List<LocalDateTime>> getAvailableSlots(
            @RequestParam Long stylistId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam List<Long> serviceIds) {
        return ResponseEntity.ok(appointmentService.getAvailableSlots(stylistId, date, serviceIds));
    }

    // Client/Admin: Hold a slot temporarily for 5 minutes (300 seconds)
    @PostMapping("/appointments/hold")
    public ResponseEntity<Map<String, Object>> holdSlot(
            @RequestBody HoldRequest request,
            @AuthenticationPrincipal String email) {
        
        boolean success = cacheService.holdSlot(
                request.getStylistId(),
                request.getStartTime(),
                request.getDurationMinutes(),
                300 // 5 minutes
        );

        Map<String, Object> response = new HashMap<>();
        response.put("success", success);
        
        if (success) {
            response.put("message", "Slot held successfully for 5 minutes.");
            response.put("expiresAt", LocalDateTime.now().plusSeconds(300));
            return ResponseEntity.ok(response);
        } else {
            response.put("message", "This slot was temporarily locked by another client. Please wait or select another slot.");
            return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
        }
    }

    // Client/Admin: Confirm booking transaction
    @PostMapping("/appointments/book")
    public ResponseEntity<Appointment> bookAppointment(
            @RequestBody BookingRequest request,
            @AuthenticationPrincipal String email) {
        
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User profile not found"));

        Appointment appt = appointmentService.createAppointment(
                user.getId(),
                request.getStylistId(),
                request.getServiceIds(),
                request.getStartTime()
        );
        return ResponseEntity.ok(appt);
    }

    // Client: Fetch current client's bookings
    @GetMapping("/appointments/my")
    public ResponseEntity<List<Appointment>> getMyAppointments(@AuthenticationPrincipal String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User profile not found"));
        return ResponseEntity.ok(appointmentService.getClientAppointments(user.getId()));
    }

    // Client/Admin: Cancel appointment
    @PutMapping("/appointments/{id}/cancel")
    public ResponseEntity<Void> cancelAppointment(
            @PathVariable Long id,
            @AuthenticationPrincipal String email) {
        
        // Ensure user is authorized to cancel this booking (either owner of booking or ADMIN)
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User profile not found"));
        
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Appointment not found"));
        
        if (user.getRole().name().equals("CLIENT") && !appointment.getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        appointmentService.cancelAppointment(id);
        return ResponseEntity.ok().build();
    }

    // Admin: Fetch paginated listing of all appointments
    @GetMapping("/admin/appointments")
    public ResponseEntity<Page<Appointment>> getAdminAppointments(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(appointmentRepository.findAllByOrderByStartTimeDesc(pageable));
    }

    // Admin: Fetch daily timeline appointments for grid view
    @GetMapping("/admin/appointments/timeline")
    public ResponseEntity<List<Appointment>> getAdminTimeline(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(appointmentService.getAdminTimelineAppointments(date));
    }

    // Admin: Trigger manual run of daily appointment reminder emails/SMS simulation
    @PostMapping("/admin/trigger-reminders")
    public ResponseEntity<Map<String, Object>> triggerReminders(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        
        LocalDate targetDate = (date != null) ? date : LocalDate.now().plusDays(1);
        int count = reminderCronService.triggerRemindersForDate(targetDate);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("date", targetDate.toString());
        response.put("remindersSent", count);
        response.put("message", "Simulated reminders successfully generated for " + targetDate.toString());
        
        return ResponseEntity.ok(response);
    }
}
