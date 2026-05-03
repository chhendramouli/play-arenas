package com.letsplay.arenas_backend.config;

import com.letsplay.arenas_backend.model.Arena;
import com.letsplay.arenas_backend.repository.ArenaRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@Order(1)
public class DataInitializer implements CommandLineRunner {

    private final ArenaRepository arenaRepository;
    private final com.letsplay.arenas_backend.repository.UserRepository userRepository;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    public DataInitializer(ArenaRepository arenaRepository, 
                          com.letsplay.arenas_backend.repository.UserRepository userRepository,
                          org.springframework.security.crypto.password.PasswordEncoder passwordEncoder) {
        this.arenaRepository = arenaRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    private Arena arena(String name, String location, String sport, double price, String img) {
        Arena a = new Arena();
        a.setName(name);
        a.setLocation(location);
        a.setSportType(sport);
        a.setPricePerHour(price);
        a.setImageUrl(img);
        return a;
    }

    @Override
    public void run(String... args) {
        // Seed Admin User if not exists
        if (userRepository.findByEmail("superadmin@letsplay.com").isEmpty()) {
            com.letsplay.arenas_backend.model.User admin = new com.letsplay.arenas_backend.model.User();
            admin.setName("Super Admin");
            admin.setEmail("superadmin@letsplay.com");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setRole(com.letsplay.arenas_backend.model.UserRole.ADMIN);
            userRepository.save(admin);
            System.out.println("Seeded default admin: superadmin@letsplay.com / admin123");
        }

        if (arenaRepository.count() > 1) return;

        arenaRepository.saveAll(List.of(
            // ── Mumbai ──────────────────────────────────────────────────
            arena("Andheri Football Turf",      "Let's Play, Andheri West, Mumbai",    "Football",   800,  "https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=800&q=80"),
            arena("Powai Basketball Arena",     "Let's Play, Powai, Mumbai",           "Basketball", 700,  "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&q=80"),
            arena("Thane Badminton Complex",    "Let's Play, Thane, Mumbai",           "Badminton",  500,  "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&q=80"),
            arena("Bandra Tennis Club",         "Let's Play, Bandra, Mumbai",          "Tennis",     600,  "https://images.unsplash.com/photo-1542144582-1ba00456b5e3?w=800&q=80"),
            arena("Navi Mumbai Cricket Ground", "Let's Play, Navi Mumbai",             "Cricket",    1200, "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&q=80"),
            arena("Goregaon Aquatics Centre",   "Let's Play, Goregaon, Mumbai",        "Swimming",   400,  "https://images.unsplash.com/photo-1600965962361-9035dbfd1c50?w=800&q=80"),

            // ── Bangalore ────────────────────────────────────────────────
            arena("Whitefield Football Turf",   "Let's Play, Whitefield, Bangalore",   "Football",   900,  "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800&q=80"),
            arena("Marathahalli Basketball",    "Let's Play, Marathahalli, Bangalore", "Basketball", 750,  "https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&q=80"),
            arena("Koramangala Badminton Hall", "Let's Play, Koramangala, Bangalore",  "Badminton",  550,  "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=800&q=80"),
            arena("HSR Layout Tennis Courts",   "Let's Play, HSR Layout, Bangalore",   "Tennis",     650,  "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=800&q=80"),
            arena("Indiranagar Cricket Nets",   "Let's Play, Indiranagar, Bangalore",  "Cricket",    1100, "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&q=80"),

            // ── Delhi / NCR ───────────────────────────────────────────────
            arena("Connaught Place Football",   "Let's Play, CP, New Delhi",           "Football",   850,  "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&q=80"),
            arena("Gurugram Basketball Arena",  "Let's Play, Sector 29, Gurugram",     "Basketball", 800,  "https://images.unsplash.com/photo-1519861531473-9200262188bf?w=800&q=80"),
            arena("Noida Badminton Academy",    "Let's Play, Sector 18, Noida",        "Badminton",  500,  "https://images.unsplash.com/photo-1564769662533-4f00a87b4056?w=800&q=80"),
            arena("Vasant Kunj Tennis Club",    "Let's Play, Vasant Kunj, New Delhi",  "Tennis",     700,  "https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=800&q=80"),
            arena("Dwarka Cricket Stadium",     "Let's Play, Dwarka, New Delhi",       "Cricket",    1300, "https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?w=800&q=80"),
            arena("Rohini Aquatics Centre",     "Let's Play, Rohini, New Delhi",       "Swimming",   450,  "https://images.unsplash.com/photo-1519315901367-f34ff9154487?w=800&q=80"),

            // ── Chennai ──────────────────────────────────────────────────
            arena("Anna Nagar Football Ground", "Let's Play, Anna Nagar, Chennai",     "Football",   750,  "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&q=80"),
            arena("Phoenix Mall Badminton",     "Let's Play, Phoenix Mall, Chennai",   "Badminton",  500,  "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&q=80"),
            arena("OMR Tennis Courts",          "Let's Play, OMR, Chennai",            "Tennis",     600,  "https://images.unsplash.com/photo-1542144582-1ba00456b5e3?w=800&q=80"),
            arena("Velachery Cricket Nets",     "Let's Play, Velachery, Chennai",      "Cricket",    1000, "https://images.unsplash.com/photo-1607170218347-5f16f9a27e12?w=800&q=80"),
            arena("Adyar Swimming Pool",        "Let's Play, Adyar, Chennai",          "Swimming",   400,  "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800&q=80"),

            // ── Hyderabad ────────────────────────────────────────────────
            arena("Gachibowli Football Turf",   "Let's Play, Gachibowli, Hyderabad",   "Football",   800,  "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800&q=80"),
            arena("HITEC City Basketball",      "Let's Play, HITEC City, Hyderabad",   "Basketball", 700,  "https://images.unsplash.com/photo-1491952562262-b67f0d16dfab?w=800&q=80"),
            arena("Banjara Hills Badminton",    "Let's Play, Banjara Hills, Hyderabad","Badminton",  550,  "https://images.unsplash.com/photo-1601439843756-22399d6ffe62?w=800&q=80"),
            arena("Jubilee Hills Cricket Net",  "Let's Play, Jubilee Hills, Hyderabad","Cricket",    1100, "https://images.unsplash.com/photo-1578621784322-f07e2c13f4c7?w=800&q=80"),

            // ── Pune ─────────────────────────────────────────────────────
            arena("Kothrud Football Ground",    "Let's Play, Kothrud, Pune",           "Football",   700,  "https://images.unsplash.com/photo-1556056504-5c7696c4c28d?w=800&q=80"),
            arena("Hinjewadi Basketball Arena", "Let's Play, Hinjewadi, Pune",         "Basketball", 650,  "https://images.unsplash.com/photo-1474224017046-182ece80b263?w=800&q=80"),
            arena("Viman Nagar Badminton",      "Let's Play, Viman Nagar, Pune",       "Badminton",  450,  "https://images.unsplash.com/photo-1618841557871-b4664fbf0cb3?w=800&q=80"),
            arena("Aundh Swimming Centre",      "Let's Play, Aundh, Pune",             "Swimming",   380,  "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=800&q=80"),

            // ── Kolkata ──────────────────────────────────────────────────
            arena("Salt Lake Football Turf",    "Let's Play, Salt Lake, Kolkata",      "Football",   700,  "https://images.unsplash.com/photo-1521537634581-0dced2fee2ef?w=800&q=80"),
            arena("New Town Cricket Academy",   "Let's Play, New Town, Kolkata",       "Cricket",    1000, "https://images.unsplash.com/photo-1585186529520-bcd93efb8c21?w=800&q=80"),
            arena("Rajarhat Badminton Hall",    "Let's Play, Rajarhat, Kolkata",       "Badminton",  450,  "https://images.unsplash.com/photo-1632923057155-dd35366a1033?w=800&q=80"),

            // ── Ahmedabad ────────────────────────────────────────────────
            arena("SG Highway Football Turf",   "Let's Play, SG Highway, Ahmedabad",   "Football",   700,  "https://images.unsplash.com/photo-1602472096073-8bdd9609b9a8?w=800&q=80"),
            arena("Prahlad Nagar Tennis",       "Let's Play, Prahlad Nagar, Ahmedabad","Tennis",     550,  "https://images.unsplash.com/photo-1545809074-59ced8b3a5c0?w=800&q=80"),

            // ── Jaipur ───────────────────────────────────────────────────
            arena("Malviya Nagar Badminton",    "Let's Play, Malviya Nagar, Jaipur",   "Badminton",  400,  "https://images.unsplash.com/photo-1599474924187-334a4ae5bd3c?w=800&q=80"),
            arena("Mansarovar Cricket Ground",  "Let's Play, Mansarovar, Jaipur",      "Cricket",    900,  "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&q=80")
        ));

        System.out.println("Seeded " + arenaRepository.count() + " arenas across India.");
    }
}
