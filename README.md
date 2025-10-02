# Real-Time Video Call Application

A Zoom-like video calling application built with Spring Boot, React+Vite, WebRTC, and MongoDB.

## Features

- ✅ Real-time video and audio calling
- ✅ Room-based system with code and password
- ✅ Multiple participants support
- ✅ WebRTC peer-to-peer connections
- ✅ Mute/unmute audio
- ✅ Turn video on/off
- ✅ Responsive UI with modern design
- ✅ No authentication required

## Tech Stack

### Backend
- **Spring Boot 3.5.6** - REST API and WebSocket server
- **MongoDB** - Database for room management
- **WebSocket** - Real-time signaling
- **Maven** - Dependency management

### Frontend
- **React 19** - UI library
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **WebRTC** - Video/audio communication
- **CSS** - Styling

## Prerequisites

Before running the application, ensure you have:

- Java 21 or higher
- Node.js 18 or higher
- MongoDB (running on localhost:27017)
- Maven
- Modern web browser with WebRTC support

## Setup Instructions

### 1. Start MongoDB

Make sure MongoDB is running on `localhost:27017`. 

**Windows:**
```bash
mongod
```

**Mac/Linux:**
```bash
sudo systemctl start mongod
```

Or use MongoDB Compass or Docker:
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 2. Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Build and run the Spring Boot application:

```bash
./mvnw spring-boot:run
```

Or on Windows:
```bash
mvnw.cmd spring-boot:run
```

The backend server will start on **http://localhost:8080**

### 3. Frontend Setup

Navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The frontend will start on **http://localhost:5173**

## Usage

1. **Open your browser** and navigate to `http://localhost:5173`

2. **Create a Room:**
   - Click "Create Room" tab
   - Enter a room name (optional)
   - Enter a room code (optional - auto-generated if empty)
   - Set a password
   - Enter your name
   - Click "Create Room"

3. **Join a Room:**
   - Click "Join Room" tab
   - Enter the room code
   - Enter the password
   - Enter your name
   - Click "Join Room"

4. **In the Video Call:**
   - Your video appears with a blue border
   - Other participants' videos appear in the grid
   - Use the control buttons to:
     - 🔊 Mute/Unmute microphone
     - 📹 Turn video on/off
     - 📞 Leave call

## API Endpoints

### REST APIs

- **POST** `/api/rooms/create` - Create a new room
  ```json
  {
    "roomCode": "ABC123",
    "password": "secret",
    "roomName": "My Meeting"
  }
  ```

- **POST** `/api/rooms/join` - Join an existing room
  ```json
  {
    "roomCode": "ABC123",
    "password": "secret",
    "username": "John"
  }
  ```

- **POST** `/api/rooms/leave` - Leave a room
  ```json
  {
    "roomCode": "ABC123",
    "username": "John"
  }
  ```

### WebSocket

- **WebSocket Endpoint:** `ws://localhost:8080/ws/signaling`

**Message Types:**
- `join` - Join a room
- `offer` - WebRTC offer
- `answer` - WebRTC answer
- `ice-candidate` - ICE candidate exchange
- `leave` - Leave a room

## Project Structure

```
Video/
├── backend/
│   └── src/main/java/com/video/demo/
│       ├── config/          # Configuration classes
│       ├── controller/      # REST controllers
│       ├── dto/            # Data transfer objects
│       ├── handler/        # WebSocket handlers
│       ├── model/          # MongoDB models
│       ├── repository/     # MongoDB repositories
│       └── service/        # Business logic
│
└── frontend/
    └── src/
        ├── components/     # React components
        ├── styles/        # CSS files
        ├── App.jsx        # Main app component
        └── main.jsx       # Entry point
```

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running on port 27017
- Check `application.properties` for correct MongoDB configuration

### WebSocket Connection Failed
- Check if backend is running on port 8080
- Verify CORS settings allow localhost:5173

### Camera/Microphone Permission Denied

**Windows System Settings:**
1. Open **Settings** → **Privacy & Security** → **Camera**
2. Enable "**Let apps access your camera**"
3. Enable "**Let desktop apps access your camera**"
4. Repeat for **Microphone** settings

**Browser Settings (Chrome/Edge):**
1. Click the **lock/camera icon** in address bar (next to URL)
2. Allow **Camera** and **Microphone** for `http://localhost:5173`
3. Refresh the page

**Alternative:** The app will automatically join without camera/mic if permissions are denied. You can still see other participants.

**Other Issues:**
- Check if camera/mic is being used by another application
- Try closing other video apps (Teams, Zoom, Skype)
- Use HTTPS in production (WebRTC requirement)

### No Video/Audio from Other Participants
- Check browser console for WebRTC errors
- Ensure both users have stable internet connection
- Verify firewall is not blocking WebRTC connections

## Production Deployment

### Backend
1. Update `application.properties` with production MongoDB URL
2. Configure proper CORS origins
3. Build: `./mvnw clean package`
4. Run: `java -jar target/demo-0.0.1-SNAPSHOT.jar`

### Frontend
1. Update API URLs in components
2. Build: `npm run build`
3. Deploy `dist/` folder to your hosting service

### Important for Production
- Use HTTPS (required for WebRTC)
- Configure TURN servers for NAT traversal
- Set up proper authentication
- Add rate limiting and security measures

## WebRTC Configuration

The application uses public STUN servers:
- `stun:stun.l.google.com:19302`
- `stun:stun1.l.google.com:19302`

For production, consider adding TURN servers for better connectivity behind restrictive firewalls.

## License

This project is open source and available for educational purposes.

## Support

For issues or questions, please check:
- Browser console for frontend errors
- Backend logs for server errors
- MongoDB logs for database issues

---

**Enjoy your video calls! 🎥**
