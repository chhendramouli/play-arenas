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
        if (userRepository.findByEmail("superadmin@dplay.com").isEmpty()) {
            com.letsplay.arenas_backend.model.User admin = new com.letsplay.arenas_backend.model.User();
            admin.setName("Super Admin");
            admin.setEmail("superadmin@dplay.com");
            admin.setPasswordHash(passwordEncoder.encode("admin123"));
            admin.setRole(com.letsplay.arenas_backend.model.UserRole.ADMIN);
            userRepository.save(admin);
            System.out.println("Seeded default admin: superadmin@dplay.com / admin123");
        }

        // Name-based guard: only insert arenas whose name doesn't exist yet
        Set<String> existing = arenaRepository.findAll().stream()
                .map(Arena::getName)
                .collect(Collectors.toSet());

        List<Arena> all = List.of(
            // ── Mumbai ──────────────────────────────────────────────────────────
            arena("Andheri Football Turf",        "DPLAY, Andheri West, Mumbai",      "Football",   800,  "https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=800&q=80"),
            arena("Powai Basketball Arena",        "DPLAY, Powai, Mumbai",             "Basketball", 700,  "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&q=80"),
            arena("Thane Badminton Complex",       "DPLAY, Thane, Mumbai",             "Badminton",  500,  "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&q=80"),
            arena("Bandra Tennis Club",            "DPLAY, Bandra, Mumbai",            "Tennis",     600,  "https://images.unsplash.com/photo-1542144582-1ba00456b5e3?w=800&q=80"),
            arena("Navi Mumbai Cricket Ground",    "DPLAY, Navi Mumbai",               "Cricket",   1200,  "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&q=80"),
            arena("Goregaon Aquatics Centre",      "DPLAY, Goregaon, Mumbai",          "Swimming",   400,  "https://images.unsplash.com/photo-1600965962361-9035dbfd1c50?w=800&q=80"),
            arena("Malad Squash Courts",           "DPLAY, Malad West, Mumbai",        "Squash",     450,  "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&q=80"),
            arena("Chembur Table Tennis Hub",      "DPLAY, Chembur, Mumbai",           "Table Tennis",350, "https://images.unsplash.com/photo-1611251135345-18c56206b863?w=800&q=80"),
            arena("Kurla Volleyball Court",        "DPLAY, Kurla, Mumbai",             "Volleyball",  400, "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=800&q=80"),
            arena("Borivali Kabaddi Grounds",      "DPLAY, Borivali, Mumbai",          "Kabaddi",    300,  "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80"),

            // ── Bangalore ────────────────────────────────────────────────────────
            arena("Whitefield Football Turf",      "DPLAY, Whitefield, Bangalore",     "Football",   900,  "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800&q=80"),
            arena("Marathahalli Basketball",       "DPLAY, Marathahalli, Bangalore",   "Basketball", 750,  "https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&q=80"),
            arena("Koramangala Badminton Hall",    "DPLAY, Koramangala, Bangalore",    "Badminton",  550,  "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=800&q=80"),
            arena("HSR Layout Tennis Courts",      "DPLAY, HSR Layout, Bangalore",     "Tennis",     650,  "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=800&q=80"),
            arena("Indiranagar Cricket Nets",      "DPLAY, Indiranagar, Bangalore",    "Cricket",   1100,  "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&q=80"),
            arena("Jayanagar Swimming Complex",    "DPLAY, Jayanagar, Bangalore",      "Swimming",   420,  "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800&q=80"),
            arena("Electronic City Squash Club",   "DPLAY, Electronic City, Bangalore","Squash",     480,  "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&q=80"),
            arena("Bellandur Volleyball Arena",    "DPLAY, Bellandur, Bangalore",      "Volleyball",  420, "https://images.unsplash.com/photo-1519861531473-9200262188bf?w=800&q=80"),

            // ── Delhi / NCR ───────────────────────────────────────────────────────
            arena("Connaught Place Football",      "DPLAY, CP, New Delhi",             "Football",   850,  "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&q=80"),
            arena("Gurugram Basketball Arena",     "DPLAY, Sector 29, Gurugram",       "Basketball", 800,  "https://images.unsplash.com/photo-1519861531473-9200262188bf?w=800&q=80"),
            arena("Noida Badminton Academy",       "DPLAY, Sector 18, Noida",          "Badminton",  500,  "https://images.unsplash.com/photo-1564769662533-4f00a87b4056?w=800&q=80"),
            arena("Vasant Kunj Tennis Club",       "DPLAY, Vasant Kunj, New Delhi",    "Tennis",     700,  "https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=800&q=80"),
            arena("Dwarka Cricket Stadium",        "DPLAY, Dwarka, New Delhi",         "Cricket",   1300,  "https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?w=800&q=80"),
            arena("Rohini Aquatics Centre",        "DPLAY, Rohini, New Delhi",         "Swimming",   450,  "https://images.unsplash.com/photo-1519315901367-f34ff9154487?w=800&q=80"),
            arena("Saket Squash Academy",          "DPLAY, Saket, New Delhi",          "Squash",     500,  "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&q=80"),
            arena("Faridabad Table Tennis Centre", "DPLAY, Sector 21, Faridabad",      "Table Tennis",320, "https://images.unsplash.com/photo-1611251135345-18c56206b863?w=800&q=80"),
            arena("Greater Noida Volleyball",      "DPLAY, Knowledge Park, Greater Noida","Volleyball",380,"https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=800&q=80"),

            // ── Chennai ──────────────────────────────────────────────────────────
            arena("Anna Nagar Football Ground",    "DPLAY, Anna Nagar, Chennai",       "Football",   750,  "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&q=80"),
            arena("Phoenix Mall Badminton",        "DPLAY, Phoenix Mall, Chennai",     "Badminton",  500,  "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&q=80"),
            arena("OMR Tennis Courts",             "DPLAY, OMR, Chennai",              "Tennis",     600,  "https://images.unsplash.com/photo-1542144582-1ba00456b5e3?w=800&q=80"),
            arena("Velachery Cricket Nets",        "DPLAY, Velachery, Chennai",        "Cricket",   1000,  "https://images.unsplash.com/photo-1607170218347-5f16f9a27e12?w=800&q=80"),
            arena("Adyar Swimming Pool",           "DPLAY, Adyar, Chennai",            "Swimming",   400,  "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800&q=80"),
            arena("T Nagar Basketball Court",      "DPLAY, T Nagar, Chennai",          "Basketball", 650,  "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&q=80"),
            arena("Tambaram Squash Club",          "DPLAY, Tambaram, Chennai",         "Squash",     420,  "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&q=80"),

            // ── Hyderabad ────────────────────────────────────────────────────────
            arena("Gachibowli Football Turf",      "DPLAY, Gachibowli, Hyderabad",     "Football",   800,  "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800&q=80"),
            arena("HITEC City Basketball",         "DPLAY, HITEC City, Hyderabad",     "Basketball", 700,  "https://images.unsplash.com/photo-1491952562262-b67f0d16dfab?w=800&q=80"),
            arena("Banjara Hills Badminton",       "DPLAY, Banjara Hills, Hyderabad",  "Badminton",  550,  "https://images.unsplash.com/photo-1601439843756-22399d6ffe62?w=800&q=80"),
            arena("Jubilee Hills Cricket Net",     "DPLAY, Jubilee Hills, Hyderabad",  "Cricket",   1100,  "https://images.unsplash.com/photo-1578621784322-f07e2c13f4c7?w=800&q=80"),
            arena("Kondapur Tennis Academy",       "DPLAY, Kondapur, Hyderabad",       "Tennis",     620,  "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=800&q=80"),
            arena("Madhapur Swimming Centre",      "DPLAY, Madhapur, Hyderabad",       "Swimming",   400,  "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=800&q=80"),
            arena("Kukatpally Volleyball Ground",  "DPLAY, Kukatpally, Hyderabad",     "Volleyball",  350, "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=800&q=80"),

            // ── Pune ─────────────────────────────────────────────────────────────
            arena("Kothrud Football Ground",       "DPLAY, Kothrud, Pune",             "Football",   700,  "https://images.unsplash.com/photo-1556056504-5c7696c4c28d?w=800&q=80"),
            arena("Hinjewadi Basketball Arena",    "DPLAY, Hinjewadi, Pune",           "Basketball", 650,  "https://images.unsplash.com/photo-1474224017046-182ece80b263?w=800&q=80"),
            arena("Viman Nagar Badminton",         "DPLAY, Viman Nagar, Pune",         "Badminton",  450,  "https://images.unsplash.com/photo-1618841557871-b4664fbf0cb3?w=800&q=80"),
            arena("Aundh Swimming Centre",         "DPLAY, Aundh, Pune",               "Swimming",   380,  "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=800&q=80"),
            arena("Wakad Cricket Nets",            "DPLAY, Wakad, Pune",               "Cricket",    950,  "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&q=80"),
            arena("Baner Tennis Courts",           "DPLAY, Baner, Pune",               "Tennis",     580,  "https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=800&q=80"),
            arena("Hadapsar Squash Arena",         "DPLAY, Hadapsar, Pune",            "Squash",     440,  "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&q=80"),

            // ── Kolkata ──────────────────────────────────────────────────────────
            arena("Salt Lake Football Turf",       "DPLAY, Salt Lake, Kolkata",        "Football",   700,  "https://images.unsplash.com/photo-1521537634581-0dced2fee2ef?w=800&q=80"),
            arena("New Town Cricket Academy",      "DPLAY, New Town, Kolkata",         "Cricket",   1000,  "https://images.unsplash.com/photo-1585186529520-bcd93efb8c21?w=800&q=80"),
            arena("Rajarhat Badminton Hall",       "DPLAY, Rajarhat, Kolkata",         "Badminton",  450,  "https://images.unsplash.com/photo-1632923057155-dd35366a1033?w=800&q=80"),
            arena("Ballygunge Basketball Court",   "DPLAY, Ballygunge, Kolkata",       "Basketball", 620,  "https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&q=80"),
            arena("Park Street Swimming Club",     "DPLAY, Park Street, Kolkata",      "Swimming",   380,  "https://images.unsplash.com/photo-1600965962361-9035dbfd1c50?w=800&q=80"),

            // ── Ahmedabad ────────────────────────────────────────────────────────
            arena("SG Highway Football Turf",      "DPLAY, SG Highway, Ahmedabad",     "Football",   700,  "https://images.unsplash.com/photo-1602472096073-8bdd9609b9a8?w=800&q=80"),
            arena("Prahlad Nagar Tennis",          "DPLAY, Prahlad Nagar, Ahmedabad",  "Tennis",     550,  "https://images.unsplash.com/photo-1545809074-59ced8b3a5c0?w=800&q=80"),
            arena("Satellite Badminton Club",      "DPLAY, Satellite, Ahmedabad",      "Badminton",  420,  "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&q=80"),
            arena("Bopal Cricket Ground",          "DPLAY, Bopal, Ahmedabad",          "Cricket",    900,  "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&q=80"),
            arena("Naroda Volleyball Arena",       "DPLAY, Naroda, Ahmedabad",         "Volleyball",  320, "https://images.unsplash.com/photo-1519861531473-9200262188bf?w=800&q=80"),

            // ── Jaipur ───────────────────────────────────────────────────────────
            arena("Malviya Nagar Badminton",       "DPLAY, Malviya Nagar, Jaipur",     "Badminton",  400,  "https://images.unsplash.com/photo-1599474924187-334a4ae5bd3c?w=800&q=80"),
            arena("Mansarovar Cricket Ground",     "DPLAY, Mansarovar, Jaipur",        "Cricket",    900,  "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&q=80"),
            arena("Vaishali Nagar Football Turf",  "DPLAY, Vaishali Nagar, Jaipur",    "Football",   680,  "https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=800&q=80"),
            arena("Tonk Road Basketball Arena",    "DPLAY, Tonk Road, Jaipur",         "Basketball", 600,  "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&q=80"),

            // ── Kochi ────────────────────────────────────────────────────────────
            arena("Kakkanad Football Ground",      "DPLAY, Kakkanad, Kochi",           "Football",   720,  "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800&q=80"),
            arena("Edapally Badminton Hall",       "DPLAY, Edapally, Kochi",           "Badminton",  480,  "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=800&q=80"),
            arena("Aluva Swimming Centre",         "DPLAY, Aluva, Kochi",              "Swimming",   360,  "https://images.unsplash.com/photo-1519315901367-f34ff9154487?w=800&q=80"),
            arena("Vyttila Cricket Nets",          "DPLAY, Vyttila, Kochi",            "Cricket",    880,  "https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?w=800&q=80"),

            // ── Chandigarh ───────────────────────────────────────────────────────
            arena("Sector 34 Football Ground",     "DPLAY, Sector 34, Chandigarh",     "Football",   720,  "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&q=80"),
            arena("Panchkula Tennis Club",         "DPLAY, Panchkula, Chandigarh",     "Tennis",     580,  "https://images.unsplash.com/photo-1542144582-1ba00456b5e3?w=800&q=80"),
            arena("Mohali Cricket Academy",        "DPLAY, Mohali, Chandigarh",        "Cricket",   1000,  "https://images.unsplash.com/photo-1607170218347-5f16f9a27e12?w=800&q=80"),
            arena("Sector 22 Badminton Complex",   "DPLAY, Sector 22, Chandigarh",     "Badminton",  430,  "https://images.unsplash.com/photo-1564769662533-4f00a87b4056?w=800&q=80"),

            // ── Lucknow ──────────────────────────────────────────────────────────
            arena("Gomti Nagar Football Turf",     "DPLAY, Gomti Nagar, Lucknow",      "Football",   660,  "https://images.unsplash.com/photo-1556056504-5c7696c4c28d?w=800&q=80"),
            arena("Hazratganj Cricket Ground",     "DPLAY, Hazratganj, Lucknow",       "Cricket",    850,  "https://images.unsplash.com/photo-1585186529520-bcd93efb8c21?w=800&q=80"),
            arena("Aliganj Badminton Hall",        "DPLAY, Aliganj, Lucknow",          "Badminton",  400,  "https://images.unsplash.com/photo-1618841557871-b4664fbf0cb3?w=800&q=80"),
            arena("Indira Nagar Basketball Court", "DPLAY, Indira Nagar, Lucknow",     "Basketball", 580,  "https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&q=80"),

            // ── Surat ────────────────────────────────────────────────────────────
            arena("Vesu Football Ground",          "DPLAY, Vesu, Surat",               "Football",   650,  "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800&q=80"),
            arena("Pal Badminton Academy",         "DPLAY, Pal, Surat",                "Badminton",  400,  "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&q=80"),
            arena("Adajan Table Tennis Club",      "DPLAY, Adajan, Surat",             "Table Tennis",300, "https://images.unsplash.com/photo-1611251135345-18c56206b863?w=800&q=80"),

            // ── Nagpur ───────────────────────────────────────────────────────────
            arena("Dharampeth Football Turf",      "DPLAY, Dharampeth, Nagpur",        "Football",   640,  "https://images.unsplash.com/photo-1521537634581-0dced2fee2ef?w=800&q=80"),
            arena("Sitabuldi Cricket Nets",        "DPLAY, Sitabuldi, Nagpur",         "Cricket",    820,  "https://images.unsplash.com/photo-1578621784322-f07e2c13f4c7?w=800&q=80"),
            arena("Manish Nagar Badminton",        "DPLAY, Manish Nagar, Nagpur",      "Badminton",  380,  "https://images.unsplash.com/photo-1632923057155-dd35366a1033?w=800&q=80"),

            // ── Indore ───────────────────────────────────────────────────────────
            arena("Vijay Nagar Football Ground",   "DPLAY, Vijay Nagar, Indore",       "Football",   620,  "https://images.unsplash.com/photo-1602472096073-8bdd9609b9a8?w=800&q=80"),
            arena("Palasia Squash Club",           "DPLAY, Palasia, Indore",           "Squash",     400,  "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&q=80"),
            arena("LIG Colony Badminton Hall",     "DPLAY, LIG Colony, Indore",        "Badminton",  380,  "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&q=80"),

            // ── Coimbatore ───────────────────────────────────────────────────────
            arena("RS Puram Football Turf",        "DPLAY, RS Puram, Coimbatore",      "Football",   600,  "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800&q=80"),
            arena("Saibaba Colony Badminton",      "DPLAY, Saibaba Colony, Coimbatore","Badminton",  380,  "https://images.unsplash.com/photo-1564769662533-4f00a87b4056?w=800&q=80"),
            arena("Peelamedu Cricket Ground",      "DPLAY, Peelamedu, Coimbatore",     "Cricket",    800,  "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&q=80"),

            // ── Mysuru ───────────────────────────────────────────────────────────
            arena("Vijayanagar Football Turf",     "DPLAY, Vijayanagar, Mysuru",       "Football",   580,  "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&q=80"),
            arena("Kuvempunagar Badminton Hall",   "DPLAY, Kuvempunagar, Mysuru",      "Badminton",  360,  "https://images.unsplash.com/photo-1599474924187-334a4ae5bd3c?w=800&q=80"),

            // ── Bhubaneswar ──────────────────────────────────────────────────────
            arena("Patia Football Ground",         "DPLAY, Patia, Bhubaneswar",        "Football",   580,  "https://images.unsplash.com/photo-1556056504-5c7696c4c28d?w=800&q=80"),
            arena("Nayapalli Cricket Nets",        "DPLAY, Nayapalli, Bhubaneswar",    "Cricket",    780,  "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&q=80"),

            // ── Guwahati ─────────────────────────────────────────────────────────
            arena("Dispur Football Turf",          "DPLAY, Dispur, Guwahati",          "Football",   540,  "https://images.unsplash.com/photo-1521537634581-0dced2fee2ef?w=800&q=80"),
            arena("Paltan Bazaar Badminton Hall",  "DPLAY, Paltan Bazaar, Guwahati",   "Badminton",  340,  "https://images.unsplash.com/photo-1618841557871-b4664fbf0cb3?w=800&q=80")
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
