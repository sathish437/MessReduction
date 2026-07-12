package com.hostel.MessReduction.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.config.annotation.web.configuration.WebSecurityCustomizer;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthEntryPoint jwtAuthEntryPoint;
    private final JwtFilter jwtFilter;
    private final CorsConfigurationSource corsConfigurationSource;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                .csrf(AbstractHttpConfigurer::disable)
                .exceptionHandling(exception -> exception
                        .authenticationEntryPoint(jwtAuthEntryPoint))
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/api/test/**").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/student/reg").permitAll()
                        .requestMatchers("/api/staff/login").permitAll()
                        .requestMatchers("/v3/api-docs/**").permitAll()
                        .requestMatchers("/swagger-ui/**").permitAll()
                        .requestMatchers("/swagger-ui.html").permitAll()
                        .requestMatchers("/api/hostelStaff/staff/auto-accept").hasAnyRole("Warden", "DeputyWarden")
                        .requestMatchers("/api/hostelStaff/staff/warden", "/api/hostelStaff/staff/warden/**").hasRole("Warden")
                        .requestMatchers("/api/hostelStaff/staff/deputyWarden", "/api/hostelStaff/staff/deputyWarden/**").hasRole("DeputyWarden")
                        .requestMatchers("/api/hostelStaff/staff/office", "/api/hostelStaff/staff/office/**").hasRole("Office")
                        .requestMatchers("/api/hostelStaff/staff/dashboard-count/warden").hasRole("Warden")
                        .requestMatchers("/api/hostelStaff/staff/dashboard-count").hasAnyRole("Warden", "DeputyWarden", "Office")
                        .requestMatchers("/api/hostelStaff/staff/deputyWarden/year-count").hasRole("DeputyWarden")
                        .requestMatchers("/api/hostelStaff/staff/office/year-count").hasRole("Office")
                        .requestMatchers("/api/hostelStaff/staff/forms/delete-all").hasRole("Office")
                        .requestMatchers("/api/logs/**").hasAnyRole("Warden", "DeputyWarden", "Office")
                        .requestMatchers("/api/student-form/**").hasRole("STUDENT")
                        .requestMatchers("/api/push/**").hasAnyRole("STUDENT", "Warden", "DeputyWarden", "Office")
                        .requestMatchers("/api/**").authenticated()
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public AuthenticationManager authenticationManager(
            StaffUserDetailsService staffUserDetailsService,
            PasswordEncoder passwordEncoder) {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider(staffUserDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder);
        return new ProviderManager(authProvider);
    }



    @Bean
    public PasswordEncoder passwordEncoder() {
        return PasswordEncoderFactories.createDelegatingPasswordEncoder();
    }
    
}
