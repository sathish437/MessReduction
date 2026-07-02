# Meta WhatsApp Cloud API Setup Guide

## 1. Create a Meta Developer App
1. Go to [Meta for Developers](https://developers.facebook.com/).
2. Click **My Apps** > **Create App**.
3. Select **Other** as the use case, then choose **Business**.
4. Name your app (e.g., "Mess Reduction Notifications").

## 2. Add WhatsApp Product
1. Once the app is created, scroll down to **Add products to your app** and click **Set up** on **WhatsApp**.
2. Select or create a Meta Business Account.

## 3. Configure API Credentials
1. Navigate to **WhatsApp** > **API Setup** in the left menu.
2. Note down the **Temporary access token** (or generate a permanent System User token in Business Settings).
3. Note down the **Phone number ID**.
4. In your `server/src/main/resources/application.properties`, configure these values:
   ```properties
   whatsapp.meta.token=YOUR_ACCESS_TOKEN
   whatsapp.meta.phone-number-id=YOUR_PHONE_NUMBER_ID
   whatsapp.meta.verify-token=messreduction_verify_token_2026
   whatsapp.meta.to-number=TEST_PHONE_NUMBER_WITH_COUNTRY_CODE
   ```

## 4. Setup Webhooks
1. Navigate to **WhatsApp** > **Configuration**.
2. Click **Edit** under Webhook.
3. Provide your server's Callback URL (e.g., `https://your-domain.com/api/webhooks/whatsapp`).
4. Enter the Verify Token (`messreduction_verify_token_2026`).
5. Click **Verify and Save**.
6. After verifying, click **Manage** under Webhook fields and subscribe to:
   - `messages` (to receive delivery statuses and incoming messages).

## 5. Message Templates
The application uses the `jaspers_market_order_confirmation_v1` default template for testing. For production, you must create your own templates in the **WhatsApp Manager** > **Account Tools** > **Message Templates**.
Make sure your custom templates match the parameter counts defined in `WhatsAppTemplates.java`.
