const { spawn } = require('child_process');
const express = require('express');
const cors = require('cors');
const http = require('http');
const expressWs = require('express-ws');
const app = express();
const port = 4737;
app.use(cors());

const server = http.createServer(app);

const wsInstance = expressWs(app, server);

let botProcess;

app.get('/start-bot', (req, res) => {
  if (!botProcess || botProcess.killed) {
    botProcess = spawn('nodemon', ['src/index.js']);

    botProcess.stdout.on('data', (data) => {
      console.log(`Bot output: ${data}`);
      wsInstance.getWss().clients.forEach((client) => {
        client.send(data.toString());
      });
    });

    botProcess.stderr.on('data', (data) => {
      console.error(`Bot error: ${data}`);
      wsInstance.getWss().clients.forEach((client) => {
        client.send(data.toString());
      });
    });

    botProcess.on('close', (code) => {
      console.log(`Bot exited with code ${code}`);
    });

    res.send('Starting the Discord bot...');
  } else {
    res.send('Bot is already running.');
  }
});

app.get('/terminate-bot', async (req, res) => {
  if (botProcess && !botProcess.killed) {
    botProcess.kill();

    botProcess.on('error', (err) => {
      console.error('Error while terminating bot:', err);
      res.send('Error terminating bot.');
    });

    botProcess.on('exit', (code) => {
      if (code === 0) {
        console.log('Discord bot terminated successfully.');
        res.send('Discord bot terminated successfully.');
      } else {
        console.error('Discord bot termination failed.');
        res.send('Discord bot termination failed.');
      }
    });
  } else {
    res.send('Bot is not running.');
  }
});

app.ws('/bot-output', (ws, req) => {
  console.log('WebSocket client connected to bot output');

  ws.on('message', (message) => {
    console.log(`Received message from client: ${message}`);
  });

  ws.on('close', () => {
    console.log('WebSocket client disconnected from bot output');
  });
});

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
