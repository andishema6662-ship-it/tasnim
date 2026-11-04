const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('archiveApi', {
  getPaths: () => ipcRenderer.invoke('app:getPaths'),
  readConfig: () => ipcRenderer.invoke('app:readConfig'),
  writeConfig: (config) => ipcRenderer.invoke('app:writeConfig', config),
  hasAdmin: () => ipcRenderer.invoke('auth:hasAdmin'),
  setupAdmin: (password) => ipcRenderer.invoke('auth:setupAdmin', password),
  login: (password) => ipcRenderer.invoke('auth:login', password),
  recover: (recoveryKey, newPassword) =>
    ipcRenderer.invoke('auth:recover', recoveryKey, newPassword),
  pickFolder: () => ipcRenderer.invoke('fs:pickFolder'),
  pickImages: () => ipcRenderer.invoke('fs:pickImages'),
  readFileBase64: (filePath) => ipcRenderer.invoke('fs:readFileBase64', filePath),
  saveDocument: (payload) => ipcRenderer.invoke('fs:saveDocument', payload),
  readSqlite: () => ipcRenderer.invoke('db:readSqlite'),
  writeSqlite: (bytes) => ipcRenderer.invoke('db:writeSqlite', bytes),
  listOcrModels: () => ipcRenderer.invoke('tess:listModels'),
  openPath: (target) => ipcRenderer.invoke('shell:openPath', target),
});
