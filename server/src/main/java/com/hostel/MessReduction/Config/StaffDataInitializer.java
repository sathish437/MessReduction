package com.hostel.MessReduction.Config;

import com.hostel.MessReduction.Entity.Gender;
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

        // Create 1 Warden (Associate Warden)
        createStaff("warden", "warden123", Role.Warden, "warden@gmail.com");


        // Create 8 Deputy Wardens
        createDeputy("deputyWarden1", Role.DeputyWarden, "MALE", 1);
        createDeputy("deputyWarden2", Role.DeputyWarden, "MALE", 2);
        createDeputy("deputyWarden3", Role.DeputyWarden, "MALE", 3);
        createDeputy("deputyWarden4", Role.DeputyWarden, "MALE", 4);
        createDeputy("deputyWarden5", Role.DeputyWarden, "FEMALE", 1);
        createDeputy("deputyWarden6", Role.DeputyWarden, "FEMALE", 2);
        createDeputy("deputyWarden7", Role.DeputyWarden, "FEMALE", 3);
        createDeputy("deputyWarden8", Role.DeputyWarden, "FEMALE", 4);

        // Create Office
        createStaff("office", "office123", Role.Office, "office@gmail.com");

        // Create Admin permanently
        createStaff("leodas", "benigay", Role.ADMIN, "admin@gces.edu");

        log.info("Default staff accounts initialized successfully");
    }

    private void createStaff(String username, String password, Role role, String gmail) {
        StaffUsers staff = new StaffUsers();
        staff.setUserName(username);
        staff.setPassword(passwordEncoder.encode(password));
        staff.setRole(role);
        staff.setGmail(gmail);
        staff.setPhoneNo("+917708988616"); // Added for WhatsApp testing
        staffUsersRepo.save(staff);
        log.info("Created staff: {} with role: {}", username, role);
    }

    private void createDeputy(String username, Role role, String gender, Integer year) {
        StaffUsers staff = new StaffUsers();
        staff.setUserName(username);
        staff.setPassword(passwordEncoder.encode("deputy123"));
        staff.setRole(role);
        staff.setGmail(username + "@gmail.com");
        staff.setPhoneNo("+917708988616"); // Added for WhatsApp testing
        staff.setGender(Gender.valueOf(gender));
        staff.setYear(year);
        staffUsersRepo.save(staff);
        log.info("Created deputy warden: {} with gender: {} year: {}", username, gender, year);
    }
}
