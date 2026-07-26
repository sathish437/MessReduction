package com.hostel.MessReduction.Config;

import com.hostel.MessReduction.Entity.Department;
import com.hostel.MessReduction.Entity.Role;
import com.hostel.MessReduction.Entity.StaffUsers;
import com.hostel.MessReduction.Repo.DepartmentRepo;
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
    private final DepartmentRepo departmentRepo;
    private final JdbcTemplate jdbcTemplate;

    public TestDataInitializer(StaffUsersRepo staffUsersRepo, DepartmentRepo departmentRepo, JdbcTemplate jdbcTemplate) {
        this.staffUsersRepo = staffUsersRepo;
        this.departmentRepo = departmentRepo;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) throws Exception {
        seedDepartments();

        try {
            jdbcTemplate.execute("SELECT setval('student_details_student_id_seq', COALESCE((SELECT MAX(student_id) FROM student_details), 0) + 1, false)");
            jdbcTemplate.execute("SELECT setval('reduction_form_form_id_seq', COALESCE((SELECT MAX(form_id) FROM reduction_form), 0) + 1, false)");
            logger.info("PostgreSQL sequences synchronized successfully.");
        } catch (Exception e) {
            logger.error("Failed to sync sequences: {}", e.getMessage());
        }
    }

    private void seedDepartments() {
        if (departmentRepo.count() == 0) {
            logger.info("Seeding initial default departments into database...");
            List<Department> defaultDepts = List.of(
                    Department.builder().departmentCode("CSE").departmentName("Computer Science and Engineering").shortName("CSE").displayOrder(1).isActive(true).build(),
                    Department.builder().departmentCode("ECE").departmentName("Electronics and Communication Engineering").shortName("ECE").displayOrder(2).isActive(true).build(),
                    Department.builder().departmentCode("EEE").departmentName("Electrical and Electronics Engineering").shortName("EEE").displayOrder(3).isActive(true).build(),
                    Department.builder().departmentCode("MECH").departmentName("Mechanical Engineering").shortName("MECH").displayOrder(4).isActive(true).build(),
                    Department.builder().departmentCode("CIVIL").departmentName("Civil Engineering").shortName("CIVIL").displayOrder(5).isActive(true).build(),
                    Department.builder().departmentCode("MECHATRONICS").departmentName("Mechatronics Engineering").shortName("MECHATRONICS").displayOrder(6).isActive(true).build()
            );
            departmentRepo.saveAll(defaultDepts);
            logger.info("Default departments seeded successfully.");
        }
    }
}
