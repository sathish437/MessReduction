package com.hostel.MessReduction.Controller;

import com.hostel.MessReduction.DTO.ResDTO.ReductionFormResDTO;
import com.hostel.MessReduction.DTO.ResDTO.StaffDashboardCountDTO;
import com.hostel.MessReduction.DTO.ResDTO.YearWiseCountDTO;
import com.hostel.MessReduction.Service.ReductionFormService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/hostelStaff")
public class StaffUsersController {
    private ReductionFormService reductionFormService;
    public StaffUsersController(ReductionFormService reductionFormService){
        this.reductionFormService=reductionFormService;
    }
    @GetMapping("/staff/warden")
    public List<ReductionFormResDTO> warden(Authentication authentication){
        String userName = authentication.getName();
        return reductionFormService.wardenPendingStatus(userName);
    }

    @GetMapping("/staff/deputyWarden")
    public List<ReductionFormResDTO> deputyWarden(Authentication authentication){
        String userName = authentication.getName();
        return reductionFormService.deputyWardenPendingStatus(userName);
    }

    @GetMapping("/staff/office")
    public List<ReductionFormResDTO> office(Authentication authentication){
        String userName = authentication.getName();
        return reductionFormService.officePendingStatus(userName);
    }

    @PatchMapping("/staff/warden/{formId}")
    public String updateWarden(@PathVariable Long formId,@RequestParam String action, Authentication authentication){
        String userName = authentication.getName();
        reductionFormService.updateWardenPendingStatus(formId,action,userName);
        return "Warden status updated successfully";
    }

    @PatchMapping("/staff/deputyWarden/{formId}")
    public String updateDeputyWarden(@PathVariable Long formId,@RequestParam String action, Authentication authentication){
        String userName = authentication.getName();
        reductionFormService.updateDeputyWardenPendingStatus(formId,action,userName);
        return "DeputyWarden status updated successfully";
    }

    @PatchMapping("/staff/office/{formId}")
    public String updateOffice(@PathVariable Long formId,@RequestParam String action, Authentication authentication){
        String userName = authentication.getName();
        reductionFormService.updateOfficePendingStatus(formId,action,userName);
        return "Office status updated successfully";
    }

    @GetMapping("/staff/dashboard-count")
    public StaffDashboardCountDTO getDashboardCount() {
        return reductionFormService.getDashboardCount();
    }

    @GetMapping("/staff/deputyWarden/year-count")
    public YearWiseCountDTO deputyYearCount() {
        return reductionFormService.deputyWardenYearWiseCount();
    }
    @GetMapping("/staff/office/year-count")
    public YearWiseCountDTO officeYearCount() {
        return reductionFormService.officeYearWiseCount();
    }

    @PatchMapping("/staff/warden/bulk")
    public String updateWardenBulk(
            @RequestBody List<Long> formIds,
            @RequestParam String action,
            Authentication authentication) {
        String userName = authentication.getName();
        reductionFormService.updateWardenBulkStatus(formIds, action, userName);
        return "Forms updated successfully";
    }

    @PatchMapping("/staff/deputyWarden/bulk")
    public String updateDeputyWardenBulk(
            @RequestBody List<Long> formIds,
            @RequestParam String action,
            Authentication authentication) {
        String userName = authentication.getName();
        reductionFormService.updateDeputyWardenPendingBulkStatus(formIds, action, userName);
        return "Forms updated successfully";
    }
    @PatchMapping("/staff/office/bulk")
    public String updateOfficeBulk(
            @RequestBody List<Long> formIds,
            @RequestParam String action,
            Authentication authentication) {
        String userName = authentication.getName();
        reductionFormService.updateOfficePendingBulkStatus(formIds, action, userName);
        return "Forms updated successfully";
    }
}
