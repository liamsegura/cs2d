const canvas = document.getElementById('gameCanvas')
const ctx = canvas.getContext('2d')

canvas.width = window.innerWidth
canvas.height = window.innerHeight

const socket = io('http://localhost:3000')

let players = {}
let bullets = []

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

function update() {
  if (keys.w) localPlayer.y -= 5
  if (keys.s) localPlayer.y += 5
  if (keys.a) localPlayer.x -= 5
  if (keys.d) localPlayer.x += 5

  localPlayer.angle = Math.atan2(
    mouse.y - localPlayer.y,
    mouse.x - localPlayer.x
  )

  socket.emit('update player', localPlayer)
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height)

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
