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

io.on('connection', (socket) => {
  console.log('A user connected')

  socket.on('new player', (player) => {
    players[socket.id] = player
  })

  socket.on('update player', (player) => {
    if (players[socket.id] && !players[socket.id].dead) {
      players[socket.id] = player
    }
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

function respawnPlayer(id) {
  if (players[id]) {
    players[id].x = Math.random() * 1000
    players[id].y = Math.random() * 1000
    players[id].dead = false
  }
}

function updateBullets() {
  bullets = bullets.filter((bullet) => {
    const steps = 5 // Number of steps to divide the bullet's movement into for better precision
    const stepX = Math.cos(bullet.angle) * (bullet.speed / steps)
    const stepY = Math.sin(bullet.angle) * (bullet.speed / steps)

    for (let i = 0; i < steps; i++) {
      const newX = bullet.x + stepX
      const newY = bullet.y + stepY

      // Update the bullet's position at each step
      bullet.x = newX
      bullet.y = newY
    }

    // Check for collisions with players
    for (let id in players) {
      if (id !== bullet.playerId && !players[id].dead) {
        const player = players[id]
        const dx = player.x - bullet.x
        const dy = player.y - bullet.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance < 20) {
          // If the bullet hits the player, mark the player as dead
          players[id].dead = true
          io.to(id).emit('killed')
          setTimeout(() => respawnPlayer(id), 3000) // Respawn after 3 seconds
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
