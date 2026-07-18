package com.hostel.MessReduction.DTO.ResDTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardStatsDTO {
    private long todaysRegistrations;
    private long todaysRequests;
    private long pendingAtDeputyWarden;
    private long pendingAtWarden;
    private long pendingAtOffice;
    private long approvedToday;
    private long rejectedToday;
    private long totalStaff;
    private long totalNotifications;
    
    // Analytics
    private Map<String, Long> studentsByDepartment;
    private Map<String, Long> requestsByDepartment;
    private Map<String, Long> monthlyRequests;
    private Map<String, Long> monthlyApprovals;
    private Map<String, Long> dailyRegistrations;
    
    private double approvalSuccessRate;
    private String averageApprovalTime;
}
