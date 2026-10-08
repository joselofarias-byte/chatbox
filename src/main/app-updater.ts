import type { BrowserWindow } from 'electron'
import { ipcMain } from 'electron'
import { getLogger } from './util'

const log = getLogger('app-updater')

function sendToRenderer(win: BrowserWindow | null, channel: string, data?: unknown) {
  if (win && !win.isDestroyed()) {
    win.webContents.send(channel, data)
  }
}

/**
 * This fork does not use the upstream Chatbox update feeds.
 *
 * Keep the IPC surface intact so existing renderer code continues to work,
 * but never contact or install updates published for the official Chatbox app.
 * A fork-owned updater can be wired here later.
 */
export class AppUpdater {
  private getWindow: () => BrowserWindow | null

  constructor(getWindow: () => BrowserWindow | null) {
    this.getWindow = getWindow

    ipcMain.removeHandler('updater:check')
    ipcMain.handle('updater:check', async () => {
      sendToRenderer(this.getWindow(), 'updater:not-available')
      return { started: true }
    })

    ipcMain.removeHandler('install-update')
    ipcMain.handle('install-update', () => {
      log.info('install-update ignored: upstream updater is disabled in this fork')
    })
  }

  async tryUpdate() {
    log.info('auto_updater: upstream feeds disabled in this fork')
    return null
  }
}
