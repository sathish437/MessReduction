package com.hostel.MessReduction.Service;

import com.hostel.MessReduction.CustomException.StudentVerificationServiceUnavailableException;
import com.hostel.MessReduction.DTO.ReqDTO.HostelVerifyReqDTO;
import com.hostel.MessReduction.DTO.ResDTO.HostelVerifyResDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

@Service
public class StudentVerificationService {

    private static final Logger logger = LoggerFactory.getLogger(StudentVerificationService.class);

    private final WebClient webClient;
    private final String apiUrl;
    private final String apiKey;
    private final boolean isEnabled;
    private final java.util.concurrent.ConcurrentHashMap<String, Long> verifiedRegisterNumbers = new java.util.concurrent.ConcurrentHashMap<>();

    public StudentVerificationService(
            WebClient webClient,
            @Value("${student.verify.api.url}") String apiUrl,
            @Value("${student.verify.api.key}") String apiKey,
            @Value("${student.verify.enabled:true}") boolean isEnabled) {
        this.webClient = webClient;
        this.apiUrl = apiUrl;
        this.apiKey = apiKey;
        this.isEnabled = isEnabled;
    }

    public boolean isEnabled() {
        return isEnabled;
    }

    public HostelVerifyResDTO fetchHostelStudentDetails(String identifier) {
        if (!isEnabled || apiUrl == null || apiUrl.isBlank() || identifier == null || identifier.isBlank()) {
            return null;
        }
        String detailsUrl = apiUrl.endsWith("/verify-details")
                ? apiUrl.substring(0, apiUrl.length() - "/verify-details".length()) + "/student-details"
                : apiUrl + "/student-details";
        try {
            String rawJson = webClient.get()
                    .uri(detailsUrl + "?identifier=" + java.net.URLEncoder.encode(identifier.trim(), java.nio.charset.StandardCharsets.UTF_8))
                    .header("X-Api-Key", apiKey)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();
            if (rawJson == null || !rawJson.trim().startsWith("{")) {
                return null;
            }
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            java.util.Map<?, ?> map = mapper.readValue(rawJson.trim(), java.util.Map.class);
            HostelVerifyResDTO dto = new HostelVerifyResDTO();
            dto.setVerified(true);
            if (map.get("name") != null) dto.setName(String.valueOf(map.get("name")));
            if (map.get("registerNo") != null) dto.setRegisterNo(String.valueOf(map.get("registerNo")));
            if (map.get("rollNo") != null) dto.setRollNo(String.valueOf(map.get("rollNo")));
            if (map.get("department") != null) dto.setDepartment(String.valueOf(map.get("department")));
            if (map.get("gender") != null) dto.setGender(String.valueOf(map.get("gender")));
            if (map.get("emailId") != null) dto.setEmailId(String.valueOf(map.get("emailId")));
            if (map.get("currentYear") instanceof Number n) dto.setCurrentYear(n.intValue());
            return dto;
        } catch (Exception e) {
            logger.warn("Could not fetch hostel student details for '{}': {}", identifier, e.getMessage());
            return null;
        }
    }

    public HostelVerifyResDTO verifyHostelCredentials(HostelVerifyReqDTO req) {
        if (!isEnabled) {
            logger.info("External student verification is disabled. Returning mock verified status.");
            return HostelVerifyResDTO.builder()
                    .verified(true)
                    .registerNo(req.getRegisterNo())
                    .rollNo(req.getRegisterNo())
                    .name("Verified Student")
                    .department("CSE")
                    .gender("MALE")
                    .message("Verification successful")
                    .build();
        }

        logger.info("Hostel verification request started for registerNo: {}", req.getRegisterNo());

        try {
            String rawResponseBody = webClient.post()
                    .uri(apiUrl)
                    .header("X-Api-Key", apiKey)
                    .bodyValue(req)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            logger.info("Hostel API Raw Response: {}", rawResponseBody);

            boolean isVerified = false;
            HostelVerifyResDTO response = new HostelVerifyResDTO();
            response.setRegisterNo(req.getRegisterNo());

            if (rawResponseBody != null) {
                String trimmed = rawResponseBody.trim();
                if (trimmed.equalsIgnoreCase("true")) {
                    isVerified = true;
                } else if (trimmed.equalsIgnoreCase("false")) {
                    isVerified = false;
                } else if (trimmed.startsWith("{")) {
                    try {
                        com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                        java.util.Map<?, ?> map = mapper.readValue(trimmed, java.util.Map.class);
                        Object v = map.get("verified");
                        if (v instanceof Boolean b) {
                            isVerified = b;
                        } else if (v != null) {
                            isVerified = Boolean.parseBoolean(v.toString());
                        } else {
                            Object s = map.get("success");
                            if (s instanceof Boolean b) isVerified = b;
                        }
                        if (map.get("name") != null) response.setName(String.valueOf(map.get("name")));
                        if (map.get("registerNo") != null) response.setRegisterNo(String.valueOf(map.get("registerNo")));
                        if (map.get("regNo") != null && response.getRegisterNo() == null) response.setRegisterNo(String.valueOf(map.get("regNo")));
                        if (map.get("rollNo") != null) response.setRollNo(String.valueOf(map.get("rollNo")));
                        if (map.get("department") != null) response.setDepartment(String.valueOf(map.get("department")));
                        if (map.get("gender") != null) response.setGender(String.valueOf(map.get("gender")));
                        if (map.get("message") != null) response.setMessage(String.valueOf(map.get("message")));
                    } catch (Exception parseEx) {
                        logger.error("Error parsing JSON response: {}", parseEx.getMessage());
                    }
                }
            }

            logger.info("Verification Result: {}", isVerified);
            response.setVerified(isVerified);

            if (!isVerified) {
                if (response.getMessage() == null || response.getMessage().isBlank()) {
                    response.setMessage("Invalid Register Number or Password.\n\nPlease use your official College Hostel credentials.");
                }
                logger.warn("Hostel verification failed for registerNo: {}", req.getRegisterNo());
            } else {
                markVerified(req.getRegisterNo());
                logger.info("Hostel verification successful for registerNo: {}", req.getRegisterNo());
            }
            return response;
        } catch (org.springframework.web.reactive.function.client.WebClientResponseException e) {
            if (e.getStatusCode().is4xxClientError()) {
                logger.warn("Hostel verification 4xx response ({}) for registerNo: {}", e.getStatusCode(), req.getRegisterNo());
                HostelVerifyResDTO response = new HostelVerifyResDTO();
                response.setRegisterNo(req.getRegisterNo());
                response.setVerified(false);
                response.setMessage("The Register Number or Password you entered is incorrect. Please use your official College Hostel App credentials.");
                return response;
            }
            logger.error("Hostel Verification API server error ({}): {}", e.getStatusCode(), e.getMessage());
            throw new StudentVerificationServiceUnavailableException(
                    "Unable to connect to the College Hostel Verification Server. Please try again later.", e);
        } catch (Exception e) {
            logger.error("Hostel Verification API call failed or is unavailable: {}", e.getMessage());
            throw new StudentVerificationServiceUnavailableException(
                    "Unable to connect to the College Hostel Verification Server. Please try again later.", e);
        }
    }

    public void markVerified(String registerNo) {
        if (registerNo != null) {
            verifiedRegisterNumbers.put(registerNo.trim().toUpperCase(), System.currentTimeMillis());
        }
    }

    public boolean isRegisterNoVerified(String registerNo) {
        if (!isEnabled) {
            return true;
        }
        if (registerNo == null) return false;
        Long timestamp = verifiedRegisterNumbers.get(registerNo.trim().toUpperCase());
        if (timestamp == null) return false;
        // Valid for 15 minutes
        if (System.currentTimeMillis() - timestamp > 15 * 60 * 1000L) {
            verifiedRegisterNumbers.remove(registerNo.trim().toUpperCase());
            return false;
        }
        return true;
    }

    public void consumeVerification(String registerNo) {
        if (registerNo != null) {
            verifiedRegisterNumbers.remove(registerNo.trim().toUpperCase());
        }
    }
}
