// test_proxy.js
import { createServer } from 'http';
import handler from './api/jikan.js';

const server = createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const query = Object.fromEntries(url.searchParams.entries());
  
  const mockReq = { query };
  const mockRes = {
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      res.writeHead(this.statusCode || 200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
    },
    setHeader: function(key, value) {
      res.setHeader(key, value);
    }
  };
  
  handler(mockReq, mockRes);
});

server.listen(3000, async () => {
  console.log("Server listening on 3000");
  try {
    const r1 = await fetch('http://localhost:3000/?endpoint=/anime&q=one%20piece&limit=1');
    const d1 = await r1.json();
    console.log("One Piece Test:", d1.data ? "Success" : "Failed");
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
});
