const canvas = document.getElementById('gameCanvas')
const ctx = canvas.getContext('2d')

canvas.width = window.innerWidth
canvas.height = window.innerHeight

const socket = io('https://cs2d.onrender.com')

let players = {}
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

const localPlayer = {
  x: Math.random() * canvas.width,
  y: Math.random() * canvas.height,
  angle: 0,
  color: `rgb(${Math.floor(Math.random() * 256)},${Math.floor(
    Math.random() * 256
  )},${Math.floor(Math.random() * 256)})`,
}

socket.emit('new player', localPlayer)

socket.on('update', (serverPlayers, serverBullets) => {
  players = serverPlayers
  bullets = serverBullets
})

function isCollidingWithWall(x, y) {
  const col = Math.floor(x / TILE_SIZE)
  const row = Math.floor(y / TILE_SIZE)
  return map[row] && map[row][col] === 1
}

function update() {
  if (keys.w && !isCollidingWithWall(localPlayer.x, localPlayer.y - 5))
    localPlayer.y -= 5
  if (keys.s && !isCollidingWithWall(localPlayer.x, localPlayer.y + 5))
    localPlayer.y += 5
  if (keys.a && !isCollidingWithWall(localPlayer.x - 5, localPlayer.y))
    localPlayer.x -= 5
  if (keys.d && !isCollidingWithWall(localPlayer.x + 5, localPlayer.y))
    localPlayer.x += 5

  localPlayer.angle = Math.atan2(
    mouse.y - localPlayer.y,
    mouse.x - localPlayer.x
  )

  socket.emit('update player', localPlayer)
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // Draw the map
  for (let row = 0; row < map.length; row++) {
    for (let col = 0; col < map[row].length; col++) {
      if (map[row][col] === 1) {
        ctx.fillStyle = 'gray'
        ctx.fillRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE)
      }
    }
  }

  // Draw players
  for (let id in players) {
    const player = players[id]
    ctx.fillStyle = player.color
    ctx.beginPath()
    ctx.arc(player.x, player.y, 20, 0, Math.PI * 2)
    ctx.fill()

    ctx.save()
    ctx.translate(player.x, player.y)
    ctx.rotate(player.angle)
    ctx.fillStyle = 'black'
    ctx.fillRect(15, -5, 20, 10)
    ctx.restore()
  }

  // Draw bullets
  bullets.forEach((bullet) => {
    ctx.fillStyle = 'red'
    ctx.beginPath()
    ctx.arc(bullet.x, bullet.y, 5, 0, Math.PI * 2)
    ctx.fill()
  })
}

function gameLoop() {
  update()
  draw()
  requestAnimationFrame(gameLoop)
}

const keys = { w: false, a: false, s: false, d: false }
const mouse = { x: 0, y: 0 }

document.addEventListener('keydown', (e) => (keys[e.key] = true))
document.addEventListener('keyup', (e) => (keys[e.key] = false))
document.addEventListener('mousemove', (e) => {
  mouse.x = e.clientX
  mouse.y = e.clientY
})
document.addEventListener('click', () => {
  socket.emit('shoot', {
    x: localPlayer.x,
    y: localPlayer.y,
    angle: localPlayer.angle,
  })
})

gameLoop()
