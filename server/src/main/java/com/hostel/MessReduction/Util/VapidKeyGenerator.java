package com.hostel.MessReduction.Util;

import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.bouncycastle.jce.interfaces.ECPrivateKey;
import org.bouncycastle.jce.interfaces.ECPublicKey;
import org.bouncycastle.jce.spec.ECNamedCurveParameterSpec;
import org.bouncycastle.jce.ECNamedCurveTable;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.Security;
import java.util.Base64;

/**
 * Utility class to generate VAPID public and private keys for web push notifications.
 * To run this class, execute it as a Java application.
 */
public class VapidKeyGenerator {
    public static void main(String[] args) {
        // Register BouncyCastle Provider for cryptography support if not already registered
        if (Security.getProvider("BC") == null) {
            Security.addProvider(new BouncyCastleProvider());
        }

        try {
            System.out.println("Generating VAPID Key Pair using BouncyCastle...");
            ECNamedCurveParameterSpec parameterSpec = ECNamedCurveTable.getParameterSpec("prime256v1");
            
            KeyPairGenerator keyPairGenerator = KeyPairGenerator.getInstance("ECDH", "BC");
            keyPairGenerator.initialize(parameterSpec);
            KeyPair keyPair = keyPairGenerator.generateKeyPair();
            
            // Extract and save keys using nl.martijndwars.webpush.Utils
            byte[] publicKeyBytes = nl.martijndwars.webpush.Utils.encode((ECPublicKey) keyPair.getPublic());
            byte[] privateKeyBytes = nl.martijndwars.webpush.Utils.encode((ECPrivateKey) keyPair.getPrivate());

            // Encode to URL Safe Base64 without padding
            String publicKeyBase64 = Base64.getUrlEncoder().withoutPadding().encodeToString(publicKeyBytes);
            String privateKeyBase64 = Base64.getUrlEncoder().withoutPadding().encodeToString(privateKeyBytes);

            System.out.println("\n--- VAPID KEYS GENERATED SUCCESSFULLY ---");
            System.out.println("webpush.public-key=" + publicKeyBase64);
            System.out.println("webpush.private-key=" + privateKeyBase64);
            System.out.println("-----------------------------------------\n");
            System.out.println("Add these keys to your application.properties or .env file.");
        } catch (Exception e) {
            System.err.println("Error generating VAPID keys: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
