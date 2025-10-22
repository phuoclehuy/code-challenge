# Live Scoreboard API Module - Specification

## Table of Contents
1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [API Specification](#api-specification)
4. [Security Implementation](#security-implementation)
5. [Real-time Communication](#real-time-communication)
6. [Data Models](#data-models)
7. [Flow Diagrams](#flow-diagrams)
8. [Implementation Guidelines](#implementation-guidelines)
9. [Improvements & Future Enhancements](#improvements--future-enhancements)

---

## Overview

### Purpose
This module provides a secure, real-time scoreboard system that:
- Displays top 10 users' scores with live updates
- Validates and processes score update requests from user actions
- Prevents unauthorized score manipulation
- Broadcasts score changes to all connected clients in real-time

### Key Requirements
- ✅ **Live Updates**: Real-time scoreboard updates without page refresh
- ✅ **Security**: Prevent malicious score manipulation
- ✅ **Performance**: Handle concurrent score updates efficiently
- ✅ **Scalability**: Support growing user base

### Technology Stack
- **Backend**: Node.js with Express.js
- **Real-time**: WebSocket (Socket.IO)
- **Database**: Redis (leaderboard) + PostgreSQL/MongoDB (persistent storage)
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Server-side action verification

---

## System Architecture

### High-Level Architecture

```
┌─────────────────┐
│   Client (Web)  │
│  - User Actions │
│  - Scoreboard   │
└────────┬────────┘
         │
         ├─── HTTP/REST ────┐
         │                  │
         └─── WebSocket ────┤
                            │
                     ┌──────▼──────┐
                     │   API       │
                     │   Gateway   │
                     │   + Auth    │
                     └──────┬──────┘
                            │
         ┌──────────────────┼──────────────────┐
         │                  │                  │
    ┌────▼────┐      ┌─────▼─────┐     ┌─────▼─────┐
    │  Score  │      │ WebSocket │     │   Auth    │
    │ Service │      │  Service  │     │  Service  │
    └────┬────┘      └─────┬─────┘     └─────┬─────┘
         │                 │                  │
    ┌────▼────┐      ┌─────▼─────┐     ┌─────▼─────┐
    │  Redis  │      │  Socket   │     │   JWT     │
    │(Leader- │      │   Rooms   │     │  Tokens   │
    │ board)  │      └───────────┘     └───────────┘
    └────┬────┘
         │
    ┌────▼────┐
    │Database │
    │ (Persist│
    │  ent)   │
    └─────────┘
```

### Component Overview

| Component | Responsibility |
|-----------|---------------|
| **API Gateway** | Request routing, rate limiting, CORS |
| **Auth Service** | JWT validation, user authentication |
| **Score Service** | Score validation, update processing |
| **WebSocket Service** | Real-time broadcast to clients |
| **Redis** | Fast leaderboard queries (sorted sets) |
| **Database** | Persistent storage, audit logs |

---

## API Specification

### Base URL
```
Production: https://api.example.com/v1
Development: http://localhost:3000/api/v1
```

### Authentication
All endpoints require JWT token in the header:
```
Authorization: Bearer <JWT_TOKEN>
```

---

### 1. Submit Score Update

**Endpoint:** `POST /api/v1/scores/submit`

**Purpose:** Submit a completed action for score update

**Request Headers:**
```json
{
  "Authorization": "Bearer <JWT_TOKEN>",
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "actionId": "uuid-v4-action-id",
  "actionType": "COMPLETE_QUEST",
  "timestamp": 1698012345678,
  "metadata": {
    "questId": "quest-123",
    "difficulty": "hard"
  },
  "signature": "server-generated-signature"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "scoreAwarded": 100,
    "newTotalScore": 1250,
    "currentRank": 5,
    "previousRank": 7
  },
  "message": "Score updated successfully"
}
```

**Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "INVALID_ACTION",
  "message": "Action signature verification failed",
  "code": 4001
}
```

**Response (429 Too Many Requests):**
```json
{
  "success": false,
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Too many score submissions. Please try again later.",
  "retryAfter": 60
}
```

---

### 2. Get Leaderboard

**Endpoint:** `GET /api/v1/scores/leaderboard`

**Purpose:** Retrieve top 10 users' scores

**Query Parameters:**
- `limit` (optional): Number of top users (default: 10, max: 100)
- `offset` (optional): Pagination offset (default: 0)

**Request:**
```
GET /api/v1/scores/leaderboard?limit=10
Authorization: Bearer <JWT_TOKEN>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "leaderboard": [
      {
        "rank": 1,
        "userId": "user-123",
        "username": "player_one",
        "score": 9500,
        "lastUpdated": "2025-10-22T10:30:00Z",
        "avatar": "https://cdn.example.com/avatars/user-123.jpg"
      },
      {
        "rank": 2,
        "userId": "user-456",
        "username": "pro_gamer",
        "score": 8700,
        "lastUpdated": "2025-10-22T10:25:00Z",
        "avatar": "https://cdn.example.com/avatars/user-456.jpg"
      }
      // ... 8 more entries
    ],
    "total": 10,
    "timestamp": "2025-10-22T10:30:15Z"
  }
}
```

---

### 3. Get User Score

**Endpoint:** `GET /api/v1/scores/me`

**Purpose:** Get current user's score and rank

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "userId": "user-789",
    "username": "current_user",
    "score": 1250,
    "rank": 45,
    "percentile": 85.5,
    "lastUpdated": "2025-10-22T10:20:00Z"
  }
}
```

---

### 4. Initialize Action (Server-to-Client)

**Endpoint:** `POST /api/v1/actions/initialize`

**Purpose:** Generate a server-signed action token before user starts an action

**Request Body:**
```json
{
  "actionType": "COMPLETE_QUEST",
  "metadata": {
    "questId": "quest-123"
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "actionId": "uuid-v4-action-id",
    "signature": "hmac-sha256-signature",
    "expiresAt": 1698012945678,
    "expectedScore": 100
  }
}
```

**Purpose of this endpoint:**
- Server generates unique action ID and signature
- Client must submit this signature when completing the action
- Prevents client-side score manipulation
- Signature expires after a time window (e.g., 10 minutes)

---

## Security Implementation

### 1. Action Signature Verification

**Flow:**
1. Client requests action initialization
2. Server generates `actionId` + `signature` (HMAC-SHA256)
3. Client completes action and submits with signature
4. Server validates signature matches and hasn't expired
5. Score is awarded only if validation passes

**Signature Generation:**
```javascript
const signature = HMAC_SHA256(
  secret_key,
  actionId + userId + actionType + timestamp
);
```

**Validation:**
```javascript
// Check signature validity
const isValidSignature = verifySignature(submittedSignature, expectedSignature);

// Check expiration (e.g., 10 minutes)
const isNotExpired = (currentTime - timestamp) < 600000;

// Check not already used (prevent replay attacks)
const isNotUsed = !await redis.exists(`action:${actionId}`);

if (isValidSignature && isNotExpired && isNotUsed) {
  // Award score
  await redis.setex(`action:${actionId}`, 3600, 'used'); // Mark as used
}
```

---

### 2. Rate Limiting

**Implementation:**
- **Per User:** Max 10 score submissions per minute
- **Per IP:** Max 100 requests per minute
- **Global:** Max 10,000 requests per second

**Strategy:**
- Use Redis with sliding window algorithm
- Return `429 Too Many Requests` with `Retry-After` header

```javascript
// Pseudo-code
const key = `rate_limit:${userId}`;
const current = await redis.incr(key);
if (current === 1) {
  await redis.expire(key, 60); // 60 seconds window
}
if (current > 10) {
  throw new RateLimitError();
}
```

---

### 3. Authentication & Authorization

**JWT Token Structure:**
```json
{
  "userId": "user-123",
  "username": "player_one",
  "role": "user",
  "iat": 1698012345,
  "exp": 1698098745
}
```

**Middleware:**
```javascript
async function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
```

---

### 4. Anti-Fraud Measures

#### a) Anomaly Detection
- **Sudden Score Spikes:** Flag users with abnormal score increases
- **Pattern Analysis:** Detect bot-like behavior (consistent timing)
- **Velocity Checks:** Limit score gain rate per time period

#### b) Server-Side Validation
- **Action Completion Time:** Verify action took reasonable time to complete
- **Resource Requirements:** Check user had necessary items/requirements
- **Game State Validation:** Verify game state allows this action

#### c) Audit Logging
```javascript
// Log all score changes
{
  "userId": "user-123",
  "actionId": "action-456",
  "scoreBefore": 1150,
  "scoreAfter": 1250,
  "scoreAwarded": 100,
  "timestamp": "2025-10-22T10:30:00Z",
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "validated": true
}
```

---

## Real-time Communication

### WebSocket Implementation (Socket.IO)

**Connection Flow:**

```javascript
// Client connects with JWT
const socket = io('wss://api.example.com', {
  auth: {
    token: userJwtToken
  }
});

// Server validates JWT on connection
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.userId = decoded.userId;
    next();
  } catch (error) {
    next(new Error('Authentication failed'));
  }
});
```

**Events:**

### 1. Join Leaderboard Room
```javascript
// Client
socket.emit('join:leaderboard');

// Server
socket.on('join:leaderboard', () => {
  socket.join('leaderboard');
  console.log(`User ${socket.userId} joined leaderboard room`);
});
```

### 2. Score Update Broadcast
```javascript
// Server broadcasts when score changes
io.to('leaderboard').emit('score:update', {
  type: 'SCORE_CHANGED',
  data: {
    userId: 'user-123',
    username: 'player_one',
    newScore: 1250,
    newRank: 5,
    previousRank: 7,
    timestamp: '2025-10-22T10:30:00Z'
  }
});
```

### 3. Leaderboard Refresh
```javascript
// Server broadcasts updated top 10 when rankings change
io.to('leaderboard').emit('leaderboard:update', {
  type: 'LEADERBOARD_REFRESH',
  data: {
    leaderboard: [...], // Top 10 users
    timestamp: '2025-10-22T10:30:00Z'
  }
});
```

### 4. Real-time Events Summary

| Event | Direction | Description |
|-------|-----------|-------------|
| `join:leaderboard` | Client → Server | Join leaderboard room for updates |
| `leave:leaderboard` | Client → Server | Leave leaderboard room |
| `score:update` | Server → Client | Broadcast individual score change |
| `leaderboard:update` | Server → Client | Broadcast top 10 refresh |
| `rank:achieved` | Server → Client | Notify user of rank milestone |

---

## Data Models

### User Score Schema (Database)

```typescript
interface UserScore {
  userId: string;           // Primary key
  username: string;
  score: number;            // Current total score
  rank: number;             // Current rank (cached)
  lastUpdated: Date;
  createdAt: Date;
  metadata: {
    totalActions: number;
    averageScorePerAction: number;
    lastActionAt: Date;
  };
}
```

### Score Transaction Schema (Audit Log)

```typescript
interface ScoreTransaction {
  transactionId: string;    // Primary key
  userId: string;           // Foreign key
  actionId: string;
  actionType: string;
  scoreBefore: number;
  scoreAfter: number;
  scoreAwarded: number;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  validated: boolean;
  metadata: object;
}
```

### Redis Data Structures

```javascript
// Leaderboard (Sorted Set)
Key: "leaderboard:global"
Type: SORTED SET
Structure: ZADD leaderboard:global <score> <userId>

// User rate limiting
Key: "rate_limit:<userId>"
Type: STRING with TTL
TTL: 60 seconds

// Used actions (prevent replay)
Key: "action:<actionId>"
Type: STRING with TTL
TTL: 3600 seconds (1 hour)

// User score cache
Key: "user:score:<userId>"
Type: HASH
Fields: { score, rank, lastUpdated }
TTL: 300 seconds (5 minutes)
```

---

## Flow Diagrams

### 1. Score Update Flow

![Score Submission Flow Sequence Diagram](./Score%20Submission%20Flow%20Sequence%20Diagram.png)

### 2. Leaderboard Real-time Update Flow

![Leaderboard Broadcast Logic](./Leaderboard%20Broadcast%20Logic.png)

### 3. Security Validation Flow

![Security Validation Flow](./Security%20Validation%20Flow.png)

### 4. System Architecture Diagram

![System Architecture Overview](./System%20Architecture%20Overview.png)

*Detailed system architecture showing all components, layers, and their interactions.*

---

## Implementation Guidelines

### 1. Technology Choices

#### Backend Framework
```javascript
// Express.js with TypeScript
import express from 'express';
import { Server } from 'socket.io';
import Redis from 'ioredis';

const app = express();
const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: 6379
});
```

#### Redis Operations

```javascript
// Update score and get new rank
async function updateUserScore(userId: string, scoreToAdd: number) {
  // Atomic increment
  const newScore = await redis.zincrby('leaderboard:global', scoreToAdd, userId);
  
  // Get new rank (0-based, so add 1)
  const rank = await redis.zrevrank('leaderboard:global', userId);
  
  return {
    newScore: parseInt(newScore),
    newRank: rank !== null ? rank + 1 : null
  };
}

// Get top 10 leaderboard
async function getLeaderboard(limit = 10) {
  const leaderboard = await redis.zrevrange(
    'leaderboard:global',
    0,
    limit - 1,
    'WITHSCORES'
  );
  
  // Format results
  const formatted = [];
  for (let i = 0; i < leaderboard.length; i += 2) {
    formatted.push({
      userId: leaderboard[i],
      score: parseInt(leaderboard[i + 1]),
      rank: (i / 2) + 1
    });
  }
  
  return formatted;
}
```

### 2. WebSocket Room Management

```javascript
class LeaderboardManager {
  constructor(io) {
    this.io = io;
    this.setupListeners();
  }
  
  setupListeners() {
    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);
      
      socket.on('join:leaderboard', () => {
        socket.join('leaderboard');
      });
      
      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
      });
    });
  }
  
  async broadcastScoreUpdate(userId, scoreData) {
    // Check if top 10 changed
    const topTenChanged = await this.checkTopTenChanged(userId, scoreData);
    
    if (topTenChanged) {
      const leaderboard = await getLeaderboard(10);
      this.io.to('leaderboard').emit('leaderboard:update', {
        type: 'LEADERBOARD_REFRESH',
        data: { leaderboard }
      });
    } else {
      this.io.to('leaderboard').emit('score:update', {
        type: 'SCORE_CHANGED',
        data: scoreData
      });
    }
  }
  
  async checkTopTenChanged(userId, scoreData) {
    // Check if user is now in top 10 or was in top 10
    return scoreData.newRank <= 10 || scoreData.previousRank <= 10;
  }
}
```

### 3. Deployment Architecture

```yaml
# docker-compose.yml
version: '3.8'

services:
  api:
    build: ./api
    ports:
      - "3000:3000"
    environment:
      - REDIS_HOST=redis
      - DB_HOST=postgres
    depends_on:
      - redis
      - postgres
    deploy:
      replicas: 3
      
  websocket:
    build: ./websocket
    ports:
      - "3001:3001"
    environment:
      - REDIS_HOST=redis
    depends_on:
      - redis
    deploy:
      replicas: 2
      
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
      
  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=scoreboard
      - POSTGRES_PASSWORD=secret
    volumes:
      - postgres-data:/var/lib/postgresql/data
      
volumes:
  redis-data:
  postgres-data:
```

### 4. Environment Configuration

```env
# .env.example
NODE_ENV=production
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=scoreboard
DB_USER=postgres
DB_PASSWORD=secret

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRATION=24h

# Rate Limiting
RATE_LIMIT_WINDOW=60
RATE_LIMIT_MAX_REQUESTS=10

# Security
ACTION_SIGNATURE_SECRET=your-signature-secret
ACTION_EXPIRATION_MS=600000

# WebSocket
WEBSOCKET_PORT=3001
CORS_ORIGIN=https://example.com
```

---

## Improvements & Future Enhancements

### 1. Performance Optimizations

#### a) **Caching Strategy**
- **Current:** Cache top 10 in Redis with 5-minute TTL
- **Improvement:** Implement multi-tier caching
  - L1: In-memory cache (Node.js) for ultra-fast reads
  - L2: Redis for distributed caching
  - L3: Database for source of truth

```javascript
// Multi-tier cache example
class LeaderboardCache {
  constructor() {
    this.memoryCache = new Map(); // L1
    this.redis = new Redis();      // L2
  }
  
  async getLeaderboard() {
    // Try L1 (memory)
    if (this.memoryCache.has('leaderboard')) {
      return this.memoryCache.get('leaderboard');
    }
    
    // Try L2 (Redis)
    const cached = await this.redis.get('leaderboard:cached');
    if (cached) {
      const data = JSON.parse(cached);
      this.memoryCache.set('leaderboard', data);
      return data;
    }
    
    // Fetch from source (Redis sorted set)
    const leaderboard = await getLeaderboard(10);
    await this.redis.setex('leaderboard:cached', 300, JSON.stringify(leaderboard));
    this.memoryCache.set('leaderboard', leaderboard);
    
    return leaderboard;
  }
}
```

#### b) **Database Indexing**
```sql
-- Indexes for fast queries
CREATE INDEX idx_user_score ON user_scores(score DESC);
CREATE INDEX idx_transactions_user ON score_transactions(user_id, timestamp DESC);
CREATE INDEX idx_transactions_timestamp ON score_transactions(timestamp DESC);
```

#### c) **Connection Pooling**
```javascript
// PostgreSQL connection pool
const pool = new Pool({
  max: 20,
  min: 5,
  idleTimeoutMillis: 30000
});
```

---

### 2. Scalability Enhancements

#### a) **Horizontal Scaling with Redis Cluster**
```javascript
// Redis Cluster for high availability
const cluster = new Redis.Cluster([
  { host: 'redis-1', port: 6379 },
  { host: 'redis-2', port: 6379 },
  { host: 'redis-3', port: 6379 }
]);
```

#### b) **WebSocket Scaling with Redis Pub/Sub**
```javascript
// Enable sticky sessions with Redis adapter
import { createAdapter } from '@socket.io/redis-adapter';

const pubClient = new Redis();
const subClient = pubClient.duplicate();

io.adapter(createAdapter(pubClient, subClient));

// Now multiple WebSocket servers can share state
```

#### c) **Microservices Architecture**
- **Score Service:** Dedicated service for score processing
- **Leaderboard Service:** Separate read-optimized service
- **Notification Service:** Handle real-time broadcasts
- **Anti-Fraud Service:** ML-based anomaly detection

---

### 3. Security Enhancements

#### a) **Advanced Anti-Cheat System**
```javascript
// Machine Learning-based anomaly detection
class AnomalyDetector {
  async checkSuspiciousActivity(userId, scoreData) {
    const metrics = await this.getUserMetrics(userId);
    
    const flags = [];
    
    // Check 1: Score velocity
    if (metrics.scoresPerHour > 100) {
      flags.push('HIGH_VELOCITY');
    }
    
    // Check 2: Unusual patterns
    const timeBetweenActions = this.calculateAverageTimeBetween(metrics.actions);
    if (timeBetweenActions < 1000 && metrics.actions.length > 10) {
      flags.push('BOT_PATTERN');
    }
    
    // Check 3: Impossible completions
    if (scoreData.completionTime < scoreData.minimumExpectedTime) {
      flags.push('IMPOSSIBLE_TIMING');
    }
    
    return {
      suspicious: flags.length > 0,
      flags,
      riskScore: this.calculateRiskScore(flags)
    };
  }
}
```

#### b) **CAPTCHA for Suspicious Activity**
```javascript
// Require CAPTCHA verification for flagged users
if (user.riskScore > 0.7) {
  return res.status(403).json({
    error: 'VERIFICATION_REQUIRED',
    message: 'Please complete CAPTCHA verification',
    captchaUrl: '/api/v1/captcha/verify'
  });
}
```

#### c) **IP Reputation & Geolocation**
```javascript
// Block requests from known VPN/proxy services
const ipInfo = await getIPInfo(req.ip);
if (ipInfo.isProxy || ipInfo.isVPN) {
  await logSuspiciousActivity(userId, 'PROXY_DETECTED');
}
```

---

### 4. Monitoring & Analytics

#### a) **Real-time Monitoring Dashboard**
- Track API response times
- Monitor WebSocket connection count
- Alert on anomalous score patterns
- Visualize leaderboard changes over time

#### b) **Metrics to Track**
```javascript
// Prometheus metrics
const scoreUpdateDuration = new Histogram({
  name: 'score_update_duration_seconds',
  help: 'Duration of score update operations'
});

const activeWebSocketConnections = new Gauge({
  name: 'websocket_connections_active',
  help: 'Number of active WebSocket connections'
});

const scoreUpdatesTotal = new Counter({
  name: 'score_updates_total',
  help: 'Total number of score updates'
});
```

#### c) **Logging Strategy**
```javascript
// Structured logging with Winston
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'scoreboard-api' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

logger.info('Score updated', {
  userId,
  scoreAwarded,
  newRank,
  duration: Date.now() - startTime
});
```

---

### 5. Feature Enhancements

#### a) **Time-based Leaderboards**
```javascript
// Support multiple leaderboard periods
const leaderboardTypes = {
  'daily': 'leaderboard:daily',
  'weekly': 'leaderboard:weekly',
  'monthly': 'leaderboard:monthly',
  'alltime': 'leaderboard:global'
};

// Reset daily/weekly leaderboards with cron jobs
```

#### b) **Achievements & Milestones**
```javascript
// Notify users when they reach milestones
const milestones = [100, 500, 1000, 5000, 10000];

if (milestones.includes(newScore)) {
  io.to(userId).emit('achievement:unlocked', {
    type: 'SCORE_MILESTONE',
    milestone: newScore
  });
}
```

#### c) **Spectator Mode**
```javascript
// Allow users to watch specific players
socket.on('spectate:user', (targetUserId) => {
  socket.join(`spectate:${targetUserId}`);
});

// Broadcast to spectators
io.to(`spectate:${userId}`).emit('player:action', actionData);
```

#### d) **Historical Data & Analytics**
```javascript
// API endpoint for user score history
GET /api/v1/scores/history?userId=xxx&period=7d

Response: {
  data: {
    points: [
      { timestamp: '2025-10-15T00:00:00Z', score: 800 },
      { timestamp: '2025-10-16T00:00:00Z', score: 950 },
      // ...
    ],
    trend: 'increasing',
    averageDailyGain: 150
  }
}
```

---

### 6. Testing Strategy

#### a) **Unit Tests**
```javascript
describe('ScoreService', () => {
  it('should validate action signature correctly', async () => {
    const action = await scoreService.initializeAction(userId, actionType);
    const isValid = scoreService.validateSignature(action);
    expect(isValid).toBe(true);
  });
  
  it('should reject expired actions', async () => {
    const expiredAction = createExpiredAction();
    await expect(
      scoreService.submitScore(userId, expiredAction)
    ).rejects.toThrow('Action expired');
  });
});
```

#### b) **Integration Tests**
```javascript
describe('Score Update Flow', () => {
  it('should update leaderboard in real-time', async () => {
    const client = io('http://localhost:3000');
    
    client.on('leaderboard:update', (data) => {
      expect(data.leaderboard).toHaveLength(10);
      expect(data.leaderboard[0].rank).toBe(1);
    });
    
    await request(app)
      .post('/api/v1/scores/submit')
      .send(validScoreData);
  });
});
```

#### c) **Load Testing**
```javascript
// k6 load test script
import http from 'k6/http';

export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 0 },   // Ramp down
  ],
};

export default function() {
  http.post('http://api.example.com/v1/scores/submit', 
    JSON.stringify(scoreData),
    { headers: { 'Authorization': `Bearer ${token}` } }
  );
}
```

---

### 7. Additional Recommendations

#### a) **GraphQL Alternative**
For more flexible queries, consider GraphQL instead of REST:
```graphql
type Query {
  leaderboard(limit: Int, offset: Int, period: Period): [LeaderboardEntry!]!
  userScore(userId: ID!): UserScore
  userRank(userId: ID!): Int
}

type Mutation {
  submitScore(input: ScoreSubmission!): ScoreUpdateResult!
}

type Subscription {
  leaderboardUpdates: LeaderboardUpdate!
  scoreUpdates(userId: ID): ScoreUpdate!
}
```

#### b) **CDN for Static Leaderboard**
Cache top 10 on CDN for ultra-fast global access:
```javascript
// Cache-Control header
res.set('Cache-Control', 'public, max-age=60, s-maxage=300');
```

#### c) **Rate Limiting with Token Bucket**
```javascript
// More sophisticated rate limiting
class TokenBucket {
  constructor(capacity, refillRate) {
    this.capacity = capacity;
    this.tokens = capacity;
    this.refillRate = refillRate;
  }
  
  async consume(userId, tokens = 1) {
    await this.refill(userId);
    
    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }
    return false;
  }
}
```

#### d) **Disaster Recovery**
```javascript
// Regular backups
cron.schedule('0 */6 * * *', async () => {
  // Backup Redis to persistent storage every 6 hours
  await redis.save();
  await uploadToS3('redis-backup.rdb');
});

// Database replication
// Primary-Replica setup for high availability
```

---

## Summary

This specification provides a complete blueprint for implementing a secure, scalable, real-time scoreboard system. Key highlights:

### ✅ **Security First**
- Action signature verification
- JWT authentication
- Rate limiting
- Anomaly detection
- Audit logging

### ✅ **Real-time Performance**
- WebSocket for instant updates
- Redis for fast leaderboard queries
- Multi-tier caching
- Optimized database queries

### ✅ **Scalability**
- Horizontal scaling support
- Redis Cluster
- Microservices architecture
- Load balancing

### ✅ **Developer Experience**
- Clear API specification
- TypeScript for type safety
- Comprehensive error handling
- Detailed documentation

### 📋 **Implementation Checklist**
- [ ] Set up Redis cluster
- [ ] Implement JWT authentication
- [ ] Create action signature system
- [ ] Build WebSocket service
- [ ] Implement rate limiting
- [ ] Set up monitoring & logging
- [ ] Create anomaly detection
- [ ] Write comprehensive tests
- [ ] Deploy with load balancing
- [ ] Set up disaster recovery

---

**Last Updated:** October 22, 2025  
**Version:** 1.0.0  
**Author:** Backend Engineering Team
