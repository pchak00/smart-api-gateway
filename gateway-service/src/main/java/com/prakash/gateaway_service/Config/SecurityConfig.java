package com.prakash.gateaway_service.Config;


import com.prakash.gateaway_service.Filter.JwtAuthenticationFilter;
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

import java.util.List;

@Configuration
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
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
                        .requestMatchers(HttpMethod.POST, "/provisioning/clients").permitAll()

                        .requestMatchers("/admin/clients/*/usage").hasAnyRole("SUPER_ADMIN", "READ_ONLY_ADMIN")
                        .requestMatchers("/admin/clients/*/stats").hasAnyRole("SUPER_ADMIN", "READ_ONLY_ADMIN")
                        .requestMatchers("/admin/clients/*/abuse").hasAnyRole("SUPER_ADMIN", "READ_ONLY_ADMIN")

                        .requestMatchers(HttpMethod.GET, "/admin/dashboard", "/admin/dashboard/**").hasAnyRole("SUPER_ADMIN", "READ_ONLY_ADMIN")
                        .requestMatchers(HttpMethod.GET, "/admin/analytics", "/admin/analytics/**").hasAnyRole("SUPER_ADMIN", "READ_ONLY_ADMIN")
                        .requestMatchers(HttpMethod.GET, "/admin/clients", "/admin/clients/**").hasAnyRole("SUPER_ADMIN", "READ_ONLY_ADMIN")
                        .requestMatchers(HttpMethod.GET, "/admin/plans", "/admin/plans/**").hasAnyRole("SUPER_ADMIN", "READ_ONLY_ADMIN")
                        .requestMatchers(HttpMethod.GET, "/admin/route-limits", "/admin/route-limits/**").hasAnyRole("SUPER_ADMIN", "READ_ONLY_ADMIN")
                        .requestMatchers(HttpMethod.GET, "/admin/abuse-alerts", "/admin/abuse-alerts/**").hasAnyRole("SUPER_ADMIN", "READ_ONLY_ADMIN")
                        .requestMatchers(HttpMethod.GET, "/admin/users", "/admin/users/**").hasAnyRole("SUPER_ADMIN", "READ_ONLY_ADMIN")
                        .requestMatchers(HttpMethod.GET, "/admin/provisioning-tokens", "/admin/provisioning-tokens/**").hasAnyRole("SUPER_ADMIN", "READ_ONLY_ADMIN")
                        .requestMatchers(HttpMethod.GET, "/admin/settings/gateway").hasAnyRole("SUPER_ADMIN", "READ_ONLY_ADMIN")
                        .requestMatchers(HttpMethod.POST, "/admin/settings/gateway/test-connection").hasAnyRole("SUPER_ADMIN", "READ_ONLY_ADMIN")

                        .requestMatchers("/admin/clients/**").hasRole("SUPER_ADMIN")
                        .requestMatchers("/admin/users/**").hasRole("SUPER_ADMIN")
                        .requestMatchers("/admin/provisioning-tokens", "/admin/provisioning-tokens/**").hasRole("SUPER_ADMIN")
                        .requestMatchers("/admin/settings/gateway").hasRole("SUPER_ADMIN")

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
        configuration.setAllowedOrigins(List.of(
                "http://localhost:3000",
                "http://127.0.0.1:3000",
                "http://localhost:5173",
                "http://127.0.0.1:5173"
        ));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-API-Key", "X-Provisioning-Token"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
