package com.hostel.MessReduction.Service;

import com.hostel.MessReduction.CustomException.BadRequestException;
import com.hostel.MessReduction.CustomException.StudentNotFoundException;
import com.hostel.MessReduction.Entity.ExtraSubmissionRequest;
import com.hostel.MessReduction.Entity.RequestStatus;
import com.hostel.MessReduction.Entity.StudentDetails;
import com.hostel.MessReduction.Repo.ExtraSubmissionRequestRepo;
import com.hostel.MessReduction.Repo.StudentDetailsRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ExtraSubmissionService {

    private final ExtraSubmissionRequestRepo extraSubmissionRequestRepo;
    private final StudentDetailsRepo studentDetailsRepo;
    private final NotificationService notificationService;

    public ExtraSubmissionRequest requestExtraSubmission(Long studentId, String reason) {
        StudentDetails student = studentDetailsRepo.findById(studentId)
                .orElseThrow(() -> new StudentNotFoundException("Student not found"));

        // Check if there's already a pending request
        boolean hasPending = extraSubmissionRequestRepo.findByStudentDetailsStudentId(studentId).stream()
                .anyMatch(req -> req.getStatus() == RequestStatus.PENDING);
        if (hasPending) {
            throw new BadRequestException("You already have a pending extra submission request.");
        }

        ExtraSubmissionRequest request = new ExtraSubmissionRequest();
        request.setStudentDetails(student);
        request.setReason(reason);
        request.setStatus(RequestStatus.PENDING);
        
        ExtraSubmissionRequest saved = extraSubmissionRequestRepo.save(request);

        // Notify Admin (Assuming Admin uses 'MasterAdmin')
        notificationService.createNotification("MasterAdmin", "New extra submission request from " + student.getName(), "EXTRA_REQUEST", saved.getId());

        return saved;
    }

    public void approveRequest(Long requestId, String adminUsername) {
        ExtraSubmissionRequest request = extraSubmissionRequestRepo.findById(requestId)
                .orElseThrow(() -> new BadRequestException("Request not found"));

        if (request.getStatus() != RequestStatus.PENDING) {
            throw new BadRequestException("Request is already processed.");
        }

        request.setStatus(RequestStatus.APPROVED);
        request.setApprovedBy(adminUsername);
        request.setApprovedAt(LocalDateTime.now());
        extraSubmissionRequestRepo.save(request);

        StudentDetails student = request.getStudentDetails();
        student.resetSubmissionCountIfNewDay();
        int currentGranted = student.getExtraSubmissionGranted() != null ? student.getExtraSubmissionGranted() : 0;
        student.setExtraSubmissionGranted(currentGranted + 1);
        studentDetailsRepo.save(student);

        notificationService.createNotification(student.getEmailId(), "Your extra submission request was approved.", "EXTRA_APPROVED", requestId);
    }

    public void rejectRequest(Long requestId, String adminUsername) {
        ExtraSubmissionRequest request = extraSubmissionRequestRepo.findById(requestId)
                .orElseThrow(() -> new BadRequestException("Request not found"));

        if (request.getStatus() != RequestStatus.PENDING) {
            throw new BadRequestException("Request is already processed.");
        }

        request.setStatus(RequestStatus.REJECTED);
        request.setApprovedBy(adminUsername);
        request.setApprovedAt(LocalDateTime.now());
        extraSubmissionRequestRepo.save(request);

        notificationService.createNotification(request.getStudentDetails().getEmailId(), "Your extra submission request was rejected.", "EXTRA_REJECTED", requestId);
    }

    public void bulkApproveRequests(List<Long> requestIds, String adminUsername) {
        if (requestIds == null || requestIds.isEmpty()) return;
        List<Long> distinctIds = requestIds.stream().filter(java.util.Objects::nonNull).distinct().toList();
        if (distinctIds.isEmpty()) return;

        List<ExtraSubmissionRequest> requests = extraSubmissionRequestRepo.findAllById(distinctIds);
        List<ExtraSubmissionRequest> toUpdate = new java.util.ArrayList<>();
        List<StudentDetails> studentsToUpdate = new java.util.ArrayList<>();
        List<NotificationService.BatchNotificationItem> notificationItems = new java.util.ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        for (ExtraSubmissionRequest req : requests) {
            if (req.getStatus() != RequestStatus.PENDING) continue;
            req.setStatus(RequestStatus.APPROVED);
            req.setApprovedBy(adminUsername);
            req.setApprovedAt(now);
            toUpdate.add(req);

            StudentDetails student = req.getStudentDetails();
            if (student != null) {
                student.resetSubmissionCountIfNewDay();
                int currentGranted = student.getExtraSubmissionGranted() != null ? student.getExtraSubmissionGranted() : 0;
                student.setExtraSubmissionGranted(currentGranted + 1);
                studentsToUpdate.add(student);

                notificationItems.add(new NotificationService.BatchNotificationItem(
                    student.getEmailId(), "Your extra submission request was approved.", "EXTRA_APPROVED", req.getId(), "STUDENT"
                ));
            }
        }

        if (!toUpdate.isEmpty()) {
            extraSubmissionRequestRepo.saveAll(toUpdate);
            studentDetailsRepo.saveAll(studentsToUpdate);
            notificationService.createNotificationsBatch(notificationItems);
        }
    }

    public void bulkRejectRequests(List<Long> requestIds, String adminUsername) {
        if (requestIds == null || requestIds.isEmpty()) return;
        List<Long> distinctIds = requestIds.stream().filter(java.util.Objects::nonNull).distinct().toList();
        if (distinctIds.isEmpty()) return;

        List<ExtraSubmissionRequest> requests = extraSubmissionRequestRepo.findAllById(distinctIds);
        List<ExtraSubmissionRequest> toUpdate = new java.util.ArrayList<>();
        List<NotificationService.BatchNotificationItem> notificationItems = new java.util.ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        for (ExtraSubmissionRequest req : requests) {
            if (req.getStatus() != RequestStatus.PENDING) continue;
            req.setStatus(RequestStatus.REJECTED);
            req.setApprovedBy(adminUsername);
            req.setApprovedAt(now);
            toUpdate.add(req);

            StudentDetails student = req.getStudentDetails();
            if (student != null) {
                notificationItems.add(new NotificationService.BatchNotificationItem(
                    student.getEmailId(), "Your extra submission request was rejected.", "EXTRA_REJECTED", req.getId(), "STUDENT"
                ));
            }
        }

        if (!toUpdate.isEmpty()) {
            extraSubmissionRequestRepo.saveAll(toUpdate);
            notificationService.createNotificationsBatch(notificationItems);
        }
    }

    public List<ExtraSubmissionRequest> getAllPendingRequests() {
        List<ExtraSubmissionRequest> list = extraSubmissionRequestRepo.findByStatus(RequestStatus.PENDING);
        for (ExtraSubmissionRequest req : list) {
            if (req.getStudentDetails() != null && req.getStudentDetails().resetSubmissionCountIfNewDay()) {
                studentDetailsRepo.save(req.getStudentDetails());
            }
        }
        return list;
    }

    public List<ExtraSubmissionRequest> getRequestsByStudent(Long studentId) {
        List<ExtraSubmissionRequest> list = extraSubmissionRequestRepo.findByStudentDetailsStudentId(studentId);
        for (ExtraSubmissionRequest req : list) {
            if (req.getStudentDetails() != null && req.getStudentDetails().resetSubmissionCountIfNewDay()) {
                studentDetailsRepo.save(req.getStudentDetails());
            }
        }
        return list;
    }
}
