package com.hostel.MessReduction;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class MessReductionApplication {

	
	public static void main(String[] args) {
		SpringApplication.run(MessReductionApplication.class, args);
	}
}
