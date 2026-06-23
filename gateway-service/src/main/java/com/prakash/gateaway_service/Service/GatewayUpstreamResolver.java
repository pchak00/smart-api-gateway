package com.prakash.gateaway_service.Service;

import com.prakash.gateaway_service.Entity.GatewaySettings;
import com.prakash.gateaway_service.Repository.GatewaySettingsRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicBoolean;

@Service
public class GatewayUpstreamResolver {
    private static final Logger log = LoggerFactory.getLogger(GatewayUpstreamResolver.class);
    private static final long SETTINGS_ID = 1L;

    private final GatewaySettingsRepository gatewaySettingsRepository;
    private final String defaultUpstreamBaseUrl;
    private final AtomicBoolean missingSettingsWarningLogged = new AtomicBoolean(false);
    private final AtomicBoolean invalidSettingsWarningLogged = new AtomicBoolean(false);
    private final AtomicBoolean unavailableSettingsWarningLogged = new AtomicBoolean(false);

    public GatewayUpstreamResolver(
            GatewaySettingsRepository gatewaySettingsRepository,
            @Value("${backend.service.url}") String defaultUpstreamBaseUrl
    ) {
        this.gatewaySettingsRepository = gatewaySettingsRepository;
        this.defaultUpstreamBaseUrl = defaultUpstreamBaseUrl;
    }

    public URI resolveUpstreamBaseUri() {
        try {
            Optional<GatewaySettings> settings = gatewaySettingsRepository.findById(SETTINGS_ID);
            if (settings.isPresent()) {
                return normalizeHttpBaseUri(settings.get().getUpstreamBaseUrl());
            }
            logFallbackOnce(
                    missingSettingsWarningLogged,
                    "Gateway settings row is missing; falling back to configured upstream URL"
            );
        } catch (IllegalArgumentException e) {
            logFallbackOnce(
                    invalidSettingsWarningLogged,
                    "Gateway settings upstream URL is invalid; falling back to configured upstream URL"
            );
        } catch (RuntimeException e) {
            logFallbackOnce(
                    unavailableSettingsWarningLogged,
                    "Gateway settings could not be read; falling back to configured upstream URL"
            );
        }

        return normalizeHttpBaseUri(defaultUpstreamBaseUrl);
    }

    public URI buildForwardUri(URI upstreamBaseUri, URI requestUri) {
        return UriComponentsBuilder.fromUri(requestUri)
                .scheme(upstreamBaseUri.getScheme())
                .host(upstreamBaseUri.getHost())
                .port(upstreamBaseUri.getPort())
                .build(true)
                .toUri();
    }

    URI normalizeHttpBaseUri(String upstreamBaseUrl) {
        if (upstreamBaseUrl == null || upstreamBaseUrl.isBlank()) {
            throw new IllegalArgumentException("Upstream base URL is required");
        }

        try {
            URI uri = new URI(upstreamBaseUrl.trim());
            String scheme = uri.getScheme();
            if (!"http".equalsIgnoreCase(scheme) && !"https".equalsIgnoreCase(scheme)) {
                throw new IllegalArgumentException("Upstream base URL must use http or https");
            }
            if (uri.getHost() == null || uri.getHost().isBlank()) {
                throw new IllegalArgumentException("Upstream base URL must include a host");
            }

            String normalizedPath = normalizePath(uri.getPath());
            return new URI(
                    scheme.toLowerCase(),
                    uri.getUserInfo(),
                    uri.getHost(),
                    uri.getPort(),
                    normalizedPath,
                    null,
                    null
            );
        } catch (URISyntaxException e) {
            throw new IllegalArgumentException("Upstream base URL must be a valid URL", e);
        }
    }

    private String normalizePath(String path) {
        if (path == null || path.isBlank() || "/".equals(path)) {
            return null;
        }

        String normalized = path;
        while (normalized.length() > 1 && normalized.endsWith("/")) {
            normalized = normalized.substring(0, normalized.length() - 1);
        }
        return normalized;
    }

    private void logFallbackOnce(AtomicBoolean warningFlag, String message) {
        if (warningFlag.compareAndSet(false, true)) {
            log.warn(message);
        }
    }
}
