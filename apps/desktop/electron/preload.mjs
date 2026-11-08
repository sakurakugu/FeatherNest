import { contextBridge, ipcRenderer } from 'electron'
import { createDesktopBridge } from './preload/create-desktop-bridge.mjs'

contextBridge.exposeInMainWorld('featherNestDesktop', createDesktopBridge(ipcRenderer))
