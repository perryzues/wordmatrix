# 🎮 Word Matrix - Multiplayer Word Battle Game

Fast, real-time multiplayer word game with auto-scoring and live leaderboards. Built with vanilla JavaScript, Node.js, Socket.io, and deployed on **100% free services**.

## 🚀 Live Demo

- **Frontend:** `https://yourusername.github.io/word-matrix`
- **Backend:** `https://your-app-name.onrender.com`

## ✨ Features

- ⚡ **Real-time Gameplay** - WebSocket-powered instant updates
- 🏆 **Auto-Scoring** - Server-side validation, no voting needed
- 📊 **Live Leaderboard** - Top 10 players updated each round
- 🎯 **Smart Scoring** - Length bonus, speed bonus, timing multiplier, originality bonus
- 📱 **Mobile-First** - Responsive design for all devices
- 🔒 **Anti-Cheat** - Server-side validation and rate limiting
- 👥 **Scalable** - Supports 500+ concurrent players per room

## 🛠️ Tech Stack

### Frontend
- **HTML5/CSS3/JavaScript** (Vanilla, no frameworks)
- **Socket.io Client** for real-time communication
- **GitHub Pages** for hosting (free CDN)

### Backend
- **Node.js + Express** for REST API
- **Socket.io** for WebSocket server
- **Redis (Upstash)** for game state and caching
- **PostgreSQL (Supabase)** for persistent storage
- **Render.com** for backend hosting

## 📋 Prerequisites

- Git
- Node.js 16+ (for local development)
- GitHub account
- Render.com account (free)
- Upstash account (free)
- Supabase account (free)

## 🔧 Installation & Deployment

### Step 1: Clone Repository

```bash
git clone https://github.com/yourusername/word-matrix.git
cd word-matrix
```

### Step 2: Set Up Backend Services

#### 2.1 Create Upstash Redis
1. Go to https://upstash.com
2. Create new database
3. Copy the Redis URL (format: `redis://default:...@...upstash.io:6379`)

#### 2.2 Create Supabase PostgreSQL
1. Go to https://supabase.com
2. Create new project
3. Go to Settings → Database → Connection string
4. Copy the connection string
5. Run this SQL in Supabase SQL Editor:

```sql
CREATE TABLE rooms (
    id VARCHAR(10) PRIMARY KEY,
    host_code VARCHAR(20) UNIQUE NOT NULL,
    rounds INTEGER DEFAULT 10,
    round_duration INTEGER DEFAULT 15,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE game_results (
    id SERIAL PRIMARY KEY,
    room_id VARCHAR(10) REFERENCES rooms(id),
    username VARCHAR(50),
    total_points DECIMAL(10,2),
    rounds_played INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_rooms_created ON rooms(created_at);
CREATE INDEX idx_results_room ON game_results(room_id);
```

### Step 3: Deploy Backend to Render

1. Push your code to GitHub
2. Go to https://render.com
3. Create new **Web Service**
4. Connect your GitHub repository
5. Configure:
   - **Name:** `word-matrix-backend`
   - **Build Command:** `cd backend && npm install`
   - **Start Command:** `cd backend && node server.js`
6. Add environment variables:

```
NODE_ENV=production
PORT=10000
REDIS_URL=your_upstash_redis_url_here
DATABASE_URL=your_supabase_postgres_url_here
FRONTEND_URL=https://yourusername.github.io/word-matrix
```

7. Click **Create Web Service**
8. Copy your backend URL (e.g., `https://word-matrix-backend.onrender.com`)

### Step 4: Generate Dictionary

SSH into your Render service or run locally:

```bash
cd backend
npm run generate-dict
```

This creates `words.json` with common English words. Commit and push to GitHub.

### Step 5: Deploy Frontend to GitHub Pages

1. Update `frontend/index.html` line 105:
```javascript
const BACKEND_URL = 'https://your-backend-name.onrender.com'; // Update this
```

2. Update `frontend/app.js` line 2:
```javascript
const BACKEND_URL = 'https://your-backend-name.onrender.com'; // Update this
```

3. Push to GitHub:
```bash
git add .
git commit -m "Configure backend URL"
git push origin main
```

4. Enable GitHub Pages:
   - Go to repository Settings → Pages
   - Source: `main` branch, `/frontend` folder
   - Save

5. Your game will be live at: `https://yourusername.github.io/word-matrix`

## 🎮 How to Play

### As Host:
1. Click "Create Room"
2. Share the room link with players
3. Set number of rounds (1-20) and round duration (10-60s)
4. Click "Start Game" when ready

### As Player:
1. Click "Join Room"
2. Enter room code and username
3. Wait for host to start
4. Form words using the random letters each round
5. Submit before time runs out!

### Scoring System:
- **Valid Word:** +5 points
- **Contains All Letters:** +3 points (required)
- **Length Bonus:** +1 per letter beyond 5
- **Speed Bonus:** +2 if submitted in first half
- **Originality Bonus:** +5 if first to submit a duplicate word
- **Timing Multiplier:** Up to 1.1x for instant submissions

## 🧪 Local Development

### Backend:
```bash
cd backend
npm install
npm run dev
```

### Frontend:
Serve with any static server:
```bash
cd frontend
npx serve
```

Or use VS Code Live Server extension.

## 📊 Monitoring & Analytics

### Check Backend Health:
```
GET https://your-backend.onrender.com/
```

### View Logs:
- Render Dashboard → Service → Logs

### Database Queries:
```sql
-- Top players all-time
SELECT username, SUM(total_points) as total 
FROM game_results 
GROUP BY username 
ORDER BY total DESC 
LIMIT 10;

-- Game statistics
SELECT COUNT(*) as total_games, 
       AVG(total_points) as avg_score
FROM game_results;
```

## 🐛 Troubleshooting

### "Connection failed" error
- **Cause:** Render free tier auto-sleeps after 15 min inactivity
- **Solution:** Wait 20-30 seconds for backend to wake up, then try again
- **Prevention:** Use UptimeRobot (free) to ping backend every 14 minutes

### CORS errors
- Check `FRONTEND_URL` environment variable matches your GitHub Pages URL exactly
- Ensure no trailing slash in URLs

### Words not validating
- Verify `words.json` exists in backend directory
- Check Render logs for dictionary loading confirmation
- Regenerate dictionary: `npm run generate-dict`

### Redis connection fails
- Verify `REDIS_URL` format: `redis://default:password@host:port`
- Check Upstash dashboard for connection limits
- Free tier: 10,000 commands/day

### Socket disconnects frequently
- Check Render logs for memory/CPU issues
- Verify client `reconnection: true` in `app.js`
- Consider upgrading Render plan for production

## 🔄 Updates & Maintenance

### Update Backend:
```bash
git add backend/
git commit -m "Update backend"
git push origin main
```
Render auto-deploys from GitHub.

### Update Frontend:
```bash
git add frontend/
git commit -m "Update frontend"
git push origin main
```
GitHub Pages auto-deploys in ~1 minute.

### Add More Words:
Edit `backend/words.json`, add words to array, commit and push.

## 📈 Scaling Beyond Free Tier

When you need more capacity:

| Service | Free Limit | Upgrade Cost |
|---------|-----------|--------------|
| Render | Auto-sleep | $7/mo always-on |
| Upstash | 10K commands/day | $10/mo for 1M |
| Supabase | 500MB storage | $25/mo for 8GB |

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit pull request

## 📝 License

MIT License - feel free to use for personal or commercial projects.

## 🙏 Acknowledgments

- Socket.io for real-time capabilities
- Upstash for Redis hosting
- Supabase for PostgreSQL hosting
- Render for backend hosting
- GitHub for frontend hosting

## 📞 Support

Issues? Open a GitHub issue or contact via email.

---

**Built with ❤️ for word game enthusiasts everywhere.**