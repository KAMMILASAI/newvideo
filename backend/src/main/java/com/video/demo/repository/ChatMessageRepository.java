package com.video.demo.repository;

import com.video.demo.model.ChatMessage;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ChatMessageRepository extends MongoRepository<ChatMessage, String> {
    List<ChatMessage> findByRoomCodeOrderByTimestampAsc(String roomCode);
    void deleteByRoomCode(String roomCode);
}
