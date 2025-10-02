package com.video.demo.config;

import com.video.demo.handler.SignalingHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketConfigurer {
    
    private final SignalingHandler signalingHandler;
    
    @Value("${spring.websocket.allowed-origins:http://localhost:5173}")
    private String allowedOrigins;
    
    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(signalingHandler, "/ws/signaling")
                .setAllowedOrigins(allowedOrigins.split(","));
    }
}
