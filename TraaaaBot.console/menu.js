const { app } = require("electron");

const applicationMenu = [
  {
    label: "TraaaaBot Console",
    submenu: [
      {
        label: "About TraaaaBot Console",
        type: "normal",
        click: () => console.log("Clicked MenuItem 1"),
      },
      {
        label: "Check for Updates",
        type: "normal",
        click: () => console.log("Clicked MenuItem 2"),
      },
      {
        type: "separator",
      },
      {
        label: "Settings",
        submenu: [
          {
            label: "TraaaaBot (Discord Bot)",
            type: "normal",
            accelerator: "Command+,",
            acceleratorWorksWhenHidden: true,
            click: () => console.log("Clicked TraaaaBot (Discord)"),
          },
          {
            label: "Console",
            type: "normal",
            accelerator: "Command+.",
            acceleratorWorksWhenHidden: true,
            click: () => console.log("Clicked Console"),
          },
          {
            label: "Dashboard",
            type: "normal",
            accelerator: "Command+/",
            acceleratorWorksWhenHidden: true,
            click: () => console.log("Clicked Dashboard"),
          },
        ],
      },
      { type: "separator" },
      { label: "Quit TraaaaBot Console", type: "normal", role: "quit" },
    ],
  },
];

module.exports = applicationMenu;
