package com.hostel.MessReduction.Controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hostel.MessReduction.Entity.AppNotification;
import com.hostel.MessReduction.Repo.FcmTokenRepository;
import com.hostel.MessReduction.Service.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class NotificationControllerTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @Mock
    private NotificationService notificationService;

    @Mock
    private FcmTokenRepository fcmTokenRepository;

    @InjectMocks
    private NotificationController notificationController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(notificationController).build();
        objectMapper = new ObjectMapper();
    }

    @Test
    @DisplayName("WF-STATE-14 / BND-25: GET /api/notifications returns user notifications & unread count")
    void testGetNotifications() throws Exception {
        Authentication auth = new UsernamePasswordAuthenticationToken("730421104001", "pass");

        AppNotification notif = new AppNotification();
        notif.setId(1L);
        notif.setMessage("Your reduction request has been approved by Warden");
        notif.setType("APPROVED");
        notif.setRead(false);

        when(notificationService.getUserNotifications("730421104001")).thenReturn(List.of(notif));
        when(notificationService.getUnreadCount("730421104001")).thenReturn(1L);

        mockMvc.perform(get("/api/notifications").principal(auth))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.unreadCount").value(1))
                .andExpect(jsonPath("$.notifications[0].message").value("Your reduction request has been approved by Warden"));
    }

    @Test
    @DisplayName("WF-STATE-14: PATCH /api/notifications/{id}/read marks individual notification read")
    void testMarkAsRead() throws Exception {
        Authentication auth = new UsernamePasswordAuthenticationToken("730421104001", "pass");

        mockMvc.perform(patch("/api/notifications/1/read").principal(auth))
                .andExpect(status().isOk());

        verify(notificationService).markAsRead(1L, "730421104001");
    }

    @Test
    @DisplayName("WF-STATE-15: PATCH /api/notifications/read-all marks all notifications read")
    void testMarkAllAsRead() throws Exception {
        Authentication auth = new UsernamePasswordAuthenticationToken("730421104001", "pass");

        mockMvc.perform(patch("/api/notifications/read-all").principal(auth))
                .andExpect(status().isOk());

        verify(notificationService).markAllAsRead("730421104001");
    }
}
