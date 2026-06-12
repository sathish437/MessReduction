package com.hostel.MessReduction.DTO.ResDTO;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class StaffDashboardCountDTO {

    private Long pendingWarden;
    private Long pendingDeputyWarden;
    private Long pendingOffice;
    private Long approved;
    private Long rejectedWarden;
    private Long rejectedDeputyWarden;
    private Long rejectedOffice;
}
