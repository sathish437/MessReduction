package com.hostel.MessReduction.MappingDTO;

import com.hostel.MessReduction.DTO.ReqDTO.ReductionFormReqDTO;
import com.hostel.MessReduction.DTO.ResDTO.ReductionFormResDTO;
import com.hostel.MessReduction.Entity.ReductionForm;
import com.hostel.MessReduction.Entity.StudentDetails;

import java.time.LocalDate;

public class ReductionFormMapper {
    public static ReductionForm mapToReductionForm(ReductionFormReqDTO reductionFormReqDTO, StudentDetails studentDetails, LocalDate presentDate,Long totalHolidays){
        ReductionForm reductionForm=new ReductionForm();

        reductionForm.setStudentDetails(studentDetails);
        reductionForm.setYear(reductionFormReqDTO.getYear());
        reductionForm.setRoomNo(reductionFormReqDTO.getRoomNo());
        reductionForm.setLeaveDate(reductionFormReqDTO.getLeaveDate());
        reductionForm.setLeaveTime(reductionFormReqDTO.getLeaveTime());
        reductionForm.setArrivalDate(reductionFormReqDTO.getArrivalDate());
        reductionForm.setArrivalTime(reductionFormReqDTO.getArrivalTime());
        reductionForm.setPresentDate(presentDate);
        reductionForm.setTotalHolidays(totalHolidays);
        reductionForm.setReason(reductionFormReqDTO.getReason());

        return reductionForm;
    }

    public static ReductionFormResDTO mapToReductionFormResDTO(ReductionForm reductionForm){
        ReductionFormResDTO reductionFormResDTO=new ReductionFormResDTO();

        reductionFormResDTO.setFormId(reductionForm.getFormId());
        reductionFormResDTO.setStudentId(reductionForm.getStudentDetails().getStudentId());
        reductionFormResDTO.setName(reductionForm.getStudentDetails().getName());
        reductionFormResDTO.setYear(reductionForm.getYear());
        reductionFormResDTO.setRoomNo(reductionForm.getRoomNo());
        reductionFormResDTO.setLeaveDate(reductionForm.getLeaveDate());
        reductionFormResDTO.setLeaveTime(reductionForm.getLeaveTime());
        reductionFormResDTO.setArrivalDate(reductionForm.getArrivalDate());
        reductionFormResDTO.setArrivalTime(reductionForm.getArrivalTime());
        reductionFormResDTO.setPresentDate(reductionForm.getPresentDate());
        reductionFormResDTO.setTotalHolidays(reductionForm.getTotalHolidays());
        reductionFormResDTO.setReason(reductionForm.getReason());
        return reductionFormResDTO;

    }
}
