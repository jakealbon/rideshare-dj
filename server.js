// Spotify Queue Backend Server
// This handles authentication and communication with Spotify's API

const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Store the driver's access token (in production, use a database)
let driverAccessToken = null;
let driverRefreshToken = null;
let tokenExpiry = null;

// Spotify API credentials (you'll need to create these in Spotify Developer Dashboard)
const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI || 'http://localhost:3001/callback';

// Step 1: Driver authentication - redirect to Spotify login
app.get('/auth/login', (req, res) => {
  const scopes = [
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-currently-playing'
  ].join(' ');

  const authUrl = `https://accounts.spotify.com/authorize?` +
    `client_id=${CLIENT_ID}` +
    `&response_type=code` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&scope=${encodeURIComponent(scopes)}`;

  res.redirect(authUrl);
});

// Step 2: Handle Spotify callback and get access token
app.get('/callback', async (req, res) => {
  const code = req.query.code;

  if (!code) {
    return res.status(400).send('No authorization code received');
  }

  try {
    const response = await axios.post(
      'https://accounts.spotify.com/api/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: REDIRECT_URI,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    driverAccessToken = response.data.access_token;
    driverRefreshToken = response.data.refresh_token;
    tokenExpiry = Date.now() + (response.data.expires_in * 1000);

    res.send(`
      <html>
        <head>
          <style>
            body {
              font-family: 'Arial', sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #1db954 0%, #1ed760 100%);
              color: white;
            }
            .container {
              text-align: center;
              padding: 40px;
              background: rgba(0,0,0,0.2);
              border-radius: 20px;
              box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            }
            h1 { margin: 0 0 20px 0; font-size: 32px; }
            p { font-size: 18px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>✅ Connected!</h1>
            <p>Your Spotify account is now connected.</p>
            <p>Passengers can now queue songs using the QR code.</p>
            <p style="margin-top: 30px; font-size: 14px; opacity: 0.8;">You can close this window.</p>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Error getting access token:', error.response?.data || error.message);
    res.status(500).send('Authentication failed');
  }
});

// Refresh access token if expired
async function refreshAccessToken() {
  if (!driverRefreshToken) {
    throw new Error('No refresh token available');
  }

  try {
    const response = await axios.post(
      'https://accounts.spotify.com/api/token',
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: driverRefreshToken,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    driverAccessToken = response.data.access_token;
    tokenExpiry = Date.now() + (response.data.expires_in * 1000);
    
    if (response.data.refresh_token) {
      driverRefreshToken = response.data.refresh_token;
    }
  } catch (error) {
    console.error('Error refreshing token:', error.response?.data || error.message);
    throw error;
  }
}

// Ensure valid access token
async function ensureValidToken() {
  if (!driverAccessToken) {
    throw new Error('Driver not authenticated. Please visit /auth/login');
  }

  // Refresh if token expires in less than 5 minutes
  if (tokenExpiry && Date.now() > tokenExpiry - 300000) {
    await refreshAccessToken();
  }
}

// Search for tracks
app.get('/api/search', async (req, res) => {
  const query = req.query.q;

  if (!query) {
    return res.status(400).json({ error: 'Search query required' });
  }

  try {
    await ensureValidToken();

    const response = await axios.get('https://api.spotify.com/v1/search', {
      headers: {
        'Authorization': `Bearer ${driverAccessToken}`
      },
      params: {
        q: query,
        type: 'track',
        limit: 10
      }
    });

    const tracks = response.data.tracks.items.map(track => ({
      id: track.id,
      uri: track.uri,
      name: track.name,
      artist: track.artists.map(a => a.name).join(', '),
      album: track.album.name,
      albumArt: track.album.images[0]?.url,
      duration: formatDuration(track.duration_ms)
    }));

    res.json({ tracks });
  } catch (error) {
    console.error('Search error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Search failed',
      message: error.message 
    });
  }
});

// Fetch playlist tracks (for Top 50, genre charts, etc.)
app.get('/api/playlist/:playlistId', async (req, res) => {
  const { playlistId } = req.params;
  const limit = req.query.limit || 50;

  try {
    await ensureValidToken();

    const response = await axios.get(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
      headers: {
        'Authorization': `Bearer ${driverAccessToken}`
      },
      params: {
        limit: limit,
        fields: 'items(track(id,uri,name,artists,album(name,images),duration_ms))'
      }
    });

    const tracks = response.data.items
      .filter(item => item.track) // Remove null tracks
      .map(item => ({
        id: item.track.id,
        uri: item.track.uri,
        name: item.track.name,
        artist: item.track.artists.map(a => a.name).join(', '),
        album: item.track.album.name,
        albumArt: item.track.album.images[0]?.url,
        duration: formatDuration(item.track.duration_ms)
      }));

    res.json({ tracks });
  } catch (error) {
    console.error('Playlist fetch error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to fetch playlist',
      message: error.message 
    });
  }
});

// Add track to queue
app.post('/api/queue', async (req, res) => {
  const { trackId } = req.body;

  if (!trackId) {
    return res.status(400).json({ error: 'Track ID required' });
  }

  try {
    await ensureValidToken();

    await axios.post(
      `https://api.spotify.com/v1/me/player/queue?uri=spotify:track:${trackId}`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${driverAccessToken}`
        }
      }
    );

    res.json({ success: true, message: 'Track added to queue' });
  } catch (error) {
    console.error('Queue error:', error.response?.data || error.message);
    
    if (error.response?.status === 404) {
      res.status(404).json({ 
        error: 'No active device found. Please start playing Spotify on your device.' 
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to add track to queue',
        message: error.message 
      });
    }
  }
});

// Get currently playing track
app.get('/api/current', async (req, res) => {
  try {
    await ensureValidToken();

    const response = await axios.get('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: {
        'Authorization': `Bearer ${driverAccessToken}`
      }
    });

    if (!response.data || !response.data.item) {
      return res.json({ playing: false });
    }

    const track = response.data.item;
    res.json({
      playing: true,
      name: track.name,
      artist: track.artists.map(a => a.name).join(', '),
      albumArt: track.album.images[0]?.url
    });
  } catch (error) {
    console.error('Current track error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to get current track' });
  }
});

// Check authentication status
app.get('/api/status', (req, res) => {
  res.json({
    authenticated: !!driverAccessToken,
    hasRefreshToken: !!driverRefreshToken
  });
});

// Helper function to format duration
function formatDuration(ms) {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Serve static files (passenger.html) - must come after API routes
app.use(express.static(__dirname));

app.listen(PORT, () => {
  console.log(`🎵 Spotify Queue Server running on port ${PORT}`);
  console.log(`📱 Driver authentication: http://localhost:${PORT}/auth/login`);
  console.log(`🔗 Make sure to set up your Spotify App credentials in .env file`);
});
