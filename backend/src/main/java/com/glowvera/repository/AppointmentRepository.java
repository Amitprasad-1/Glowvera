package com.glowvera.repository;

import com.glowvera.entity.Appointment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    
    // Find all active (non-cancelled) appointments for a stylist on a specific day, sorted by start_time
    @Query("SELECT a FROM Appointment a WHERE a.stylist.id = :stylistId " +
           "AND a.status != 'CANCELLED' " +
           "AND a.startTime >= :dayStart AND a.startTime < :dayEnd " +
           "ORDER BY a.startTime ASC")
    List<Appointment> findActiveAppointmentsByStylistAndDate(
            @Param("stylistId") Long stylistId,
            @Param("dayStart") LocalDateTime dayStart,
            @Param("dayEnd") LocalDateTime dayEnd);

    // Concurrency Guard Check query
    @Query("SELECT COUNT(a) FROM Appointment a " +
           "WHERE a.stylist.id = :stylistId " +
           "AND a.status = 'CONFIRMED' " +
           "AND (:startTime < a.endTime AND :endTime > a.startTime)")
    long countOverlappingConfirmedAppointments(
            @Param("stylistId") Long stylistId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);

    // Admin dashboard list: get all appointments with paging
    Page<Appointment> findAllByOrderByStartTimeDesc(Pageable pageable);

    // Admin dashboard timeline: get appointments for a date range across all active stylists
    @Query("SELECT a FROM Appointment a WHERE a.startTime >= :start AND a.startTime <= :end AND a.status != 'CANCELLED'")
    List<Appointment> findAppointmentsInDateRange(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    // Get appointments for a user
    List<Appointment> findByUserIdOrderByStartTimeDesc(Long userId);
}
