// settings.js
function changeTab(clickedItem) {
    // Remove the "active" class from all menu items
    const menuItems = document.querySelectorAll('.menu li a');
    menuItems.forEach(item => item.classList.remove('active'));

    // Add the "active" class to the clicked menu item
    clickedItem.classList.add('active');
}

document.addEventListener("DOMContentLoaded", function () {        
    const generalTab = document.getElementById("general");
    const extensionsTab = document.getElementById("extensions");
    const advancedTab = document.getElementById("advanced");
    const tokenInput = document.getElementById("token"); 

    // Initially, hide the Advanced tab content
    advancedTab.style.display = "none";

    const generalMenuItem = document.querySelector(".menu li a[href='#general']");
    const extensionsMenuItem = document.querySelector(".menu li a[href='#extensions']");
    const advancedMenuItem = document.querySelector(".menu li a[href='#advanced']");

    generalMenuItem.addEventListener("click", function () {
        generalTab.style.display = "block";
        extensionsTab.style.display = "none";
        advancedTab.style.display = "none";
        changeTab(generalMenuItem);
    });

    extensionsMenuItem.addEventListener("click", function () {
        generalTab.style.display = "none";
        extensionsTab.style.display = "block";
        advancedTab.style.display = "none";
        changeTab(extensionsMenuItem);
    })

    advancedMenuItem.addEventListener("click", function () {
        generalTab.style.display = "none";
        extensionsTab.style.display = "none";
        advancedTab.style.display = "block";
        changeTab(advancedMenuItem);
    });

    // Initially set the "active" class for the General menu item
    changeTab(generalMenuItem);

    // Fetch the token value from the server
    fetch('http://localhost:4737/get-token')
    .then(response => response.text())
    .then(token => {
        tokenInput.value = token; // Set the value property with the fetched token
        console.log("Token:", token); // Log the token to the console
    })
    .catch(error => {
        tokenInput.value = `Error fetching token: ${error.message}`;
        console.error("Error fetching token:", error);
    });

    const discordRichPresenceCheckbox = document.getElementById('discord-rich-presence');
    const richPresenceSelection = document.getElementById('rich-presence-selection');

    // Add an event listener to the checkbox
    discordRichPresenceCheckbox.addEventListener('change', function () {
        if (discordRichPresenceCheckbox.checked) {
            enableRichPresence();
            richPresenceSelection.disabled = false; // Enable the selection
        } else {
            disableRichPresence();
            richPresenceSelection.disabled = true; // Disable the selection
            richPresenceSelection.selectedIndex = 0; // Reset to the first option
        }
    });
});

// Function to enable Discord Rich Presence
function enableRichPresence() {
    // Make a POST request to start Rich Presence on your server
    fetch('http://localhost:4737/set-rich-presence', {
        method: 'POST',
    })
    .then(response => {
        if (response.ok) {
            console.log('Discord Rich Presence is enabled');
        } else {
            console.error('Error enabling Discord Rich Presence');
        }
    })
    .catch(error => {
        console.error('Error enabling Discord Rich Presence:', error);
    });
}

// Function to disable Discord Rich Presence
function disableRichPresence() {
    // Make a POST request to stop Rich Presence on your server
    fetch('http://localhost:4737/stop-rich-presence', {
        method: 'POST',
    })
    .then(response => {
        if (response.ok) {
            console.log('Discord Rich Presence is disabled');
        } else {
            console.error('Error disabling Discord Rich Presence');
        }
    })
    .catch(error => {
        console.error('Error disabling Discord Rich Presence:', error);
    });
}
