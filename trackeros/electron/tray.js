'use strict';

const { Tray, Menu, nativeImage } = require('electron');
const path = require('path');

function setupTray(app, mainWin, statsWin) {
  let iconPath = path.join(__dirname, '../assets/icon.png');

  let img;
  try {
    img = nativeImage.createFromPath(iconPath);
    // Resize to 16x16 for tray
    img = img.resize({ width: 16, height: 16 });
  } catch (e) {
    img = nativeImage.createEmpty();
  }

  const tray = new Tray(img);
  tray.setToolTip('Tracker');

  const buildMenu = () => Menu.buildFromTemplate([
    {
      label: 'Show / Hide',
      click: () => {
        if (mainWin.isVisible()) {
          mainWin.hide();
        } else {
          mainWin.show();
          mainWin.focus();
        }
      },
    },
    {
      label: 'Stats',
      click: () => {
        // Position stats relative to main
        const [mx, my] = mainWin.getPosition();
        const mw = mainWin.getBounds().width;
        statsWin.setPosition(mx + mw + 16, my);
        statsWin.show();
        statsWin.focus();
      },
    },
    {
      label: 'Skip Current Block',
      click: () => {
        if (mainWin && !mainWin.isDestroyed()) {
          mainWin.webContents.send('skip-current-block');
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Quit Tracker',
      click: () => app.quit(),
    },
  ]);

  tray.setContextMenu(buildMenu());

  tray.on('double-click', () => {
    if (mainWin.isVisible()) {
      mainWin.hide();
    } else {
      mainWin.show();
      mainWin.focus();
    }
  });

  return tray;
}

module.exports = { setupTray };
