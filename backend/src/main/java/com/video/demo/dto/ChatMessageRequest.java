package com.video.demo.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ChatMessageRequest {
    @NotBlank(message = "Room code is required")
    private String roomCode;
    
    @NotBlank(message = "Username is required")
    private String username;
    
    @NotBlank(message = "Message is required")
    private String message;
}
