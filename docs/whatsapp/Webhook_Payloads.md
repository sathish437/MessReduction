# Sample Webhook Payloads

## 1. Delivery Status (Sent / Delivered / Read)
When Meta successfully delivers a message or a user reads it, Meta sends this webhook payload to your POST endpoint:

```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "1234567890",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "15550000000",
              "phone_number_id": "1234567890"
            },
            "statuses": [
              {
                "id": "wamid.HBgLMTU1...",
                "status": "delivered",
                "timestamp": "1678901234",
                "recipient_id": "15551112222"
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}
```

## 2. Incoming Text Message
If a student replies to the notification:

```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "1234567890",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "15550000000",
              "phone_number_id": "1234567890"
            },
            "contacts": [
              {
                "profile": {
                  "name": "John Doe"
                },
                "wa_id": "15551112222"
              }
            ],
            "messages": [
              {
                "from": "15551112222",
                "id": "wamid.HBgLMTU1...",
                "timestamp": "1678901234",
                "text": {
                  "body": "Thank you for the update."
                },
                "type": "text"
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}
```
