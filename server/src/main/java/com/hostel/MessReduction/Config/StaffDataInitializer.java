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

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class StaffDataInitializer implements CommandLineRunner {

    private final StaffUsersRepo staffUsersRepo;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        log.info("Checking and initializing default accounts...");

        // Ensure MasterAdmin exists if no ADMIN account is present
        List<StaffUsers> admins = staffUsersRepo.findByRole(Role.ADMIN);
        if (admins.isEmpty()) {
            createStaff("MasterAdmin", "admin@gces@123", Role.ADMIN, "admin@gces.edu");
        } else if (admins.size() > 1) {
            // Clean up any extra admin accounts accidentally duplicated in previous runs
            StaffUsers primary = admins.stream()
                    .filter(a -> "MasterAdmin".equals(a.getUserName()))
                    .findFirst()
                    .orElse(admins.get(0));
            for (StaffUsers admin : admins) {
                if (!admin.getUserId().equals(primary.getUserId())) {
                    staffUsersRepo.delete(admin);
                    log.info("Removed duplicate admin account: {}", admin.getUserName());
                }
            }
        }

        // Ensure Warden exists if no Warden account is present
        if (staffUsersRepo.findByRole(Role.Warden).isEmpty()) {
            createStaff("warden", "warden123", Role.Warden, "warden@gmail.com");
        }

        // Ensure 8 Deputy Wardens exist for each gender and year if not present
        ensureDeputy("deputyWarden1", "MALE", 1);
        ensureDeputy("deputyWarden2", "MALE", 2);
        ensureDeputy("deputyWarden3", "MALE", 3);
        ensureDeputy("deputyWarden4", "MALE", 4);
        ensureDeputy("deputyWarden5", "FEMALE", 1);
        ensureDeputy("deputyWarden6", "FEMALE", 2);
        ensureDeputy("deputyWarden7", "FEMALE", 3);
        ensureDeputy("deputyWarden8", "FEMALE", 4);

        // Ensure Office exists if no Office account is present
        if (staffUsersRepo.findByRole(Role.Office).isEmpty()) {
            createStaff("office", "office123", Role.Office, "office@gmail.com");
        }

        log.info("Staff and admin accounts checked/initialized successfully");
    }

    private void ensureDeputy(String defaultUsername, String gender, Integer year) {
        Gender g = Gender.valueOf(gender);
        if (staffUsersRepo.findByRoleAndGenderAndYear(Role.DeputyWarden, g, year).isEmpty()) {
            createDeputy(defaultUsername, Role.DeputyWarden, gender, year);
        }
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
