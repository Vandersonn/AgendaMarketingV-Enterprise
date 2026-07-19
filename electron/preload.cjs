const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('agendaDesktop', {
  saveBackup: (content) => ipcRenderer.invoke('backup:save', content),
  openExternal: (url) => ipcRenderer.invoke('system:openExternal', url),
  chooseCloudFolder: () => ipcRenderer.invoke('cloud:chooseFolder'),
  writeCloudFile: (payload) => ipcRenderer.invoke('cloud:writeFile', payload),
  listCloudFiles: (folderPath) => ipcRenderer.invoke('cloud:listFiles', folderPath),
  readCloudFile: (filePath) => ipcRenderer.invoke('cloud:readFile', filePath),
  connectGoogleDrive: (clientId) => ipcRenderer.invoke('google:connect', clientId),
  googleDriveStatus: () => ipcRenderer.invoke('google:status'),
  disconnectGoogleDrive: () => ipcRenderer.invoke('google:disconnect'),
  uploadGoogleBackup: (payload) => ipcRenderer.invoke('google:uploadBackup', payload),
  listGoogleBackups: (clientId) => ipcRenderer.invoke('google:listBackups', clientId),
  listGoogleContacts: (clientId) => ipcRenderer.invoke('google:contacts:list', clientId),
  createGoogleContact: (payload) => ipcRenderer.invoke('google:contacts:create', payload)
})
