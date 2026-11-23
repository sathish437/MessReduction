package com.hostel.MessReduction.Controller;

import com.hostel.MessReduction.CustomException.UnauthorizedUserException;
import com.hostel.MessReduction.Entity.StudentDetails;
import com.hostel.MessReduction.Service.StudentSseService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/student-form/sse")
@RequiredArgsConstructor
@Slf4j
public class StudentSseController {

    private final StudentSseService studentSseService;

    /**
     * Subscribe to real-time Server-Sent Events for the authenticated student.
     * Enforces strict authorization so students only receive updates for their own applications.
     */
    @GetMapping(value = "/track", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @PreAuthorize("hasRole('STUDENT')")
    public SseEmitter subscribeToTracking(
            @RequestParam("studentId") Long studentId,
            @RequestHeader(value = "Last-Event-ID", required = false) String lastEventIdHeader,
            @RequestParam(value = "lastEventId", required = false) String lastEventIdParam,
            Authentication authentication) {

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new UnauthorizedUserException("Authentication required for SSE connection");
        }

        // Verify that the requested studentId matches the authenticated student
        Object principal = authentication.getPrincipal();
        if (principal instanceof StudentDetails studentDetails) {
            if (!studentDetails.getStudentId().equals(studentId)) {
                log.warn("Security check failed: studentId {} does not match authenticated studentId {}",
                        studentId, studentDetails.getStudentId());
                throw new UnauthorizedUserException("Access denied: You cannot subscribe to another student's updates");
            }
        }

        String lastEventId = lastEventIdHeader != null ? lastEventIdHeader : lastEventIdParam;
        log.info("Student SSE subscription accepted: studentId={} | Last-Event-ID={}", studentId, lastEventId);

        return studentSseService.createConnection(studentId, lastEventId);
    }
}
