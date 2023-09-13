// script.js

// Error Bar
function closeErrorBar() {
  const errorBar = document.getElementById("error-bar");
  errorBar.style.display = "none";

  // Reset the copy button text to its original state
  const errorCopyButton = document.getElementById("error-copy");
  errorCopyButton.textContent = "Copy";
}

// Easter eggs for the copy button in the error
const copyBtnMsg = [
  "Copied!",
  "Copied again!",
  "Copied! Like a Witcher in Novigrad!",
  "Copy-paste precision: Assassin's Creed style!",
  "You just teabagged that text! Halo-style teabagging!",
  "Copying like a legend in Skyrim! Fus Ro Dah!",
  "Achievement Unlocked: Copy Master Chief!",
  "Copy successful, with extra rings like in Sonic!",
  "Ready to paste and outbuild everyone, Fortnite-style!",
  "Legendary Copy Move! Approved by Lara Croft!",
  "You're on a copy quest like Link in Zelda! Keep going!",
  "Copy, paste, and save the world, like in Overwatch!",
  "Copying your way to vault hunter status, Borderlands-style!",
  "You're the real copy MVP, collecting power-ups like Mario!",
  "Copy-tastic! Keep it up, like in Street Fighter!",
  "Copy mission: Super Mario Odyssey! Grab those moons!",
];

let copyBtnMsgIndex = 0;

function copyErrorText() {
  const errorCopyButton = document.getElementById("error-copy");
  const errorTextElement = document.getElementById("error-message");
  const errorText = errorTextElement.textContent;

  const tempInput = document.createElement("input");
  tempInput.value = errorText;
  document.body.appendChild(tempInput);

  errorCopyButton.textContent = copyBtnMsg[copyBtnMsgIndex];

  copyBtnMsgIndex = (copyBtnMsgIndex + 1) % copyBtnMsg.length;

  tempInput.select();
  document.execCommand("copy");

  document.body.removeChild(tempInput);
}

function updateTitle() {
  const resolutionText = `${window.innerWidth}x${window.innerHeight}`;
  const newTitle = `traaabot - TraaaaBot Console - ${resolutionText}`;
  document.title = newTitle;
  document
    .getElementById("window-title")
    .getElementsByTagName("span")[0].textContent = newTitle;
}

window.addEventListener("resize", updateTitle);
window.addEventListener("DOMContentLoaded", updateTitle);

document.getElementById("settingsButton").addEventListener("click", function () {
  const menuItems = document.querySelectorAll('.menu-item');
  const sections = document.querySelectorAll('.section');
  
  menuItems.forEach((menuItem, index) => {
    menuItem.addEventListener('click', () => {
      // Hide all sections
      sections.forEach((section) => {
        section.style.display = 'none';
      });
  
      // Show the selected section
      sections[index].style.display = 'block';
  
      // Mark the clicked menu item as active
      menuItems.forEach((item) => {
        item.classList.remove('active');
      });
      menuItem.classList.add('active');
    });
  });
});
