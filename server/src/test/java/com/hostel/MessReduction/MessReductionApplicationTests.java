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
        try {
            System.out.println("TESTING STAFF AUTHENTICATION");
            UsernamePasswordAuthenticationToken token = 
                new UsernamePasswordAuthenticationToken("warden", "warden123");
            Authentication auth = authenticationManager.authenticate(token);
            System.out.println("Auth success! Principal: " + auth.getPrincipal());
        } catch (Exception e) {
            System.out.println("Auth failed! Exception: ");
            e.printStackTrace();
        }
    }
}

