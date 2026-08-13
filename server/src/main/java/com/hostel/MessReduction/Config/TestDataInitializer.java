package com.hostel.MessReduction.Config;

import com.hostel.MessReduction.Entity.Department;
import com.hostel.MessReduction.Entity.Gender;
import com.hostel.MessReduction.Entity.Role;
import com.hostel.MessReduction.Entity.StaffUsers;
import com.hostel.MessReduction.Entity.StudentDetails;
import com.hostel.MessReduction.Repo.DepartmentRepo;
import com.hostel.MessReduction.Repo.StaffUsersRepo;
import com.hostel.MessReduction.Repo.StudentDetailsRepo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import com.hostel.MessReduction.Entity.FormStatus;
import com.hostel.MessReduction.Entity.ReductionForm;
import com.hostel.MessReduction.Repo.ReductionFormRepo;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Component
public class TestDataInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(TestDataInitializer.class);

    private final StaffUsersRepo staffUsersRepo;
    private final DepartmentRepo departmentRepo;
    private final StudentDetailsRepo studentDetailsRepo;
    private final ReductionFormRepo reductionFormRepo;
    private final JdbcTemplate jdbcTemplate;

    public TestDataInitializer(StaffUsersRepo staffUsersRepo, DepartmentRepo departmentRepo, StudentDetailsRepo studentDetailsRepo, ReductionFormRepo reductionFormRepo, JdbcTemplate jdbcTemplate) {
        this.staffUsersRepo = staffUsersRepo;
        this.departmentRepo = departmentRepo;
        this.studentDetailsRepo = studentDetailsRepo;
        this.reductionFormRepo = reductionFormRepo;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) throws Exception {
        seedDepartments();
        seedTestStudents();
        seedDeputyWarden4Forms();

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

    private void seedTestStudents() {
        long currentCount = studentDetailsRepo.count();
        if (currentCount >= 200) {
            logger.info("Database already contains {} students (>= 200). Skipping student seeding.", currentCount);
            return;
        }

        logger.info("Seeding 200 test students into database (current count: {})...", currentCount);

        String[] firstNamesMale = {
                "Aarav", "Aditya", "Akash", "Arjun", "Deepak", "Gautam", "Harish", "Karthik", "Manoj", "Naveen",
                "Pranav", "Rahul", "Rohan", "Sachin", "Siddharth", "Suresh", "Varun", "Vignesh", "Vijay", "Yash"
        };
        String[] firstNamesFemale = {
                "Aishwarya", "Ananya", "Bhavna", "Deepika", "Divya", "Ishita", "Kavya", "Keerthi", "Meera", "Neha",
                "Pooja", "Priya", "Radhika", "Rhea", "Sanjana", "Shreya", "Sneha", "Swathi", "Tanvi", "Vidya"
        };
        String[] lastNames = {
                "Sharma", "Verma", "Patel", "Reddy", "Nair", "Iyer", "Kumar", "Singh", "Subramanian", "Joshi",
                "Gupta", "Rao", "Menon", "Pillai", "Choudhury", "Bose", "Mehta", "Bhat", "Deshmukh", "Kulkarni"
        };
        String[] departments = {"CSE", "ECE", "EEE", "MECH", "CIVIL", "MECHATRONICS"};

        List<StudentDetails> newStudents = new ArrayList<>();
        java.util.Set<String> existingRegs = studentDetailsRepo.findAll().stream()
                .map(StudentDetails::getRegisterNo)
                .collect(java.util.stream.Collectors.toSet());

        for (int i = 1; i <= 200; i++) {
            String registerNo = String.format("7100TEST%04d", i);
            String rollNo = String.format("TST%04d", i);
            String emailId = String.format("test.student%04d@hosteltest.com", i);
            String phoneNo = String.format("910000%04d", i);

            // Skip if already exists
            if (existingRegs.contains(registerNo)) {
                continue;
            }

            Gender gender = (i % 2 == 0) ? Gender.MALE : Gender.FEMALE;
            String firstName = (gender == Gender.MALE)
                    ? firstNamesMale[(i / 2) % firstNamesMale.length]
                    : firstNamesFemale[(i / 2) % firstNamesFemale.length];
            String lastName = lastNames[i % lastNames.length];
            String fullName = firstName + " " + lastName;

            int year = 1 + (i % 4);
            int birthYear = 2007 - year;
            int birthMonth = 1 + (i % 12);
            int birthDay = 1 + (i % 28);
            LocalDate dob = LocalDate.of(birthYear, birthMonth, birthDay);

            String dept = departments[i % departments.length];

            StudentDetails student = new StudentDetails();
            student.setName(fullName);
            student.setRegisterNo(registerNo);
            student.setRollNo(rollNo);
            student.setDepartment(dept);
            student.setGender(gender);
            student.setDob(dob);
            student.setEmailId(emailId);
            student.setPhoneNo(phoneNo);
            student.setCurrentYear(year);
            student.setDailySubmissionCount(0);
            student.setExtraSubmissionGranted(0);
            student.setExtraSubmissionUsed(0);

            newStudents.add(student);
        }

        if (!newStudents.isEmpty()) {
            studentDetailsRepo.saveAll(newStudents);
            logger.info("Successfully seeded {} new test students into the database.", newStudents.size());
        }
    }

    private void seedDeputyWarden4Forms() {
        long existingCount = reductionFormRepo.countByCurrentStatusAndAssignedDeputyWardenAndIsActiveTrue(
                FormStatus.PendingDeputyWarden, "deputyWarden4");
        if (existingCount >= 100) {
            logger.info("Deputy Warden 'deputyWarden4' already has {} pending requests (>= 100). Skipping.", existingCount);
            return;
        }

        List<StudentDetails> students = studentDetailsRepo.findAll();
        if (students.isEmpty()) {
            logger.warn("No students found in DB to associate with deputyWarden4 reduction forms.");
            return;
        }

        long toCreate = 100 - existingCount;
        logger.info("Seeding {} pending reduction forms assigned to 'deputyWarden4'...", toCreate);

        List<ReductionForm> forms = new ArrayList<>();
        LocalDate baseLeave = LocalDate.now().plusDays(2);

        for (int i = 0; i < toCreate; i++) {
            StudentDetails student = students.get(i % students.size());

            ReductionForm form = new ReductionForm();
            form.setStudentDetails(student);
            form.setYear(4);
            form.setRoomNo(100L + (i % 50));
            form.setLeaveDate(baseLeave.plusDays(i % 5));
            form.setLeaveTime(LocalTime.of(8, 0, 0));
            form.setArrivalDate(baseLeave.plusDays((i % 5) + 3));
            form.setArrivalTime(LocalTime.of(20, 0, 0));
            form.setPresentDate(baseLeave.plusDays((i % 5) + 4));
            form.setTotalHolidays(3L);
            form.setReason("Testing mess reduction bulk approval/rejection for Deputy Warden 4");
            form.setCurrentStatus(FormStatus.PendingDeputyWarden);
            form.setAssignedDeputyWarden("deputyWarden4");
            form.setActive(true);

            forms.add(form);
        }

        reductionFormRepo.saveAll(forms);
        logger.info("Successfully seeded 100 pending mess reduction requests for 'deputyWarden4'.");
    }
}
