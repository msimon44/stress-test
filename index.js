/*
USAGE:
node index.js

OPTIONS:
GET /
GET /?duration=n

EXAMPLE:
node index.js
PORT=3001 node index.js

WITH PM2: (npm install -g pm2)
pm2 start index.js --name "stress-test"


SCALE PM2:
pm2 scale stress-test 10
*/


const http = require("http");

const PORT = process.env.PORT || 8080;

function burnCPU(durationMs) {
  const start = Date.now();
  let count = 0;
  let num = 2;

  while (Date.now() - start < durationMs) {
    if (isPrime(num)) count++;
    num++;
  }

  return { primesFound: count, lastChecked: num, elapsedMs: Date.now() - start };
}

function isPrime(n) {
  for (let i = 2; i * i <= n; i++) {
    if (n % i === 0) return false;
  }
  return true;
}

const server = http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "healthy", pid: process.pid, uptime: process.uptime() }));
    return;
  }

  if (req.method === "GET" && req.url.split("?")[0] === "/prime") {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const duration = Math.min(parseInt(url.searchParams.get("duration") || "5000", 10), 60000);

    const result = burnCPU(duration);


    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      status: "done",
      duration: `${result.elapsedMs}ms`,
      primesFound: result.primesFound,
      lastChecked: result.lastChecked,
      pid: process.pid,
    }));
  } else {
    res.writeHead(404);
    res.end("Not found");
  }
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
