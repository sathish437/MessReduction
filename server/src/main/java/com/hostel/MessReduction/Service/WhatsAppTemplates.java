package com.hostel.MessReduction.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class WhatsAppTemplates {

    // Template names as configured in Meta WhatsApp Manager
    public static final String BATCH_SUMMARY = "mess_reduction_batch_summary"; // Requires 1 param: list of students
    public static final String REMINDER = "mess_reduction_reminder"; // Requires 1 param: list of pending students
    public static final String STUDENT_UPDATE = "mess_reduction_student_update"; // Requires 1 param: update message
    
    // Default fallback template provided by Meta (no params)
    public static final String HELLO_WORLD = "hello_world";

    /**
     * Builds the JSON structure for a Meta WhatsApp template message with text parameters.
     * @param templateName The name of the approved template
     * @param languageCode The language code (e.g., "en_US")
     * @param bodyParameters List of string parameters matching the {{1}}, {{2}} in the template
     * @return Map representing the "template" object in the API payload
     */
    public static Map<String, Object> buildTemplatePayload(String templateName, String languageCode, List<String> bodyParameters) {
        Map<String, Object> templateObj = new HashMap<>();
        templateObj.put("name", templateName);
        
        Map<String, String> languageObj = new HashMap<>();
        languageObj.put("code", languageCode);
        templateObj.put("language", languageObj);

        if (bodyParameters != null && !bodyParameters.isEmpty()) {
            List<Map<String, Object>> components = new ArrayList<>();
            Map<String, Object> bodyComponent = new HashMap<>();
            bodyComponent.put("type", "body");

            List<Map<String, String>> parametersList = new ArrayList<>();
            for (String param : bodyParameters) {
                Map<String, String> paramMap = new HashMap<>();
                paramMap.put("type", "text");
                // Meta limits parameter length, typically to 1024 characters.
                // We truncate if it exceeds safe limits to avoid API rejection.
                String safeParam = param.length() > 1000 ? param.substring(0, 997) + "..." : param;
                paramMap.put("text", safeParam);
                parametersList.add(paramMap);
            }
            bodyComponent.put("parameters", parametersList);
            components.add(bodyComponent);
            templateObj.put("components", components);
        }

        return templateObj;
    }
}
