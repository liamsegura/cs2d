const express = require('express')
const http = require('http')
const socketIO = require('socket.io')
const cors = require('cors')

const app = express()

app.use(
  cors({
    origin: ['http://127.0.0.1:5501', 'https://cs2d2.netlify.app'],
    methods: ['GET', 'POST'],
  })
)

const server = http.createServer(app)
const io = socketIO(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})

const players = {}
let bullets = []

// Define a simple map with walls (1) and empty spaces (0)
const map = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
]

const TILE_SIZE = 50 // Size of each tile in pixels

io.on('connection', (socket) => {
  console.log('A user connected')

  socket.on('new player', (player) => {
    players[socket.id] = player
  })

  socket.on('update player', (player) => {
    players[socket.id] = player
  })

  socket.on('shoot', (bulletData) => {
    const bullet = {
      x: bulletData.x,
      y: bulletData.y,
      angle: bulletData.angle,
      speed: 10,
      playerId: socket.id,
    }
    bullets.push(bullet)
  })

  socket.on('disconnect', () => {
    console.log('A user disconnected')
    delete players[socket.id]
  })
})

function isCollidingWithWall(x, y) {
  const buffer = 1 // Allow a small margin of error
  const col = Math.floor((x + buffer) / TILE_SIZE)
  const row = Math.floor((y + buffer) / TILE_SIZE)

  // Check if the row and col are within the bounds of the map
  if (row >= 0 && row < map.length && col >= 0 && col < map[0].length) {
    return map[row][col] === 1 // Collision with wall
  }

  // If out of bounds, treat it as no collision (false)
  return false
}

function updateBullets() {
  bullets = bullets.filter((bullet) => {
    const steps = 5 // Number of steps to divide the bullet's movement into for better precision
    const stepX = Math.cos(bullet.angle) * (bullet.speed / steps)
    const stepY = Math.sin(bullet.angle) * (bullet.speed / steps)

    for (let i = 0; i < steps; i++) {
      const newX = bullet.x + stepX
      const newY = bullet.y + stepY

      // Check for collisions with walls at each step
      if (isCollidingWithWall(newX, newY)) {
        // If the bullet collides with a wall, remove it
        return false
      }

      // Update the bullet's position at each step
      bullet.x = newX
      bullet.y = newY
    }

    // Remove bullet if it's out of bounds
    if (
      bullet.x < 0 ||
      bullet.x >= map[0].length * TILE_SIZE ||
      bullet.y < 0 ||
      bullet.y >= map.length * TILE_SIZE
    ) {
      return false
    }

    // Check for collisions with players
    for (let id in players) {
      if (id !== bullet.playerId) {
        const player = players[id]
        const dx = player.x - bullet.x
        const dy = player.y - bullet.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance < 20) {
          // If the bullet hits the player, remove the player
          delete players[id]
          io.to(id).emit('killed')
          return false
        }
      }
    }

    return true
  })
}

setInterval(() => {
  updateBullets()
  io.emit('update', players, bullets)
}, 1000 / 60)

const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})

module.exports = app
