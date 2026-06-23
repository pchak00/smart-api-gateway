package com.prakash.gateaway_service.Controller;

import com.prakash.gateaway_service.Config.SecurityConfig;
import com.prakash.gateaway_service.DTO.AbuseAlertResponseDto;
import com.prakash.gateaway_service.Entity.AbuseAlertStatus;
import com.prakash.gateaway_service.Exception.AbuseAlertNotFoundException;
import com.prakash.gateaway_service.Exception.InvalidAbuseAlertStatusException;
import com.prakash.gateaway_service.Exception.InvalidAbuseAlertTransitionException;
import com.prakash.gateaway_service.Filter.JwtAuthenticationFilter;
import com.prakash.gateaway_service.Repository.AdminUserRepository;
import com.prakash.gateaway_service.Service.AbuseDetectionService;
import com.prakash.gateaway_service.Service.AdminService;
import com.prakash.gateaway_service.Service.JwtService;
import com.prakash.gateaway_service.Service.PlanService;
import com.prakash.gateaway_service.Service.RouteLimitService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AdminReadController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class})
class AbuseAlertLifecycleControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private PlanService planService;

    @MockitoBean
    private RouteLimitService routeLimitService;

    @MockitoBean
    private AbuseDetectionService abuseDetectionService;

    @MockitoBean
    private AdminService adminService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private AdminUserRepository adminUserRepository;

    @Test
    @WithMockUser(roles = "READ_ONLY_ADMIN")
    void listAlertsIncludesStatus() throws Exception {
        when(abuseDetectionService.findAllAbuseAlerts(null))
                .thenReturn(List.of(alert(AbuseAlertStatus.OPEN)));

        mockMvc.perform(get("/admin/abuse-alerts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status").value("OPEN"))
                .andExpect(jsonPath("$[0].clientName").value("Demo Free Client"));
    }

    @Test
    @WithMockUser(roles = "READ_ONLY_ADMIN")
    void statusFilterIsPassedToService() throws Exception {
        when(abuseDetectionService.findAllAbuseAlerts("OPEN"))
                .thenReturn(List.of(alert(AbuseAlertStatus.OPEN)));

        mockMvc.perform(get("/admin/abuse-alerts?status=OPEN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status").value("OPEN"));

        verify(abuseDetectionService).findAllAbuseAlerts("OPEN");
    }

    @Test
    @WithMockUser(roles = "READ_ONLY_ADMIN")
    void invalidStatusFilterReturnsBadRequest() throws Exception {
        when(abuseDetectionService.findAllAbuseAlerts("bad"))
                .thenThrow(new InvalidAbuseAlertStatusException("Invalid abuse alert status: bad"));

        mockMvc.perform(get("/admin/abuse-alerts?status=bad"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Invalid abuse alert status: bad"));
    }

    @Test
    @WithMockUser(username = "super admin", roles = "SUPER_ADMIN")
    void superAdminCanAcknowledgeOpenAlert() throws Exception {
        when(abuseDetectionService.acknowledgeAlert(7L, "super admin"))
                .thenReturn(alert(AbuseAlertStatus.ACKNOWLEDGED));

        mockMvc.perform(patch("/admin/abuse-alerts/7/acknowledge"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACKNOWLEDGED"));

        verify(abuseDetectionService).acknowledgeAlert(7L, "super admin");
    }

    @Test
    @WithMockUser(username = "super admin", roles = "SUPER_ADMIN")
    void superAdminCanResolveAlert() throws Exception {
        when(abuseDetectionService.resolveAlert(7L, "super admin"))
                .thenReturn(alert(AbuseAlertStatus.RESOLVED));

        mockMvc.perform(patch("/admin/abuse-alerts/7/resolve"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RESOLVED"));
    }

    @Test
    @WithMockUser(roles = "READ_ONLY_ADMIN")
    void readOnlyAdminCannotAcknowledgeAlert() throws Exception {
        mockMvc.perform(patch("/admin/abuse-alerts/7/acknowledge"))
                .andExpect(status().isForbidden());

        verify(abuseDetectionService, never()).acknowledgeAlert(7L, "viewer");
    }

    @Test
    void unauthenticatedUserCannotResolveAlert() throws Exception {
        mockMvc.perform(patch("/admin/abuse-alerts/7/resolve"))
                .andExpect(status().isForbidden());

        verify(abuseDetectionService, never()).resolveAlert(7L, null);
    }

    @Test
    @WithMockUser(username = "super admin", roles = "SUPER_ADMIN")
    void missingAlertReturnsNotFound() throws Exception {
        when(abuseDetectionService.resolveAlert(99L, "super admin"))
                .thenThrow(new AbuseAlertNotFoundException("Abuse alert not found with id: 99"));

        mockMvc.perform(patch("/admin/abuse-alerts/99/resolve"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Abuse alert not found with id: 99"));
    }

    @Test
    @WithMockUser(username = "super admin", roles = "SUPER_ADMIN")
    void invalidTransitionReturnsConflict() throws Exception {
        when(abuseDetectionService.acknowledgeAlert(7L, "super admin"))
                .thenThrow(new InvalidAbuseAlertTransitionException("Resolved alerts cannot be acknowledged"));

        mockMvc.perform(patch("/admin/abuse-alerts/7/acknowledge"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Resolved alerts cannot be acknowledged"));
    }

    private AbuseAlertResponseDto alert(AbuseAlertStatus status) {
        return new AbuseAlertResponseDto(
                7L,
                1L,
                "Demo Free Client",
                10,
                "HIGH",
                "Client exceeded blocked request threshold",
                status,
                LocalDateTime.of(2026, 6, 23, 8, 0),
                LocalDateTime.of(2026, 6, 23, 8, 5),
                status == AbuseAlertStatus.ACKNOWLEDGED ? LocalDateTime.of(2026, 6, 23, 8, 6) : null,
                status == AbuseAlertStatus.ACKNOWLEDGED ? "super admin" : null,
                status == AbuseAlertStatus.RESOLVED ? LocalDateTime.of(2026, 6, 23, 8, 7) : null,
                status == AbuseAlertStatus.RESOLVED ? "super admin" : null,
                LocalDateTime.of(2026, 6, 23, 8, 6)
        );
    }
}
