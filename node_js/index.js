import http from "http"
/*
const httpServer = http.createServer((req,res)=>{
    const { method, url } = req;

    if(method==='GET' && url==='/')

    res.end("hii this is a simple server");
});
httpServer.listen(3000)



const server1 = http.createServer((req, res) => {

  if (method === 'GET' && url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Home page');
  } else if (method === 'GET' && url === '/about') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('About page');
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

server1.listen(3000);

*/

// this code has all the function the http have.

// 1. http.createServer()
const server = http.createServer((req, res) => {
    console.log("Server received:", req.method, req.url);
    res.writeHead(200, {
        "Content-Type": "text/plain"
    });

    res.end("Hello from server");
});

server.listen(3000, () => {
    console.log("Server running on port 3000");


    const request = http.request(
        {
            hostname: "localhost",
            port: 3000,
            path: "/users",
            method: "GET"
        },
        (response) => {
            console.log("request() status:", response.statusCode);

            response.on("data", (chunk) => {
                console.log("request() response:", chunk.toString());
            });

            response.on("end", () => {
                console.log("request() finished");
            });
        }
    );

    request.end();

    http.get(
        "http://localhost:3000/products",
        (response) => {
            console.log("get() status:", response.statusCode);

            response.on("data", (chunk) => {
                console.log("get() response:", chunk.toString());
            });

            response.on("end", () => {
                console.log("get() finished");
                
                server.close();
            });
        }
    );
});


