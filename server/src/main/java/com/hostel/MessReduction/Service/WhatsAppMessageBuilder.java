package com.hostel.MessReduction.Service;

import com.hostel.MessReduction.Entity.FormStatus;
import com.hostel.MessReduction.Entity.ReductionForm;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

public class WhatsAppMessageBuilder {

    public static String buildBatchSummaryMessage(String recipientUsername, List<ReductionForm> forms) {
        if (forms == null || forms.isEmpty()) {
            return null;
        }

        // Deduplicate based on formId
        long uniqueCount = forms.stream()
                .filter(f -> f != null && f.getStudentDetails() != null)
                .map(ReductionForm::getFormId)
                .distinct()
                .count();

        if (uniqueCount == 0) {
            return null;
        }

        StringBuilder sb = new StringBuilder();
        sb.append("📋 Mess Reduction System\n\n");
        
        if (uniqueCount == 1) {
            sb.append("You have 1 pending request.\n\n");
            sb.append("Please review it in the dashboard.");
        } else {
            sb.append("You have ").append(uniqueCount).append(" pending requests.\n\n");
            sb.append("Please review them in the dashboard.");
        }

        return sb.toString();
    }

    public static String buildReminderMessage(String recipientUsername, List<ReductionForm> forms) {
        if (forms == null || forms.isEmpty()) {
            return null;
        }

        long uniqueCount = forms.stream()
                .filter(f -> f != null && f.getStudentDetails() != null)
                .map(ReductionForm::getFormId)
                .distinct()
                .count();

        if (uniqueCount == 0) {
            return null;
        }

        StringBuilder sb = new StringBuilder();
        sb.append("⏰ Reminder\n\n");
        
        if (uniqueCount == 1) {
            sb.append("You have 1 pending request.\n\n");
            sb.append("Please review it.");
        } else {
            sb.append("You have ").append(uniqueCount).append(" pending requests.\n\n");
            sb.append("Please review them.");
        }

        return sb.toString();
    }

    public static String buildEscalationMessage(String recipientUsername, List<ReductionForm> forms) {
        if (forms == null || forms.isEmpty()) {
            return null;
        }

        long uniqueCount = forms.stream()
                .filter(f -> f != null && f.getStudentDetails() != null)
                .map(ReductionForm::getFormId)
                .distinct()
                .count();

        if (uniqueCount == 0) {
            return null;
        }

        StringBuilder sb = new StringBuilder();
        sb.append("⚠ Escalation\n\n");
        
        if (uniqueCount == 1) {
            sb.append("1 request is still pending.\n\n");
            sb.append("Please review immediately.");
        } else {
            sb.append(uniqueCount).append(" requests are still pending.\n\n");
            sb.append("Please review immediately.");
        }

        return sb.toString();
    }
}
