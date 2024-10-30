import http from "http";
import https from "https";

let TARGET_BASE_URL = "https://github.com/mistydemeo/cargodisttest/releases/download/v0.2.263";

let server = http.createServer((req, res) => {
  let path = req.url;

  let expectedPrefix = "/blah/blah";

  if (!path.startsWith(expectedPrefix)) {
    res.writeHead(404);
    res.end("Not Found");
    return;
  }
  path = path.slice(expectedPrefix.length);

  // Set the target URL
  let targetUrl = `${TARGET_BASE_URL}${path}`;

  // Perform an HTTPS request to the target URL
  https
    .get(
      targetUrl,
      {
        followAllRedirects: true,
        maxRedirects: 10,
      },
      (proxyRes) => {
        // Check if it's a redirect
        if (proxyRes.statusCode >= 300 && proxyRes.statusCode < 400 && proxyRes.headers.location) {
          https.get(proxyRes.headers.location, (finalRes) => {
            res.writeHead(finalRes.statusCode, finalRes.headers);
            finalRes.pipe(res, { end: true });
          });
        } else {
          res.writeHead(proxyRes.statusCode, proxyRes.headers);
          proxyRes.pipe(res, { end: true });
        }
      },
    )
    .on("error", (err) => {
      res.writeHead(500);
      res.end(`Error: ${err.message}`);
    });
});

server.listen(8000, () => {
  console.log("Proxy server running at http://localhost:8000");
});
