package com.decathlon.play_arenas_backend.controller;

import com.decathlon.play_arenas_backend.model.Arena;
import com.decathlon.play_arenas_backend.service.ArenaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/arenas")
public class ArenaController {

    @Autowired private ArenaService arenaService;

    @GetMapping
    public List<Arena> getAll(
            @RequestParam(required = false) String sport,
            @RequestParam(required = false) String search,
            @RequestParam(required = false, defaultValue = "false") boolean includeInactive,
            org.springframework.security.core.Authentication auth) {
        // Only admins may see inactive arenas
        boolean isAdmin = auth != null && auth.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        return arenaService.getAllArenas(sport, search, includeInactive && isAdmin);
    }

    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> dashboard() {
        return arenaService.getDashboardStats();
    }

    @GetMapping("/{id}")
    public Arena getById(@PathVariable UUID id) {
        return arenaService.getArenaById(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Arena create(@RequestBody Arena arena) {
        return arenaService.saveArena(arena);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Arena update(@PathVariable UUID id, @RequestBody Arena arena) {
        return arenaService.updateArena(id, arena);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(@PathVariable UUID id) {
        arenaService.deleteArena(id);
    }

    @GetMapping("/{id}/slots")
    public Map<String, Object> getAvailableSlots(
            @PathVariable UUID id,
            @RequestParam String date) {
        return arenaService.getAvailableSlots(id, date);
    }
}
