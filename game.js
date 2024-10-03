const canvas = document.getElementById('gameCanvas')
const ctx = canvas.getContext('2d')

canvas.width = window.innerWidth
canvas.height = window.innerHeight

const socket = io('https://cs2d.onrender.com')

let players = {}
let bullets = []
let camera = { x: 0, y: 0 }

const MAP_SIZE = 1000

const localPlayer = {
  x: Math.random() * MAP_SIZE - MAP_SIZE / 2,
  y: Math.random() * MAP_SIZE - MAP_SIZE / 2,
  angle: 0,
  color: `rgb(${Math.floor(Math.random() * 256)},${Math.floor(
    Math.random() * 256
  )},${Math.floor(Math.random() * 256)})`,
  dead: false,
}

socket.emit('new player', localPlayer)

socket.on('update', (serverPlayers, serverBullets) => {
  players = serverPlayers
  bullets = serverBullets
})

socket.on('killed', () => {
  localPlayer.dead = true
  setTimeout(() => {
    localPlayer.dead = false
    localPlayer.x = Math.random() * MAP_SIZE - MAP_SIZE / 2
    localPlayer.y = Math.random() * MAP_SIZE - MAP_SIZE / 2
    socket.emit('new player', localPlayer)
  }, 3000)
})

function update() {
  if (!localPlayer.dead) {
    if (keys.w) localPlayer.y -= 5
    if (keys.s) localPlayer.y += 5
    if (keys.a) localPlayer.x -= 5
    if (keys.d) localPlayer.x += 5

    localPlayer.x = Math.max(
      -MAP_SIZE / 2,
      Math.min(MAP_SIZE / 2, localPlayer.x)
    )
    localPlayer.y = Math.max(
      -MAP_SIZE / 2,
      Math.min(MAP_SIZE / 2, localPlayer.y)
    )

    localPlayer.angle = Math.atan2(
      mouse.y + camera.y - localPlayer.y,
      mouse.x + camera.x - localPlayer.x
    )

    socket.emit('update player', localPlayer)
  }

  camera.x = localPlayer.x - canvas.width / 2
  camera.y = localPlayer.y - canvas.height / 2
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  ctx.strokeStyle = 'rgba(200, 200, 200, 0.2)'
  ctx.beginPath()
  for (let x = -camera.x % 100; x < canvas.width; x += 100) {
    ctx.moveTo(x, 0)
    ctx.lineTo(x, canvas.height)
  }
  for (let y = -camera.y % 100; y < canvas.height; y += 100) {
    ctx.moveTo(0, y)
    ctx.lineTo(canvas.width, y)
  }
  ctx.stroke()

  ctx.strokeStyle = 'black'
  ctx.lineWidth = 5
  ctx.strokeRect(
    -MAP_SIZE / 2 - camera.x,
    -MAP_SIZE / 2 - camera.y,
    MAP_SIZE,
    MAP_SIZE
  )

  for (let id in players) {
    const player = players[id]
    const drawX = player.x - camera.x
    const drawY = player.y - camera.y

    if (player.dead) {
      ctx.fillStyle = 'red'
      ctx.beginPath()
      ctx.arc(drawX, drawY, 20, 0, Math.PI * 2)
      ctx.fill()
    } else {
      ctx.fillStyle = player.color
      ctx.beginPath()
      ctx.arc(drawX, drawY, 20, 0, Math.PI * 2)
      ctx.fill()

      ctx.save()
      ctx.translate(drawX, drawY)
      ctx.rotate(player.angle)
      ctx.fillStyle = 'black'
      ctx.fillRect(15, -5, 25, -10)
      ctx.restore()
    }
  }

  bullets.forEach((bullet) => {
    ctx.fillStyle = 'red'
    ctx.beginPath()
    ctx.arc(bullet.x - camera.x, bullet.y - camera.y, 5, 0, Math.PI * 2)
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
  if (!localPlayer.dead) {
    socket.emit('shoot', {
      x: localPlayer.x,
      y: localPlayer.y,
      angle: localPlayer.angle,
    })
  }
})

gameLoop()
