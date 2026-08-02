package com.hostel.MessReduction.Service;

import com.hostel.MessReduction.CustomException.DuplicateStudentException;
import com.hostel.MessReduction.DTO.ReqDTO.StudentDetailsReqDTO;
import com.hostel.MessReduction.DTO.ResDTO.StudentDetailsResDTO;
import com.hostel.MessReduction.Entity.Department;
import com.hostel.MessReduction.Entity.StudentDetails;
import com.hostel.MessReduction.Repo.StudentDetailsRepo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class StudentDetailsServiceTest {

    @Mock
    private StudentDetailsRepo studentDetailsRepo;

    @Mock
    private DepartmentService departmentService;

    @InjectMocks
    private StudentDetailsService studentDetailsService;

    private StudentDetailsReqDTO reqDto;

    @BeforeEach
    void setUp() {
        reqDto = new StudentDetailsReqDTO();
        reqDto.setName("John Doe");
        reqDto.setRollNo("22CSE01");
        reqDto.setRegisterNo("830122104001");
        reqDto.setEmailId("john@example.com");
        reqDto.setPhoneNo("9876543210");
        reqDto.setDepartment("CSE");
    }

    @Test
    void testAddStudent_DuplicateRollNo_ThrowsDuplicateStudentException() {
        when(studentDetailsRepo.existsByRollNo("22CSE01")).thenReturn(true);

        DuplicateStudentException exception = assertThrows(
                DuplicateStudentException.class,
                () -> studentDetailsService.addStudent(reqDto)
        );

        assertEquals("This Roll Number is already registered!", exception.getMessage());
        verify(studentDetailsRepo, never()).saveAndFlush(any());
    }

    @Test
    void testAddStudent_DuplicateRegisterNo_ThrowsDuplicateStudentException() {
        when(studentDetailsRepo.existsByRollNo("22CSE01")).thenReturn(false);
        when(studentDetailsRepo.existsByRegisterNo("830122104001")).thenReturn(true);

        DuplicateStudentException exception = assertThrows(
                DuplicateStudentException.class,
                () -> studentDetailsService.addStudent(reqDto)
        );

        assertEquals("This Register Number is already registered!", exception.getMessage());
        verify(studentDetailsRepo, never()).saveAndFlush(any());
    }

    @Test
    void testAddStudent_DuplicateEmail_ThrowsDuplicateStudentException() {
        when(studentDetailsRepo.existsByRollNo("22CSE01")).thenReturn(false);
        when(studentDetailsRepo.existsByRegisterNo("830122104001")).thenReturn(false);
        when(studentDetailsRepo.existsByEmailId("john@example.com")).thenReturn(true);

        DuplicateStudentException exception = assertThrows(
                DuplicateStudentException.class,
                () -> studentDetailsService.addStudent(reqDto)
        );

        assertEquals("Email already exists", exception.getMessage());
        verify(studentDetailsRepo, never()).saveAndFlush(any());
    }

    @Test
    void testAddStudent_DataIntegrityViolation_RollNo_ThrowsDuplicateStudentException() {
        when(studentDetailsRepo.existsByRollNo(any())).thenReturn(false);
        when(studentDetailsRepo.existsByRegisterNo(any())).thenReturn(false);
        when(studentDetailsRepo.existsByEmailId(any())).thenReturn(false);
        when(studentDetailsRepo.existsByPhoneNo(any())).thenReturn(false);

        Department dept = new Department();
        dept.setIsActive(true);
        when(departmentService.findEntityByCode("CSE")).thenReturn(dept);

        DataIntegrityViolationException dive = new DataIntegrityViolationException(
                "Duplicate entry",
                new org.hibernate.exception.ConstraintViolationException("Duplicate entry for key roll_no", null, "roll_no_KEY")
        );
        when(studentDetailsRepo.saveAndFlush(any(StudentDetails.class))).thenThrow(dive);

        DuplicateStudentException exception = assertThrows(
                DuplicateStudentException.class,
                () -> studentDetailsService.addStudent(reqDto)
        );

        assertEquals("This Roll Number is already registered!", exception.getMessage());
    }
}
