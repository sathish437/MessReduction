package com.hostel.MessReduction.Config;

import com.hostel.MessReduction.Entity.Gender;

import java.util.Map;

public class DeputyWardenAssignment {
    private static final Map<Gender, Map<Integer, String>> ASSIGNMENT = Map.of(
            Gender.MALE, Map.of(
                    1, "deputyWarden1",
                    2, "deputyWarden2",
                    3, "deputyWarden3",
                    4, "deputyWarden4"
            ),
            Gender.FEMALE, Map.of(
                    1, "deputyWarden5",
                    2, "deputyWarden6",
                    3, "deputyWarden7",
                    4, "deputyWarden8"
            )
    );

    public static String getAssignedDeputyWarden(Gender gender, Integer year) {
        if (gender == null || year == null) {
            throw new IllegalArgumentException("Gender and year are required to resolve the deputy warden");
        }
        return ASSIGNMENT.getOrDefault(gender, Map.of()).get(year);
    }
}
