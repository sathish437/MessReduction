package com.hostel.MessReduction.Service;

import com.hostel.MessReduction.Entity.ReductionForm;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);
    private final JavaMailSender emailSender;
    
    // Deduplication cache: Key = Email+FormId+Type, Value = Timestamp in millis
    private final ConcurrentHashMap<String, Long> recentEmails = new ConcurrentHashMap<>();
    private static final long DEDUPLICATION_WINDOW_MS = 60000; // 1 minute window

    @Value("${spring.mail.username:admin@example.com}")
    private String fromEmail;

    public EmailService(JavaMailSender emailSender) {
        this.emailSender = emailSender;
    }

    @Async("emailTaskExecutor")
    public void sendReminderEmail(String to, ReductionForm form, String reminderType) {
        String dedupKey = to + "-" + form.getFormId() + "-" + reminderType;
        if (isDuplicate(dedupKey)) {
            logger.info("Duplicate email blocked | Recipient: {} | Request ID: {} | Type: {}", to, form.getFormId(), reminderType);
            return;
        }

        MimeMessage mimeMessage = emailSender.createMimeMessage();
        try {
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(to);

            String subjectPrefix = reminderType.equals("FINAL") ? "[FINAL REMINDER] " : (reminderType.equals("EMERGENCY") ? "[EMERGENCY] " : "");
            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
            // Append UUID to prevent Gmail threading
            String uniqueId = UUID.randomUUID().toString().substring(0, 8);
            String subject = String.format("%s🍽️ HOSTEL MESS REDUCTION - New Request Pending Approval - Request#%s - %s - [%s]",
                    subjectPrefix, form.getFormId(), timestamp, uniqueId);
            helper.setSubject(subject);

            // HTML content
            String html = "<html><body>" +
                    "<h2>🍽️ HOSTEL MESS REDUCTION SYSTEM</h2>" +
                    "<p><strong>Student:</strong> " + escape(form.getStudentDetails().getName()) + "</p>" +
                    "<p><strong>Register No:</strong> " + escape(form.getStudentDetails().getRegisterNo()) + "</p>" +
                    "<p><strong>Request ID:</strong> " + escape(form.getFormId()) + "</p>" +
                    "<p><strong>Status:</strong> Pending Approval</p>" +
                    "<hr/>" +
                    "<p>Please review the request in the application.</p>" +
                    "<p style='font-size:small;color:gray;'>This is an automated notification.</p>" +
                    "</body></html>";

            helper.setText(html, true);

            // Add priority headers to improve delivery/notification behavior
            mimeMessage.addHeader("X-Priority", "1");
            mimeMessage.addHeader("Importance", "High");
            mimeMessage.addHeader("Priority", "urgent");

            emailSender.send(mimeMessage);

            String source = reminderType.equals("NORMAL") || reminderType.equals("EMERGENCY") ? "NEW_SUBMISSION" : "REMINDER";

            logger.info("Mail Sent Successfully\n" +
                        "Form ID: {}\n" +
                        "Student Name: {}\n" +
                        "Created Time: {}\n" +
                        "Email Sent Time: {}\n" +
                        "Recipient Email: {}\n" +
                        "Source: {}",
                    form.getFormId(),
                    form.getStudentDetails().getName(),
                    form.getSubmittedAt(),
                    LocalDateTime.now(),
                    to,
                    source);
        } catch (Exception e) {
            logger.error("Mail Sent Failed | Recipient: {} | Request ID: {} | Error: {}", to, form.getFormId(), e.getMessage());
            // Remove from cache on failure so it can be retried
            recentEmails.remove(dedupKey);
        }
    }

    @Async("emailTaskExecutor")
    public void sendEscalationEmail(String to, ReductionForm form) {
        String dedupKey = to + "-" + form.getFormId() + "-ESCALATION";
        if (isDuplicate(dedupKey)) {
            logger.info("Duplicate escalation email blocked | Recipient: {} | Request ID: {}", to, form.getFormId());
            return;
        }

        MimeMessage mimeMessage = emailSender.createMimeMessage();
        try {
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(to);

            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
            String uniqueId = UUID.randomUUID().toString().substring(0, 8);
            String subject = String.format("[HIGH PRIORITY ESCALATION] 🍽️ HOSTEL MESS REDUCTION - Request#%s - %s - [%s]",
                    form.getFormId(), timestamp, uniqueId);
            helper.setSubject(subject);

            long hoursElapsed = java.time.temporal.ChronoUnit.HOURS.between(form.getSubmittedAt(), LocalDateTime.now());

            String html = "<html><body>" +
                    "<h2>🚨 HIGH PRIORITY ESCALATION - HOSTEL MESS REDUCTION SYSTEM</h2>" +
                    "<p>A student request has remained <strong>PENDING</strong> for " + hoursElapsed + " hour(s) without any action.</p>" +
                    "<p><strong>Student:</strong> " + escape(form.getStudentDetails().getName()) + "</p>" +
                    "<p><strong>Register No:</strong> " + escape(form.getStudentDetails().getRegisterNo()) + "</p>" +
                    "<p><strong>Request ID:</strong> " + escape(form.getFormId()) + "</p>" +
                    "<p><strong>Submitted:</strong> " + escape(String.valueOf(form.getSubmittedAt())) + "</p>" +
                    "<p><strong>Status:</strong> " + escape(String.valueOf(form.getCurrentStatus())) + "</p>" +
                    "<hr/>" +
                    "<p style='color:red;'>⚠️ Immediate action is required. Please review and process this request.</p>" +
                    "<p style='font-size:small;color:gray;'>This is an automated escalation alert.</p>" +
                    "</body></html>";

            helper.setText(html, true);

            mimeMessage.addHeader("X-Priority", "1");
            mimeMessage.addHeader("Importance", "High");
            mimeMessage.addHeader("Priority", "urgent");

            emailSender.send(mimeMessage);

            logger.info("Escalation Mail Sent Successfully\n" +
                        "Form ID: {}\n" +
                        "Student Name: {}\n" +
                        "Created Time: {}\n" +
                        "Email Sent Time: {}\n" +
                        "Recipient Email: {}\n" +
                        "Source: ESCALATION",
                    form.getFormId(),
                    form.getStudentDetails().getName(),
                    form.getSubmittedAt(),
                    LocalDateTime.now(),
                    to);
        } catch (Exception e) {
            logger.error("Escalation Mail Sent Failed | Recipient: {} | Request ID: {} | Error: {}", to, form.getFormId(), e.getMessage());
            recentEmails.remove(dedupKey);
        }
    }

    @Async("emailTaskExecutor")
    public void sendAggregatedEmail(String to, java.util.List<ReductionForm> forms, boolean isReminder, String roleName) {
        if (forms == null || forms.isEmpty()) return;
        
        MimeMessage mimeMessage = emailSender.createMimeMessage();
        try {
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(to);

            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
            String uniqueId = UUID.randomUUID().toString().substring(0, 8);
            String subjectPrefix = isReminder ? "[REMINDER] " : "[SUMMARY] ";
            String subject = String.format("%s🍽️ HOSTEL MESS REDUCTION - %d Pending Requests for %s - [%s]",
                    subjectPrefix, forms.size(), roleName, uniqueId);
            helper.setSubject(subject);

            StringBuilder html = new StringBuilder();
            html.append("<html><body>")
                .append("<h2>🍽️ HOSTEL MESS REDUCTION SYSTEM</h2>")
                .append("<p>You have <strong>").append(forms.size()).append("</strong> pending requests awaiting your review.</p>")
                .append("<table border='1' cellpadding='5' cellspacing='0' style='border-collapse: collapse; width: 100%;'>")
                .append("<tr style='background-color: #f2f2f2;'>")
                .append("<th>Request ID</th><th>Student Name</th><th>Register No</th><th>Submitted At</th>")
                .append("</tr>");

            for (ReductionForm form : forms) {
                html.append("<tr>")
                    .append("<td>#").append(escape(form.getFormId())).append("</td>")
                    .append("<td>").append(escape(form.getStudentDetails().getName())).append("</td>")
                    .append("<td>").append(escape(form.getStudentDetails().getRegisterNo())).append("</td>")
                    .append("<td>").append(escape(form.getSubmittedAt())).append("</td>")
                    .append("</tr>");
            }

            html.append("</table>")
                .append("<br/>")
                .append("<p>Please log in to the application to review and process these requests.</p>")
                .append("<p style='font-size:small;color:gray;'>This is an automated aggregated notification.</p>")
                .append("</body></html>");

            helper.setText(html.toString(), true);

            mimeMessage.addHeader("X-Priority", "1");
            mimeMessage.addHeader("Importance", "High");
            
            emailSender.send(mimeMessage);

            logger.info("Aggregated Mail Sent Successfully | Recipient: {} | Count: {} | Reminder: {}", to, forms.size(), isReminder);
        } catch (Exception e) {
            logger.error("Aggregated Mail Sent Failed | Recipient: {} | Count: {} | Error: {}", to, forms.size(), e.getMessage());
        }
    }

    private boolean isDuplicate(String key) {
        long now = System.currentTimeMillis();
        // clean up old entries occasionally if we wanted, but map size is likely small
        Long lastSent = recentEmails.get(key);
        if (lastSent != null && (now - lastSent) < DEDUPLICATION_WINDOW_MS) {
            return true;
        }
        recentEmails.put(key, now);
        return false;
    }

    private String escape(Object o) {
        if (o == null) return "";
        String s = String.valueOf(o);
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;").replace("'", "&#39;");
    }
}
