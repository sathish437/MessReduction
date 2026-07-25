package com.hostel.MessReduction.Service;

import com.hostel.MessReduction.CustomException.StudentVerificationServiceUnavailableException;
import com.hostel.MessReduction.DTO.ReqDTO.StudentDetailsReqDTO;
import com.hostel.MessReduction.DTO.ReqDTO.StudentVerificationRequestDTO;
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

    public boolean verifyStudent(StudentDetailsReqDTO studentDto) {
        if (!isEnabled) {
            logger.info("External student verification is disabled. Bypassing API call.");
            return true;
        }

        logger.info("Verification request started for rollNo: {}", studentDto.getRollNo());

        String genderStr = studentDto.getGender() != null ? studentDto.getGender().name() : null;
        String deptStr = studentDto.getDepartment() != null ? studentDto.getDepartment().name() : null;

        StudentVerificationRequestDTO requestDto = StudentVerificationRequestDTO.builder()
                .rollNo(studentDto.getRollNo())
                .registerNo(studentDto.getRegisterNo())
                .regNo(studentDto.getRegisterNo())
                .gender(genderStr)
                .dept(deptStr)
                .department(deptStr)
                .build();

        String jsonPayload;
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            mapper.setSerializationInclusion(com.fasterxml.jackson.annotation.JsonInclude.Include.NON_NULL);
            jsonPayload = mapper.writeValueAsString(requestDto);
            logger.info("Outgoing Student Verification JSON Payload to {}: {}", apiUrl, jsonPayload);
        } catch (Exception e) {
            logger.error("Error serializing StudentVerificationRequestDTO to JSON", e);
            jsonPayload = "{\"rollNo\":\"" + studentDto.getRollNo() + "\",\"registerNo\":\"" + studentDto.getRegisterNo() + "\",\"regNo\":\"" + studentDto.getRegisterNo() + "\",\"gender\":\"" + genderStr + "\",\"dept\":\"" + deptStr + "\",\"department\":\"" + deptStr + "\"}";
        }

        try {
            String rawResponseBody = webClient.post()
                    .uri(apiUrl)
                    .header("X-Api-Key", apiKey)
                    .header(org.springframework.http.HttpHeaders.CONTENT_TYPE, org.springframework.http.MediaType.APPLICATION_JSON_VALUE)
                    .bodyValue(jsonPayload)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            logger.info("Student verification API raw response: {}", rawResponseBody);

            boolean isVerified = false;
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
                        
                        Object verifiedObj = map.get("verified");
                        if (verifiedObj instanceof Boolean b) {
                            isVerified = b;
                        } else if (verifiedObj != null) {
                            isVerified = Boolean.parseBoolean(verifiedObj.toString());
                        } else if (map.get("success") instanceof Boolean successBool) {
                            if (successBool) {
                                Object dataObj = map.get("data");
                                if (dataObj instanceof Boolean dataBool) {
                                    isVerified = dataBool;
                                } else if (dataObj != null) {
                                    isVerified = Boolean.parseBoolean(dataObj.toString());
                                } else {
                                    isVerified = true;
                                }
                            } else {
                                isVerified = false;
                            }
                        } else if (map.get("status") instanceof Boolean statusBool) {
                            isVerified = statusBool;
                        }
                    } catch (Exception parseEx) {
                        logger.error("Error parsing student verification JSON: {}", parseEx.getMessage());
                    }
                }
            }

            if (isVerified) {
                logger.info("Verification successful for rollNo: {}", studentDto.getRollNo());
                return true;
            } else {
                logger.warn("Verification failed for rollNo: {}", studentDto.getRollNo());
                return false;
            }
        } catch (org.springframework.web.reactive.function.client.WebClientResponseException e) {
            String errorBody = e.getResponseBodyAsString();
            logger.error("Student verification API error response (Status: {}): {}", e.getStatusCode().value(), errorBody);

            if (e.getStatusCode().is4xxClientError()) {
                logger.warn("Student verification 4xx response ({}) for rollNo: {}", e.getStatusCode().value(), studentDto.getRollNo());
                return false;
            } else if (e.getStatusCode().is5xxServerError()) {
                logger.error("External Hostel API returned 5xx Server Error ({}) for rollNo: {}. Body: {}",
                        e.getStatusCode().value(), studentDto.getRollNo(), errorBody);
                throw new StudentVerificationServiceUnavailableException(
                        "Unable to connect to the College Hostel Verification Server (500 Internal Error). Please try again later.", e);
            }
            throw new StudentVerificationServiceUnavailableException(
                    "Unable to connect to the College Hostel Verification Server. Please try again later.", e);
        } catch (Exception e) {
            logger.error("Verification API call failed or is unavailable: {}", e.getMessage(), e);
            throw new StudentVerificationServiceUnavailableException(
                    "Unable to connect to the College Hostel Verification Server. Please try again later.", e);
        }
    }

    public HostelVerifyResDTO verifyHostelCredentials(HostelVerifyReqDTO req) {
        if (!isEnabled) {
            logger.info("External student verification is disabled. Returning mock verified status.");
            return HostelVerifyResDTO.builder()
                    .verified(true)
                    .rollNo(req.getRollNo())
                    .registerNo("8301" + req.getRollNo())
                    .name("Verified Student")
                    .department("CSE")
                    .gender("MALE")
                    .message("Verification successful")
                    .build();
        }

        logger.info("Hostel verification request started for rollNo: {}", req.getRollNo());

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
            response.setRollNo(req.getRollNo());

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
                    response.setMessage("Invalid Roll Number or Password.\n\nPlease use your official College Hostel credentials.");
                }
                logger.warn("Hostel verification failed for rollNo: {}", req.getRollNo());
            } else {
                logger.info("Hostel verification successful for rollNo: {}", req.getRollNo());
            }
            return response;
        } catch (org.springframework.web.reactive.function.client.WebClientResponseException e) {
            if (e.getStatusCode().is4xxClientError()) {
                logger.warn("Hostel verification 4xx response ({}) for rollNo: {}", e.getStatusCode(), req.getRollNo());
                HostelVerifyResDTO response = new HostelVerifyResDTO();
                response.setRollNo(req.getRollNo());
                response.setVerified(false);
                response.setMessage("The Roll Number or Password you entered is incorrect. Please use your official College Hostel App credentials.");
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
}
