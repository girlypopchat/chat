const http = require('http');

const hostname = '0.0.0.0';
const port = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html');
  res.end(`
    <!DOCTYPE html>
    <html>
      <head><title>girlypopchat.com</title></head>
      <body>
        <h1>Welcome to girlypopchat.com</h1>
        <p>Node.js site managed by DockLite</p>
        <p>Site path: /var/www/sites/stella/girlypopchat.com</p>
      </body>
    </html>
  `);
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});