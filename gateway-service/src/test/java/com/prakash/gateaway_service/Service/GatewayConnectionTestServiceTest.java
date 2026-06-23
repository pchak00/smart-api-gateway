package com.prakash.gateaway_service.Service;

import com.prakash.gateaway_service.DTO.GatewaySettingsResponseDto;
import com.prakash.gateaway_service.DTO.TestGatewayConnectionRequestDto;
import com.prakash.gateaway_service.DTO.TestGatewayConnectionResponseDto;
import com.prakash.gateaway_service.Exception.InvalidGatewaySettingsException;
import com.prakash.gateaway_service.Repository.GatewaySettingsRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.io.IOException;
import java.net.ConnectException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class GatewayConnectionTestServiceTest {

    private GatewaySettingsService gatewaySettingsService;
    private GatewayConnectionTestService gatewayConnectionTestService;
    private HttpClient httpClient;

    @BeforeEach
    void setUp() {
        GatewaySettingsRepository gatewaySettingsRepository = mock(GatewaySettingsRepository.class);
        when(gatewaySettingsRepository.findById(1L)).thenReturn(Optional.empty());
        gatewaySettingsService = new GatewaySettingsService(
                gatewaySettingsRepository,
                "http://backend-service:8081"
        );
        httpClient = mock(HttpClient.class);
        gatewayConnectionTestService = new GatewayConnectionTestService(
                gatewaySettingsService,
                new GatewayUpstreamResolver(gatewaySettingsRepository, "http://backend-service:8081"),
                httpClient
        );
    }

    @Test
    void returnsReachableWhenUpstreamRespondsWith2xx() throws Exception {
        HttpResponse<Void> httpResponse = response(200);
        when(httpClient.send(any(HttpRequest.class), anyBodyHandler()))
                .thenReturn(httpResponse);

        TestGatewayConnectionResponseDto response = gatewayConnectionTestService.testConnection(
                new TestGatewayConnectionRequestDto("http://backend-service:8081", "/health", 5000)
        );

        assertTrue(response.reachable());
        assertEquals(200, response.statusCode());
        assertEquals("http://backend-service:8081/health", response.checkedUrl());
        assertEquals("Upstream is reachable", response.message());

        ArgumentCaptor<HttpRequest> requestCaptor = ArgumentCaptor.forClass(HttpRequest.class);
        verify(httpClient).send(requestCaptor.capture(), anyBodyHandler());
        HttpRequest outboundRequest = requestCaptor.getValue();
        assertEquals("GET", outboundRequest.method());
        assertEquals(Optional.of(Duration.ofMillis(5000)), outboundRequest.timeout());
        assertTrue(outboundRequest.headers().firstValue("Authorization").isEmpty());
        assertTrue(outboundRequest.headers().firstValue("X-API-Key").isEmpty());
    }

    @Test
    void returnsUnreachableWithStatusCodeForNon2xxResponse() throws Exception {
        HttpResponse<Void> httpResponse = response(503);
        when(httpClient.send(any(HttpRequest.class), anyBodyHandler()))
                .thenReturn(httpResponse);

        TestGatewayConnectionResponseDto response = gatewayConnectionTestService.testConnection(
                new TestGatewayConnectionRequestDto("http://backend-service:8081", "/health", 5000)
        );

        assertFalse(response.reachable());
        assertEquals(503, response.statusCode());
        assertEquals("Upstream responded with status 503", response.message());
    }

    @Test
    void connectionFailureReturnsUnreachableInsteadOfThrowing() throws Exception {
        when(httpClient.send(any(HttpRequest.class), anyBodyHandler()))
                .thenThrow(new ConnectException("Connection refused"));

        TestGatewayConnectionResponseDto response = gatewayConnectionTestService.testConnection(
                new TestGatewayConnectionRequestDto("http://localhost:9999", "/health", 1000)
        );

        assertFalse(response.reachable());
        assertNull(response.statusCode());
        assertEquals("http://localhost:9999/health", response.checkedUrl());
        assertEquals("Connection refused", response.message());
    }

    @Test
    void genericConnectionFailureReturnsUnreachableInsteadOfThrowing() throws Exception {
        when(httpClient.send(any(HttpRequest.class), anyBodyHandler()))
                .thenThrow(new IOException("network failed"));

        TestGatewayConnectionResponseDto response = gatewayConnectionTestService.testConnection(
                new TestGatewayConnectionRequestDto("http://localhost:9999", "/health", 1000)
        );

        assertFalse(response.reachable());
        assertNull(response.statusCode());
        assertEquals("Connection failed", response.message());
    }

    @Test
    void rejectsInvalidUpstreamUrl() {
        assertThrows(
                InvalidGatewaySettingsException.class,
                () -> gatewayConnectionTestService.testConnection(
                        new TestGatewayConnectionRequestDto("file:///etc/passwd", "/health", 5000)
                )
        );
    }

    @Test
    void rejectsInvalidHealthCheckPath() {
        assertThrows(
                InvalidGatewaySettingsException.class,
                () -> gatewayConnectionTestService.testConnection(
                        new TestGatewayConnectionRequestDto("http://backend-service:8081", "health", 5000)
                )
        );
    }

    @Test
    void rejectsInvalidTimeout() {
        assertThrows(
                InvalidGatewaySettingsException.class,
                () -> gatewayConnectionTestService.testConnection(
                        new TestGatewayConnectionRequestDto("http://backend-service:8081", "/health", 60001)
                )
        );
    }

    @Test
    void emptyBodyUsesSavedSettings() throws Exception {
        GatewaySettingsService settingsService = mock(GatewaySettingsService.class);
        GatewayUpstreamResolver upstreamResolver = mock(GatewayUpstreamResolver.class);
        GatewayConnectionTestService service = new GatewayConnectionTestService(
                settingsService,
                upstreamResolver,
                httpClient
        );
        when(settingsService.getGatewaySettings()).thenReturn(new GatewaySettingsResponseDto(
                "http://saved-backend:8081",
                "/health",
                5000,
                LocalDateTime.of(2026, 6, 23, 10, 15),
                "system"
        ));
        when(settingsService.validateGatewaySettings(any())).thenCallRealMethod();
        when(upstreamResolver.normalizeHttpBaseUri("http://saved-backend:8081"))
                .thenReturn(URI.create("http://saved-backend:8081"));
        when(upstreamResolver.buildHealthCheckUri(URI.create("http://saved-backend:8081"), "/health"))
                .thenReturn(URI.create("http://saved-backend:8081/health"));
        HttpResponse<Void> httpResponse = response(200);
        when(httpClient.send(any(HttpRequest.class), anyBodyHandler()))
                .thenReturn(httpResponse);

        TestGatewayConnectionResponseDto response = service.testConnection(null);

        assertTrue(response.reachable());
        assertEquals("http://saved-backend:8081/health", response.checkedUrl());
        verify(settingsService).getGatewaySettings();
    }

    @SuppressWarnings("unchecked")
    private HttpResponse<Void> response(int statusCode) {
        HttpResponse<Void> response = mock(HttpResponse.class);
        when(response.statusCode()).thenReturn(statusCode);
        return response;
    }

    @SuppressWarnings("unchecked")
    private HttpResponse.BodyHandler<Void> anyBodyHandler() {
        return (HttpResponse.BodyHandler<Void>) any(HttpResponse.BodyHandler.class);
    }
}
