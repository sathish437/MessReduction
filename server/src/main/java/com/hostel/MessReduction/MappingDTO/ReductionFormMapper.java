package com.hostel.MessReduction.MappingDTO;

import com.hostel.MessReduction.DTO.ReqDTO.ReductionFormReqDTO;
import com.hostel.MessReduction.DTO.ResDTO.ReductionFormResDTO;
import com.hostel.MessReduction.Entity.ReductionForm;
import com.hostel.MessReduction.Entity.StudentDetails;

import java.time.LocalDate;

public class ReductionFormMapper {
    public static ReductionForm mapToReductionForm(ReductionFormReqDTO reductionFormReqDTO, StudentDetails studentDetails, LocalDate presentDate, Long totalHolidays, String assignedDeputyWarden){
        ReductionForm reductionForm=new ReductionForm();

        reductionForm.setStudentDetails(studentDetails);
        reductionForm.setYear(reductionFormReqDTO.getYear());
        reductionForm.setRoomNo(reductionFormReqDTO.getRoomNo());
        reductionForm.setLeaveDate(reductionFormReqDTO.getLeaveDate());
        reductionForm.setLeaveTime(reductionFormReqDTO.getLeaveTime());
        reductionForm.setAssignedDeputyWarden(assignedDeputyWarden);
        reductionForm.setArrivalDate(reductionFormReqDTO.getArrivalDate());
        reductionForm.setArrivalTime(reductionFormReqDTO.getArrivalTime());
        reductionForm.setPresentDate(presentDate);
        reductionForm.setTotalHolidays(totalHolidays);
        reductionForm.setReason(reductionFormReqDTO.getReason());
        reductionForm.setToDate(reductionFormReqDTO.getToDate());
        reductionForm.setAdditionalRemarks(reductionFormReqDTO.getAdditionalRemarks());
        reductionForm.setSubmittedAt(com.hostel.MessReduction.utils.DateTimeUtil.nowLocalDateTime());

        return reductionForm;
    }

    public static ReductionFormResDTO mapToReductionFormResDTO(ReductionForm reductionForm){
        if (reductionForm == null) {
            return null;
        }
        ReductionFormResDTO reductionFormResDTO=new ReductionFormResDTO();

        reductionFormResDTO.setFormId(reductionForm.getFormId());

        StudentDetails studentDetails = reductionForm.getStudentDetails();
        if (studentDetails != null) {
            reductionFormResDTO.setStudentId(studentDetails.getStudentId());
            reductionFormResDTO.setName(studentDetails.getName());
            reductionFormResDTO.setDepartment(studentDetails.getDepartment());
            reductionFormResDTO.setRegisterNo(studentDetails.getRegisterNo());
            reductionFormResDTO.setRollNo(studentDetails.getRollNo());
            reductionFormResDTO.setGender(studentDetails.getGender());
            reductionFormResDTO.setPhoneNo(studentDetails.getPhoneNo());
        }

        reductionFormResDTO.setYear(reductionForm.getYear());
        reductionFormResDTO.setRoomNo(reductionForm.getRoomNo());
        reductionFormResDTO.setLeaveDate(reductionForm.getLeaveDate());
        reductionFormResDTO.setLeaveTime(reductionForm.getLeaveTime());
        reductionFormResDTO.setAssignedDeputyWarden(reductionForm.getAssignedDeputyWarden());
        reductionFormResDTO.setArrivalDate(reductionForm.getArrivalDate());
        reductionFormResDTO.setArrivalTime(reductionForm.getArrivalTime());
        reductionFormResDTO.setPresentDate(reductionForm.getPresentDate());
        reductionFormResDTO.setTotalHolidays(reductionForm.getTotalHolidays());
        reductionFormResDTO.setMonthWiseHolidays(
                com.hostel.MessReduction.utils.HolidayReportHelper.calculateMonthWiseHolidays(
                        reductionForm.getLeaveDate(),
                        reductionForm.getArrivalDate() != null ? reductionForm.getArrivalDate() : reductionForm.getToDate(),
                        reductionForm.getTotalHolidays()
                )
        );
        reductionFormResDTO.setReason(reductionForm.getReason());
        reductionFormResDTO.setCurrentStatus(reductionForm.getCurrentStatus());
        reductionFormResDTO.setRejectReason(reductionForm.getRejectReason());
        reductionFormResDTO.setSubmittedAt(reductionForm.getSubmittedAt());
        reductionFormResDTO.setToDate(reductionForm.getToDate());
        reductionFormResDTO.setAdditionalRemarks(reductionForm.getAdditionalRemarks());
        reductionFormResDTO.setResubmissionCount(reductionForm.getResubmissionCount());
        reductionFormResDTO.setDeletedByStudent(reductionForm.isDeletedByStudent());
        reductionFormResDTO.setDeletedAt(reductionForm.getDeletedAt());
        reductionFormResDTO.setRejectedStage(reductionForm.getRejectedStage() != null ? reductionForm.getRejectedStage().name() : null);
        reductionFormResDTO.setResumeStage(reductionForm.getResumeStage() != null ? reductionForm.getResumeStage().name() : null);
        return reductionFormResDTO;
    }

    public static ReductionFormResDTO mapToOfficeReportDTO(ReductionForm reductionForm, int adminN) {
        if (reductionForm == null) {
            return null;
        }
        ReductionFormResDTO dto = mapToReductionFormResDTO(reductionForm);

        java.time.LocalDate leaveDate = reductionForm.getLeaveDate();
        java.time.LocalDate arrivalDate = reductionForm.getArrivalDate() != null ? reductionForm.getArrivalDate() : reductionForm.getToDate();

        if (leaveDate != null && arrivalDate != null && !leaveDate.isAfter(arrivalDate)) {
            long inclusiveDays = java.time.temporal.ChronoUnit.DAYS.between(leaveDate, arrivalDate) + 1;
            long displayedHolidays = Math.max(0L, inclusiveDays - adminN);
            dto.setTotalHolidays(displayedHolidays);
            dto.setMonthWiseHolidays(
                    com.hostel.MessReduction.utils.HolidayReportHelper.calculateMonthWiseHolidays(
                            leaveDate,
                            arrivalDate,
                            displayedHolidays
                    )
            );
        }
        return dto;
    }
}
