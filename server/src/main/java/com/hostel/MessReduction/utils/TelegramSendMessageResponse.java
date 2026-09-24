package com.hostel.MessReduction.utils;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public class TelegramSendMessageResponse {

    @JsonProperty("ok")
    private boolean ok;

    @JsonProperty("result")
    private TelegramSentResult result;

    public boolean isOk() {
        return ok;
    }

    public void setOk(boolean ok) {
        this.ok = ok;
    }

    public TelegramSentResult getResult() {
        return result;
    }

    public void setResult(TelegramSentResult result) {
        this.result = result;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class TelegramSentResult {
        @JsonProperty("message_id")
        private Long messageId;

        public Long getMessageId() {
            return messageId;
        }

        public void setMessageId(Long messageId) {
            this.messageId = messageId;
        }
    }
}
