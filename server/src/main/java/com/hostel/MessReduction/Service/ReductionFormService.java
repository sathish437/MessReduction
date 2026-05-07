package com.hostel.MessReduction.Service;

import com.hostel.MessReduction.CustomException.*;

import com.hostel.MessReduction.DTO.ReqDTO.ReductionFormReqDTO;
import com.hostel.MessReduction.DTO.ResDTO.ReductionFormResDTO;
import com.hostel.MessReduction.DTO.ResDTO.StaffDashboardCountDTO;
import com.hostel.MessReduction.DTO.ResDTO.YearWiseCountDTO;
import com.hostel.MessReduction.Entity.FormStatus;
import com.hostel.MessReduction.Entity.ReductionForm;
import com.hostel.MessReduction.Entity.StudentDetails;
import com.hostel.MessReduction.MappingDTO.ReductionFormMapper;
import com.hostel.MessReduction.Repo.ReductionFormRepo;
import com.hostel.MessReduction.Repo.StudentDetailsRepo;
import org.aspectj.apache.bcel.classfile.LineNumberTable;
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
            throw new DateNotValidException("Leave date must be after arrival date");
        }
        int  totalDays=Math.toIntExact(ChronoUnit.DAYS.between(dto.getLeaveDate(), dto.getArrivalDate()));
        if(totalDays>3){
            totalDays-=3;
        }else{
            throw new TotalLeaveDateCountException("Leave duration must be more than 3 days to apply for mess reduction. Please change the selected dates.");
        }
        ReductionForm reductionForm=ReductionFormMapper.mapToReductionForm(dto,studentDetails,LocalDate.now(), (long) totalDays);
        reductionForm.setCurrentStatus(FormStatus.PendingWarden);
        reductionFormRepo.save(reductionForm);
        return ReductionFormMapper.mapToReductionFormResDTO(reductionForm);
    }
    public List<ReductionFormResDTO> formDetails(Long studentId) {
        List<ReductionForm> forms = reductionFormRepo.findByStudentDetailsStudentId(studentId);
        if (forms.isEmpty()) {
            throw new ReductionFormNotFoundException("No forms found for this student");
        }
        return forms.stream()
                .map(ReductionFormMapper::mapToReductionFormResDTO)
                .toList();
    }

    public List<ReductionFormResDTO> wardenPendingStatus(String userName){
        Integer year = switch (userName) {
            case "warden1" -> 1;
            case "warden2" -> 2;
            case "warden3" -> 3;
            case "warden4" -> 4;
            default -> throw new UnauthorizedUserException("Unauthorized user");
        };

        List<ReductionForm> forms=reductionFormRepo.findByCurrentStatusAndYear(FormStatus.PendingWarden,year);
        return forms.stream().map(ReductionFormMapper::mapToReductionFormResDTO).toList();
    }

    public List<ReductionFormResDTO> deputyWardenPendingStatus(String userName){
        if (!userName.equals("deputyWarden")) {
            throw new UnauthorizedUserException("Unauthorized user");
        }
        List<ReductionForm> forms=reductionFormRepo.findByCurrentStatus(FormStatus.PendingDeputyWarden);
        return forms.stream().map(ReductionFormMapper::mapToReductionFormResDTO).toList();
    }

    public List<ReductionFormResDTO> officePendingStatus(String userName){
        if (!userName.equals("office")) {
            throw new UnauthorizedUserException("Unauthorized user");
        }
        List<ReductionForm> forms=reductionFormRepo.findByCurrentStatus(FormStatus.PendingOffice);
        return forms.stream().map(ReductionFormMapper::mapToReductionFormResDTO).toList();
    }

    public void updateWardenPendingStatus(Long formId,String action,String userName){
        Integer year = switch (userName) {
            case "warden1" -> 1;
            case "warden2" -> 2;
            case "warden3" -> 3;
            case "warden4" -> 4;
            default -> throw new UnauthorizedUserException("Unauthorized user");
        };

        ReductionForm form=reductionFormRepo.findById(formId)
                .orElseThrow(()-> new ReductionFormNotFoundException("Form Not found"));

        if(!form.getCurrentStatus().equals(FormStatus.PendingWarden)){
            throw new InvalidStatusException("Form is not in warden stage");
        }

        if(!form.getYear().equals(year)){
            throw new UnauthorizedUserException("Unauthorized access");
        }

        if("Approve".equalsIgnoreCase(action)){
            form.setCurrentStatus(FormStatus.PendingDeputyWarden);
        }else if("Reject".equalsIgnoreCase(action)){
            form.setCurrentStatus(FormStatus.RejectedWarden);
        }else {
            throw new InvalidActionException("Invalid action");
        }

        reductionFormRepo.save(form);
    }

    public void updateDeputyWardenPendingStatus(Long formId ,String action, String userName){
        if (!userName.equals("deputyWarden")) {
            throw new UnauthorizedUserException("Unauthorized user");
        }
        ReductionForm form=reductionFormRepo.findById(formId)
                .orElseThrow(()->  new ReductionFormNotFoundException("No pending deputyWarden forms found"));

        if(!form.getCurrentStatus().equals(FormStatus.PendingDeputyWarden)){
            throw new InvalidStatusException("Form is not in warden stage");
        }

        if("Approve".equalsIgnoreCase(action)){
            form.setCurrentStatus(FormStatus.PendingOffice);
        } else if("Reject".equalsIgnoreCase(action)) {
            form.setCurrentStatus(FormStatus.RejectedDeputyWarden);
        }else{
            throw new InvalidActionException("Invalid action");
        }

        reductionFormRepo.save(form);
    }

    public void updateOfficePendingStatus(Long formId,String action, String userName){
        if (!userName.equals("office")) {
            throw new UnauthorizedUserException("Unauthorized user");
        }
        ReductionForm form=reductionFormRepo.findById(formId)
                .orElseThrow(()->  new ReductionFormNotFoundException("No pending deputyWarden forms found"));

        if(!form.getCurrentStatus().equals(FormStatus.PendingOffice)){
            throw new InvalidStatusException("Form is not in warden stage");
        }

        if("Approve".equalsIgnoreCase(action)){
            form.setCurrentStatus(FormStatus.Approved);
        } else if("Reject".equalsIgnoreCase(action)) {
            form.setCurrentStatus(FormStatus.RejectedOffice);
        }else{
            throw new InvalidActionException("Invalid action");
        }

        reductionFormRepo.save(form);
    }

    public StaffDashboardCountDTO getDashboardCount() {
        return new StaffDashboardCountDTO(
                reductionFormRepo.countByCurrentStatus(FormStatus.PendingWarden),
                reductionFormRepo.countByCurrentStatus(FormStatus.PendingDeputyWarden),
                reductionFormRepo.countByCurrentStatus(FormStatus.PendingOffice),
                reductionFormRepo.countByCurrentStatus(FormStatus.Approved),
                reductionFormRepo.countByCurrentStatus(FormStatus.RejectedWarden),
                reductionFormRepo.countByCurrentStatus(FormStatus.RejectedDeputyWarden),
                reductionFormRepo.countByCurrentStatus(FormStatus.RejectedOffice)
        );
    }

    public StaffDashboardCountDTO getDashboardCountForWarden(String userName) {
        Integer year = switch (userName) {
            case "warden1" -> 1;
            case "warden2" -> 2;
            case "warden3" -> 3;
            case "warden4" -> 4;
            default -> throw new UnauthorizedUserException("Unauthorized user");
        };

        return new StaffDashboardCountDTO(
                reductionFormRepo.countByCurrentStatusAndYear(FormStatus.PendingWarden, year),
                reductionFormRepo.countByCurrentStatusAndYear(FormStatus.PendingDeputyWarden, year),
                reductionFormRepo.countByCurrentStatusAndYear(FormStatus.PendingOffice, year),
                reductionFormRepo.countByCurrentStatusAndYear(FormStatus.Approved, year),
                reductionFormRepo.countByCurrentStatusAndYear(FormStatus.RejectedWarden, year),
                reductionFormRepo.countByCurrentStatusAndYear(FormStatus.RejectedDeputyWarden, year),
                reductionFormRepo.countByCurrentStatusAndYear(FormStatus.RejectedOffice, year)
        );
    }

    public YearWiseCountDTO deputyWardenYearWiseCount() {
        return new YearWiseCountDTO(
                reductionFormRepo.countByCurrentStatusAndYear(FormStatus.PendingDeputyWarden, 1),
                reductionFormRepo.countByCurrentStatusAndYear(FormStatus.PendingDeputyWarden, 2),
                reductionFormRepo.countByCurrentStatusAndYear(FormStatus.PendingDeputyWarden, 3),
                reductionFormRepo.countByCurrentStatusAndYear(FormStatus.PendingDeputyWarden, 4)
        );
    }

    public YearWiseCountDTO officeYearWiseCount() {
        return new YearWiseCountDTO(
                reductionFormRepo.countByCurrentStatusAndYear(FormStatus.PendingOffice, 1),
                reductionFormRepo.countByCurrentStatusAndYear(FormStatus.PendingOffice, 2),
                reductionFormRepo.countByCurrentStatusAndYear(FormStatus.PendingOffice, 3),
                reductionFormRepo.countByCurrentStatusAndYear(FormStatus.PendingOffice, 4)
        );
    }

    public void updateWardenBulkStatus(List<Long> formIds, String action, String userName) {

        Integer year = switch (userName) {
            case "warden1" -> 1;
            case "warden2" -> 2;
            case "warden3" -> 3;
            case "warden4" -> 4;
            default -> throw new UnauthorizedUserException("Unauthorized user");
        };

        List<ReductionForm> forms = reductionFormRepo.findAllById(formIds);

        if (forms.isEmpty()) {
            throw new ReductionFormNotFoundException("No forms found");
        }
        for (ReductionForm form : forms) {
            if (!form.getCurrentStatus().equals(FormStatus.PendingWarden)) {
                throw new InvalidStatusException("Form is not in warden stage");
            }
            if (!form.getYear().equals(year)) {
                throw new UnauthorizedUserException("Unauthorized access");
            }
            if ("Approve".equalsIgnoreCase(action)) {
                form.setCurrentStatus(FormStatus.PendingDeputyWarden);
            } else if ("Reject".equalsIgnoreCase(action)) {
                form.setCurrentStatus(FormStatus.RejectedWarden);
            } else {
                throw new InvalidActionException("Invalid action");
            }
        }

        reductionFormRepo.saveAll(forms);
    }

    public void updateDeputyWardenPendingBulkStatus(List<Long> formId ,String action, String userName){
        if (!userName.equals("deputyWarden")) {
            throw new UnauthorizedUserException("Unauthorized user");
        }
        List<ReductionForm> forms=reductionFormRepo.findAllById(formId);
        if(forms.isEmpty()){
            throw new ReductionFormNotFoundException("No pending deputyWarden forms found");
        }
        for (ReductionForm form : forms) {
            if (!form.getCurrentStatus().equals(FormStatus.PendingDeputyWarden)) {
                throw new InvalidStatusException("Form is not in warden stage");
            }

            if ("Approve".equalsIgnoreCase(action)) {
                form.setCurrentStatus(FormStatus.PendingOffice);
            } else if ("Reject".equalsIgnoreCase(action)) {
                form.setCurrentStatus(FormStatus.RejectedDeputyWarden);
            } else {
                throw new InvalidActionException("Invalid action");
            }
        }

        reductionFormRepo.saveAll(forms);
    }

    public void updateOfficePendingBulkStatus(List<Long> formId,String action, String userName){
        if (!userName.equals("office")) {
            throw new UnauthorizedUserException("Unauthorized user");
        }
        List<ReductionForm> forms=reductionFormRepo.findAllById(formId);
        if(forms.isEmpty()){
            throw new ReductionFormNotFoundException("No pending deputyWarden forms found");
        }
        for (ReductionForm form : forms) {

            if (!form.getCurrentStatus().equals(FormStatus.PendingOffice)) {
                throw new InvalidStatusException("Form is not in warden stage");
            }

            if ("Approve".equalsIgnoreCase(action)) {
                form.setCurrentStatus(FormStatus.Approved);
            } else if ("Reject".equalsIgnoreCase(action)) {
                form.setCurrentStatus(FormStatus.RejectedOffice);
            } else {
                throw new InvalidActionException("Invalid action");
            }
        }
        reductionFormRepo.saveAll(forms);
    }
}
