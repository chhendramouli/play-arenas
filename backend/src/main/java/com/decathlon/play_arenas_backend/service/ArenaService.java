package com.decathlon.play_arenas_backend.service;

import com.decathlon.play_arenas_backend.model.Arena;
import com.decathlon.play_arenas_backend.model.Booking;
import com.decathlon.play_arenas_backend.repository.ArenaRepository;
import com.decathlon.play_arenas_backend.repository.BookingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

@Service
public class ArenaService {

    @Autowired private ArenaRepository arenaRepository;
    @Autowired private BookingRepository bookingRepository;

    public List<Arena> getAllArenas(String sport, String search) {
        return getAllArenas(sport, search, false);
    }

    public List<Arena> getAllArenas(String sport, String search, boolean includeInactive) {
        List<Arena> all;
        if ((sport == null || sport.isBlank()) && (search == null || search.isBlank())) {
            all = arenaRepository.findAll();
        } else {
            all = arenaRepository.search(sport, search);
        }
        if (includeInactive) return all;
        return all.stream()
            .filter(a -> a.getActive() == null || Boolean.TRUE.equals(a.getActive()))
            .toList();
    }

    /** Per-sport / per-arena / per-location aggregates for the admin dashboard. */
    public Map<String, Object> getDashboardStats() {
        List<Arena> arenas = arenaRepository.findAll();
        List<Booking> bookings = bookingRepository.findAll();

        Map<UUID, Arena> arenaById = new HashMap<>();
        for (Arena a : arenas) arenaById.put(a.getId(), a);

        Map<String, Long> bySport    = new TreeMap<>();
        Map<String, Long> byArena    = new TreeMap<>();
        Map<String, Long> byLocation = new TreeMap<>();
        Map<String, Long> byStatus   = new TreeMap<>();

        for (Booking b : bookings) {
            Arena a = b.getArena();
            if (a == null && arenaById != null) a = arenaById.get(b.getArena() != null ? b.getArena().getId() : null);
            String status = b.getStatus() != null ? b.getStatus().name() : "UNKNOWN";
            byStatus.merge(status, 1L, Long::sum);
            if (a != null) {
                bySport   .merge(a.getSportType() == null ? "Other" : a.getSportType(), 1L, Long::sum);
                byArena   .merge(a.getName()      == null ? "Other" : a.getName(),      1L, Long::sum);
                String loc = a.getLocation() == null ? "Other" : extractCity(a.getLocation());
                byLocation.merge(loc, 1L, Long::sum);
            }
        }

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("totalArenas",   arenas.size());
        out.put("activeArenas",  arenas.stream().filter(a -> a.getActive() == null || Boolean.TRUE.equals(a.getActive())).count());
        out.put("totalBookings", bookings.size());
        out.put("bySport",       bySport);
        out.put("byArena",       byArena);
        out.put("byLocation",    byLocation);
        out.put("byStatus",      byStatus);
        return out;
    }

    /** Extract last comma-separated token (treated as city) e.g. "Decathlon, Powai, Mumbai" -> "Mumbai". */
    private static String extractCity(String location) {
        int idx = location.lastIndexOf(',');
        if (idx < 0) return location.trim();
        return location.substring(idx + 1).trim();
    }

    public Arena getArenaById(UUID id) {
        return arenaRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Arena not found"));
    }

    public Arena saveArena(Arena arena) {
        return arenaRepository.save(arena);
    }

    public Arena updateArena(UUID id, Arena patch) {
        Arena existing = arenaRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Arena not found"));
        if (patch.getName() != null)         existing.setName(patch.getName());
        if (patch.getLocation() != null)     existing.setLocation(patch.getLocation());
        if (patch.getSportType() != null)    existing.setSportType(patch.getSportType());
        if (patch.getPricePerHour() != null) existing.setPricePerHour(patch.getPricePerHour());
        if (patch.getActive() != null)       existing.setActive(patch.getActive());
        // imageUrl can be set to null intentionally — accept any value, including null,
        // when the request body explicitly includes the field. We can't easily detect
        // "field omitted" vs "field=null" with this DTO, so callers should send the
        // current value if they don't want to change it.
        existing.setImageUrl(patch.getImageUrl());
        return arenaRepository.save(existing);
    }

    public void deleteArena(UUID id) {
        arenaRepository.deleteById(id);
    }

    public Map<String, Object> getAvailableSlots(UUID id, String date) {
        LocalDate day = LocalDate.parse(date);
        LocalDateTime dayStart = day.atTime(LocalTime.MIDNIGHT);
        LocalDateTime dayEnd   = day.plusDays(1).atTime(LocalTime.MIDNIGHT);

        List<Booking> booked = bookingRepository.findByArenaAndDay(id, dayStart, dayEnd);
        Set<Integer> bookedHours = new HashSet<>();
        for (Booking b : booked) {
            LocalDateTime cur = b.getStartTime();
            while (cur.isBefore(b.getEndTime())) {
                bookedHours.add(cur.getHour());
                cur = cur.plusHours(1);
            }
        }

        List<Integer> available = new ArrayList<>();
        for (int h = 6; h < 22; h++) {
            if (!bookedHours.contains(h)) available.add(h);
        }

        return Map.of("date", date, "availableHours", available, "bookedHours", bookedHours);
    }
}
