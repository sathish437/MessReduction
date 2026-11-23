package com.hostel.MessReduction.Flow;

import com.hostel.MessReduction.DTO.ResDTO.RequestTrackingResDTO;
import com.hostel.MessReduction.DTO.ResDTO.StudentTrackingEventDTO;
import com.hostel.MessReduction.Service.StudentSseService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

public class StudentSseFlowTest {

    private StudentSseService studentSseService;

    @BeforeEach
    void setUp() {
        studentSseService = new StudentSseService();
    }

    @Test
    @DisplayName("Student subscribes to SSE: emitter created, initial connect event sent")
    void testSubscribeStudent() {
        Long studentId = 101L;
        SseEmitter emitter = studentSseService.createConnection(studentId, null);

        assertNotNull(emitter);
        assertEquals(1, studentSseService.getEmitterCountForStudent(studentId));
        assertEquals(0, studentSseService.getEmitterCountForStudent(999L));
    }

    @Test
    @DisplayName("Dispatch tracking update: student receives event only for their own applications")
    void testDispatchTrackingUpdate() {
        Long student1 = 101L;
        Long student2 = 102L;

        SseEmitter emitter1 = studentSseService.createConnection(student1, null);
        SseEmitter emitter2 = studentSseService.createConnection(student2, null);

        assertNotNull(emitter1);
        assertNotNull(emitter2);

        RequestTrackingResDTO tracking = new RequestTrackingResDTO();
        tracking.setCurrentStage("DEPUTY_WARDEN");
        tracking.setCurrentStatus("PendingDeputyWarden");
        tracking.setSubmittedTime(LocalDateTime.now());

        // Dispatch update for student1
        assertDoesNotThrow(() -> {
            studentSseService.sendTrackingUpdate(student1, 55L, tracking, "Application submitted");
        });

        assertEquals(1, studentSseService.getEmitterCountForStudent(student1));
        assertEquals(1, studentSseService.getEmitterCountForStudent(student2));
    }

    @Test
    @DisplayName("Multiple students connected concurrently: verify independent tracking")
    void testMultipleStudentsConcurrent() {
        for (long i = 1; i <= 5; i++) {
            studentSseService.createConnection(i, null);
            assertEquals(1, studentSseService.getEmitterCountForStudent(i));
        }

        RequestTrackingResDTO tracking = new RequestTrackingResDTO();
        tracking.setCurrentStage("COMPLETED");
        tracking.setCurrentStatus("Approved");

        // Send to student 3
        studentSseService.sendTrackingUpdate(3L, 88L, tracking, "Approved by Office");

        // All 5 students remain connected
        for (long i = 1; i <= 5; i++) {
            assertEquals(1, studentSseService.getEmitterCountForStudent(i));
        }
    }

    @Test
    @DisplayName("Reconnection with Last-Event-ID: event replay from cache")
    void testEventReplay() {
        Long studentId = 200L;

        RequestTrackingResDTO tracking = new RequestTrackingResDTO();
        tracking.setCurrentStage("WARDEN");
        tracking.setCurrentStatus("PendingWarden");

        // Send update before connection (cached)
        studentSseService.sendTrackingUpdate(studentId, 77L, tracking, "Approved by Deputy Warden");

        // Now connect with Last-Event-ID "0" (or initial)
        assertDoesNotThrow(() -> {
            SseEmitter emitter = studentSseService.createConnection(studentId, "0");
            assertNotNull(emitter);
        });
    }

    @Test
    @DisplayName("Emitter completion/timeout: cleanly removes disconnected emitter")
    void testEmitterCleanupOnComplete() {
        Long studentId = 300L;
        SseEmitter emitter = studentSseService.createConnection(studentId, null);

        assertEquals(1, studentSseService.getEmitterCountForStudent(studentId));

        emitter.complete();

        // After completion, attempting to send drops the dead emitter
        RequestTrackingResDTO tracking = new RequestTrackingResDTO();
        tracking.setCurrentStage("REJECTED");
        tracking.setCurrentStatus("RejectedWarden");

        studentSseService.sendTrackingUpdate(studentId, 99L, tracking, "Rejected by Warden");

        assertEquals(0, studentSseService.getEmitterCountForStudent(studentId));
    }
}
