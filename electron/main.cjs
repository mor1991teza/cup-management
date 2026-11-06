const { app, BrowserWindow, shell, protocol, net, ipcMain } = require('electron');
const path = require('path');
const { pathToFileURL } = require('url');
const fs = require('fs');

try {
  if (require('electron-squirrel-startup')) app.quit();
} catch (e) {}

let mainWindow;
const isDev = !app.isPackaged;

// ثبت پروتکل سفارشی
protocol.registerSchemesAsPrivileged([
  { scheme: 'media', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } }
]);

// 🔴 لایه امنیتی جدید: مسیر فایل مخفی لایسنس
const getLicenseFilePath = () => {
  return path.join(app.getPath('userData'), '.sys_license.dat');
};

// 🔴 ذخیره لایسنس در فایل مخفی
ipcMain.handle('save-license-to-disk', (event, licenseData) => {
  try {
    const filePath = getLicenseFilePath();
    const encodedData = Buffer.from(JSON.stringify(licenseData)).toString('base64');
    fs.writeFileSync(filePath, encodedData, 'utf8');
    return true;
  } catch (error) {
    console.error('Error saving license to disk:', error);
    return false;
  }
});

// 🔴 خواندن لایسنس از فایل مخفی
ipcMain.handle('read-license-from-disk', () => {
  try {
    const filePath = getLicenseFilePath();
    if (fs.existsSync(filePath)) {
      const encodedData = fs.readFileSync(filePath, 'utf8');
      const decodedData = Buffer.from(encodedData, 'base64').toString('utf8');
      return JSON.parse(decodedData);
    }
    return null;
  } catch (error) {
    console.error('Error reading license from disk:', error);
    return null;
  }
});

ipcMain.handle('get-resources-path', () => {
  return pathToFileURL(process.resourcesPath).href;
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
    show: false,
    backgroundColor: '#1a1a1a',
  });

  mainWindow.once('ready-to-show', () => mainWindow.show());

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  if (isDev) {
    const devUrl = 'http://localhost:5173';
    const checkServer = () => {
      mainWindow.loadURL(devUrl).catch(() => setTimeout(checkServer, 1000));
    };
    checkServer();
  } else {
    // 🔴 اصلاح مهم: استفاده از __dirname برای بارگذاری از داخل asar
    const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
    mainWindow.loadFile(indexPath).catch((err) => {
      console.error('Failed to load index.html:', err);
    });
  }
}

app.whenReady().then(() => {
  // پردازش درخواست‌های media:// (اصلاح‌شده برای asar)
  protocol.handle('media', (request) => {
    const url = request.url.slice('media://'.length);
    // 🔴 اصلاح: استفاده از __dirname
    const filePath = path.join(__dirname, '..', 'dist', url);
    return net.fetch(pathToFileURL(filePath).toString());
  });  
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});