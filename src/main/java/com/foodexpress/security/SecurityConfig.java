package com.foodexpress.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // Disable CSRF (Stateless REST API)
            .csrf(csrf -> csrf.disable())
            
            // Allow iframe rendering for H2 console
            .headers(headers -> headers.frameOptions(frameOptions -> frameOptions.disable()))
            
            // Session management stateless
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            
            // Authorize HTTP requests
            .authorizeHttpRequests(auth -> auth
                // Public REST endpoints
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/foods/**").permitAll()
                
                // Protected REST endpoints
                .requestMatchers(HttpMethod.POST, "/api/foods/add").authenticated()
                .requestMatchers("/api/orders/**").authenticated()
                
                // Allow public access to static UI files & images
                .requestMatchers("/", "/index.html", "/menu.html", "/login.html", "/signup.html", "/cart.html", "/checkout.html", "/orders.html").permitAll()
                .requestMatchers("/script.js", "/style.css", "/images/**").permitAll()

                
                // H2 database console
                .requestMatchers("/h2-console/**").permitAll()
                
                // All other requests require authentication
                .anyRequest().authenticated()
            );

        // Add custom JWT security filter
        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
