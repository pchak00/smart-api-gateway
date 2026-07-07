package com.prakash.gateaway_service.Config;


import com.prakash.gateaway_service.Filter.JwtAuthenticationFilter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final String corsAllowedOrigins;

    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthenticationFilter,
            @Value("${cors.allowed-origins}") String corsAllowedOrigins
    ) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.corsAllowedOrigins = corsAllowedOrigins;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
                .cors(Customizer.withDefaults())
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/api/**").permitAll()
                        .requestMatchers("/auth/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/admin/recovery/owner").permitAll()
                        .requestMatchers(HttpMethod.POST, "/provisioning/clients").permitAll()

                        .requestMatchers("/admin/clients/*/usage").hasAnyRole("OWNER", "SUPER_ADMIN", "READ_ONLY_ADMIN")
                        .requestMatchers("/admin/clients/*/stats").hasAnyRole("OWNER", "SUPER_ADMIN", "READ_ONLY_ADMIN")
                        .requestMatchers("/admin/clients/*/abuse").hasAnyRole("OWNER", "SUPER_ADMIN", "READ_ONLY_ADMIN")

                        .requestMatchers(HttpMethod.GET, "/admin/dashboard", "/admin/dashboard/**").hasAnyRole("OWNER", "SUPER_ADMIN", "READ_ONLY_ADMIN")
                        .requestMatchers(HttpMethod.GET, "/admin/analytics", "/admin/analytics/**").hasAnyRole("OWNER", "SUPER_ADMIN", "READ_ONLY_ADMIN")
                        .requestMatchers(HttpMethod.GET, "/admin/clients", "/admin/clients/**").hasAnyRole("OWNER", "SUPER_ADMIN", "READ_ONLY_ADMIN")
                        .requestMatchers(HttpMethod.GET, "/admin/plans", "/admin/plans/**").hasAnyRole("OWNER", "SUPER_ADMIN", "READ_ONLY_ADMIN")
                        .requestMatchers(HttpMethod.GET, "/admin/route-limits", "/admin/route-limits/**").hasAnyRole("OWNER", "SUPER_ADMIN", "READ_ONLY_ADMIN")
                        .requestMatchers(HttpMethod.GET, "/admin/route-groups", "/admin/route-groups/**").hasAnyRole("OWNER", "SUPER_ADMIN", "READ_ONLY_ADMIN")
                        .requestMatchers(HttpMethod.GET, "/admin/abuse-alerts", "/admin/abuse-alerts/**").hasAnyRole("OWNER", "SUPER_ADMIN", "READ_ONLY_ADMIN")
                        .requestMatchers(HttpMethod.GET, "/admin/users", "/admin/users/**").hasAnyRole("OWNER", "SUPER_ADMIN", "READ_ONLY_ADMIN")
                        .requestMatchers(HttpMethod.GET, "/admin/provisioning-tokens", "/admin/provisioning-tokens/**").hasAnyRole("OWNER", "SUPER_ADMIN", "READ_ONLY_ADMIN")
                        .requestMatchers(HttpMethod.GET, "/admin/settings/gateway").hasAnyRole("OWNER", "SUPER_ADMIN", "READ_ONLY_ADMIN")
                        .requestMatchers(HttpMethod.POST, "/admin/settings/gateway/test-connection").hasAnyRole("OWNER", "SUPER_ADMIN", "READ_ONLY_ADMIN")

                        .requestMatchers("/admin/clients/**").hasAnyRole("OWNER", "SUPER_ADMIN")
                        .requestMatchers("/admin/route-groups", "/admin/route-groups/**").hasAnyRole("OWNER", "SUPER_ADMIN")
                        .requestMatchers("/admin/users/**").hasAnyRole("OWNER", "SUPER_ADMIN")
                        .requestMatchers("/admin/provisioning-tokens", "/admin/provisioning-tokens/**").hasAnyRole("OWNER", "SUPER_ADMIN")
                        .requestMatchers("/admin/settings/gateway").hasAnyRole("OWNER", "SUPER_ADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/admin/abuse-alerts/**").hasAnyRole("OWNER", "SUPER_ADMIN")

                        .requestMatchers("/admin/**").authenticated()
                        .anyRequest().permitAll()
                )
                .httpBasic(httpBasic -> httpBasic.disable())
                .formLogin(formLogin -> formLogin.disable())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        List<String> allowedOrigins = Arrays.stream(corsAllowedOrigins.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isBlank())
                .toList();

        if (allowedOrigins.contains("*")) {
            throw new IllegalStateException("CORS_ALLOWED_ORIGINS must list explicit origins and cannot be '*'");
        }

        configuration.setAllowedOrigins(allowedOrigins);
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-API-Key", "X-Provisioning-Token"));
        configuration.setAllowCredentials(false);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
