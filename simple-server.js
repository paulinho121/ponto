const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const DIRECTORY = '.';

const server = http.createServer((req, res) => {
  let filePath = path.join(process.cwd(), req.url);

  // Tratar rota raiz
  if (filePath.endsWith('/')) {
    filePath += 'index.html';
  }

  // Obter extensão do arquivo para definir o Content-Type
  const extname = path.extname(filePath);
  let contentType = 'text/html';

  switch (extname) {
    case '.js':
      contentType = 'text/javascript';
      break;
    case '.css':
      contentType = 'text/css';
      break;
    case '.json':
      contentType = 'application/json';
      break;
    case '.png':
      contentType = 'image/png';
      break;
    case '.jpg':
    case '.jpeg':
      contentType = 'image/jpeg';
      break;
    case '.gif':
      contentType = 'image/gif';
      break;
    case '.svg':
      contentType = 'image/svg+xml';
      break;
    case '.ico':
      contentType = 'image/x-icon';
      break;
    default:
      contentType = 'text/html';
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // Arquivo não encontrado, retornar index.html para rotas SPA
        fs.readFile(path.join(process.cwd(), 'index.html'), (err, content) => {
          if (err) {
            res.writeHead(500);
            res.end('Erro interno do servidor');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(content, 'utf-8');
          }
        });
      } else {
        res.writeHead(500);
        res.end(`Erro interno do servidor: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
  console.log('Pressione Ctrl+C para parar o servidor');
});