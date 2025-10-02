# Video Call App Deployment Guide

## 🚀 Deployment Overview

This video call application is ready for production deployment with proper WebRTC, WebSocket, and CORS configuration.

## 📁 Project Structure

```
Video/
├── frontend/          # React + Vite frontend
├── backend/           # Spring Boot backend
└── DEPLOYMENT.md      # This guide
```

## 🔧 Configuration Files

### Frontend Configuration
- `.env.example` - Example environment variables
- `.env.production` - Production environment variables

### Backend Configuration  
- `application.properties` - Development configuration
- `application-prod.properties` - Production configuration

## 🌐 Environment Variables

### Frontend (.env.production)
```env
VITE_WS_URL=wss://your-domain.com/ws/signaling
VITE_API_URL=https://your-domain.com/api/rooms
```

### Backend (application-prod.properties)
```properties
# Update these values for your domain:
spring.web.cors.allowed-origins=https://your-frontend-domain.com
spring.websocket.allowed-origins=https://your-frontend-domain.com
```

## 🚀 Deployment Steps

### 1. Frontend Deployment (React + Vite)

```bash
cd frontend

# Install dependencies
npm install

# Build for production
npm run build

# Deploy the 'dist' folder to your hosting service
```

**Frontend Hosting Options:**
- **Vercel** (Recommended - Free tier, WebSocket support)
- **Netlify** (Free tier, WebSocket support)
- **AWS Amplify** (Paid)
- **Custom hosting with Nginx**

### 2. Backend Deployment (Spring Boot)

```bash
cd backend

# Build the JAR file
./mvnw clean package

# Run the application
java -jar target/demo-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod
```

**Backend Hosting Options:**
- **Heroku** (Free tier, WebSocket support)
- **AWS EC2** (Paid, full control)
- **DigitalOcean** (Paid, good performance)
- **Google Cloud Platform** (Paid)

### 3. Database Configuration

The application uses MongoDB Atlas (cloud database), which is already configured:
```properties
spring.data.mongodb.uri=mongodb+srv://saikammila143:sai143@cluster0.cozih.mongodb.net/videocalldb?retryWrites=true&w=majority&appName=Cluster0
```

## 🔐 Security Considerations

### CORS Configuration
- Update `allowed-origins` to match your frontend domain
- Enable credentials for production
- WebSocket origins must match frontend domain

### WebSocket Security
- Use `wss://` (secure WebSocket) in production
- Configure proper origin validation
- Enable CORS credentials

### WebRTC Security
- STUN servers are configured for global access
- For enterprise deployment, add TURN servers:
```javascript
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'turn:your-turn-server:3478', 
      username: 'user', 
      credential: 'pass' }
  ]
};
```

## 🏥 Health Monitoring

The backend includes Spring Boot Actuator for health checks:
- `/actuator/health` - Application health
- `/actuator/info` - Application information

## 📱 Features Ready for Production

✅ **Core Features:**
- Video/audio streaming between participants
- Room creation and joining with password protection
- Real-time participant management
- WebSocket signaling for WebRTC
- Error handling for camera/microphone permissions

✅ **User Interface:**
- Modern, responsive design
- Mute/video off controls
- Participant count display
- Error messages with helpful instructions
- Mobile-friendly layout

✅ **Technical Features:**
- WebRTC peer connections
- STUN server configuration
- CORS and WebSocket security
- Environment variable configuration
- Production-ready logging

## 🐛 Troubleshooting

### Common Issues:

1. **WebSocket Connection Failed**
   - Check backend is running on port 8080
   - Verify CORS configuration matches frontend domain
   - Ensure WebSocket support in hosting

2. **Video/Audio Not Working**
   - Check camera/microphone permissions
   - Verify WebRTC STUN servers are accessible
   - Check browser console for errors

3. **CORS Errors**
   - Update `allowed-origins` in backend configuration
   - Ensure frontend and backend domains match
   - Check HTTPS/HTTP consistency

4. **Room Creation/Joining Issues**
   - Verify MongoDB connection
   - Check API endpoints are accessible
   - Review backend logs for errors

## 🔄 Scaling Considerations

### Horizontal Scaling:
- Use Redis for WebSocket session sharing
- Load balance multiple backend instances
- Configure sticky sessions for WebSocket connections

### Performance:
- Monitor WebSocket connection count
- Optimize WebRTC ICE candidate gathering
- Consider CDN for static assets

## 📞 Support

For deployment issues:
1. Check browser console for errors
2. Review backend application logs
3. Verify network connectivity between frontend and backend
4. Ensure all environment variables are properly set

---

**Note:** This application is production-ready and includes all necessary configurations for WebRTC video calling, WebSocket signaling, and secure CORS handling.
