import 'dotenv/config'
import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { GirlyPopChatServer } from './mini-services/chat-server/index'

const port = parseInt(process.env.PORT || '3012', 10)
const app = next({ dev: false, hostname: 'localhost', port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true)
    handle(req, res, parsedUrl)
  })

  new GirlyPopChatServer(server)

  server.listen(port, () => {
    console.log(`🚀 GirlyPopChat ready on port ${port}`)
  })
}).catch(console.error)
