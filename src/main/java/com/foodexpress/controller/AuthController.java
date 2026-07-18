package com.foodexpress.controller;

import com.foodexpress.model.User;
import com.foodexpress.repository.UserRepository;
import com.foodexpress.security.JwtTokenProvider;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^\\w+([\\.-]?\\w+)*@\\w+([\\.-]?\\w+)*(\\.\\w{2,3})+$");

    public AuthController(UserRepository userRepository,
                          PasswordEncoder passwordEncoder,
                          JwtTokenProvider tokenProvider) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
    }

    @PostMapping("/signup")
    public ResponseEntity<Map<String, Object>> signup(@RequestBody SignupRequest request) {
        Map<String, Object> response = new HashMap<>();

        // 1. Validate inputs
        if (request.getName() == null || request.getName().trim().isEmpty() ||
            request.getEmail() == null || request.getEmail().trim().isEmpty() ||
            request.getPhone() == null || request.getPhone().trim().isEmpty() ||
            request.getPassword() == null || request.getPassword().trim().isEmpty()) {
            response.put("success", false);
            response.put("message", "Please provide all required fields: name, email, phone, password");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }

        // Email validation
        if (!EMAIL_PATTERN.matcher(request.getEmail()).matches()) {
            response.put("success", false);
            response.put("message", "Please enter a valid email address");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }

        // Domain validation: enforce @gmail.com except for dev@example.com
        String emailToCheck = request.getEmail().trim().toLowerCase();
        if (!emailToCheck.equals("dev@example.com") && !emailToCheck.endsWith("@gmail.com")) {
            response.put("success", false);
            response.put("message", "Only Gmail addresses (@gmail.com) are allowed to register.");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }

        // Password length check
        if (request.getPassword().length() < 6) {
            response.put("success", false);
            response.put("message", "Password must be at least 6 characters long");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }

        // 2. Check if user already exists
        if (userRepository.findByEmail(request.getEmail().toLowerCase()).isPresent()) {
            response.put("success", false);
            response.put("message", "User already exists with this email address");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }

        // 3. Create and save user
        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail().toLowerCase());
        user.setPhone(request.getPhone());
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        User savedUser = userRepository.save(user);

        // Generate token and build response
        String token = tokenProvider.generateToken(savedUser.getId());

        Map<String, Object> userData = new HashMap<>();
        userData.put("_id", savedUser.getId());
        userData.put("name", savedUser.getName());
        userData.put("email", savedUser.getEmail());
        userData.put("phone", savedUser.getPhone());
        userData.put("role", savedUser.getRole());
        userData.put("token", token);

        response.put("success", true);
        response.put("message", "User registered successfully");
        response.put("data", userData);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody LoginRequest request) {
        Map<String, Object> response = new HashMap<>();

        // 1. Validate inputs
        if (request.getEmail() == null || request.getEmail().trim().isEmpty() ||
            request.getPassword() == null || request.getPassword().trim().isEmpty()) {
            response.put("success", false);
            response.put("message", "Please provide both email and password");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }

        // 2. Check for user
        User user = userRepository.findByEmail(request.getEmail().toLowerCase()).orElse(null);
        if (user == null) {
            response.put("success", false);
            response.put("message", "Invalid email or password");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }

        // 3. Check password
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            response.put("success", false);
            response.put("message", "Invalid email or password");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }

        // Generate token and build response
        String token = tokenProvider.generateToken(user.getId());

        Map<String, Object> userData = new HashMap<>();
        userData.put("_id", user.getId());
        userData.put("name", user.getName());
        userData.put("email", user.getEmail());
        userData.put("phone", user.getPhone());
        userData.put("role", user.getRole());
        userData.put("token", token);

        response.put("success", true);
        response.put("message", "Logged in successfully");
        response.put("data", userData);

        return ResponseEntity.ok(response);
    }

    // Helper requests DTO classes
    public static class SignupRequest {
        private String name;
        private String email;
        private String phone;
        private String password;

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    public static class LoginRequest {
        private String email;
        private String password;

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }
}
