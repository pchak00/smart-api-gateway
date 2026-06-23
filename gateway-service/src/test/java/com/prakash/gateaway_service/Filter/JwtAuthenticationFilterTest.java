package com.prakash.gateaway_service.Filter;

import com.prakash.gateaway_service.Repository.AdminUserRepository;
import com.prakash.gateaway_service.Service.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.Test;

import java.io.PrintWriter;
import java.io.StringWriter;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class JwtAuthenticationFilterTest {

    @Test
    void refreshTokenCannotBeUsedAsBearerToken() throws Exception {
        JwtAuthenticationFilter filter = new JwtAuthenticationFilter(
                new JwtService("myverysecuresecretkeymyverysecuresecretkey", 60_000),
                mock(AdminUserRepository.class)
        );
        HttpServletRequest request = mock(HttpServletRequest.class);
        HttpServletResponse response = mock(HttpServletResponse.class);
        FilterChain filterChain = mock(FilterChain.class);
        StringWriter responseBody = new StringWriter();

        when(request.getHeader("Authorization")).thenReturn("Bearer admref_not-a-jwt");
        when(response.getWriter()).thenReturn(new PrintWriter(responseBody));

        filter.doFilterInternal(request, response, filterChain);

        verify(response).setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        verify(filterChain, never()).doFilter(request, response);
        assertEquals("Invalid or expired token", responseBody.toString());
    }
}
