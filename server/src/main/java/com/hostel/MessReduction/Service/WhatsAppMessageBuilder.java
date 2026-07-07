package com.hostel.MessReduction.Service;

import com.hostel.MessReduction.Entity.FormStatus;
import com.hostel.MessReduction.Entity.ReductionForm;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

public class WhatsAppMessageBuilder {

    /**
     * Builds a compact summary message of pending requests for a batch notification.
     * deduplicates by formId and sorts by submission time.
     * @param forms List of pending ReductionForms
     * @return Formatted message string
     */
    public static String buildBatchSummaryMessage(String recipientUsername, List<ReductionForm> forms) {
        if (forms == null || forms.isEmpty()) {
            return null;
        }

        // Deduplicate and sort by submission time (oldest first)
        List<ReductionForm> uniqueSortedForms = forms.stream()
                .filter(f -> f != null && f.getStudentDetails() != null)
                // Deduplicate based on formId
                .collect(Collectors.toMap(
                        ReductionForm::getFormId,
                        f -> f,
                        (existing, replacement) -> existing
                ))
                .values().stream()
                .sorted(Comparator.comparing(f -> f.getSubmittedAt() != null ? f.getSubmittedAt() : java.time.LocalDateTime.MAX))
                .collect(Collectors.toList());

        if (uniqueSortedForms.isEmpty()) {
            return null;
        }

        StringBuilder sb = new StringBuilder();
        
        if (uniqueSortedForms.size() == 1) {
            sb.append("📋 Mess Reduction Request\n");
            sb.append("👤 To: ").append(recipientUsername).append("\n\n");
            ReductionForm form = uniqueSortedForms.get(0);
            sb.append(form.getStudentDetails().getName())
              .append(" (")
              .append(form.getStudentDetails().getRegisterNo())
              .append(")\n\n");
            sb.append("Please review in the Mess Reduction Dashboard.");
        } else {
            sb.append("📋 Mess Reduction Requests\n");
            sb.append("👤 To: ").append(recipientUsername).append("\n\n");
            sb.append("Pending Students (").append(uniqueSortedForms.size()).append(")\n\n");
            for (ReductionForm form : uniqueSortedForms) {
                sb.append("• ")
                  .append(form.getStudentDetails().getName())
                  .append(" (")
                  .append(form.getStudentDetails().getRegisterNo())
                  .append(")\n");
            }
            sb.append("\nPlease review them in the Mess Reduction Dashboard.");
        }

        return sb.toString();
    }

    public static String buildReminderMessage(String recipientUsername, List<ReductionForm> forms) {
        if (forms == null || forms.isEmpty()) {
            return null;
        }

        // Deduplicate
        List<ReductionForm> uniqueForms = forms.stream()
                .filter(f -> f != null && f.getStudentDetails() != null)
                .collect(Collectors.toMap(ReductionForm::getFormId, f -> f, (e, r) -> e))
                .values().stream()
                .sorted(Comparator.comparing(f -> f.getSubmittedAt() != null ? f.getSubmittedAt() : java.time.LocalDateTime.MAX))
                .collect(Collectors.toList());

        StringBuilder sb = new StringBuilder();
        
        if (uniqueForms.size() == 1) {
            sb.append("⚠️ Pending Request Reminder\n");
            sb.append("👤 To: ").append(recipientUsername).append("\n\n");
            ReductionForm form = uniqueForms.get(0);
            sb.append(formatStatusForDisplay(form.getCurrentStatus())).append(":\n");
            sb.append("• ")
              .append(form.getStudentDetails().getName())
              .append(" (")
              .append(form.getStudentDetails().getRegisterNo())
              .append(")\n\n");
            sb.append("Please review this request as soon as possible.");
        } else {
            sb.append("⚠️ Pending Requests Reminder\n");
            sb.append("👤 To: ").append(recipientUsername).append("\n\n");
            
            // Group forms by current status
            java.util.Map<FormStatus, java.util.List<ReductionForm>> groupedForms = uniqueForms.stream()
                    .collect(Collectors.groupingBy(ReductionForm::getCurrentStatus));
                    
            for (java.util.Map.Entry<FormStatus, java.util.List<ReductionForm>> entry : groupedForms.entrySet()) {
                String sectionTitle = formatStatusForDisplay(entry.getKey());
                sb.append(sectionTitle).append(" (").append(entry.getValue().size()).append(")\n");
                for (ReductionForm form : entry.getValue()) {
                    sb.append("• ")
                      .append(form.getStudentDetails().getName())
                      .append(" (")
                      .append(form.getStudentDetails().getRegisterNo())
                      .append(")\n");
                }
                sb.append("\n");
            }
            sb.append("Please review these requests as soon as possible.");
        }

        return sb.toString();
    }

    private static String formatStatusForDisplay(FormStatus status) {
        if (status == null) return "Pending Requests";
        switch (status) {
            case PendingDeputyWarden: return "Deputy Warden Requests";
            case PendingWarden: return "Warden Requests";
            case PendingOffice: return "Office Requests";
            default: return "Pending Requests";
        }
    }
}
