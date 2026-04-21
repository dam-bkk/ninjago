const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server } = require('socket.io')

const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true)
    handle(req, res, parsedUrl)
  })

  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
  })

  // Make io available to API routes via global
  global.io = io

  io.on('connection', (socket) => {
    // Coach/manager joins a location room for the day
    // Room format: location-{locationId}-{date}  e.g. location-1-2026-05-10
    socket.on('join:location', ({ locationId, date }) => {
      const room = `location-${locationId}-${date}`
      socket.join(room)
    })

    socket.on('leave:location', ({ locationId, date }) => {
      const room = `location-${locationId}-${date}`
      socket.leave(room)
    })

    socket.on('disconnect', () => {})
  })

  const port = process.env.PORT || 3000
  httpServer.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`)
  })
})
