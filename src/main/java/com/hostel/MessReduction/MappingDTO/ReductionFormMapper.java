package com.hostel.MessReduction.MappingDTO;

import com.hostel.MessReduction.DTO.ReqDTO.ReductionFormReqDTO;
import com.hostel.MessReduction.Entity.ReductionForm;
import com.hostel.MessReduction.Entity.StudentDetails;

public class ReductionFormMapper {
    public static ReductionForm mapToReductionForm(ReductionFormReqDTO reductionFormReqDTO, StudentDetails studentDetails){
        ReductionForm reductionForm=new ReductionForm();

        reductionForm.setStudentDetails(studentDetails);
        reductionForm.setYear(reductionFormReqDTO.getYear());

        return reductionForm;
    }
}
