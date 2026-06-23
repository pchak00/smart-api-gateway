package com.prakash.gateaway_service.Service;

import com.prakash.gateaway_service.DTO.GatewaySettingsResponseDto;
import com.prakash.gateaway_service.DTO.UpdateGatewaySettingsRequestDto;
import com.prakash.gateaway_service.Entity.GatewaySettings;
import com.prakash.gateaway_service.Exception.InvalidGatewaySettingsException;
import com.prakash.gateaway_service.Repository.GatewaySettingsRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URISyntaxException;
import java.time.LocalDateTime;

@Service
public class GatewaySettingsService {
    private static final long SETTINGS_ID = 1L;
    private static final int DEFAULT_TIMEOUT_MS = 5000;
    private static final int MAX_TIMEOUT_MS = 60000;
    private static final String DEFAULT_HEALTH_CHECK_PATH = "/health";

    private final GatewaySettingsRepository gatewaySettingsRepository;
    private final String defaultUpstreamBaseUrl;

    public GatewaySettingsService(
            GatewaySettingsRepository gatewaySettingsRepository,
            @Value("${backend.service.url}") String defaultUpstreamBaseUrl
    ) {
        this.gatewaySettingsRepository = gatewaySettingsRepository;
        this.defaultUpstreamBaseUrl = defaultUpstreamBaseUrl;
    }

    @Transactional
    public GatewaySettingsResponseDto getGatewaySettings() {
        return GatewaySettingsResponseDto.from(getOrCreateSettings());
    }

    @Transactional
    public GatewaySettingsResponseDto updateGatewaySettings(UpdateGatewaySettingsRequestDto request) {
        UpdateGatewaySettingsRequestDto validatedRequest = validateGatewaySettings(request);
        GatewaySettings settings = getOrCreateSettings();
        settings.setUpstreamBaseUrl(validatedRequest.upstreamBaseUrl());
        settings.setHealthCheckPath(validatedRequest.healthCheckPath());
        settings.setTimeoutMs(validatedRequest.timeoutMs());
        settings.setUpdatedAt(LocalDateTime.now());
        settings.setUpdatedBy(resolveCurrentUsername());

        GatewaySettings savedSettings = gatewaySettingsRepository.save(settings);

        return GatewaySettingsResponseDto.from(savedSettings);
    }

    public UpdateGatewaySettingsRequestDto validateGatewaySettings(UpdateGatewaySettingsRequestDto request) {
        if (request == null) {
            throw new InvalidGatewaySettingsException("Request body is required");
        }

        return new UpdateGatewaySettingsRequestDto(
                validateUpstreamBaseUrl(request.upstreamBaseUrl()),
                validateHealthCheckPath(request.healthCheckPath()),
                validateTimeoutMs(request.timeoutMs())
        );
    }

    private GatewaySettings getOrCreateSettings() {
        return gatewaySettingsRepository.findById(SETTINGS_ID)
                .orElseGet(() -> {
                    GatewaySettings settings = new GatewaySettings();
                    settings.setId(SETTINGS_ID);
                    settings.setUpstreamBaseUrl(defaultUpstreamBaseUrl);
                    settings.setHealthCheckPath(DEFAULT_HEALTH_CHECK_PATH);
                    settings.setTimeoutMs(DEFAULT_TIMEOUT_MS);
                    settings.setUpdatedAt(LocalDateTime.now());
                    settings.setUpdatedBy("system");
                    return gatewaySettingsRepository.save(settings);
                });
    }

    private String validateUpstreamBaseUrl(String upstreamBaseUrl) {
        if (upstreamBaseUrl == null || upstreamBaseUrl.isBlank()) {
            throw new InvalidGatewaySettingsException("Upstream base URL is required");
        }

        String normalized = upstreamBaseUrl.trim();
        try {
            URI uri = new URI(normalized);
            String scheme = uri.getScheme();
            if (!"http".equalsIgnoreCase(scheme) && !"https".equalsIgnoreCase(scheme)) {
                throw new InvalidGatewaySettingsException("Upstream base URL must use http or https");
            }
            if (uri.getHost() == null || uri.getHost().isBlank()) {
                throw new InvalidGatewaySettingsException("Upstream base URL must include a host");
            }
            return normalized;
        } catch (URISyntaxException e) {
            throw new InvalidGatewaySettingsException("Upstream base URL must be a valid URL");
        }
    }

    private String validateHealthCheckPath(String healthCheckPath) {
        if (healthCheckPath == null || healthCheckPath.isBlank()) {
            throw new InvalidGatewaySettingsException("Health check path is required");
        }

        String normalized = healthCheckPath.trim();
        if (!normalized.startsWith("/")) {
            throw new InvalidGatewaySettingsException("Health check path must start with /");
        }
        return normalized;
    }

    private Integer validateTimeoutMs(Integer timeoutMs) {
        if (timeoutMs == null || timeoutMs <= 0) {
            throw new InvalidGatewaySettingsException("Timeout must be greater than zero");
        }
        if (timeoutMs > MAX_TIMEOUT_MS) {
            throw new InvalidGatewaySettingsException("Timeout must be " + MAX_TIMEOUT_MS + " ms or fewer");
        }
        return timeoutMs;
    }

    private String resolveCurrentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            return null;
        }
        return authentication.getName();
    }
}
