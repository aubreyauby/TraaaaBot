const path = require('path');
const url = require('url');
const { app: traaaabotConsole, BrowserWindow, dialog, ipcMain, Menu } = require('electron');
const axios = require('axios');
const applicationMenu = require('./menu.js');

let mainWindow;
let isCancelClicked = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    height: 900,
    minHeight: 900,
    width: 1200,
    minWidth: 1200,
    frame: false,
    fullscreenable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      devTools: true,
      preload: path.join(__dirname, 'preload.js')
    },
  });

  // For developmental purposes, toggle false if you don't want to show Dev Tools.
  // If otherwise, set to true.
  let showDev = true;
  if (showDev) { mainWindow.webContents.openDevTools(); }

  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, 'renderer/index.html'),
      protocol: 'file:',
      slashes: true,
    })
  );

  let isClosing = false;

  mainWindow.on('close', async (e) => {
    if (!isClosing) {
      e.preventDefault();
  
      const options = {
        type: 'question',
        buttons: ['Terminate', 'Cancel'],
        defaultId: 0,
        title: 'Question',
        message: 'Terminate Console?',
        detail: 'Any active tasks will be exited immediately, and any unsaved data will be lost.',
      };
  
      const response = await dialog.showMessageBox(mainWindow, options);
  
      if (response.response === 0) {
        try {
          // Run terminate-bot on localhost, which terminates all processes of the bot
          const response = await axios.get('http://localhost:4737/terminate-bot');
          if (response.status === 200) {
            console.log('Termination request successful.');
          } else {
            console.error('Termination request failed with status code:', response.status);
          }
          
          // Handle the process for closing the window and ending the app process
          isClosing = true;
          mainWindow.destroy();
          process.kill(process.pid, 'SIGINT');
        } catch (error) {
          // If there is an issue terminating the error, catch the error and state why it failed.
          console.error('Error terminating the server:', error.stack);
          process.exit(1);
        }
      } else if (response.response === 1) { isCancelClicked = true; }
    }
  });

  mainWindow.on('closed', function () {
    mainWindow = null;
  });

  // Prevent the user from refreshing the page with Ctrl/Command + R.
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.type === 'keyDown' && (input.control || input.meta) && input.key.toLowerCase() === 'r') {
      event.preventDefault();
    }
  });
}

traaaabotConsole.on('ready', () => {
  createWindow();

  const appMenu = Menu.buildFromTemplate(applicationMenu);
  Menu.setApplicationMenu(appMenu);

  ipcMain.on('close-app', () => {
    app.quit();
  })

  ipcMain.on('start-bot', () => {
    startBot();
  });
});

traaaabotConsole.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    traaaabotConsole.quit();
  }
});

traaaabotConsole.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});

traaaabotConsole.on('before-quit', (e) => {
  if (isCancelClicked) {
    e.preventDefault();
  }
});

ipcMain.on('minimize-window', () => {
  mainWindow.minimize();
});

ipcMain.on('maximize-window', () => {
  if (mainWindow.isMaximized()) {
    mainWindow.restore();
  } else {
    mainWindow.maximize();
  }
});

ipcMain.on('restore-window', () => {
  mainWindow.restore();
});

ipcMain.on('close-window', () => {
  mainWindow.close();
});

ipcMain.on('get-window-state', (event) => {
  event.sender.send('window-state', mainWindow.isMaximized());
});
