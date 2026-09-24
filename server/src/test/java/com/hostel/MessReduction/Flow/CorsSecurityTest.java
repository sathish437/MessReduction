package com.hostel.MessReduction.Flow;

import com.hostel.MessReduction.Config.CorsConfig;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

public class CorsSecurityTest {

    @Test
    @DisplayName("WF-ABU-29 & Security: Foreign untrusted origin is rejected and not echoed back; legitimate origin is accepted")
    void testCorsConfiguration_ForeignOriginRejectedAndNoWildcard() {
        CorsConfig corsConfig = new CorsConfig();
        // Allowed origins configured in production/properties: http://localhost:5173, http://localhost:5174, http://localhost:3000
        ReflectionTestUtils.setField(corsConfig, "allowedOrigins", List.of("http://localhost:5173", "http://localhost:5174", "http://localhost:3000"));

        CorsConfigurationSource source = corsConfig.corsConfigurationSource();

        // 1. Foreign / Malicious Origin
        MockHttpServletRequest foreignRequest = new MockHttpServletRequest("GET", "/api/departments");
        foreignRequest.addHeader("Origin", "http://malicious-site.com");

        CorsConfiguration foreignConfig = source.getCorsConfiguration(foreignRequest);
        assertNotNull(foreignConfig, "CORS configuration must exist for mapping");
        
        // Assert that wildcard origin "*" is NOT present
        assertFalse(foreignConfig.getAllowedOrigins().contains("*"), "Wildcard origin '*' must NOT be allowed");

        // Check if foreign origin matches allowed origins
        String matchedForeignOrigin = foreignConfig.checkOrigin("http://malicious-site.com");
        assertNull(matchedForeignOrigin, "Untrusted foreign origin 'http://malicious-site.com' must NOT be matched or allowed");

        // 2. Legitimate Configured Origin
        MockHttpServletRequest legitimateRequest = new MockHttpServletRequest("GET", "/api/departments");
        legitimateRequest.addHeader("Origin", "http://localhost:5173");

        String matchedLegitimateOrigin = foreignConfig.checkOrigin("http://localhost:5173");
        assertEquals("http://localhost:5173", matchedLegitimateOrigin, "Legitimate origin 'http://localhost:5173' must be allowed");

        // Assert credentials allowed only with explicit origin
        assertTrue(foreignConfig.getAllowCredentials(), "AllowCredentials should be true with explicit origins");
    }

    @Test
    @DisplayName("WF-ABU-29: MockMvc integration with CORS filter verifies allowed origin headers and rejects foreign origin")
    void testMockMvcCorsFilter_PreflightAndOriginHandling() throws Exception {
        CorsConfig corsConfig = new CorsConfig();
        ReflectionTestUtils.setField(corsConfig, "allowedOrigins", List.of("http://localhost:5173"));
        org.springframework.web.filter.CorsFilter corsFilter = new org.springframework.web.filter.CorsFilter(corsConfig.corsConfigurationSource());

        com.hostel.MessReduction.Controller.DepartmentController departmentController =
                new com.hostel.MessReduction.Controller.DepartmentController(org.mockito.Mockito.mock(com.hostel.MessReduction.Service.DepartmentService.class));

        org.springframework.test.web.servlet.MockMvc mockMvc =
                org.springframework.test.web.servlet.setup.MockMvcBuilders
                        .standaloneSetup(departmentController)
                        .addFilters(corsFilter)
                        .build();

        // 1. Valid origin preflight OPTIONS request
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options("/api/departments")
                        .header("Origin", "http://localhost:5173")
                        .header("Access-Control-Request-Method", "GET"))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isOk())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.header().string("Access-Control-Allow-Origin", "http://localhost:5173"))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.header().string("Access-Control-Allow-Credentials", "true"));

        // 2. Untrusted foreign origin preflight request is rejected without CORS header
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options("/api/departments")
                        .header("Origin", "http://untrusted-site.com")
                        .header("Access-Control-Request-Method", "GET"))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.header().doesNotExist("Access-Control-Allow-Origin"));
    }
}
