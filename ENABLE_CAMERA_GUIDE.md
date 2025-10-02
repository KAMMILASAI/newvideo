# Enable Camera & Microphone Guide

## Windows 10/11 System Settings

### Camera Permissions:
1. Press `Windows + I` to open Settings
2. Go to **Privacy & Security**
3. Click **Camera** in the left sidebar
4. Turn ON: **"Camera access"**
5. Turn ON: **"Let apps access your camera"**
6. Turn ON: **"Let desktop apps access your camera"**

### Microphone Permissions:
1. In Settings → **Privacy & Security**
2. Click **Microphone** in the left sidebar
3. Turn ON: **"Microphone access"**
4. Turn ON: **"Let apps access your microphone"**
5. Turn ON: **"Let desktop apps access your microphone"**

## Browser Settings (Chrome/Edge)

### Method 1: Quick Fix (Click Lock Icon)
1. Go to `http://localhost:5173`
2. Click the **lock icon** 🔒 (or camera icon) in the address bar
3. Find **Camera** → Change to **Allow**
4. Find **Microphone** → Change to **Allow**
5. Click **Refresh** or press F5

### Method 2: Browser Settings
**Chrome:**
1. Go to `chrome://settings/content/camera`
2. Under "Allowed to use your camera" → Click **Add**
3. Enter: `http://localhost:5173`
4. Go to `chrome://settings/content/microphone`
5. Under "Allowed to use your microphone" → Click **Add**
6. Enter: `http://localhost:5173`

**Edge:**
1. Go to `edge://settings/content/camera`
2. Under "Allow" → Click **Add**
3. Enter: `http://localhost:5173`
4. Go to `edge://settings/content/microphone`
5. Under "Allow" → Click **Add**
6. Enter: `http://localhost:5173`

## Troubleshooting

### Still Not Working?

1. **Check if camera/mic is used by another app**
   - Close Teams, Zoom, Skype, Discord
   - Close other browser tabs using camera
   - Restart your browser

2. **Test your camera**
   - Windows: Open "Camera" app to verify it works
   - If Camera app doesn't work, issue is with device/drivers

3. **After granting permissions**
   - Refresh the page (F5)
   - Or leave room and rejoin

### Success Indicators:
- ✅ You should see your video in the local video window
- ✅ Camera icon in browser shows as active
- ✅ Mute/video buttons work when clicked
