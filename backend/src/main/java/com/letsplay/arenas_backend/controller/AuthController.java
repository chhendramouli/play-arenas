package com.letsplay.arenas_backend.controller;

import com.letsplay.arenas_backend.model.User;
import com.letsplay.arenas_backend.model.UserRole;
import com.letsplay.arenas_backend.repository.UserRepository;
import com.letsplay.arenas_backend.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired private UserRepository userRepository;
    @Autowired private JwtUtil jwtUtil;
    @Autowired private PasswordEncoder passwordEncoder;

    // ── DTOs ──────────────────────────────────────────────
    record SignupRequest(String name, String email, String password, String role) {}
    record LoginRequest(String email, String password) {}

    // ── POST /api/auth/signup ──────────────────────────────
    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody SignupRequest req) {
        if (req.name() == null || req.email() == null || req.password() == null
                || req.name().isBlank() || req.email().isBlank() || req.password().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Name, email and password are required"));
        }
        if (userRepository.existsByEmail(req.email())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "Email already registered"));
        }
        User user = new User();
        user.setName(req.name());
        user.setEmail(req.email());
        user.setPasswordHash(passwordEncoder.encode(req.password()));
        
        if (req.role() != null && req.role().equals("ADMIN")) {
            user.setRole(UserRole.ADMIN);
        } else {
            user.setRole(UserRole.CUSTOMER);
        }
        userRepository.save(user);

        String token = jwtUtil.generate(user.getEmail(), user.getRole().name());
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
            "token", token,
            "user", Map.of("id", user.getId(), "name", user.getName(),
                           "email", user.getEmail(), "role", user.getRole())
        ));
    }

    // ── POST /api/auth/login ───────────────────────────────
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {
        return userRepository.findByEmail(req.email())
            .map(user -> {
                if (!passwordEncoder.matches(req.password(), user.getPasswordHash())) {
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                            .body(Map.of("error", "Invalid credentials"));
                }
                String token = jwtUtil.generate(user.getEmail(), user.getRole().name());
                return ResponseEntity.ok(Map.of(
                    "token", token,
                    "user", Map.of("id", user.getId(), "name", user.getName(),
                                   "email", user.getEmail(), "role", user.getRole())
                ));
            })
            .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid credentials")));
    }

    // ── GET /api/auth/me (validate token) ─────────────────
    @GetMapping("/me")
    public ResponseEntity<?> me(org.springframework.security.core.Authentication auth) {
        if (auth == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return userRepository.findByEmail(auth.getName())
            .map(u -> ResponseEntity.ok(Map.of(
                "id", u.getId(), "name", u.getName(),
                "email", u.getEmail(), "role", u.getRole()
            )))
            .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
    }
}
