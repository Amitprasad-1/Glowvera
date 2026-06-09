package com.glowvera.service;

import com.glowvera.entity.Appointment;
import com.glowvera.entity.AppointmentStatus;
import com.glowvera.repository.AppointmentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class ReminderCronService {

    private static final Logger log = LoggerFactory.getLogger(ReminderCronService.class);
    private final AppointmentRepository appointmentRepository;

    public ReminderCronService(AppointmentRepository appointmentRepository) {
        this.appointmentRepository = appointmentRepository;
    }

    /**
     * Daily Cron Job at 08:00 AM.
     * Expression: "0 0 8 * * *" (Second Minute Hour DayMonth Month DayWeek)
     */
    @Scheduled(cron = "0 0 8 * * *")
    public void runDailyReminders() {
        log.info("[CRON JOB] Starting daily appointment reminders scan at 08:00 AM...");
        int count = triggerRemindersForDate(LocalDate.now().plusDays(1));
        log.info("[CRON JOB] Reminders processing complete. Total notifications sent: {}", count);
    }

    /**
     * Scans and prints reminder simulation logs for a specific target date.
     */
    public int triggerRemindersForDate(LocalDate date) {
        LocalDateTime start = date.atStartOfDay();
        LocalDateTime end = date.atTime(LocalTime.MAX);
        
        // Find appointments for the target date across all stylists (status confirmed)
        List<Appointment> appointments = appointmentRepository.findAppointmentsInDateRange(start, end);
        int count = 0;

        DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("hh:mm a");

        for (Appointment appt : appointments) {
            if (appt.getStatus() == AppointmentStatus.CONFIRMED) {
                String clientName = appt.getUser().getName();
                String clientEmail = appt.getUser().getEmail();
                String stylistName = appt.getStylist().getName();
                String appointmentTime = appt.getStartTime().format(timeFormatter);
                
                // Print SMS simulation to logs
                log.info("------------------------------------------------------------------");
                log.info("[SMS NOTIFICATION SIMULATION] Sent to client phone:");
                log.info("    To: {} (Client)", clientName);
                log.info("    Message: Hi {}, this is a friendly reminder that you have an appointment booked tomorrow ({}) at {} with stylist {}. Please arrive 10 minutes early. To manage your booking, visit Glowvera! Text STOP to opt-out.", 
                         clientName, date.toString(), appointmentTime, stylistName);
                
                // Print Email simulation to logs
                log.info("[EMAIL NOTIFICATION SIMULATION] Sent to client email:");
                log.info("    To: <{}>", clientEmail);
                log.info("    Subject: Upcoming Appointment Reminder - Glowvera Unisex Salon");
                log.info("    Body: Hello {},\n\nThis is a reminder of your salon booking scheduled for tomorrow, {} at {}.\nStylist: {}\nTotal Price: ${}\n\nWe look forward to giving you your best look!\n\nWarm regards,\nThe Glowvera Team",
                         clientName, date.toString(), appointmentTime, stylistName, appt.getTotalPrice());
                log.info("------------------------------------------------------------------");
                
                count++;
            }
        }
        return count;
    }
}
