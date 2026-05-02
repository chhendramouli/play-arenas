package com.decathlon.play_arenas_backend.controller;

import com.decathlon.play_arenas_backend.dto.BookingRequestDTO;
import com.decathlon.play_arenas_backend.model.Booking;
import com.decathlon.play_arenas_backend.service.BookingService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    @Autowired private BookingService bookingService;

    @GetMapping
    public List<Booking> getBookings(Authentication auth) {
        if (auth == null) return List.of();
        boolean isAdmin = auth.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        return bookingService.getBookingsForUser(auth.getName(), isAdmin);
    }

    @PostMapping
    public ResponseEntity<?> createBooking(@Valid @RequestBody BookingRequestDTO request, Authentication auth) {
        if (auth == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        try {
            Booking saved = bookingService.createBooking(request, auth.getName());
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/payment")
    public ResponseEntity<?> completePayment(@PathVariable UUID id,
                                               @RequestParam boolean success,
                                               Authentication auth) {
        if (auth == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        // Permission check (simplified here, but could be inside service)
        bookingService.signalPayment(id, success);
        return ResponseEntity.ok(Map.of("message", "Payment signal sent", "success", success));
    }

    @GetMapping("/my")
    public ResponseEntity<List<Booking>> getMyBookings(Authentication auth) {
        if (auth == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(bookingService.getBookingsForUser(auth.getName(), false));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> cancelBooking(@PathVariable UUID id, Authentication auth) {
        if (auth == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        boolean isAdmin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        try {
            bookingService.cancelBooking(id, auth.getName(), isAdmin);
            return ResponseEntity.ok(Map.of("message", "Booking cancelled"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
