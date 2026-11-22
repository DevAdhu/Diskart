package com.store.ecommerce.config;

import com.store.ecommerce.model.User;
import com.store.ecommerce.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

/**
 * Development-only bootstrap of an admin account. Disabled in the "prod"
 * profile and unless app.seed.enabled=true. Credentials come from properties,
 * never from source-controlled production defaults.
 */
@Slf4j
@Component
@Profile("!prod")
@ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true")
@RequiredArgsConstructor
public class AdminSeeder implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.seed.admin.email}")
    private String adminEmail;

    @Value("${app.seed.admin.password}")
    private String adminPassword;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        String email = adminEmail == null ? "" : adminEmail.trim().toLowerCase(Locale.ROOT);
        if (email.isEmpty()) {
            log.warn("app.seed.admin.email is empty; skipping dev admin seed");
            return;
        }
        if (userRepository.existsByEmail(email)) {
            return;
        }
        try {
            User admin = new User();
            admin.setName("Dev Admin");
            admin.setEmail(email);
            admin.setPassword(passwordEncoder.encode(adminPassword));
            admin.setRole(User.Role.ADMIN);
            userRepository.save(admin);
            log.info("Seeded development admin account for {}", email);
        } catch (Exception ex) {
            log.warn("Could not seed development admin account for {}", email, ex);
        }
    }
}
