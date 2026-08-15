package com.hostel.MessReduction.DTO.ResDTO;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.hostel.MessReduction.Entity.Role;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class ActivityLogResponse {

    private Long id;
    private Long formId;
    private Long studentId;
    private String studentName;
    private String department;
    private Role staffRole;
    private String staffName;
    private String action;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime timestamp;
    private LocalDate arrivalDate;
    private boolean isActive;
    private Integer year;

    public ActivityLogResponse() {
    }

    public ActivityLogResponse(Long id, Long formId, Long studentId, String studentName, String department, Role staffRole, String staffName, String action, LocalDateTime timestamp, LocalDate arrivalDate, boolean isActive) {
        this(id, formId, studentId, studentName, department, staffRole, staffName, action, timestamp, arrivalDate, isActive, null);
    }

    public ActivityLogResponse(Long id, Long formId, Long studentId, String studentName, String department, Role staffRole, String staffName, String action, LocalDateTime timestamp, LocalDate arrivalDate, boolean isActive, Integer year) {
        this.id = id;
        this.formId = formId;
        this.studentId = studentId;
        this.studentName = studentName;
        this.department = department;
        this.staffRole = staffRole;
        this.staffName = staffName;
        this.action = action;
        this.timestamp = timestamp;
        this.arrivalDate = arrivalDate;
        this.isActive = isActive;
        this.year = year;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public LocalDate getArrivalDate() {
        return arrivalDate;
    }

    public void setArrivalDate(LocalDate arrivalDate) {
        this.arrivalDate = arrivalDate;
    }

    public boolean isActive() {
        return isActive;
    }

    public void setActive(boolean active) {
        isActive = active;
    }

    public Integer getYear() {
        return year;
    }

    public void setYear(Integer year) {
        this.year = year;
    }
}
