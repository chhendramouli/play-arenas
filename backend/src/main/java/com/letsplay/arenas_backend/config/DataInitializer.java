package com.letsplay.arenas_backend.config;

import com.letsplay.arenas_backend.model.Arena;
import com.letsplay.arenas_backend.repository.ArenaRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

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
            admin.setPasswordHash(passwordEncoder.encode("admin123"));
            admin.setRole(com.letsplay.arenas_backend.model.UserRole.ADMIN);
            userRepository.save(admin);
            System.out.println("Seeded default admin: superadmin@letsplay.com / admin123");
        }

        // Name-based guard: only insert arenas whose name doesn't exist yet
        Set<String> existing = arenaRepository.findAll().stream()
                .map(Arena::getName)
                .collect(Collectors.toSet());

        List<Arena> all = List.of(
            // ── Mumbai ──────────────────────────────────────────────────────────
            arena("Andheri Football Turf",        "Let's Play, Andheri West, Mumbai",      "Football",   800,  "https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=800&q=80"),
            arena("Powai Basketball Arena",        "Let's Play, Powai, Mumbai",             "Basketball", 700,  "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&q=80"),
            arena("Thane Badminton Complex",       "Let's Play, Thane, Mumbai",             "Badminton",  500,  "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&q=80"),
            arena("Bandra Tennis Club",            "Let's Play, Bandra, Mumbai",            "Tennis",     600,  "https://images.unsplash.com/photo-1542144582-1ba00456b5e3?w=800&q=80"),
            arena("Navi Mumbai Cricket Ground",    "Let's Play, Navi Mumbai",               "Cricket",   1200,  "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&q=80"),
            arena("Goregaon Aquatics Centre",      "Let's Play, Goregaon, Mumbai",          "Swimming",   400,  "https://images.unsplash.com/photo-1600965962361-9035dbfd1c50?w=800&q=80"),
            arena("Malad Squash Courts",           "Let's Play, Malad West, Mumbai",        "Squash",     450,  "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&q=80"),
            arena("Chembur Table Tennis Hub",      "Let's Play, Chembur, Mumbai",           "Table Tennis",350, "https://images.unsplash.com/photo-1611251135345-18c56206b863?w=800&q=80"),
            arena("Kurla Volleyball Court",        "Let's Play, Kurla, Mumbai",             "Volleyball",  400, "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=800&q=80"),
            arena("Borivali Kabaddi Grounds",      "Let's Play, Borivali, Mumbai",          "Kabaddi",    300,  "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80"),

            // ── Bangalore ────────────────────────────────────────────────────────
            arena("Whitefield Football Turf",      "Let's Play, Whitefield, Bangalore",     "Football",   900,  "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800&q=80"),
            arena("Marathahalli Basketball",       "Let's Play, Marathahalli, Bangalore",   "Basketball", 750,  "https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&q=80"),
            arena("Koramangala Badminton Hall",    "Let's Play, Koramangala, Bangalore",    "Badminton",  550,  "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=800&q=80"),
            arena("HSR Layout Tennis Courts",      "Let's Play, HSR Layout, Bangalore",     "Tennis",     650,  "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=800&q=80"),
            arena("Indiranagar Cricket Nets",      "Let's Play, Indiranagar, Bangalore",    "Cricket",   1100,  "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&q=80"),
            arena("Jayanagar Swimming Complex",    "Let's Play, Jayanagar, Bangalore",      "Swimming",   420,  "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800&q=80"),
            arena("Electronic City Squash Club",   "Let's Play, Electronic City, Bangalore","Squash",     480,  "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&q=80"),
            arena("Bellandur Volleyball Arena",    "Let's Play, Bellandur, Bangalore",      "Volleyball",  420, "https://images.unsplash.com/photo-1519861531473-9200262188bf?w=800&q=80"),

            // ── Delhi / NCR ───────────────────────────────────────────────────────
            arena("Connaught Place Football",      "Let's Play, CP, New Delhi",             "Football",   850,  "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&q=80"),
            arena("Gurugram Basketball Arena",     "Let's Play, Sector 29, Gurugram",       "Basketball", 800,  "https://images.unsplash.com/photo-1519861531473-9200262188bf?w=800&q=80"),
            arena("Noida Badminton Academy",       "Let's Play, Sector 18, Noida",          "Badminton",  500,  "https://images.unsplash.com/photo-1564769662533-4f00a87b4056?w=800&q=80"),
            arena("Vasant Kunj Tennis Club",       "Let's Play, Vasant Kunj, New Delhi",    "Tennis",     700,  "https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=800&q=80"),
            arena("Dwarka Cricket Stadium",        "Let's Play, Dwarka, New Delhi",         "Cricket",   1300,  "https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?w=800&q=80"),
            arena("Rohini Aquatics Centre",        "Let's Play, Rohini, New Delhi",         "Swimming",   450,  "https://images.unsplash.com/photo-1519315901367-f34ff9154487?w=800&q=80"),
            arena("Saket Squash Academy",          "Let's Play, Saket, New Delhi",          "Squash",     500,  "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&q=80"),
            arena("Faridabad Table Tennis Centre", "Let's Play, Sector 21, Faridabad",      "Table Tennis",320, "https://images.unsplash.com/photo-1611251135345-18c56206b863?w=800&q=80"),
            arena("Greater Noida Volleyball",      "Let's Play, Knowledge Park, Greater Noida","Volleyball",380,"https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=800&q=80"),

            // ── Chennai ──────────────────────────────────────────────────────────
            arena("Anna Nagar Football Ground",    "Let's Play, Anna Nagar, Chennai",       "Football",   750,  "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&q=80"),
            arena("Phoenix Mall Badminton",        "Let's Play, Phoenix Mall, Chennai",     "Badminton",  500,  "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&q=80"),
            arena("OMR Tennis Courts",             "Let's Play, OMR, Chennai",              "Tennis",     600,  "https://images.unsplash.com/photo-1542144582-1ba00456b5e3?w=800&q=80"),
            arena("Velachery Cricket Nets",        "Let's Play, Velachery, Chennai",        "Cricket",   1000,  "https://images.unsplash.com/photo-1607170218347-5f16f9a27e12?w=800&q=80"),
            arena("Adyar Swimming Pool",           "Let's Play, Adyar, Chennai",            "Swimming",   400,  "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800&q=80"),
            arena("T Nagar Basketball Court",      "Let's Play, T Nagar, Chennai",          "Basketball", 650,  "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&q=80"),
            arena("Tambaram Squash Club",          "Let's Play, Tambaram, Chennai",         "Squash",     420,  "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&q=80"),

            // ── Hyderabad ────────────────────────────────────────────────────────
            arena("Gachibowli Football Turf",      "Let's Play, Gachibowli, Hyderabad",     "Football",   800,  "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800&q=80"),
            arena("HITEC City Basketball",         "Let's Play, HITEC City, Hyderabad",     "Basketball", 700,  "https://images.unsplash.com/photo-1491952562262-b67f0d16dfab?w=800&q=80"),
            arena("Banjara Hills Badminton",       "Let's Play, Banjara Hills, Hyderabad",  "Badminton",  550,  "https://images.unsplash.com/photo-1601439843756-22399d6ffe62?w=800&q=80"),
            arena("Jubilee Hills Cricket Net",     "Let's Play, Jubilee Hills, Hyderabad",  "Cricket",   1100,  "https://images.unsplash.com/photo-1578621784322-f07e2c13f4c7?w=800&q=80"),
            arena("Kondapur Tennis Academy",       "Let's Play, Kondapur, Hyderabad",       "Tennis",     620,  "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=800&q=80"),
            arena("Madhapur Swimming Centre",      "Let's Play, Madhapur, Hyderabad",       "Swimming",   400,  "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=800&q=80"),
            arena("Kukatpally Volleyball Ground",  "Let's Play, Kukatpally, Hyderabad",     "Volleyball",  350, "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=800&q=80"),

            // ── Pune ─────────────────────────────────────────────────────────────
            arena("Kothrud Football Ground",       "Let's Play, Kothrud, Pune",             "Football",   700,  "https://images.unsplash.com/photo-1556056504-5c7696c4c28d?w=800&q=80"),
            arena("Hinjewadi Basketball Arena",    "Let's Play, Hinjewadi, Pune",           "Basketball", 650,  "https://images.unsplash.com/photo-1474224017046-182ece80b263?w=800&q=80"),
            arena("Viman Nagar Badminton",         "Let's Play, Viman Nagar, Pune",         "Badminton",  450,  "https://images.unsplash.com/photo-1618841557871-b4664fbf0cb3?w=800&q=80"),
            arena("Aundh Swimming Centre",         "Let's Play, Aundh, Pune",               "Swimming",   380,  "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=800&q=80"),
            arena("Wakad Cricket Nets",            "Let's Play, Wakad, Pune",               "Cricket",    950,  "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&q=80"),
            arena("Baner Tennis Courts",           "Let's Play, Baner, Pune",               "Tennis",     580,  "https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=800&q=80"),
            arena("Hadapsar Squash Arena",         "Let's Play, Hadapsar, Pune",            "Squash",     440,  "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&q=80"),

            // ── Kolkata ──────────────────────────────────────────────────────────
            arena("Salt Lake Football Turf",       "Let's Play, Salt Lake, Kolkata",        "Football",   700,  "https://images.unsplash.com/photo-1521537634581-0dced2fee2ef?w=800&q=80"),
            arena("New Town Cricket Academy",      "Let's Play, New Town, Kolkata",         "Cricket",   1000,  "https://images.unsplash.com/photo-1585186529520-bcd93efb8c21?w=800&q=80"),
            arena("Rajarhat Badminton Hall",       "Let's Play, Rajarhat, Kolkata",         "Badminton",  450,  "https://images.unsplash.com/photo-1632923057155-dd35366a1033?w=800&q=80"),
            arena("Ballygunge Basketball Court",   "Let's Play, Ballygunge, Kolkata",       "Basketball", 620,  "https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&q=80"),
            arena("Park Street Swimming Club",     "Let's Play, Park Street, Kolkata",      "Swimming",   380,  "https://images.unsplash.com/photo-1600965962361-9035dbfd1c50?w=800&q=80"),

            // ── Ahmedabad ────────────────────────────────────────────────────────
            arena("SG Highway Football Turf",      "Let's Play, SG Highway, Ahmedabad",     "Football",   700,  "https://images.unsplash.com/photo-1602472096073-8bdd9609b9a8?w=800&q=80"),
            arena("Prahlad Nagar Tennis",          "Let's Play, Prahlad Nagar, Ahmedabad",  "Tennis",     550,  "https://images.unsplash.com/photo-1545809074-59ced8b3a5c0?w=800&q=80"),
            arena("Satellite Badminton Club",      "Let's Play, Satellite, Ahmedabad",      "Badminton",  420,  "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&q=80"),
            arena("Bopal Cricket Ground",          "Let's Play, Bopal, Ahmedabad",          "Cricket",    900,  "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&q=80"),
            arena("Naroda Volleyball Arena",       "Let's Play, Naroda, Ahmedabad",         "Volleyball",  320, "https://images.unsplash.com/photo-1519861531473-9200262188bf?w=800&q=80"),

            // ── Jaipur ───────────────────────────────────────────────────────────
            arena("Malviya Nagar Badminton",       "Let's Play, Malviya Nagar, Jaipur",     "Badminton",  400,  "https://images.unsplash.com/photo-1599474924187-334a4ae5bd3c?w=800&q=80"),
            arena("Mansarovar Cricket Ground",     "Let's Play, Mansarovar, Jaipur",        "Cricket",    900,  "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&q=80"),
            arena("Vaishali Nagar Football Turf",  "Let's Play, Vaishali Nagar, Jaipur",    "Football",   680,  "https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=800&q=80"),
            arena("Tonk Road Basketball Arena",    "Let's Play, Tonk Road, Jaipur",         "Basketball", 600,  "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&q=80"),

            // ── Kochi ────────────────────────────────────────────────────────────
            arena("Kakkanad Football Ground",      "Let's Play, Kakkanad, Kochi",           "Football",   720,  "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800&q=80"),
            arena("Edapally Badminton Hall",       "Let's Play, Edapally, Kochi",           "Badminton",  480,  "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=800&q=80"),
            arena("Aluva Swimming Centre",         "Let's Play, Aluva, Kochi",              "Swimming",   360,  "https://images.unsplash.com/photo-1519315901367-f34ff9154487?w=800&q=80"),
            arena("Vyttila Cricket Nets",          "Let's Play, Vyttila, Kochi",            "Cricket",    880,  "https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?w=800&q=80"),

            // ── Chandigarh ───────────────────────────────────────────────────────
            arena("Sector 34 Football Ground",     "Let's Play, Sector 34, Chandigarh",     "Football",   720,  "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&q=80"),
            arena("Panchkula Tennis Club",         "Let's Play, Panchkula, Chandigarh",     "Tennis",     580,  "https://images.unsplash.com/photo-1542144582-1ba00456b5e3?w=800&q=80"),
            arena("Mohali Cricket Academy",        "Let's Play, Mohali, Chandigarh",        "Cricket",   1000,  "https://images.unsplash.com/photo-1607170218347-5f16f9a27e12?w=800&q=80"),
            arena("Sector 22 Badminton Complex",   "Let's Play, Sector 22, Chandigarh",     "Badminton",  430,  "https://images.unsplash.com/photo-1564769662533-4f00a87b4056?w=800&q=80"),

            // ── Lucknow ──────────────────────────────────────────────────────────
            arena("Gomti Nagar Football Turf",     "Let's Play, Gomti Nagar, Lucknow",      "Football",   660,  "https://images.unsplash.com/photo-1556056504-5c7696c4c28d?w=800&q=80"),
            arena("Hazratganj Cricket Ground",     "Let's Play, Hazratganj, Lucknow",       "Cricket",    850,  "https://images.unsplash.com/photo-1585186529520-bcd93efb8c21?w=800&q=80"),
            arena("Aliganj Badminton Hall",        "Let's Play, Aliganj, Lucknow",          "Badminton",  400,  "https://images.unsplash.com/photo-1618841557871-b4664fbf0cb3?w=800&q=80"),
            arena("Indira Nagar Basketball Court", "Let's Play, Indira Nagar, Lucknow",     "Basketball", 580,  "https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&q=80"),

            // ── Surat ────────────────────────────────────────────────────────────
            arena("Vesu Football Ground",          "Let's Play, Vesu, Surat",               "Football",   650,  "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800&q=80"),
            arena("Pal Badminton Academy",         "Let's Play, Pal, Surat",                "Badminton",  400,  "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&q=80"),
            arena("Adajan Table Tennis Club",      "Let's Play, Adajan, Surat",             "Table Tennis",300, "https://images.unsplash.com/photo-1611251135345-18c56206b863?w=800&q=80"),

            // ── Nagpur ───────────────────────────────────────────────────────────
            arena("Dharampeth Football Turf",      "Let's Play, Dharampeth, Nagpur",        "Football",   640,  "https://images.unsplash.com/photo-1521537634581-0dced2fee2ef?w=800&q=80"),
            arena("Sitabuldi Cricket Nets",        "Let's Play, Sitabuldi, Nagpur",         "Cricket",    820,  "https://images.unsplash.com/photo-1578621784322-f07e2c13f4c7?w=800&q=80"),
            arena("Manish Nagar Badminton",        "Let's Play, Manish Nagar, Nagpur",      "Badminton",  380,  "https://images.unsplash.com/photo-1632923057155-dd35366a1033?w=800&q=80"),

            // ── Indore ───────────────────────────────────────────────────────────
            arena("Vijay Nagar Football Ground",   "Let's Play, Vijay Nagar, Indore",       "Football",   620,  "https://images.unsplash.com/photo-1602472096073-8bdd9609b9a8?w=800&q=80"),
            arena("Palasia Squash Club",           "Let's Play, Palasia, Indore",           "Squash",     400,  "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&q=80"),
            arena("LIG Colony Badminton Hall",     "Let's Play, LIG Colony, Indore",        "Badminton",  380,  "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&q=80"),

            // ── Coimbatore ───────────────────────────────────────────────────────
            arena("RS Puram Football Turf",        "Let's Play, RS Puram, Coimbatore",      "Football",   600,  "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800&q=80"),
            arena("Saibaba Colony Badminton",      "Let's Play, Saibaba Colony, Coimbatore","Badminton",  380,  "https://images.unsplash.com/photo-1564769662533-4f00a87b4056?w=800&q=80"),
            arena("Peelamedu Cricket Ground",      "Let's Play, Peelamedu, Coimbatore",     "Cricket",    800,  "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&q=80"),

            // ── Mysuru ───────────────────────────────────────────────────────────
            arena("Vijayanagar Football Turf",     "Let's Play, Vijayanagar, Mysuru",       "Football",   580,  "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&q=80"),
            arena("Kuvempunagar Badminton Hall",   "Let's Play, Kuvempunagar, Mysuru",      "Badminton",  360,  "https://images.unsplash.com/photo-1599474924187-334a4ae5bd3c?w=800&q=80"),

            // ── Bhubaneswar ──────────────────────────────────────────────────────
            arena("Patia Football Ground",         "Let's Play, Patia, Bhubaneswar",        "Football",   580,  "https://images.unsplash.com/photo-1556056504-5c7696c4c28d?w=800&q=80"),
            arena("Nayapalli Cricket Nets",        "Let's Play, Nayapalli, Bhubaneswar",    "Cricket",    780,  "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&q=80"),

            // ── Guwahati ─────────────────────────────────────────────────────────
            arena("Dispur Football Turf",          "Let's Play, Dispur, Guwahati",          "Football",   540,  "https://images.unsplash.com/photo-1521537634581-0dced2fee2ef?w=800&q=80"),
            arena("Paltan Bazaar Badminton Hall",  "Let's Play, Paltan Bazaar, Guwahati",   "Badminton",  340,  "https://images.unsplash.com/photo-1618841557871-b4664fbf0cb3?w=800&q=80")
        );

        List<Arena> toSave = all.stream()
                .filter(a -> !existing.contains(a.getName()))
                .collect(Collectors.toList());

        if (!toSave.isEmpty()) {
            arenaRepository.saveAll(toSave);
            System.out.println("Seeded " + toSave.size() + " new arenas. Total: " + arenaRepository.count());
        } else {
            System.out.println("All arenas already present. Total: " + arenaRepository.count());
        }
    }
}
