package com.hostel.MessReduction.Service;

import com.hostel.MessReduction.CustomException.StatusAlreadyPendingException;
import com.hostel.MessReduction.CustomException.StudentNotFoundException;
import com.hostel.MessReduction.DTO.ReqDTO.ReductionFormReqDTO;
import com.hostel.MessReduction.DTO.ResDTO.ReductionFormResDTO;
import com.hostel.MessReduction.Entity.FormStatus;
import com.hostel.MessReduction.Entity.ReductionForm;
import com.hostel.MessReduction.Entity.StudentDetails;
import com.hostel.MessReduction.MappingDTO.ReductionFormMapper;
import com.hostel.MessReduction.Repo.ReductionFormRepo;
import com.hostel.MessReduction.Repo.StudentDetailsRepo;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class ReductionFormService {
    private ReductionFormRepo reductionFormRepo;
    private StudentDetailsRepo studentDetailsRepo;
    public ReductionFormService(ReductionFormRepo reductionFormRepo,StudentDetailsRepo studentDetailsRepo){
        this.reductionFormRepo=reductionFormRepo;
        this.studentDetailsRepo=studentDetailsRepo;
    }

    public StudentDetails getStudentDetails(Long id){
       return studentDetailsRepo.findById(id)
               .orElseThrow(()->new StudentNotFoundException("Student Not Found"));
    }
    public ReductionFormResDTO formSubmit(ReductionFormReqDTO dto,Long studentId) {
        StudentDetails studentDetails=getStudentDetails(studentId);
        if(reductionFormRepo.existsByStudentDetailsStudentIdAndCurrentStatusIn(studentId, List.of(FormStatus.PendingWarden, FormStatus.PendingDeputyWarden, FormStatus.PendingOffice))){
            throw new StatusAlreadyPendingException("Cannot submit a new form while the previous request is pending");
        }
        if(dto.getArrivalDate().isBefore(dto.getLeaveDate()) || dto.getArrivalDate().isEqual(dto.getLeaveDate()) ){
            throw new IllegalArgumentException("Enter valid Date");
        }
        int  totalDays=Math.toIntExact(ChronoUnit.DAYS.between(dto.getLeaveDate(), dto.getArrivalDate()));
        if(totalDays>3){
            totalDays-=3;
        }else{
            throw new IllegalArgumentException("Leave duration must be more than 3 days to apply for mess reduction. Please change the selected dates.");
        }
        ReductionForm reductionForm=ReductionFormMapper.mapToReductionForm(dto,studentDetails,LocalDate.now(), (long) totalDays);
        reductionForm.setCurrentStatus(FormStatus.PendingWarden);
        reductionFormRepo.save(reductionForm);
        return ReductionFormMapper.mapToReductionFormResDTO(reductionForm);
    }

}
