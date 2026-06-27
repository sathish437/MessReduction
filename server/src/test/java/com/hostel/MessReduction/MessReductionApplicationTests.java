package com.hostel.MessReduction;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;

@SpringBootTest
class MessReductionApplicationTests {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Test
    void testStaffAuthentication() {
        UsernamePasswordAuthenticationToken token = 
            new UsernamePasswordAuthenticationToken("warden", "warden123");
        Authentication auth = authenticationManager.authenticate(token);
        org.junit.jupiter.api.Assertions.assertNotNull(auth);
    }
}

