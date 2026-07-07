package com.hostel.MessReduction.DTO.ReqDTO;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public class BulkRejectReqDTO {

    @NotEmpty(message = "Form IDs list cannot be empty")
    private List<Long> formIds;

    @NotBlank(message = "Reject reason is required")
    private String rejectReason;

    public BulkRejectReqDTO() {
    }

    public BulkRejectReqDTO(List<Long> formIds, String rejectReason) {
        this.formIds = formIds;
        this.rejectReason = rejectReason;
    }

    public List<Long> getFormIds() {
        return formIds;
    }

    public void setFormIds(List<Long> formIds) {
        this.formIds = formIds;
    }

    public String getRejectReason() {
        return rejectReason;
    }

    public void setRejectReason(String rejectReason) {
        this.rejectReason = rejectReason;
    }
}
