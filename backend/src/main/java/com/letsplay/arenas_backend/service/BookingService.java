package com.letsplay.arenas_backend.service;

import com.letsplay.arenas_backend.dto.BookingRequestDTO;
import com.letsplay.arenas_backend.model.Booking;
import com.letsplay.arenas_backend.model.BookingStatus;
import com.letsplay.arenas_backend.repository.ArenaRepository;
import com.letsplay.arenas_backend.repository.BookingRepository;
import com.letsplay.arenas_backend.workflow.BookingWorkflow;
import com.letsplay.arenas_backend.config.TemporalConfig;
import io.temporal.client.WorkflowClient;
import io.temporal.client.WorkflowOptions;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class BookingService {

    @Value("${booking.hold-duration-minutes:2}")
    private int holdDurationMinutes;

    @Autowired private BookingRepository bookingRepository;
    @Autowired private ArenaRepository arenaRepository;
    @Autowired private WorkflowClient workflowClient;

    public List<Booking> getBookingsForUser(String email, boolean isAdmin) {
        return isAdmin ? bookingRepository.findAll() : bookingRepository.findByUserEmail(email);
    }

    @Transactional
    public Booking createBooking(BookingRequestDTO dto, String userEmail) {
        var arena = arenaRepository.findById(dto.getArenaId())
            .orElseThrow(() -> new RuntimeException("Arena not found"));

        // Parse raw ISO strings to LocalDateTime without timezone shift
        java.time.LocalDateTime start = java.time.LocalDateTime.parse(dto.getStartTime());
        java.time.LocalDateTime end   = java.time.LocalDateTime.parse(dto.getEndTime());

        // Conflict check
        List<Booking> conflicts = bookingRepository.findConflicting(
            arena.getId(), start, end
        );
        if (!conflicts.isEmpty()) {
            throw new RuntimeException("Slot already booked for this time");
        }

        Booking booking = new Booking();
        booking.setUserEmail(userEmail);
        booking.setArena(arena);
        booking.setStartTime(start);
        booking.setEndTime(end);
        booking.setStatus(BookingStatus.PENDING);
        
        Booking saved = bookingRepository.save(booking);

        // Start Temporal workflow
        WorkflowOptions options = WorkflowOptions.newBuilder()
            .setTaskQueue(TemporalConfig.BOOKING_TASK_QUEUE)
            .setWorkflowId("booking-" + saved.getId())
            .build();
        BookingWorkflow workflow = workflowClient.newWorkflowStub(BookingWorkflow.class, options);
        WorkflowClient.start(workflow::startBooking, saved.getId().toString(), holdDurationMinutes);

        return saved;
    }

    public void signalPayment(UUID bookingId, boolean success) {
        BookingWorkflow workflow = workflowClient.newWorkflowStub(
            BookingWorkflow.class, "booking-" + bookingId);
        workflow.completePayment(success);
    }

    @Transactional
    public void cancelBooking(UUID id, String userEmail, boolean isAdmin) {
        Booking booking = bookingRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Booking not found"));
            
        if (!isAdmin && !booking.getUserEmail().equals(userEmail)) {
            throw new RuntimeException("Unauthorized");
        }
        
        if (booking.getStatus() == BookingStatus.PENDING) {
            try {
                io.temporal.client.WorkflowStub untyped = workflowClient.newUntypedWorkflowStub("booking-" + id);
                untyped.terminate("User cancelled");
            } catch (Exception e) {
                System.out.println("Could not cancel workflow: " + e.getMessage());
            }
        }
        
        booking.setStatus(BookingStatus.CANCELLED);
        bookingRepository.save(booking);
    }
}
