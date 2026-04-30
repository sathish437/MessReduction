package com.hostel.MessReduction.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
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

    private final JwtUtil jwtUtil;
    private final StaffJwtUtil staffJwtUtil;
    private final CustomUserDetailsService customUserDetailsService;
    private final StaffUserDetailsService staffUserDetailsService;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.startsWith("/api/auth/") || 
               path.equals("/api/student/reg") ||
               path.startsWith("/api/staff/login");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        try {
            String jwt = parseJwt(request);
            
            if (jwt != null) {
                String username;
                String role;
                boolean isStaffToken = false;
                
                // Try to extract using StaffJwtUtil first (for staff tokens)
                try {
                    username = staffJwtUtil.extractUsername(jwt);
                    role = staffJwtUtil.extractRole(jwt).name();
                    isStaffToken = true;
                } catch (Exception e) {
                    // If staffJwtUtil fails, try JwtUtil (for student tokens)
                    username = jwtUtil.extractUsername(jwt);
                    role = jwtUtil.extractRole(jwt);
                    isStaffToken = false;
                }
                
                if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                    UserDetails userDetails;
                    
                    // Based on role, use appropriate UserDetailsService
                    if ("STUDENT".equals(role)) {
                        userDetails = customUserDetailsService.loadUserByUsername(username);
                    } else {
                        // Staff roles: WARDEN, DEPUTY_WARDEN, OFFICE
                        userDetails = staffUserDetailsService.loadUserByUsername(username);
                    }
                    
                    // Validate token using appropriate util
                    boolean isValid;
                    if (isStaffToken) {
                        isValid = staffJwtUtil.validateToken(jwt, userDetails.getUsername());
                    } else {
                        isValid = jwtUtil.validateToken(jwt, userDetails.getUsername());
                    }
                    
                    if (isValid) {
                        UsernamePasswordAuthenticationToken authentication =
                                new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                        SecurityContextHolder.getContext().setAuthentication(authentication);
                    }
                }
            }
        } catch (Exception e) {
            logger.error("Cannot set user authentication: " + e.getMessage());
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
