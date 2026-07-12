package com.hostel.MessReduction.Service;

import nl.martijndwars.webpush.Encoding;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import org.apache.http.Header;
import org.apache.http.HttpResponse;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;

import java.io.IOException;
import java.security.GeneralSecurityException;

/**
 * Custom PushService implementation that extends the library's PushService.
 * This overrides the send methods to intercept the generated HttpPost requests
 * and strip the trailing '=' padding from the VAPID public key in the Crypto-Key header.
 * 
 * This fixes the FCM HTTP 403 Forbidden error:
 * "permission denied: crypto-key header had invalid format. crypto-key header should have the following format: p256ecdsa=base64(publicApplicationServerKey)"
 */
public class FcmPushService extends PushService {
    private final CloseableHttpClient httpClient = HttpClients.createDefault();

    public FcmPushService(String publicKey, String privateKey, String subject) throws GeneralSecurityException {
        super(publicKey, privateKey, subject);
    }

    @Override
    public HttpResponse send(Notification notification) throws GeneralSecurityException, IOException, org.jose4j.lang.JoseException, java.util.concurrent.ExecutionException, InterruptedException {
        return send(notification, Encoding.AES128GCM);
    }

    @Override
    public HttpResponse send(Notification notification, Encoding encoding) throws GeneralSecurityException, IOException, org.jose4j.lang.JoseException, java.util.concurrent.ExecutionException, InterruptedException {
        HttpPost post = preparePost(notification, encoding);

        // Strip the trailing '=' padding from the Crypto-Key header to comply with strict FCM format validation
        Header[] cryptoKeyHeaders = post.getHeaders("Crypto-Key");
        if (cryptoKeyHeaders != null && cryptoKeyHeaders.length > 0) {
            post.removeHeaders("Crypto-Key");
            for (Header h : cryptoKeyHeaders) {
                String val = h.getValue();
                if (val.endsWith("=")) {
                    val = val.substring(0, val.length() - 1);
                }
                post.addHeader("Crypto-Key", val);
            }
        }

        return httpClient.execute(post);
    }
}
