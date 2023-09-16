const { spawn } = require('child_process');
const express = require('express');
const cors = require('cors');
const http = require('http');
const expressWs = require('express-ws');
const dotenv = require('dotenv');
const RichPresence = require("rich-presence-builder")
const app = express();
const port = 4737;
app.use(cors());
dotenv.config();

const rp = new RichPresence({ clientID: '1152028710816448522' })
.setLargeImage('trans', "TraaaaBot Console")
.setSmallImage('estrog', "Built by electrasys")
.setState('and Estrogen')
.setDetails('Eating Progesterone')

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

app.get('/get-token', (req, res) => {
  const token = process.env.TOKEN || 'TOKEN not found in .env file';
  res.send(token);
});

app.post('/set-rich-presence', (req, res) => {
    rp.go()
    .then(() => {
      console.log('Discord Rich Presence set successfully.');
      res.send('Discord Rich Presence set successfully.');
    })
    .catch((err) => {
      console.error('Error setting Discord Rich Presence:', err);
      res.status(500).send('Error setting Discord Rich Presence.');
    });
});


app.post('/stop-rich-presence', (req, res) => {
  rp.clear();
});

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
