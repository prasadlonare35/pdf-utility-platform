const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // We will add IPC methods here later.
    // For now, the Frontend calls localhost:8000 directly.
});
