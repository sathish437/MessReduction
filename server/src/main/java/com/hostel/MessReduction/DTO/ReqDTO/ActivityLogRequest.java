package com.hostel.MessReduction.DTO.ReqDTO;

import com.hostel.MessReduction.Entity.Role;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public class ActivityLogRequest {

    @NotNull
    private Long formId;

    @NotNull
    private Long studentId;

    @NotBlank
    private String studentName;

    @NotBlank
    private String department;

    @NotNull
    private Role staffRole;

    @NotBlank
    private String staffName;

    @NotBlank
    private String action;

    @NotNull
    private LocalDate arrivalDate;

    private Integer year;

    public Integer getYear() {
        return year;
    }

    public void setYear(Integer year) {
        this.year = year;
    }

    public Long getFormId() {
        return formId;
    }

    public void setFormId(Long formId) {
        this.formId = formId;
    }

    public Long getStudentId() {
        return studentId;
    }

    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }

    public String getStudentName() {
        return studentName;
    }

    public void setStudentName(String studentName) {
        this.studentName = studentName;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public Role getStaffRole() {
        return staffRole;
    }

    public void setStaffRole(Role staffRole) {
        this.staffRole = staffRole;
    }

    public String getStaffName() {
        return staffName;
    }

    public void setStaffName(String staffName) {
        this.staffName = staffName;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public LocalDate getArrivalDate() {
        return arrivalDate;
    }

    public void setArrivalDate(LocalDate arrivalDate) {
        this.arrivalDate = arrivalDate;
    }
}
