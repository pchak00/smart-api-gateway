package com.prakash.gateaway_service.Service;

import com.prakash.gateaway_service.DTO.GatewaySettingsResponseDto;
import com.prakash.gateaway_service.DTO.UpdateGatewaySettingsRequestDto;
import com.prakash.gateaway_service.Entity.GatewaySettings;
import com.prakash.gateaway_service.Exception.InvalidGatewaySettingsException;
import com.prakash.gateaway_service.Repository.GatewaySettingsRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class GatewaySettingsServiceTest {

    private GatewaySettingsRepository gatewaySettingsRepository;
    private GatewaySettingsService gatewaySettingsService;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
        gatewaySettingsRepository = mock(GatewaySettingsRepository.class);
        gatewaySettingsService = new GatewaySettingsService(
                gatewaySettingsRepository,
                "http://backend-service:8081"
        );
    }

    @Test
    void returnsExistingGatewaySettings() {
        GatewaySettings settings = settings();
        when(gatewaySettingsRepository.findById(1L)).thenReturn(Optional.of(settings));

        GatewaySettingsResponseDto response = gatewaySettingsService.getGatewaySettings();

        assertEquals("http://backend-service:8081", response.upstreamBaseUrl());
        assertEquals("/health", response.healthCheckPath());
        assertEquals(5000, response.timeoutMs());
        assertEquals("system", response.updatedBy());
        verify(gatewaySettingsRepository, never()).save(any());
    }

    @Test
    void createsDefaultSettingsWhenMissing() {
        when(gatewaySettingsRepository.findById(1L)).thenReturn(Optional.empty());
        when(gatewaySettingsRepository.save(any(GatewaySettings.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        GatewaySettingsResponseDto response = gatewaySettingsService.getGatewaySettings();

        assertEquals("http://backend-service:8081", response.upstreamBaseUrl());
        assertEquals("/health", response.healthCheckPath());
        assertEquals(5000, response.timeoutMs());
        assertEquals("system", response.updatedBy());
        assertNotNull(response.updatedAt());
        verify(gatewaySettingsRepository).save(any(GatewaySettings.class));
    }

    @Test
    void updatesGatewaySettingsAndUpdatedBy() {
        GatewaySettings settings = settings();
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("super admin", null)
        );
        when(gatewaySettingsRepository.findById(1L)).thenReturn(Optional.of(settings));
        when(gatewaySettingsRepository.save(settings)).thenReturn(settings);

        GatewaySettingsResponseDto response = gatewaySettingsService.updateGatewaySettings(
                new UpdateGatewaySettingsRequestDto(" https://api.example.com ", " /status ", 8000)
        );

        assertEquals("https://api.example.com", response.upstreamBaseUrl());
        assertEquals("/status", response.healthCheckPath());
        assertEquals(8000, response.timeoutMs());
        assertEquals("super admin", response.updatedBy());
        assertNotNull(response.updatedAt());
        verify(gatewaySettingsRepository).save(settings);
    }

    @Test
    void rejectsBlankUpstreamBaseUrl() {
        assertInvalid(new UpdateGatewaySettingsRequestDto(" ", "/health", 5000));
    }

    @Test
    void rejectsUnsupportedUpstreamBaseUrlScheme() {
        assertInvalid(new UpdateGatewaySettingsRequestDto("file:///tmp/backend", "/health", 5000));
        assertInvalid(new UpdateGatewaySettingsRequestDto("javascript:alert(1)", "/health", 5000));
    }

    @Test
    void rejectsUpstreamBaseUrlWithoutHost() {
        assertInvalid(new UpdateGatewaySettingsRequestDto("http:///missing-host", "/health", 5000));
    }

    @Test
    void rejectsBlankHealthCheckPath() {
        assertInvalid(new UpdateGatewaySettingsRequestDto("https://api.example.com", " ", 5000));
    }

    @Test
    void rejectsHealthCheckPathWithoutLeadingSlash() {
        assertInvalid(new UpdateGatewaySettingsRequestDto("https://api.example.com", "health", 5000));
    }

    @Test
    void rejectsNonPositiveTimeoutMs() {
        assertInvalid(new UpdateGatewaySettingsRequestDto("https://api.example.com", "/health", 0));
        assertInvalid(new UpdateGatewaySettingsRequestDto("https://api.example.com", "/health", -1));
    }

    @Test
    void rejectsTooLargeTimeoutMs() {
        assertInvalid(new UpdateGatewaySettingsRequestDto("https://api.example.com", "/health", 60001));
    }

    private void assertInvalid(UpdateGatewaySettingsRequestDto request) {
        when(gatewaySettingsRepository.findById(1L)).thenReturn(Optional.of(settings()));

        assertThrows(
                InvalidGatewaySettingsException.class,
                () -> gatewaySettingsService.updateGatewaySettings(request)
        );
        verify(gatewaySettingsRepository, never()).save(any());
    }

    private GatewaySettings settings() {
        GatewaySettings settings = new GatewaySettings();
        settings.setId(1L);
        settings.setUpstreamBaseUrl("http://backend-service:8081");
        settings.setHealthCheckPath("/health");
        settings.setTimeoutMs(5000);
        settings.setUpdatedAt(LocalDateTime.of(2026, 6, 23, 10, 15));
        settings.setUpdatedBy("system");
        return settings;
    }
}
