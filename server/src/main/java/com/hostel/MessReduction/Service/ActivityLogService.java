package com.hostel.MessReduction.Service;

import com.hostel.MessReduction.CustomException.BadRequestException;
import com.hostel.MessReduction.DTO.ReqDTO.ActivityLogRequest;
import com.hostel.MessReduction.DTO.ResDTO.ActivityLogResponse;
import com.hostel.MessReduction.Entity.ActivityLog;
import com.hostel.MessReduction.Entity.ReductionForm;
import com.hostel.MessReduction.Entity.Role;
import com.hostel.MessReduction.Repo.ActivityLogRepository;
import com.hostel.MessReduction.Repo.ReductionFormRepo;
import jakarta.annotation.PostConstruct;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import jakarta.transaction.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class ActivityLogService {

    private final ActivityLogRepository activityLogRepository;
    private final ReductionFormRepo reductionFormRepo;

    public ActivityLogService(ActivityLogRepository activityLogRepository, ReductionFormRepo reductionFormRepo) {
        this.activityLogRepository = activityLogRepository;
        this.reductionFormRepo = reductionFormRepo;
    }

    @PostConstruct
    public void backfillMissingYears() {
        try {
            List<ActivityLog> missingLogs = activityLogRepository.findAll((root, query, cb) -> cb.isNull(root.get("year")));
            if (!missingLogs.isEmpty()) {
                List<Long> formIds = missingLogs.stream()
                        .map(ActivityLog::getFormId)
                        .filter(Objects::nonNull)
                        .distinct()
                        .toList();
                if (!formIds.isEmpty()) {
                    Map<Long, Integer> yearMap = reductionFormRepo.findAllById(formIds).stream()
                            .filter(f -> f.getYear() != null)
                            .collect(Collectors.toMap(ReductionForm::getFormId, ReductionForm::getYear, (a, b) -> a));

                    boolean updated = false;
                    for (ActivityLog log : missingLogs) {
                        if (log.getFormId() != null && yearMap.containsKey(log.getFormId())) {
                            log.setYear(yearMap.get(log.getFormId()));
                            updated = true;
                        }
                    }
                    if (updated) {
                        activityLogRepository.saveAll(missingLogs);
                    }
                }
            }
        } catch (Exception ignored) {
        }
    }

    public ActivityLogResponse createLog(ActivityLogRequest request) {
        validateRequest(request);

        ActivityLog log = new ActivityLog();
        log.setFormId(request.getFormId());
        log.setStudentId(request.getStudentId());
        log.setStudentName(request.getStudentName());
        log.setDepartment(request.getDepartment());
        log.setYear(request.getYear());
        log.setStaffRole(request.getStaffRole());
        log.setStaffName(request.getStaffName());
        log.setAction(request.getAction());
        log.setTimestamp(LocalDateTime.now(java.time.ZoneId.of("Asia/Kolkata")));
        log.setArrivalDate(request.getArrivalDate());
        log.setActive(true);

        return mapToResponse(activityLogRepository.save(log));
    }

    public void createLogs(List<ActivityLogRequest> requests) {
        if (requests == null || requests.isEmpty()) return;
        LocalDateTime now = LocalDateTime.now(java.time.ZoneId.of("Asia/Kolkata"));
        List<ActivityLog> logs = new ArrayList<>();
        for (ActivityLogRequest request : requests) {
            if (request == null || request.getStaffRole() == null || request.getArrivalDate() == null) continue;
            ActivityLog log = new ActivityLog();
            log.setFormId(request.getFormId());
            log.setStudentId(request.getStudentId());
            log.setStudentName(request.getStudentName());
            log.setDepartment(request.getDepartment());
            log.setYear(request.getYear());
            log.setStaffRole(request.getStaffRole());
            log.setStaffName(request.getStaffName());
            log.setAction(request.getAction());
            log.setTimestamp(now);
            log.setArrivalDate(request.getArrivalDate());
            log.setActive(true);
            logs.add(log);
        }
        if (!logs.isEmpty()) {
            activityLogRepository.saveAll(logs);
        }
    }

    public void deleteLogsByFormId(Long formId) {
        if (formId != null) {
            activityLogRepository.deleteByFormId(formId);
        }
    }

    public List<ActivityLogResponse> findActiveLogsByStaffName(String staffName) {
        if (staffName == null || staffName.isBlank()) {
            throw new BadRequestException("Staff name is required to fetch activity logs");
        }
        List<ActivityLog> logs = activityLogRepository.findByStaffNameAndIsActiveTrue(staffName).stream()
                .sorted(Comparator.comparing(ActivityLog::getTimestamp).reversed())
                .toList();

        Map<Long, Integer> resolvedYears = resolveMissingYears(logs);

        return logs.stream()
                .map(log -> mapToResponse(log, log.getYear() != null ? log.getYear() : (log.getFormId() != null ? resolvedYears.get(log.getFormId()) : null)))
                .toList();
    }

    public Page<ActivityLogResponse> getLogsByRoleAndAction(Role role, String action, int page, int size, String username) {
        return getLogsByRoleAndAction(role, action, null, null, null, null, null, page, size, username);
    }

    public Page<ActivityLogResponse> getLogsByRoleAndAction(
            Role role,
            String action,
            String search,
            String department,
            Integer year,
            LocalDate fromDate,
            LocalDate toDate,
            int page,
            int size,
            String username) {

        if (role == null || action == null || action.isBlank()) {
            throw new BadRequestException("Role and action are required to fetch activity logs");
        }

        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size), Sort.by(Sort.Direction.DESC, "timestamp"));

        Specification<ActivityLog> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // 1. Is active
            predicates.add(cb.isTrue(root.get("isActive")));

            // 2. Action match (Approved / Rejected)
            predicates.add(cb.equal(root.get("action"), action));

            // 3. Role isolation
            if (role == Role.DeputyWarden) {
                predicates.add(cb.equal(root.get("staffRole"), Role.DeputyWarden));
                Predicate byStaffName = cb.equal(root.get("staffName"), username);

                Subquery<Long> subquery = query.subquery(Long.class);
                Root<ReductionForm> formRoot = subquery.from(ReductionForm.class);
                subquery.select(formRoot.get("formId"))
                        .where(cb.equal(formRoot.get("assignedDeputyWarden"), username));

                Predicate byAssignedForm = root.get("formId").in(subquery);
                predicates.add(cb.or(byStaffName, byAssignedForm));
            } else {
                predicates.add(cb.equal(root.get("staffRole"), role));
            }

            // 4. Search by student name or student ID or form ID
            if (search != null && !search.trim().isEmpty()) {
                String term = "%" + search.trim().toLowerCase() + "%";
                Predicate nameLike = cb.like(cb.lower(root.get("studentName")), term);
                Predicate idLike = cb.like(cb.lower(root.get("studentId").as(String.class)), term);
                Predicate formIdLike = cb.like(cb.lower(root.get("formId").as(String.class)), term);
                predicates.add(cb.or(nameLike, idLike, formIdLike));
            }

            // 5. Department filter
            if (department != null && !department.trim().isEmpty() && !"ALL".equalsIgnoreCase(department.trim())) {
                predicates.add(cb.equal(cb.lower(root.get("department")), department.trim().toLowerCase()));
            }

            // 6. Year filter (Warden & Office only)
            if (role != Role.DeputyWarden && year != null && year >= 1 && year <= 4) {
                Predicate yearDirect = cb.equal(root.get("year"), year);

                Subquery<Long> subquery = query.subquery(Long.class);
                Root<ReductionForm> formRoot = subquery.from(ReductionForm.class);
                subquery.select(formRoot.get("formId"))
                        .where(cb.equal(formRoot.get("year"), year));

                Predicate yearSubquery = root.get("formId").in(subquery);
                predicates.add(cb.or(yearDirect, yearSubquery));
            }

            // 7. Date range filter
            if (fromDate != null) {
                LocalDateTime startOfDay = fromDate.atStartOfDay();
                predicates.add(cb.greaterThanOrEqualTo(root.get("timestamp"), startOfDay));
            }
            if (toDate != null) {
                LocalDateTime endOfDay = toDate.atTime(23, 59, 59, 999999999);
                predicates.add(cb.lessThanOrEqualTo(root.get("timestamp"), endOfDay));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<ActivityLog> logPage = activityLogRepository.findAll(spec, pageable);
        Map<Long, Integer> resolvedYears = resolveMissingYears(logPage.getContent());

        return logPage.map(log -> {
            Integer resolvedYear = log.getYear();
            if (resolvedYear == null && log.getFormId() != null) {
                resolvedYear = resolvedYears.get(log.getFormId());
            }
            return mapToResponse(log, resolvedYear);
        });
    }

    private Map<Long, Integer> resolveMissingYears(List<ActivityLog> logs) {
        if (logs == null || logs.isEmpty()) return Collections.emptyMap();
        List<Long> missingFormIds = logs.stream()
                .filter(l -> l.getYear() == null && l.getFormId() != null)
                .map(ActivityLog::getFormId)
                .distinct()
                .toList();

        if (missingFormIds.isEmpty()) return Collections.emptyMap();

        Map<Long, Integer> map = new HashMap<>();
        try {
            reductionFormRepo.findAllById(missingFormIds).forEach(form -> {
                if (form != null && form.getFormId() != null && form.getYear() != null) {
                    map.put(form.getFormId(), form.getYear());
                }
            });
        } catch (Exception ignored) {
        }
        return map;
    }

    public void expireLogs() {
        LocalDate today = LocalDate.now();
        List<ActivityLog> expiredLogs = activityLogRepository.findByIsActiveTrueAndArrivalDateBefore(today);
        if (expiredLogs.isEmpty()) {
            return;
        }
        expiredLogs.forEach(log -> log.setActive(false));
        activityLogRepository.saveAll(expiredLogs);
    }

    private void validateRequest(ActivityLogRequest request) {
        if (request.getStaffRole() == null) {
            throw new BadRequestException("Staff role is required for activity logs");
        }
        if (request.getArrivalDate() == null) {
            throw new BadRequestException("Arrival date is required for activity logs");
        }
    }

    private ActivityLogResponse mapToResponse(ActivityLog log) {
        return mapToResponse(log, log.getYear());
    }

    private ActivityLogResponse mapToResponse(ActivityLog log, Integer year) {
        return new ActivityLogResponse(
                log.getId(),
                log.getFormId(),
                log.getStudentId(),
                log.getStudentName(),
                log.getDepartment(),
                log.getStaffRole(),
                log.getStaffName(),
                log.getAction(),
                log.getTimestamp(),
                log.getArrivalDate(),
                log.isActive(),
                year
        );
    }
}

