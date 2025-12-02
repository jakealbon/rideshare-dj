# 🎵 Spotify Queue for Uber - Quick Start

Your custom Spotify queue system is ready! Here's what you have:

## 📦 Files Included

1. **server.js** - Backend server that handles Spotify API
2. **passenger.html** - Frontend interface for passengers
3. **spotify-queue.jsx** - React component (alternative frontend)
4. **package.json** - Dependencies configuration
5. **.env.example** - Environment variables template
6. **README.md** - Complete documentation

## 🚀 Get Started in 5 Minutes

### Step 1: Get Spotify Credentials
1. Go to https://developer.spotify.com/dashboard
2. Create a new app
3. Copy your Client ID and Client Secret

### Step 2: Setup
```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env and add your Spotify credentials
```

### Step 3: Run
```bash
# Start the server
npm start

# Authenticate your Spotify account
# Open: http://localhost:3001/auth/login
```

### Step 4: Create QR Code
1. Deploy to a service like Heroku, Railway, or use Ngrok
2. Create QR code pointing to: `https://your-url.com/passenger.html`
3. Print and laminate the QR code

## 🎯 How It Works

**For You (Driver):**
- Keep Spotify playing on your device
- Display the QR code in your car

**For Passengers:**
- Scan QR code → Search for songs → Add to queue
- Songs play after current track

## 📱 Deployment Options

**Easiest:** Railway.app (free tier)
- Sign up → Connect GitHub → Deploy

**Alternative:** Heroku, Render, or Fly.io

**For Testing:** Use Ngrok to expose localhost

## ⚡ Key Features

✅ Real-time song search
✅ Clean, mobile-friendly interface  
✅ No passenger account needed
✅ Automatic queue management
✅ Works with Spotify Premium

## 🔧 Customization

- Edit colors in `passenger.html`
- Add content filters in `server.js`
- Limit songs per passenger
- Change the app name/branding

## 📚 Full Documentation

See **README.md** for:
- Detailed setup instructions
- Troubleshooting guide
- Advanced customization
- Security best practices

## 💡 Pro Tips

1. Pre-authenticate before your driving shift
2. Keep Spotify actively playing
3. Create a starter playlist as backup
4. Print multiple QR codes
5. Keep your phone charged

---

Questions? Check the README.md for detailed help!

Happy driving! 🚗🎶
