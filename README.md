# Spotify Queue for Uber - Setup Guide

This system allows your Uber passengers to scan a QR code and queue songs on your Spotify account during rides.

## 🚀 Quick Start

### Prerequisites
- Node.js installed (v14 or higher)
- A Spotify Premium account (required for queue control)
- Basic knowledge of running Node.js applications

### Step 1: Create Spotify App

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Log in with your Spotify account
3. Click "Create an App"
4. Fill in:
   - **App Name**: "Uber Ride Queue" (or any name)
   - **App Description**: "Music queue system for passengers"
   - **Redirect URI**: `http://localhost:3001/callback`
5. Click "Create"
6. You'll get a **Client ID** and **Client Secret** - save these!

### Step 2: Configure the Project

1. Create a `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

2. Edit `.env` and add your credentials:
```
SPOTIFY_CLIENT_ID=your_actual_client_id
SPOTIFY_CLIENT_SECRET=your_actual_client_secret
REDIRECT_URI=http://localhost:3001/callback
PORT=3001
```

### Step 3: Install Dependencies

```bash
npm install
```

### Step 4: Start the Server

```bash
npm start
```

The server will start on http://localhost:3001

### Step 5: Authenticate Your Account

1. Open your browser and go to: `http://localhost:3001/auth/login`
2. Log in with your Spotify account
3. Authorize the app
4. You'll see a success message

**Important**: Keep Spotify playing on your device (phone/computer). The queue only works when Spotify is actively playing.

### Step 6: Deploy (Optional)

For production use, you'll want to deploy this to a cloud service:

#### Option A: Deploy to Heroku (Free Tier Available)
```bash
# Install Heroku CLI, then:
heroku create your-app-name
heroku config:set SPOTIFY_CLIENT_ID=your_id
heroku config:set SPOTIFY_CLIENT_SECRET=your_secret
heroku config:set REDIRECT_URI=https://your-app-name.herokuapp.com/callback
git push heroku main
```

#### Option B: Deploy to Railway.app
1. Sign up at [Railway.app](https://railway.app)
2. Connect your GitHub repo
3. Add environment variables in Railway dashboard
4. Deploy automatically

#### Option C: Use Ngrok for Testing
```bash
# Install ngrok, then:
ngrok http 3001

# Use the ngrok URL (e.g., https://abc123.ngrok.io) as your REDIRECT_URI
# Update it in Spotify Developer Dashboard and .env file
```

### Step 7: Create QR Code

Once deployed, create a QR code that points to your passenger interface:

**URL format**: `https://your-deployed-url.com/passenger.html`

**Free QR Code Generators**:
- https://qr-code-generator.com
- https://www.qrcode-monkey.com
- Built-in iOS: Open Camera, create Note with URL, long press to generate QR

Print the QR code and laminate it for your car!

## 📱 Usage

### For Drivers:
1. Start Spotify on your phone/device
2. Begin playing music
3. Make sure your server is running and authenticated
4. Display the QR code where passengers can see it

### For Passengers:
1. Scan the QR code with their phone camera
2. Search for songs
3. Click "Add" to queue songs
4. Songs will play in order after the current track

## 🎨 Customization

### Change the App Theme
Edit `spotify-queue.jsx` and modify the color scheme:
```javascript
// Find this line:
background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',

// Change to your colors:
background: 'linear-gradient(135deg, #yourcolor1 0%, #yourcolor2 100%)',
```

### Add Song Restrictions
In `server.js`, you can add filters to prevent explicit content:

```javascript
// In the /api/search endpoint, filter results:
const tracks = response.data.tracks.items
  .filter(track => !track.explicit) // Remove explicit tracks
  .map(track => ({
    // ... rest of the code
  }));
```

### Limit Queue Length
Add a counter to prevent passengers from adding too many songs:

```javascript
// In server.js, track queued songs per session
let queueCount = 0;
const MAX_SONGS_PER_PASSENGER = 3;

app.post('/api/queue', async (req, res) => {
  if (queueCount >= MAX_SONGS_PER_PASSENGER) {
    return res.status(429).json({ 
      error: 'Maximum songs reached. Thanks for your selections!' 
    });
  }
  
  // ... existing queue code ...
  queueCount++;
});
```

## 🔧 Troubleshooting

### "No active device found"
**Solution**: Make sure Spotify is actively playing on your device. The app can't queue songs if Spotify isn't running.

### Songs not adding to queue
**Solution**: 
- Check that you're authenticated (visit `/api/status`)
- Make sure your access token hasn't expired
- Restart the server if needed

### Authentication expired
**Solution**: Visit `/auth/login` again to re-authenticate

### Port already in use
**Solution**: Change the PORT in `.env` to a different number (e.g., 3002)

## 🔒 Security Notes

- Never commit your `.env` file to Git (it's already in `.gitignore`)
- Your Spotify Client Secret should remain private
- In production, use HTTPS (most deployment platforms provide this automatically)
- Consider rate limiting in production to prevent abuse

## 📊 Monitoring

Check server status:
```bash
curl http://localhost:3001/api/status
```

Should return:
```json
{
  "authenticated": true,
  "hasRefreshToken": true
}
```

## 💡 Tips for Best Experience

1. **Keep Spotify Playing**: The queue system only works when Spotify is actively playing
2. **Pre-authenticate**: Authenticate before starting your driving shift
3. **Create a Playlist**: Consider creating a "Ride Vibes" starter playlist so there's always something playing
4. **Set Volume**: Adjust Spotify volume to a comfortable level for conversation
5. **Print Multiple QR Codes**: Place them in the back seat and on your dashboard
6. **Battery**: Keep your phone charged - streaming uses battery
7. **Data**: Streaming music uses mobile data if not on Wi-Fi

## 📝 Advanced Features (Optional)

### Add a "Now Playing" Display
Create a screen showing the current song so passengers can see what's playing.

### Vote System
Instead of instant queuing, let passengers vote on songs.

### Theme Selection
Let passengers choose from preset playlists by genre.

### Analytics
Track popular songs/artists to understand passenger preferences.

## 🆘 Support

If you run into issues:
1. Check the troubleshooting section above
2. Verify all environment variables are set correctly
3. Check that Spotify is playing on your device
4. Restart the server: `npm start`
5. Re-authenticate: visit `/auth/login`

## 📜 License

MIT License - Feel free to modify and use for your rides!

---

Made with ♥️ for better rides
