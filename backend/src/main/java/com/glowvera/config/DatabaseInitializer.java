package com.glowvera.config;

import com.glowvera.entity.*;
import com.glowvera.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Optional;

@Component
public class DatabaseInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final ServiceRepository serviceRepository;
    private final StylistRepository stylistRepository;
    private final PasswordEncoder passwordEncoder;

    public DatabaseInitializer(UserRepository userRepository,
                               CategoryRepository categoryRepository,
                               ServiceRepository serviceRepository,
                               StylistRepository stylistRepository,
                               PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
        this.serviceRepository = serviceRepository;
        this.stylistRepository = stylistRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        System.out.println("Running Database Initializer...");

        // 1. Seed Users (Granular check per user)
        if (userRepository.findByEmail("client@glowvera.com").isEmpty()) {
            User client = User.builder()
                    .name("Glowvera Client")
                    .email("client@glowvera.com")
                    .passwordHash(passwordEncoder.encode("password123"))
                    .role(Role.CLIENT)
                    .build();
            userRepository.save(client);
            System.out.println("Auto-created missing user: client@glowvera.com");
        } else {
            System.out.println("User client@glowvera.com already exists.");
        }

        if (userRepository.findByEmail("admin@glowvera.com").isEmpty()) {
            User admin = User.builder()
                    .name("Glowvera Admin")
                    .email("admin@glowvera.com")
                    .passwordHash(passwordEncoder.encode("password123"))
                    .role(Role.ADMIN)
                    .build();
            userRepository.save(admin);
            System.out.println("Auto-created missing user: admin@glowvera.com");
        } else {
            System.out.println("User admin@glowvera.com already exists.");
        }

        // 2. Seed Categories (Granular check per category name)
        Category hairCare = getOrCreateCategory("Hair Care");
        Category beardGrooming = getOrCreateCategory("Beard & Grooming");
        Category spaMassage = getOrCreateCategory("Spa & Massage");
        Category skinFacial = getOrCreateCategory("Skin & Facial");

        // 3. Seed Services (Granular check per service name)
        Service s1 = getOrCreateService(hairCare, "Unisex Haircut & Styling", new BigDecimal("800.00"), 45);
        Service s2 = getOrCreateService(hairCare, "Luxury Hair Spa & Deep Conditioning", new BigDecimal("1500.00"), 60);
        Service s3 = getOrCreateService(hairCare, "Professional Hair Coloring", new BigDecimal("4000.00"), 120);
        Service s4 = getOrCreateService(hairCare, "Hair Blowout & Styling", new BigDecimal("600.00"), 30);

        Service s5 = getOrCreateService(beardGrooming, "Classic Beard Trim & Razor Styling", new BigDecimal("400.00"), 30);
        Service s6 = getOrCreateService(beardGrooming, "Hot Towel Royal Shave", new BigDecimal("500.00"), 45);

        Service s7 = getOrCreateService(spaMassage, "Swedish Deep Tissue Massage", new BigDecimal("2500.00"), 60);
        Service s8 = getOrCreateService(spaMassage, "Hot Stone Relaxing Therapy", new BigDecimal("3500.00"), 90);

        Service s9 = getOrCreateService(skinFacial, "Charcoal Deep Cleansing Facial", new BigDecimal("1500.00"), 45);
        Service s10 = getOrCreateService(skinFacial, "Luxury Anti-Aging Facial", new BigDecimal("2500.00"), 60);

        // 4. Seed Stylists (Granular check per stylist name)
        getOrCreateStylist("Alex Carter", LocalTime.of(9, 0), LocalTime.of(18, 0), LocalTime.of(13, 0), LocalTime.of(14, 0), s1, s2, s3, s4);
        getOrCreateStylist("Sophia Bennett", LocalTime.of(10, 0), LocalTime.of(19, 0), LocalTime.of(14, 0), LocalTime.of(15, 0), s7, s8);
        getOrCreateStylist("Marcus Vance", LocalTime.of(9, 0), LocalTime.of(18, 0), LocalTime.of(12, 0), LocalTime.of(13, 0), s1, s4, s5, s6);
        getOrCreateStylist("Elena Rostova", LocalTime.of(11, 0), LocalTime.of(20, 0), LocalTime.of(15, 0), LocalTime.of(16, 0), s9, s10, s7);

        System.out.println("Database Seeding Check Completed.");
    }

    private Category getOrCreateCategory(String name) {
        return categoryRepository.findByName(name)
                .orElseGet(() -> {
                    Category cat = Category.builder().name(name).build();
                    System.out.println("Auto-created missing category: " + name);
                    return categoryRepository.save(cat);
                });
    }

    private Service getOrCreateService(Category category, String name, BigDecimal price, int duration) {
        java.util.Optional<Service> existing = serviceRepository.findByName(name);
        if (existing.isPresent()) {
            Service s = existing.get();
            if (s.getPrice().compareTo(price) != 0 || s.getDurationMinutes() != duration) {
                s.setPrice(price);
                s.setDurationMinutes(duration);
                System.out.println("Updated service pricing/duration: " + name);
                return serviceRepository.save(s);
            }
            return s;
        } else {
            Service s = Service.builder()
                    .category(category)
                    .name(name)
                    .price(price)
                    .durationMinutes(duration)
                    .build();
            System.out.println("Auto-created missing service: " + name);
            return serviceRepository.save(s);
        }
    }

    private void getOrCreateStylist(String name, LocalTime start, LocalTime end, LocalTime breakS, LocalTime breakE, Service... services) {
        Optional<Stylist> existing = stylistRepository.findByName(name);
        if (existing.isEmpty()) {
            Stylist stylist = Stylist.builder()
                    .name(name)
                    .isActive(true)
                    .workingStart(start)
                    .workingEnd(end)
                    .breakStart(breakS)
                    .breakEnd(breakE)
                    .services(new HashSet<>(Arrays.asList(services)))
                    .build();
            stylistRepository.save(stylist);
            System.out.println("Auto-created missing stylist: " + name);
        }
    }
}
