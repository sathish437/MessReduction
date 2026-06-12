package com.hostel.MessReduction.Config;

import com.hostel.MessReduction.Entity.Role;
import com.hostel.MessReduction.Entity.StaffUsers;
import com.hostel.MessReduction.Repo.StaffUsersRepo;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class TestDataInitializer implements CommandLineRunner {

    private final StaffUsersRepo staffUsersRepo;

    public TestDataInitializer(StaffUsersRepo staffUsersRepo) {
        this.staffUsersRepo = staffUsersRepo;
    }

    @Override
    public void run(String... args) throws Exception {
        List<StaffUsers> wardens = staffUsersRepo.findByRole(Role.Warden);
        for (StaffUsers warden : wardens) {
            warden.setGmail("dhineshdeveloper001@gmail.com");
            staffUsersRepo.save(warden);
        }
        System.out.println("==========================================================");
        System.out.println("TESTING SETUP: Updated all Warden emails to dhineshdeveloper001@gmail.com");
        System.out.println("==========================================================");
    }
}
