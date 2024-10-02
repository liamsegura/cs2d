const express = require('express')
const http = require('http')
const socketIO = require('socket.io')
const cors = require('cors')

const app = express()

// Use CORS middleware
app.use(
  cors({
    origin: ['http://127.0.0.1:5501', 'https://cs2d2.netlify.app'], // Allow specific origins
    methods: ['GET', 'POST'],
  })
)

const server = http.createServer(app)
const io = socketIO(server, {
  cors: {
    origin: ['http://127.0.0.1:5501', 'https://cs2d2.netlify.app'], // Allow specific origins
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
})

const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})

module.exports = app
