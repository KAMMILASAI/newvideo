package com.video.demo.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "chat_messages")
public class ChatMessage {
    @Id
    private String id;
    private String roomCode;
    private String username;
    private String message;
    private LocalDateTime timestamp;
    
    public ChatMessage(String roomCode, String username, String message) {
        this.roomCode = roomCode;
        this.username = username;
        this.message = message;
        this.timestamp = LocalDateTime.now();
    }
}
