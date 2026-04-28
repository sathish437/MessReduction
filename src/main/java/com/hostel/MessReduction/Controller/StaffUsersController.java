package com.hostel.MessReduction.Controller;

import com.hostel.MessReduction.DTO.ResDTO.ReductionFormResDTO;
import com.hostel.MessReduction.DTO.ResDTO.StaffDashboardCountDTO;
import com.hostel.MessReduction.DTO.ResDTO.YearWiseCountDTO;
import com.hostel.MessReduction.Service.ReductionFormService;
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
    public List<ReductionFormResDTO> warden(@RequestParam String userName){
        return reductionFormService.wardenPendingStatus(userName);
    }

    @GetMapping("/staff/deputyWarden")
    public List<ReductionFormResDTO> deputyWarden(@RequestParam String UserName){
        return reductionFormService.deputyWardenPendingStatus(UserName);
    }

    @GetMapping("/staff/office")
    public List<ReductionFormResDTO> office(@RequestParam String UserName){
        return reductionFormService.officePendingStatus(UserName);
    }

    @PatchMapping("/staff/warden/{formId}")
    public String updateWarden(@PathVariable Long formId,@RequestParam String action,@RequestParam String userName){
        reductionFormService.updateWardenPendingStatus(formId,action,userName);
        return "Warden status updated successfully";
    }

    @PatchMapping("/staff/deputyWarden/{formId}")
    public String updateDeputyWarden(@PathVariable Long formId,@RequestParam String action,@RequestParam String userName){
        reductionFormService.updateDeputyWardenPendingStatus(formId,action,userName);
        return "DeputyWarden status updated successfully";
    }

    @PatchMapping("/staff/office/{formId}")
    public String updateOffice(@PathVariable Long formId,@RequestParam String action,@RequestParam String userName){
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
            @RequestParam String userName) {

        reductionFormService.updateWardenBulkStatus(formIds, action, userName);
        return "Forms updated successfully";
    }

    @PatchMapping("/staff/deputyWarden/bulk")
    public String updateDeputyWardenBulk(
            @RequestBody List<Long> formIds,
            @RequestParam String action,
            @RequestParam String userName) {

        reductionFormService.updateDeputyWardenPendingBulkStatus(formIds, action, userName);
        return "Forms updated successfully";
    }
    @PatchMapping("/staff/office/bulk")
    public String updateOfficeBulk(
            @RequestBody List<Long> formIds,
            @RequestParam String action,
            @RequestParam String userName) {

        reductionFormService.updateOfficePendingBulkStatus(formIds, action, userName);
        return "Forms updated successfully";
    }
}
