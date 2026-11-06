const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('appPaths', {
  getResources: () => ipcRenderer.invoke('get-resources-path'),
  
  // 🔴 توابع جدید لایسنس
  saveLicenseToDisk: (licenseData) => ipcRenderer.invoke('save-license-to-disk', licenseData),
  readLicenseFromDisk: () => ipcRenderer.invoke('read-license-from-disk'),
});