package com.decathlon.play_arenas_backend.workflow;

import com.decathlon.play_arenas_backend.model.Booking;
import com.decathlon.play_arenas_backend.model.BookingStatus;
import com.decathlon.play_arenas_backend.repository.BookingRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component
public class BookingActivitiesImpl implements BookingActivities {

    private static final Logger log = LoggerFactory.getLogger(BookingActivitiesImpl.class);

    @Autowired
    private BookingRepository bookingRepository;

    @Override
    @Transactional
    public void markBookingPending(String bookingIdStr) {
        log.info("Marking booking {} as PENDING", bookingIdStr);
        updateBookingStatus(bookingIdStr, BookingStatus.PENDING);
    }

    @Override
    @Transactional
    public void confirmBooking(String bookingIdStr) {
        log.info("Confirming booking {}", bookingIdStr);
        updateBookingStatus(bookingIdStr, BookingStatus.CONFIRMED);
    }

    @Override
    @Transactional
    public void cancelBooking(String bookingIdStr) {
        log.info("Cancelling booking {}", bookingIdStr);
        updateBookingStatus(bookingIdStr, BookingStatus.CANCELLED);
    }

    private void updateBookingStatus(String bookingIdStr, BookingStatus status) {
        UUID id = UUID.fromString(bookingIdStr);
        Booking booking = bookingRepository.findById(id)
            .orElseThrow(() -> {
                log.error("Booking {} not found during activity execution", bookingIdStr);
                return new RuntimeException("Booking not found: " + bookingIdStr);
            });
        
        booking.setStatus(status);
        bookingRepository.save(booking);
        log.debug("Successfully updated booking {} status to {}", bookingIdStr, status);
    }
}
