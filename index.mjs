import http from "http";
import https from "https";
import chalk from "chalk";
import bytes from "bytes";

let TARGET_BASE_URL = "https://github.com/mistydemeo/cargodisttest/releases/download/v0.2.263";

let server = http.createServer((req, res) => {
  const startTime = Date.now();
  let bytesTransferred = 0;

  let path = req.url;
  console.log(chalk.cyan(`📥 Incoming ${req.method} ${path}`));

  let expectedPrefix = "/blah/blah";

  if (!path.startsWith(expectedPrefix)) {
    console.log(chalk.red(`❌ 404 Not Found - Invalid prefix`));
    res.writeHead(404);
    res.end("Not Found");
    return;
  }
  path = path.slice(expectedPrefix.length);

  // Set the target URL
  let targetUrl = `${TARGET_BASE_URL}${path}`;
  console.log(chalk.yellow(`🎯 Proxying to: ${targetUrl}`));

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
          console.log(chalk.blue(`🔄 Following redirect to: ${proxyRes.headers.location}`));
          https.get(proxyRes.headers.location, (finalRes) => {
            console.log(
              chalk.green(`✨ Final response received with status: ${finalRes.statusCode}`),
            );
            res.writeHead(finalRes.statusCode, finalRes.headers);

            finalRes.on("data", (chunk) => {
              bytesTransferred += chunk.length;
            });

            finalRes.pipe(res, { end: true });

            finalRes.on("end", () => {
              const duration = Date.now() - startTime;
              console.log(
                chalk.magenta(
                  `✅ Response complete in ${duration}ms, transferred ${bytes(bytesTransferred)}`,
                ),
              );
            });
          });
        } else {
          console.log(chalk.green(`✨ Response received with status: ${proxyRes.statusCode}`));
          res.writeHead(proxyRes.statusCode, proxyRes.headers);

          proxyRes.on("data", (chunk) => {
            bytesTransferred += chunk.length;
          });

          proxyRes.pipe(res, { end: true });

          proxyRes.on("end", () => {
            const duration = Date.now() - startTime;
            console.log(
              chalk.magenta(
                `✅ Response complete in ${duration}ms, transferred ${bytes(bytesTransferred)}`,
              ),
            );
          });
        }
      },
    )
    .on("error", (err) => {
      console.log(chalk.red(`💥 Error occurred: ${err.message}`));
      res.writeHead(500);
      res.end(`Error: ${err.message}`);
    });
});

server.listen(8000, () => {
  console.log(chalk.green(`🚀 Proxy server running at http://localhost:8000`));
});
