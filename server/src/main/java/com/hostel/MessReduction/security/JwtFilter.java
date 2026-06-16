package com.hostel.MessReduction.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(JwtFilter.class);

    private final JwtUtil jwtUtil;
    private final StaffJwtUtil staffJwtUtil;
    private final CustomUserDetailsService customUserDetailsService;
    private final StaffUserDetailsService staffUserDetailsService;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        String servletPath = request.getServletPath();

        return path.startsWith("/api/auth/")
                || servletPath.startsWith("/api/auth/")
                || path.equals("/api/student/reg")
                || servletPath.equals("/api/student/reg")
                || path.startsWith("/api/student/reg")
                || servletPath.startsWith("/api/student/reg")
                || path.startsWith("/api/staff/login")
                || servletPath.startsWith("/api/staff/login");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        try {
            String jwt = parseJwt(request);
            String requestUri = request.getRequestURI();

            logger.debug("Incoming request {} {} | auth header {}",
                    request.getMethod(),
                    requestUri,
                    (jwt != null ? "present" : "missing"));

            if (jwt != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                String username;
                String role;

                try {
                    username = jwtUtil.extractUsername(jwt);
                    role = jwtUtil.extractRole(jwt);
                } catch (Exception e) {
                    logger.warn("JWT parsing failed for {}: {}", requestUri, e.getMessage());
                    filterChain.doFilter(request, response);
                    return;
                }

                logger.debug("Token parsed: username={}, role={}", username, role);

                if (role == null) {
                    logger.warn("JWT missing role claim for request {}", requestUri);
                    filterChain.doFilter(request, response);
                    return;
                }

                UserDetails userDetails;
                boolean isValid;

                if ("STUDENT".equals(role)) {
                    logger.debug("Loading student user details for email: {}", username);
                    userDetails = customUserDetailsService.loadUserByUsername(username);
                    isValid = jwtUtil.validateToken(jwt, userDetails.getUsername());
                } else {
                    logger.debug("Loading staff user details for username: {}", username);
                    userDetails = staffUserDetailsService.loadUserByUsername(username);
                    isValid = staffJwtUtil.validateToken(jwt, userDetails.getUsername());
                }

                logger.debug("User loaded: username={}, authorities={}",
                        userDetails.getUsername(), userDetails.getAuthorities());

                if (isValid) {
                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(
                                    userDetails,
                                    null,
                                    userDetails.getAuthorities()
                            );

                    authentication.setDetails(
                            new WebAuthenticationDetailsSource().buildDetails(request)
                    );

                    SecurityContextHolder.getContext().setAuthentication(authentication);

                    logger.info("Authentication success for {} | role={} | authorities={} | uri={}",
                            userDetails.getUsername(), role, userDetails.getAuthorities(), requestUri);
                } else {
                    logger.warn("Token validation failed for user {} on {}", username, requestUri);
                }
            }

        } catch (Exception e) {
            logger.error("Authentication filter failed for {}: {}", request.getRequestURI(), e.getMessage());
        }

        filterChain.doFilter(request, response);
    }

    private String parseJwt(HttpServletRequest request) {
        String headerAuth = request.getHeader("Authorization");

        if (StringUtils.hasText(headerAuth) && headerAuth.startsWith("Bearer ")) {
            return headerAuth.substring(7);
        }

        return null;
    }
}