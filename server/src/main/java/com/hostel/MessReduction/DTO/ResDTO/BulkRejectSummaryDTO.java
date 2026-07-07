package com.hostel.MessReduction.DTO.ResDTO;

public class BulkRejectSummaryDTO {
    private int selected;
    private int rejected;
    private int failed;

    public BulkRejectSummaryDTO() {
    }

    public BulkRejectSummaryDTO(int selected, int rejected, int failed) {
        this.selected = selected;
        this.rejected = rejected;
        this.failed = failed;
    }

    public int getSelected() {
        return selected;
    }

    public void setSelected(int selected) {
        this.selected = selected;
    }

    public int getRejected() {
        return rejected;
    }

    public void setRejected(int rejected) {
        this.rejected = rejected;
    }

    public int getFailed() {
        return failed;
    }

    public void setFailed(int failed) {
        this.failed = failed;
    }
}
