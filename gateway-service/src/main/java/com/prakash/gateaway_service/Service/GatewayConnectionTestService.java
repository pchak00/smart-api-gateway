package com.prakash.gateaway_service.Service;

import com.prakash.gateaway_service.DTO.GatewaySettingsResponseDto;
import com.prakash.gateaway_service.DTO.TestGatewayConnectionRequestDto;
import com.prakash.gateaway_service.DTO.TestGatewayConnectionResponseDto;
import com.prakash.gateaway_service.DTO.UpdateGatewaySettingsRequestDto;
import com.prakash.gateaway_service.Exception.InvalidGatewaySettingsException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.net.ssl.SSLException;
import java.io.IOException;
import java.net.ConnectException;
import java.net.URI;
import java.net.UnknownHostException;
import java.net.http.HttpClient;
import java.net.http.HttpConnectTimeoutException;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.http.HttpTimeoutException;
import java.time.Duration;

@Service
public class GatewayConnectionTestService {

    private final GatewaySettingsService gatewaySettingsService;
    private final GatewayUpstreamResolver gatewayUpstreamResolver;
    private final HttpClient httpClient;

    @Autowired
    public GatewayConnectionTestService(
            GatewaySettingsService gatewaySettingsService,
            GatewayUpstreamResolver gatewayUpstreamResolver
    ) {
        this(gatewaySettingsService, gatewayUpstreamResolver, HttpClient.newBuilder()
                .followRedirects(HttpClient.Redirect.NEVER)
                .build());
    }

    GatewayConnectionTestService(
            GatewaySettingsService gatewaySettingsService,
            GatewayUpstreamResolver gatewayUpstreamResolver,
            HttpClient httpClient
    ) {
        this.gatewaySettingsService = gatewaySettingsService;
        this.gatewayUpstreamResolver = gatewayUpstreamResolver;
        this.httpClient = httpClient;
    }

    public TestGatewayConnectionResponseDto testConnection(TestGatewayConnectionRequestDto request) {
        UpdateGatewaySettingsRequestDto settings = resolveSettings(request);
        URI checkedUri = buildCheckedUri(settings);
        HttpRequest healthRequest = HttpRequest.newBuilder(checkedUri)
                .timeout(Duration.ofMillis(settings.timeoutMs()))
                .GET()
                .build();

        long start = System.nanoTime();
        try {
            HttpResponse<Void> response = httpClient.send(healthRequest, HttpResponse.BodyHandlers.discarding());
            long responseTimeMs = elapsedMs(start);
            int statusCode = response.statusCode();
            boolean reachable = statusCode >= 200 && statusCode < 300;
            return new TestGatewayConnectionResponseDto(
                    reachable,
                    statusCode,
                    checkedUri.toString(),
                    responseTimeMs,
                    reachable ? "Upstream is reachable" : "Upstream responded with status " + statusCode
            );
        } catch (HttpConnectTimeoutException e) {
            return failure(checkedUri, elapsedMs(start), "Connection timed out");
        } catch (HttpTimeoutException e) {
            return failure(checkedUri, elapsedMs(start), "Connection timed out");
        } catch (UnknownHostException e) {
            return failure(checkedUri, elapsedMs(start), "Host could not be resolved");
        } catch (ConnectException e) {
            return failure(checkedUri, elapsedMs(start), "Connection refused");
        } catch (SSLException e) {
            return failure(checkedUri, elapsedMs(start), "TLS connection failed");
        } catch (IOException e) {
            return failure(checkedUri, elapsedMs(start), "Connection failed");
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return failure(checkedUri, elapsedMs(start), "Connection test interrupted");
        }
    }

    private UpdateGatewaySettingsRequestDto resolveSettings(TestGatewayConnectionRequestDto request) {
        if (request == null) {
            GatewaySettingsResponseDto savedSettings = gatewaySettingsService.getGatewaySettings();
            return gatewaySettingsService.validateGatewaySettings(new UpdateGatewaySettingsRequestDto(
                    savedSettings.upstreamBaseUrl(),
                    savedSettings.healthCheckPath(),
                    savedSettings.timeoutMs()
            ));
        }

        return gatewaySettingsService.validateGatewaySettings(new UpdateGatewaySettingsRequestDto(
                request.upstreamBaseUrl(),
                request.healthCheckPath(),
                request.timeoutMs()
        ));
    }

    private URI buildCheckedUri(UpdateGatewaySettingsRequestDto settings) {
        try {
            URI upstreamBaseUri = gatewayUpstreamResolver.normalizeHttpBaseUri(settings.upstreamBaseUrl());
            return gatewayUpstreamResolver.buildHealthCheckUri(upstreamBaseUri, settings.healthCheckPath());
        } catch (IllegalArgumentException e) {
            throw new InvalidGatewaySettingsException(e.getMessage());
        }
    }

    private TestGatewayConnectionResponseDto failure(URI checkedUri, long responseTimeMs, String message) {
        return new TestGatewayConnectionResponseDto(
                false,
                null,
                checkedUri.toString(),
                responseTimeMs,
                message
        );
    }

    private long elapsedMs(long start) {
        return Duration.ofNanos(System.nanoTime() - start).toMillis();
    }
}
