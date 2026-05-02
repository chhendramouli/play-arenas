package com.decathlon.play_arenas_backend.repository;

import com.decathlon.play_arenas_backend.model.Booking;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface BookingRepository extends JpaRepository<Booking, UUID> {

    List<Booking> findByUserEmail(String email);

    /** Returns bookings for an arena that overlap [from, to) and are not cancelled/failed.
     *  Pessimistic write lock prevents concurrent double-booking. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT b FROM Booking b WHERE b.arena.id = :arenaId " +
           "AND b.status NOT IN ('CANCELLED','FAILED') " +
           "AND b.startTime < :to AND b.endTime > :from")
    List<Booking> findConflicting(@Param("arenaId") UUID arenaId,
                                  @Param("from") LocalDateTime from,
                                  @Param("to") LocalDateTime to);

    /** All active bookings for an arena on a given day */
    @Query("SELECT b FROM Booking b WHERE b.arena.id = :arenaId " +
           "AND b.status NOT IN ('CANCELLED','FAILED') " +
           "AND b.startTime >= :dayStart AND b.startTime < :dayEnd")
    List<Booking> findByArenaAndDay(@Param("arenaId") UUID arenaId,
                                    @Param("dayStart") LocalDateTime dayStart,
                                    @Param("dayEnd") LocalDateTime dayEnd);
}
