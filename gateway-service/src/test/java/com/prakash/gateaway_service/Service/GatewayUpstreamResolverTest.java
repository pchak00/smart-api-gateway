package com.prakash.gateaway_service.Service;

import com.prakash.gateaway_service.Entity.GatewaySettings;
import com.prakash.gateaway_service.Repository.GatewaySettingsRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.net.URI;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class GatewayUpstreamResolverTest {

    private GatewaySettingsRepository gatewaySettingsRepository;
    private GatewayUpstreamResolver gatewayUpstreamResolver;

    @BeforeEach
    void setUp() {
        gatewaySettingsRepository = mock(GatewaySettingsRepository.class);
        gatewayUpstreamResolver = new GatewayUpstreamResolver(
                gatewaySettingsRepository,
                "http://backend-service:8081"
        );
    }

    @Test
    void returnsDatabaseUpstreamWhenValid() {
        GatewaySettings settings = settings("https://api.example.com:9443/");
        when(gatewaySettingsRepository.findById(1L)).thenReturn(Optional.of(settings));

        URI resolved = gatewayUpstreamResolver.resolveUpstreamBaseUri();

        assertEquals(URI.create("https://api.example.com:9443"), resolved);
    }

    @Test
    void fallsBackToConfiguredUpstreamWhenSettingsMissing() {
        when(gatewaySettingsRepository.findById(1L)).thenReturn(Optional.empty());

        URI resolved = gatewayUpstreamResolver.resolveUpstreamBaseUri();

        assertEquals(URI.create("http://backend-service:8081"), resolved);
    }

    @Test
    void fallsBackToConfiguredUpstreamWhenSettingsUrlIsBlank() {
        GatewaySettings settings = settings(" ");
        when(gatewaySettingsRepository.findById(1L)).thenReturn(Optional.of(settings));

        URI resolved = gatewayUpstreamResolver.resolveUpstreamBaseUri();

        assertEquals(URI.create("http://backend-service:8081"), resolved);
    }

    @Test
    void fallsBackToConfiguredUpstreamWhenSettingsUrlHasUnsupportedScheme() {
        GatewaySettings settings = settings("file:///tmp/backend");
        when(gatewaySettingsRepository.findById(1L)).thenReturn(Optional.of(settings));

        URI resolved = gatewayUpstreamResolver.resolveUpstreamBaseUri();

        assertEquals(URI.create("http://backend-service:8081"), resolved);
    }

    @Test
    void fallsBackToConfiguredUpstreamWhenSettingsRepositoryFails() {
        when(gatewaySettingsRepository.findById(1L)).thenThrow(new RuntimeException("database unavailable"));

        URI resolved = gatewayUpstreamResolver.resolveUpstreamBaseUri();

        assertEquals(URI.create("http://backend-service:8081"), resolved);
    }

    @Test
    void rejectsInvalidConfiguredFallbackUpstream() {
        GatewayUpstreamResolver resolver = new GatewayUpstreamResolver(
                gatewaySettingsRepository,
                "javascript:alert(1)"
        );
        when(gatewaySettingsRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, resolver::resolveUpstreamBaseUri);
    }

    @Test
    void buildsForwardUrlWithPathAndQuery() {
        URI target = gatewayUpstreamResolver.buildForwardUri(
                URI.create("http://backend-service:8081/"),
                URI.create("http://localhost:8080/api/products?category=books&page=2")
        );

        assertEquals(
                URI.create("http://backend-service:8081/api/products?category=books&page=2"),
                target
        );
    }

    @Test
    void normalizesTrailingSlashFromBaseUrl() {
        URI normalized = gatewayUpstreamResolver.normalizeHttpBaseUri(" http://backend-service:8081/ ");

        assertEquals(URI.create("http://backend-service:8081"), normalized);
    }

    private GatewaySettings settings(String upstreamBaseUrl) {
        GatewaySettings settings = new GatewaySettings();
        settings.setId(1L);
        settings.setUpstreamBaseUrl(upstreamBaseUrl);
        settings.setHealthCheckPath("/health");
        settings.setTimeoutMs(5000);
        settings.setUpdatedAt(LocalDateTime.of(2026, 6, 23, 10, 15));
        settings.setUpdatedBy("system");
        return settings;
    }
}
