package com.hostel.MessReduction.Config;

import com.hostel.MessReduction.Entity.Role;
import com.hostel.MessReduction.Entity.StaffUsers;
import com.hostel.MessReduction.Repo.StaffUsersRepo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class TestDataInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(TestDataInitializer.class);

    private final StaffUsersRepo staffUsersRepo;
    private final JdbcTemplate jdbcTemplate;

    public TestDataInitializer(StaffUsersRepo staffUsersRepo, JdbcTemplate jdbcTemplate) {
        this.staffUsersRepo = staffUsersRepo;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) throws Exception {
        List<StaffUsers> wardens = staffUsersRepo.findByRole(Role.Warden);
        for (StaffUsers warden : wardens) {
            warden.setGmail("dhineshdeveloper001@gmail.com");
            staffUsersRepo.save(warden);
        }
        logger.info("TESTING SETUP: Updated all Warden emails to dhineshdeveloper001@gmail.com");

        try {
            jdbcTemplate.execute("SELECT setval('student_details_student_id_seq', COALESCE((SELECT MAX(student_id) FROM student_details), 0) + 1, false)");
            jdbcTemplate.execute("SELECT setval('reduction_form_form_id_seq', COALESCE((SELECT MAX(form_id) FROM reduction_form), 0) + 1, false)");
            logger.info("PostgreSQL sequences synchronized successfully.");
        } catch (Exception e) {
            logger.error("Failed to sync sequences: {}", e.getMessage());
        }
    }
}
