package com.hostel.MessReduction.Config;

import com.hostel.MessReduction.Entity.Role;
import com.hostel.MessReduction.Entity.StaffUsers;
import com.hostel.MessReduction.Repo.StaffUsersRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class StaffDataInitializer implements CommandLineRunner {

    private final StaffUsersRepo staffUsersRepo;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        log.info("Initializing default staff accounts...");

        // Delete existing staff accounts to avoid role column truncation issues
        staffUsersRepo.deleteAll();

        // Create 4 Wardens
        createStaff("warden1", "warden123", Role.Warden, "duraisamysathish437@gmail.com");
        createStaff("warden2", "warden123", Role.Warden, "duraisamysathish437@gmail.com");
        createStaff("warden3", "warden123", Role.Warden, "duraisamysathish437@gmail.com");
        createStaff("warden4", "warden123", Role.Warden, "duraisamysathish437@gmail.com");

        // Create Deputy Warden
        createStaff("deputyWarden", "deputy123", Role.DeputyWarden, "deputy@gmail.com");

        // Create Office
        createStaff("office", "office123", Role.Office, "office@gmail.com");

        log.info("Default staff accounts initialized successfully");
    }

    private void createStaff(String username, String password, Role role, String gmail) {
        StaffUsers staff = new StaffUsers();
        staff.setUserName(username);
        staff.setPassword(passwordEncoder.encode(password));
        staff.setRole(role);
        staff.setGmail(gmail);
        staffUsersRepo.save(staff);
        log.info("Created staff: {} with role: {}", username, role);
    }
}
