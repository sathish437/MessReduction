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

        logger.info("Verification request started");

        StudentVerificationRequestDTO requestDto = new StudentVerificationRequestDTO(
                studentDto.getRollNo(),
                studentDto.getRegisterNo(),
                studentDto.getGender() != null ? studentDto.getGender().name() : null,
                studentDto.getDepartment() != null ? studentDto.getDepartment().name() : null
        );

        try {
            Boolean response = webClient.post()
                    .uri(apiUrl)
                    .header("X-Api-Key", apiKey)
                    .bodyValue(requestDto)
                    .retrieve()
                    .bodyToMono(Boolean.class)
                    .block(); // Blocking call since the registration flow is synchronous/blocking

            if (Boolean.TRUE.equals(response)) {
                logger.info("Verification successful");
                return true;
            } else {
                logger.warn("Verification failed");
                return false;
            }
        } catch (Exception e) {
            logger.error("Verification API call failed or is unavailable: {}", e.getMessage());
            throw new StudentVerificationServiceUnavailableException(
                    "External verification service is currently unavailable. Please try again later.", e);
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
            HostelVerifyResDTO response = webClient.post()
                    .uri(apiUrl)
                    .header("X-Api-Key", apiKey)
                    .bodyValue(req)
                    .retrieve()
                    .bodyToMono(HostelVerifyResDTO.class)
                    .block();

            if (response != null && response.isVerified()) {
                logger.info("Hostel verification successful for rollNo: {}", req.getRollNo());
                return response;
            } else {
                logger.warn("Hostel verification failed for rollNo: {}", req.getRollNo());
                return HostelVerifyResDTO.builder()
                        .verified(false)
                        .message("Invalid Roll Number or Password.")
                        .build();
            }
        } catch (Exception e) {
            logger.error("Hostel Verification API call failed or is unavailable: {}", e.getMessage());
            throw new StudentVerificationServiceUnavailableException(
                    "Unable to verify your hostel account. Please try again later.", e);
        }
    }
}
