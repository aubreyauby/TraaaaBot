const stopDialog = document.getElementById('stop-dialog');
const offlineDialog = document.getElementById('offline-dialog');

const startBotButton = document.getElementById("startBotButton");
const stopBotButton = document.getElementById("stopBotButton");

const timerContainer = document.getElementById("timer-container");
const terminalSocket = new WebSocket("ws://localhost:4737/terminal");
const fontSize = 14;

const { Terminal } = require('xterm')

var term = new Terminal({ cols: calculateCols(), fontSize: 14, });

let consoleLocked = false;
let isBotStarting = false;
let botSocket;
let showPrompt = true;
let isBotStopped = false;

terminalSocket.addEventListener("message", (event) => {
  try {
    const message = JSON.parse(event.data);
    if (message.type === "error") {
      const errorMessage = message.message;
      showErrorBar(errorMessage);
    }
  } catch (error) {
    console.error("Error processing message:", error);
  }
});

function calculateCols() {
  const screenWidth = window.innerWidth;
  const columnWidth = Math.floor(screenWidth / (fontSize * 0.6));
  return columnWidth;
}

window.addEventListener("resize", () => {
  term.resize(calculateCols(), term.rows);
});

function showErrorBar(errorMessage) {
  const errorBar = document.getElementById("error-bar");
  const errorMessageElement = document.getElementById("error-message");

  errorMessageElement.innerHTML = `<span style="font-family: monospace;">${errorMessage}</span>`;

  errorBar.style.display = "block";
}

window.addEventListener("error", (event) => {
  const errorMessage = event.message || "Unknown error";
  showErrorBar(errorMessage);
});

async function isProblematicIP(ipAddress) {
  try {
    // Fetch the list of blacklisted IPs from the API
    const response = await fetch("http://localhost:5001/secure/blacklisted_IPs.json");
    if (!response.ok) {
      throw new Error(`Request failed with status: ${response.status}`);
    }
    const data = await response.json();

    // Check if the user's IP is in the list of blacklisted IPs
    if (data.ips && Array.isArray(data.ips) && data.ips.includes(ipAddress)) {
      // User's IP is in the blacklist
      return true;
    } else {
      // User's IP is not in the blacklist
      return false;
    }
  } catch (error) {
    console.error("Error checking IP:", error);
    showErrorBar(error.message); // Display the error message
    return false; // Default to false in case of an error
  }
}

function showProblematicDialog(dialogId) {
  const problematicDialog = document.getElementById(dialogId);

  // Display the problematic dialog
  problematicDialog.style.top = "0";
  problematicDialog.style.opacity = "1";

  const problematicOkButton = problematicDialog.querySelector(".dialog-buttons button");

  // The OK button
  problematicOkButton.addEventListener("click", () => {
    problematicDialog.style.top = "-100%";
    problematicDialog.style.opacity = "0";
  });
}

async function checkAndShowProblematicDialog() {
  try {
    const isIPProblematic = await fetchUserIPAndCheck();

    if (isIPProblematic) {
      showProblematicDialog("blacklist-ip-dialog");
      stopBot(); // Stop the bot if the IP is problematic
      return;
    } else {
      // User's IP is not problematic, continue with other actions
    }
  } catch (error) {
    console.error("Error detecting or checking IPv4 address:", error);
    showErrorBar(`Error detecting or checking IPv4 address: ${error}`);
  }
}

term.open(document.getElementById("terminal"));

function displayMessage(message, textColor = "255;255;255") {
  // Replace 'stevengarciadelbusto' with 'electrasys' in the message
  message = message.replace(/stevengarciadelbusto/g, "electrasys");

  const isInputPrompt = message.startsWith("traaaabot $ ");

  if (isInputPrompt) {
    // Move to the next line before displaying the prompt
    term.writeln("");
    // Display the prompt on the new line
    term.write(`\x1B[38;2;255;255;255m${message}\x1B[0m`);
  } else {
    const lines = message.split("\n"); // Split the message into lines
    lines.forEach((line, index) => {
      if (index === 0) {
        // For the first line, display it without a newline
        term.write(`\x1B[38;2;${textColor}m${line}\x1B[0m`);
      } else {
        // For subsequent lines, move to the next line and display the content
        term.writeln("");
        term.write(`\x1B[38;2;${textColor}m${line}\x1B[0m`);
      }
    });
  }
}

function showPromptIfNeeded() {
  if (showPrompt) {
    displayMessage("traaaabot $ ");
  }
}

// The introductory messages
const currentYear = new Date().getFullYear();
displayMessage(`© ${currentYear} GXX: by electrasys. All rights reserved.\n`);
displayMessage(
  `Remember to routinely check for updates to get the latest bug fixes, performance enhancements, new features, and other crucial changes.\n`
);

displayMessage("traaaabot $ ");

let commandBuffer = "";

term.onData((data) => {
  if (consoleLocked) return;
  if (data === "\r") {
    if (commandBuffer.trim() === "") {
      showPromptIfNeeded();
    } else {
      term.write("\r\n");
      const command = commandBuffer.trim().toLowerCase();

      if (command === "help") {
        displayMessage('Available Commands:\n', '255;255;0')
        displayMessage('- help: Shows the list of commands for TraaaaBot Console.\n');
        displayMessage('- start: Start an attempt to connect to TraaaaBot on Discord.\n')
        displayMessage('- clear: Clear the console window.\n')
        showPrompt = true;
        showPromptIfNeeded();
      } else if (command === "clear") {
        term.clear();
        showPrompt = true;
        showPromptIfNeeded();
      } else if (command === "start") {
        fetchUserIPAndCheck().then((isIPProblematic) => {
          if (isIPProblematic) {
            showProblematicDialog("blacklist-ip-dialog");
            checkAndShowProblematicDialog();
            showPrompt = true;
            showPromptIfNeeded();
          } else {
            showPrompt = false;
            startBot();
            startBotButton.style.display = "none";
            stopBotButton.style.display = "flex";
            startBotButton.disabled = true;
            stopBotButton.disabled = false;
            startTimer();
            simulateTypingAndEnter("start");
          }
        });
      } else if (command !== "") {
        const knownCommands = ["help", "start", "clear"];
        if (!knownCommands.includes(command)) {
          displayMessage(`err: command not found: ${command}\nType help for a list of commands.`, "255;114;118");
        }
        showPrompt = true;
        showPromptIfNeeded();
      }
    }
    commandBuffer = "";
  } else if (data === "\x7F") {
    if (commandBuffer.length > 0) {
      commandBuffer = commandBuffer.slice(0, -1);
      term.write("\b \b");
    }
  } else if (data === "\x03") {
    if (showPrompt) {
      term.write("\r");
      showPromptIfNeeded();
    } else {
      term.write("^C");
    }
  } else {
    commandBuffer += data;
    term.write(data);
  }
});

function unlockConsole() {
  consoleLocked = false;
  console.log("Console unlocked");
  isBotStarting = false;

  startBotButton.disabled = false;
  startBotButton.textContent = "Start";
  startBotButton.style.color = "";
  startBotButton.style.border = "";

  term.focus();
}

async function startBot() {
  try {
    const isIPProblematic = await fetchUserIPAndCheck();
    console.log('Is IP problematic in startBot?', isIPProblematic);

    if (isIPProblematic) {
      showProblematicDialog("blacklist-ip-dialog");
      return;
    }

      try {
        console.log('running bot');
        isBotStopped = true;
        showPrompt = false;
        displayMessage("Establishing a connection for TraaaaBot to Discord...");
        botSocket = new WebSocket("ws://localhost:4737/bot-output");
    
        try {
          term.attachCustomKeyEventHandler(() => {
            return false;
          });
        } catch (err) {
          console.log("unable to lock the console:", err);
        }
    
        botSocket.onmessage = (event) => {
          const output = event.data;
          displayMessage(output);
        };
    
        botSocket.onclose = () => {
          stopBot();
          unlockConsole();
        };
    
        botSocket.onerror = (error) => {
          console.error("WebSocket error:", error);
    
          displayMessage(`WebSocket error: ${error.message}`, "255;0;0");
          showPrompt = true;
          showPromptIfNeeded();
    
          // Re-enable the Start button
          startBotButton.disabled = false;
          startBotButton.textContent = "Start";
          showErrorBar(error);
          unlockConsole();
        };
    
        fetch("http://localhost:4737/start-bot", { method: "GET" })
          .then((response) => {
            if (!response.ok) {
              throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.text();
          })
          .then((output) => {
            displayMessage("\n" + output);
          })
          .catch((error) => {
            console.error("err:", error);
            displayMessage("\n" + `err: ${error.message}`, "255;0;0");
            showErrorBar(error);
          });
      } catch (err) {
        displayMessage(`err: ${err.stack}`, "255;0;0");
        stopBot();
        startBotButton.disabled = false;
        startBotButton.textContent = "Start";
        unlockConsole();
      }
  } catch (error) {
    console.error("Error starting bot:", error);
    showErrorBar(`Error starting bot: ${error}`);
  }
}
  
function stopBot() {
  // Check if the bot is already stopped
  if (isBotStopped) {
    return;
  }
  
  isBotStopped = true; // Set the flag to true
  // Close the WebSocket connection
  if (botSocket) {
    botSocket.close();
  }
  // Terminate the bot process (You may need to adjust this part based on your setup)
  fetch('http://localhost:4737/terminate-bot', { method: 'GET' })
    .catch((error) => {
      console.error("Error terminating bot:", error);
    });
}

function simulateTypingAndEnter(text) {
  // Check if the entered text is "start"
  if (text.toLowerCase() === "start") {
    // Show the prompt and allow the user to input
    showPrompt = true;
    showPromptIfNeeded();
  } else {
    // Perform IP checking and show the problematic dialog
    fetchUserIPAndCheck().then((isIPProblematic) => {
      if (isIPProblematic) {
        showProblematicDialog("blacklist-ip-dialog");
        checkAndShowProblematicDialog();
        // Terminate the bot if the IP is problematic
        return;
      } else {
        const delayBetweenKeystrokes = 0;
        const command = text + "\r";

        let currentIndex = 0;

        function typeNextCharacter() {
          if (currentIndex < command.length) {
            term.write(command[currentIndex]);
            currentIndex++;
            setTimeout(typeNextCharacter, delayBetweenKeystrokes);
          } else {
            setTimeout(() => {
              const event = new KeyboardEvent("keydown", {
                key: "Enter",
                code: "Enter",
                keyCode: 13,
                which: 13,
                charCode: 13,
              });

              term.textarea.dispatchEvent(event);

              startBotButton.disabled = true;
              stopBotButton.disabled = false;
            }, delayBetweenKeystrokes);
          }
        }

        term.focus();
        typeNextCharacter();
      }
    }).catch((err) => {
      displayMessage(`err: ${err.stack}`, "255;0;0");
      stopBot(); // Terminate the bot if an error occurs
      startBotButton.disabled = false;
      startBotButton.textContent = "Start";
      unlockConsole();
    });
  }
}


let timerInterval;
let timerSeconds = 0;
let timerMinutes = 0;
let timerHours = 0;

// Function to update the timer element's content
function updateTimer() {
  timerSeconds++;
  if (timerSeconds >= 60) {
    timerSeconds = 0;
    timerMinutes++;
    if (timerMinutes >= 60) {
      timerMinutes = 0;
      timerHours++;
    }
  }

  const formattedHours = String(timerHours).padStart(2, "0");
  const formattedMinutes = String(timerMinutes).padStart(2, "0");
  const formattedSeconds = String(timerSeconds).padStart(2, "0");

  const timerElement = document.getElementById("timer");
  timerElement.textContent = `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
}

// Function to start the timer
function startTimer() {
  timerContainer.style.display = "block";
  timerInterval = setInterval(updateTimer, 1000);
}

// Function to stop the timer
function stopTimer() {
  clearInterval(timerInterval);
}


// Event listener for the "Start" button
startBotButton.addEventListener("click", () => {
  fetchUserIPAndCheck().then((isIPProblematic) => {
    if (isIPProblematic) { return showProblematicDialog("blacklist-ip-dialog");
    } else {
      startBotButton.style.display = "none";
      stopBotButton.style.display = "flex";
      stopBotButton.disabled = false;
      startBotButton.disabled = true;
      try { startBot(); }
      catch (e) {
        showErrorBar(e);
        startBotButton.style.display = "flex";
        stopBotButton.style.display = "none";
        stopBotButton.disabled = true;
        startBotButton.disabled = false;
      }
      startTimer();
      simulateTypingAndEnter("start");
    }
  });
});

stopBotButton.addEventListener('click', () => {
  console.log('i was clicked');
  showProblematicDialog("stop-dialog");
});

const stopYesButton = document.getElementById('stop-yes-button');
stopYesButton.addEventListener('click', () => {
  timerContainer.style.display = "none";
  // Reset the timer values to 00:00:00
  timerSeconds = 0;
  timerMinutes = 0;
  timerHours = 0;

  const timerElement = document.getElementById("timer");
  timerElement.textContent = "00:00:00";

  fetch('http://localhost:4737/terminate-bot', { method: 'GET' })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.text();
    })
    .then(() => {
      if (botSocket) {
        botSocket.close();
      }

      stopBot();
      stopTimer();

      stopDialog.style.top = '-100%';
      term.attachCustomKeyEventHandler(null);
      showPrompt = true;
      showPromptIfNeeded();

      startBotButton.style.display = "flex";
      stopBotButton.style.display = "none";
      startBotButton.disabled = false;
      stopBotButton.disabled = true;
    })
    .catch((error) => {
      console.error(`Error terminating bot: ${error}`);
      stopDialog.style.top = '-100%';
    });
});

const stopNoButton = document.getElementById('stop-no-button');
stopNoButton.addEventListener('click', () => {
  stopDialog.style.top = '-100%';
});

window.addEventListener('DOMContentLoaded', () => {
  fetchUserIPAndCheck();
});

async function fetchUserIPAndCheck() {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    const userIPAddress = data.ip;

    const isIPProblematic = await isProblematicIP(userIPAddress);
    console.log('Is IP problematic?', isIPProblematic);

    if (isIPProblematic) {
      showProblematicDialog("blacklist-ip-dialog");
    }

    return isIPProblematic;
  } catch (error) {
    console.error('Error fetching or checking IP address:', error);
    showErrorBar(`Error fetching or checking IP address: ${error}`);
    return false;
  }
}