const express = require('express')
const http = require('http')
const socketIO = require('socket.io')

const app = express()
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

function updateBullets() {
  bullets = bullets.filter((bullet) => {
    bullet.x += Math.cos(bullet.angle) * bullet.speed
    bullet.y += Math.sin(bullet.angle) * bullet.speed

    // Remove bullet if it's out of bounds
    if (bullet.x < 0 || bullet.x > 2000 || bullet.y < 0 || bullet.y > 2000) {
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

module.exports = app
