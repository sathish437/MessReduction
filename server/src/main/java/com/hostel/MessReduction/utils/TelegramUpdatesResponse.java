package com.hostel.MessReduction.utils;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class TelegramUpdatesResponse {

    @JsonProperty("ok")
    private boolean ok;

    @JsonProperty("result")
    private List<TelegramUpdate> result;

    public boolean isOk() {
        return ok;
    }

    public void setOk(boolean ok) {
        this.ok = ok;
    }

    public List<TelegramUpdate> getResult() {
        return result;
    }

    public void setResult(List<TelegramUpdate> result) {
        this.result = result;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class TelegramUpdate {
        @JsonProperty("update_id")
        private Long updateId;

        @JsonProperty("message")
        private TelegramMessage message;

        public Long getUpdateId() {
            return updateId;
        }

        public void setUpdateId(Long updateId) {
            this.updateId = updateId;
        }

        public TelegramMessage getMessage() {
            return message;
        }

        public void setMessage(TelegramMessage message) {
            this.message = message;
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class TelegramMessage {
        @JsonProperty("message_id")
        private Long messageId;

        @JsonProperty("text")
        private String text;

        @JsonProperty("chat")
        private TelegramChat chat;

        public Long getMessageId() {
            return messageId;
        }

        public void setMessageId(Long messageId) {
            this.messageId = messageId;
        }

        public String getText() {
            return text;
        }

        public void setText(String text) {
            this.text = text;
        }

        public TelegramChat getChat() {
            return chat;
        }

        public void setChat(TelegramChat chat) {
            this.chat = chat;
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class TelegramChat {
        @JsonProperty("id")
        private Long id;

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }
    }
}
