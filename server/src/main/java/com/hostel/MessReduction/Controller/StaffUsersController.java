package com.hostel.MessReduction.Controller;

import com.hostel.MessReduction.DTO.ReqDTO.RejectFormReqDTO;
import com.hostel.MessReduction.DTO.ResDTO.ReductionFormResDTO;
import com.hostel.MessReduction.DTO.ResDTO.StaffDashboardCountDTO;
import com.hostel.MessReduction.DTO.ResDTO.YearWiseCountDTO;
import com.hostel.MessReduction.Service.ReductionFormService;
import com.hostel.MessReduction.utils.ExcelReportHelper;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/hostelStaff")
public class StaffUsersController {
    private final ReductionFormService reductionFormService;

    public StaffUsersController(ReductionFormService reductionFormService) {
        this.reductionFormService = reductionFormService;
    }

    @GetMapping("/staff/warden")
    public ResponseEntity<List<ReductionFormResDTO>> warden(
            @RequestParam(required = false) String userName,
            @RequestParam(required = false) String gender,
            @RequestParam(required = false) Integer year,
            Authentication authentication) {
        String effectiveUserName = (userName != null && !userName.isEmpty())
                ? userName
                : authentication.getName();
        return ResponseEntity.ok(reductionFormService.wardenPendingStatus(effectiveUserName, gender, year));
    }

    @GetMapping("/staff/deputyWarden")
    public ResponseEntity<List<ReductionFormResDTO>> deputyWarden(Authentication authentication) {
        String userName = authentication.getName();
        return ResponseEntity.ok(reductionFormService.deputyWardenPendingStatus(userName));
    }

    @GetMapping("/staff/office")
    public ResponseEntity<List<ReductionFormResDTO>> office(
            @RequestParam(required = false) String gender,
            @RequestParam(required = false) Integer year,
            Authentication authentication) {
        String userName = authentication.getName();
        return ResponseEntity.ok(reductionFormService.officePendingStatus(userName, gender, year));
    }

    @PatchMapping("/staff/warden/{formId}")
    public ResponseEntity<String> updateWarden(@PathVariable Long formId,
                                               @RequestParam String action,
                                               Authentication authentication) {
        String userName = authentication.getName();
        reductionFormService.updateWardenPendingStatus(formId, action, userName);
        return ResponseEntity.ok("Warden status updated successfully");
    }

    @PatchMapping("/staff/deputyWarden/{formId}")
    public ResponseEntity<String> updateDeputyWarden(@PathVariable Long formId,
                                                     @RequestParam String action,
                                                     Authentication authentication) {
        String userName = authentication.getName();
        reductionFormService.updateDeputyWardenPendingStatus(formId, action, userName);
        return ResponseEntity.ok("DeputyWarden status updated successfully");
    }

    @PatchMapping("/staff/office/{formId}")
    public ResponseEntity<String> updateOffice(@PathVariable Long formId,
                                               @RequestParam String action,
                                               Authentication authentication) {
        String userName = authentication.getName();
        reductionFormService.updateOfficePendingStatus(formId, action, userName);
        return ResponseEntity.ok("Office status updated successfully");
    }

    @PatchMapping("/staff/warden/{formId}/reject")
    public ResponseEntity<String> rejectWarden(@PathVariable Long formId,
                                               @Valid @RequestBody RejectFormReqDTO request,
                                               Authentication authentication) {
        String userName = authentication.getName();
        reductionFormService.rejectWardenForm(formId, request.getRejectReason(), userName);
        return ResponseEntity.status(HttpStatus.OK).body("Form rejected by warden successfully");
    }

    @PatchMapping("/staff/deputyWarden/{formId}/reject")
    public ResponseEntity<String> rejectDeputyWarden(@PathVariable Long formId,
                                                     @Valid @RequestBody RejectFormReqDTO request,
                                                     Authentication authentication) {
        String userName = authentication.getName();
        reductionFormService.rejectDeputyWardenForm(formId, request.getRejectReason(), userName);
        return ResponseEntity.status(HttpStatus.OK).body("Form rejected by deputy warden successfully");
    }

    @PatchMapping("/staff/office/{formId}/reject")
    public ResponseEntity<String> rejectOffice(@PathVariable Long formId,
                                               @Valid @RequestBody RejectFormReqDTO request,
                                               Authentication authentication) {
        String userName = authentication.getName();
        reductionFormService.rejectOfficeForm(formId, request.getRejectReason(), userName);
        return ResponseEntity.status(HttpStatus.OK).body("Form rejected by office successfully");
    }

    @GetMapping("/staff/dashboard-count")
    public ResponseEntity<StaffDashboardCountDTO> getDashboardCount(Authentication authentication) {
        String userName = authentication.getName();
        boolean isDeputy = authentication.getAuthorities().stream()
                .anyMatch(grantedAuthority -> grantedAuthority.getAuthority().equals("ROLE_DeputyWarden"));
        if (isDeputy) {
            return ResponseEntity.ok(reductionFormService.getDashboardCountForDeputy(userName));
        }
        return ResponseEntity.ok(reductionFormService.getDashboardCount());
    }

    @GetMapping("/staff/dashboard-count/warden")
    public ResponseEntity<StaffDashboardCountDTO> getWardenDashboardCount(
            @RequestParam(required = false) String userName,
            Authentication authentication) {
        String effectiveUserName = (userName != null && !userName.isEmpty())
                ? userName
                : authentication.getName();
        return ResponseEntity.ok(reductionFormService.getDashboardCountForWarden(effectiveUserName));
    }

    @GetMapping("/staff/deputyWarden/year-count")
    public ResponseEntity<YearWiseCountDTO> deputyYearCount(Authentication authentication) {
        String userName = authentication.getName();
        return ResponseEntity.ok(reductionFormService.deputyWardenYearWiseCount(userName));
    }

    @GetMapping("/staff/office/year-count")
    public ResponseEntity<YearWiseCountDTO> officeYearCount() {
        return ResponseEntity.ok(reductionFormService.officeYearWiseCount());
    }

    @DeleteMapping("/staff/forms/delete-all")
    public ResponseEntity<String> deleteAllForms(Authentication authentication) {
        reductionFormService.deleteAllReductionForms();
        return ResponseEntity.ok("All reduction forms deleted successfully");
    }

    @PatchMapping("/staff/warden/bulk")
    public ResponseEntity<String> updateWardenBulk(
                                                   @RequestBody List<Long> formIds,
                                                   @RequestParam String action,
                                                   Authentication authentication) {
        String userName = authentication.getName();
        reductionFormService.updateWardenBulkStatus(formIds, action, userName);
        return ResponseEntity.ok("Forms approved by warden successfully");
    }

    @PatchMapping("/staff/deputyWarden/bulk")
    public ResponseEntity<String> updateDeputyWardenBulk(
                                                         @RequestBody List<Long> formIds,
                                                         @RequestParam String action,
                                                         Authentication authentication) {
        String userName = authentication.getName();
        reductionFormService.updateDeputyWardenPendingBulkStatus(formIds, action, userName);
        return ResponseEntity.ok("Forms approved by deputy warden successfully");
    }

    @PatchMapping("/staff/office/bulk")
    public ResponseEntity<String> updateOfficeBulk(
                                                   @RequestBody List<Long> formIds,
                                                   @RequestParam String action,
                                                   Authentication authentication) {
        String userName = authentication.getName();
        reductionFormService.updateOfficePendingBulkStatus(formIds, action, userName);
        return ResponseEntity.ok("Forms approved by office successfully");
    }

    @GetMapping("/staff/office/report-data")
    public ResponseEntity<List<ReductionFormResDTO>> getOfficeReportData() {
        return ResponseEntity.ok(reductionFormService.getOfficeReportData());
    }

    @GetMapping("/staff/office/download-report")
    public ResponseEntity<byte[]> downloadOfficeReport() throws IOException {
        List<ReductionFormResDTO> reports = reductionFormService.getOfficeReportData();
        byte[] excelBytes = ExcelReportHelper.generateExcelReport(reports);
        
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=mess_reduction_report.xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(excelBytes);
    }
}
