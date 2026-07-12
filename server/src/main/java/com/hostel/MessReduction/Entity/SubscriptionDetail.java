package com.hostel.MessReduction.Entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SubscriptionDetail {
    private String endpoint;
    private String p256dh;
    private String auth;
}
