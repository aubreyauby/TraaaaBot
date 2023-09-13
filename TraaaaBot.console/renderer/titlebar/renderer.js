const { ipcRenderer } = require('electron');

document.onreadystatechange = (event) => {
    if (document.readyState == "complete") {
        handleWindowControls();
    }
};

window.onbeforeunload = (event) => {
    win.removeAllListeners();
}

function handleWindowControls() {
    document.getElementById('min-button').addEventListener("click", event => {
      ipcRenderer.send('minimize-window');
    });
  
    document.getElementById('max-button').addEventListener("click", event => {
      ipcRenderer.send('maximize-window');
    });
  
    document.getElementById('restore-button').addEventListener("click", event => {
      ipcRenderer.send('restore-window');
    });
  
    document.getElementById('close-button').addEventListener("click", event => {
      ipcRenderer.send('close-window');
    });
  
    toggleMaxRestoreButtons();
  
    ipcRenderer.on('window-maximized', toggleMaxRestoreButtons);
    ipcRenderer.on('window-restored', toggleMaxRestoreButtons);
  
    function toggleMaxRestoreButtons() {
      ipcRenderer.send('get-window-state');
  
      ipcRenderer.on('window-state', (event, isMaximized) => {
        if (isMaximized) {
          document.body.classList.add('maximized');
        } else {
          document.body.classList.remove('maximized');
        }
      });
    }
  }