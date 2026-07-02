package com.hostel.MessReduction.Service;

import com.hostel.MessReduction.Entity.ReductionForm;
import org.springframework.stereotype.Component;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

@Component
public class WhatsAppMessageBuilder {

    public String buildBatchSummaryMessage(List<ReductionForm> forms, int totalCount) {
        StringBuilder sb = new StringBuilder();
        sb.append("📋 Mess Reduction Requests\n\n");
        sb.append("You have ").append(totalCount).append(" new pending requests.\n\n");

        AtomicInteger counter = new AtomicInteger(1);
        for (ReductionForm form : forms) {
            sb.append(counter.getAndIncrement()).append(".\n\n");
            sb.append("Student:\n").append(form.getStudentDetails().getName()).append("\n\n");
            sb.append("Register No:\n").append(form.getStudentDetails().getRegisterNo()).append("\n\n");
        }

        sb.append("Please review them in the Mess Reduction Dashboard.");
        return sb.toString();
    }

    public String buildReminderSummaryMessage(List<ReductionForm> forms) {
        StringBuilder sb = new StringBuilder();
        sb.append("⏰ Reminder\n\n");
        sb.append("You still have pending Mess Reduction Requests.\n\n");
        sb.append("Pending Students\n\n");

        AtomicInteger counter = new AtomicInteger(1);
        for (ReductionForm form : forms) {
            sb.append(counter.getAndIncrement()).append(".\n\n");
            sb.append(form.getStudentDetails().getName()).append("\n\n");
            sb.append(form.getStudentDetails().getRegisterNo()).append("\n\n");
        }

        sb.append("Please review them as soon as possible.");
        return sb.toString();
    }

    public String buildStudentBatchMessage(List<String> messages) {
        StringBuilder sb = new StringBuilder();
        sb.append("📋 Mess Reduction Updates\n\n");
        sb.append("You have ").append(messages.size()).append(" new updates:\n\n");
        
        AtomicInteger counter = new AtomicInteger(1);
        for (String msg : messages) {
            sb.append(counter.getAndIncrement()).append(". ").append(msg).append("\n\n");
        }
        
        return sb.toString();
    }
}
