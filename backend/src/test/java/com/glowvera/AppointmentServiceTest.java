package com.glowvera;

import com.glowvera.entity.Appointment;
import com.glowvera.entity.Role;
import com.glowvera.entity.Stylist;
import com.glowvera.entity.User;
import com.glowvera.repository.AppointmentRepository;
import com.glowvera.repository.ServiceRepository;
import com.glowvera.repository.StylistRepository;
import com.glowvera.repository.UserRepository;
import com.glowvera.service.AppointmentService;
import com.glowvera.service.CacheService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;

public class AppointmentServiceTest {

    private AppointmentRepository appointmentRepository;
    private UserRepository userRepository;
    private StylistRepository stylistRepository;
    private ServiceRepository serviceRepository;
    private CacheService cacheService;
    private AppointmentService appointmentService;

    private Stylist mockStylist;
    private com.glowvera.entity.Service mockService;

    @BeforeEach
    public void setUp() {
        appointmentRepository = Mockito.mock(AppointmentRepository.class);
        userRepository = Mockito.mock(UserRepository.class);
        stylistRepository = Mockito.mock(StylistRepository.class);
        serviceRepository = Mockito.mock(ServiceRepository.class);
        cacheService = Mockito.mock(CacheService.class);

        appointmentService = new AppointmentService(
                appointmentRepository,
                userRepository,
                stylistRepository,
                serviceRepository,
                cacheService
        );

        // Setup Stylist: works 09:00 - 18:00, break 12:00 - 13:00
        mockStylist = Stylist.builder()
                .id(1L)
                .name("Alex Carter")
                .isActive(true)
                .workingStart(LocalTime.of(9, 0))
                .workingEnd(LocalTime.of(18, 0))
                .breakStart(LocalTime.of(12, 0))
                .breakEnd(LocalTime.of(13, 0))
                .services(new HashSet<>())
                .build();

        // Setup Service: Haircut (60 mins)
        mockService = com.glowvera.entity.Service.builder()
                .id(1L)
                .name("Unisex Haircut")
                .price(BigDecimal.valueOf(35.00))
                .durationMinutes(60)
                .build();

        mockStylist.getServices().add(mockService);

        Mockito.when(stylistRepository.findById(1L)).thenReturn(Optional.of(mockStylist));
        Mockito.when(serviceRepository.findById(1L)).thenReturn(Optional.of(mockService));
    }

    @Test
    public void testGetAvailableSlots_NoBookingsOrHolds() {
        LocalDate testDate = LocalDate.now().plusDays(2); // In the future so time check passes

        // Mock empty bookings
        Mockito.when(appointmentRepository.findActiveAppointmentsByStylistAndDate(
                eq(1L), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(new ArrayList<>());

        // Mock no cache holds
        Mockito.when(cacheService.isSlotHeld(eq(1L), any(LocalDateTime.class), eq(60)))
                .thenReturn(false);

        List<LocalDateTime> slots = appointmentService.getAvailableSlots(1L, testDate, Collections.singletonList(1L));

        // Let's assert:
        // Alex works 9:00 to 18:00, breaks 12:00 to 13:00.
        // Slots should start at 09:00, 09:30, 10:00, 10:30, 11:00 (since 11:00 ends at 12:00 which matches break start).
        // 11:30 is blocked because it ends at 12:30 (overlaps break).
        // 12:00 is blocked (overlaps break).
        // 12:30 is blocked (ends at 13:30, overlaps break start-end).
        // 13:00 is available (ends at 14:00).
        
        assertFalse(slots.isEmpty(), "Available slots should not be empty");
        
        // Check slot: 09:00 AM
        assertTrue(slots.contains(testDate.atTime(9, 0)));
        // Check slot: 11:00 AM
        assertTrue(slots.contains(testDate.atTime(11, 0)));
        // Check slot: 11:30 AM (Should NOT be available due to break)
        assertFalse(slots.contains(testDate.atTime(11, 30)));
        // Check slot: 12:00 PM (Should NOT be available due to break)
        assertFalse(slots.contains(testDate.atTime(12, 0)));
        // Check slot: 13:00 PM (Should be available after break)
        assertTrue(slots.contains(testDate.atTime(13, 0)));
    }

    @Test
    public void testGetAvailableSlots_WithOverlappingBooking() {
        LocalDate testDate = LocalDate.now().plusDays(2);

        // Stylist is booked from 10:00 to 11:00
        Appointment appt = Appointment.builder()
                .id(101L)
                .stylist(mockStylist)
                .startTime(testDate.atTime(10, 0))
                .endTime(testDate.atTime(11, 0))
                .totalPrice(BigDecimal.valueOf(35.00))
                .status(com.glowvera.entity.AppointmentStatus.CONFIRMED)
                .build();

        Mockito.when(appointmentRepository.findActiveAppointmentsByStylistAndDate(
                eq(1L), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(Collections.singletonList(appt));

        Mockito.when(cacheService.isSlotHeld(eq(1L), any(LocalDateTime.class), eq(60)))
                .thenReturn(false);

        List<LocalDateTime> slots = appointmentService.getAvailableSlots(1L, testDate, Collections.singletonList(1L));

        // 09:00 AM should be available (ends at 10:00 AM)
        assertTrue(slots.contains(testDate.atTime(9, 0)));
        // 09:30 AM should be blocked (ends at 10:30 AM, overlaps booking start)
        assertFalse(slots.contains(testDate.atTime(9, 30)));
        // 10:00 AM should be blocked
        assertFalse(slots.contains(testDate.atTime(10, 0)));
        // 10:30 AM should be blocked
        assertFalse(slots.contains(testDate.atTime(10, 30)));
        // 11:00 AM should be available (ends at 12:00 PM)
        assertTrue(slots.contains(testDate.atTime(11, 0)));
    }
}
