// import http from "http";

// const server = http.createServer((request, response) => {
// 	if (request.method === "GET" && request.url === "/error") {
// 		throw new Error("This is an intentional test error");
// 	}

// 	if (request.method === "GET" && request.url === "/") {
// 		response.writeHead(200, { "Content-Type": "text/plain" });
// 		response.end("Hello from the Node.js server!");
// 		return;
// 	}

// 	response.writeHead(404, { "Content-Type": "text/plain" });
// 	response.end("Not found");
// });

// server.listen(3000, () => {
// 	console.log("Server running at http://localhost:3000");
// });


import express from 'express';

const app = express();
const port = 3000;

app.get('/', (req, res) => {
  throw new Error('BROKEN'); // Express will catch this on its own.
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});