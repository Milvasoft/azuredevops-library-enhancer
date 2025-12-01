const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.css': 'text/css',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2'
};

const server = http.createServer((req, res) => {
    console.log(`${req.method} ${req.url}`);

    let filePath = req.url === '/' ? '/test/test-standalone.html' : req.url;
    filePath = path.join(__dirname, '..', filePath);

    const extname = path.extname(filePath);
    const contentType = MIME_TYPES[extname] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('404 - File Not Found');
            } else {
                res.writeHead(500);
                res.end(`Server Error: ${err.code}`);
            }
        } else {
            // Development-only CORS policy: allow only local preview origins.
            // Sonar raises a security issue for wildcard CORS; do NOT use '*' in production.
            const ALLOWED_ORIGINS = ['http://localhost:3000', 'http://127.0.0.1:3000'];
            const requestOrigin = req.headers && req.headers.origin;
            const allowOrigin = requestOrigin && ALLOWED_ORIGINS.includes(requestOrigin) ? requestOrigin : 'null';

            res.writeHead(200, {
                'Content-Type': contentType,
                'Access-Control-Allow-Origin': allowOrigin
            });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`\n🚀 Test server running!`);
    console.log(`\n📖 Open: http://localhost:${PORT}`);
    console.log(`\n✨ Preview your Library Enhancer extension locally\n`);
});
