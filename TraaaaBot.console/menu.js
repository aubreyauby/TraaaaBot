const { app, Menu, dialog, BrowserWindow } = require('electron');
const path = require('path');
const url = require('url');

let settingsWindow;

function buildMenu(mainWindow) {
  const applicationMenu = [
    {
      label: app.name,
      submenu: [
        {
          label: `About ${app.name}`,
          role: 'about',
        },
        {
          label: `Check for Updates...`,
        },
        { type: 'separator' },
        {
          label: 'Restart TraaaaBot Console...',
          click: async () => {
            const response = await dialog.showMessageBox(mainWindow, {
              type: 'warning',
              buttons: ['Yes', 'No'],
              defaultId: 0,
              title: 'Confirm Restart',
              message: 'Are you sure you want to restart TraaaaBot Console?',
              detail: 'If the bot is running, make sure you gracefully stop it first to prevent any potential data loss, as closing the console while it is running will forcibly shut it down.\n\nRestarting will close this session and reopen a new one.',
            });

            if (response.response === 0) {
              app.relaunch();
              app.exit();
            }
          },
        },
        {
          label: 'Settings',
          submenu: [
            {
              label: 'TraaaaBot (Discord Bot)',
              type: 'normal',
              accelerator: 'Command+,',
              acceleratorWorksWhenHidden: true,
              click: () => {
                if (!settingsWindow) {
                  settingsWindow = new BrowserWindow({
                    width: 800,
                    minWidth: 800,
                    height: 600,
                    minHeight: 600,
                    fullscreenable: false,
                    minimizable: false,
                    webPreferences: {
                      nodeIntegration: true,
                    },
                  });
              
                  settingsWindow.on('closed', () => {
                    settingsWindow = null;
                  });
              
                  // Load the settings.html file
                  settingsWindow.loadURL(url.format({
                    pathname: path.join(__dirname, 'renderer/TraaaaBot.console.settings/settings.html'),
                    protocol: 'file:',
                    slashes: true,
                  }));
                }
              },
            },
            {
              label: 'Console',
              type: 'normal',
              accelerator: 'Command+.',
              acceleratorWorksWhenHidden: true,
              click: () => console.log('Clicked Console'),
            },
            {
              label: 'Dashboard',
              type: 'normal',
              accelerator: 'Command+/',
              acceleratorWorksWhenHidden: true,
              click: () => console.log('Clicked Dashboard'),
            },
          ],
        },
        { type: 'separator' },
        {
          label: 'Services',
          role: 'services',
          submenu: [],
        },
        { type: 'separator' },
        {
          label: `Hide ${app.name}`,
          role: 'hide',
          accelerator: 'Command+H',
          acceleratorWorksWhenHidden: true,
        },
        {
          label: 'Hide Others',
          role: 'hideOthers',
          accelerator: 'Option+Command+H',
          acceleratorWorksWhenHidden: true,
        },
        {
          label: 'Show All',
          role: 'unhide',
        },
        { type: 'separator' },
        {
          label: `Quit ${app.name}`,
          role: 'quit',
        },
      ],
    },
  ];

  const appMenu = Menu.buildFromTemplate(applicationMenu);
  Menu.setApplicationMenu(appMenu);
}

module.exports = buildMenu;

app.whenReady().then(buildMenu);