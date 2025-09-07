const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    minimizeWindow: () => ipcRenderer.send('minimize-window'),
    closeWindow: () => ipcRenderer.send('close-window'),
    runPowershellScript: (scriptBaseName, args) => ipcRenderer.invoke('run-powershell-script', scriptBaseName, args),
    terminateZapretProcess: () => ipcRenderer.invoke('terminate-zapret-process'),
    checkZapretProcess: () => ipcRenderer.invoke('check-zapret-process'),
    getZapretStatus: () => ipcRenderer.invoke('get-zapret-status'),
    log: (message) => ipcRenderer.send('log-to-main', message),
	toggleRunAtStartup: (enable) => ipcRenderer.invoke('toggle-run-at-startup', enable),
	getRunAtStartupStatus: () => ipcRenderer.invoke('get-run-at-startup-status'),
	getAppPath: () => ipcRenderer.invoke('get-app-path'),
    updateRunInTray: (value) => ipcRenderer.send('update-run-in-tray', value),
    updateTrayMenu: (data) => ipcRenderer.send('update-tray-menu', data),
    onTrayConnect: (callback) => ipcRenderer.on('tray-connect', (event, strategyId) => callback(strategyId)),
    onTrayDisconnect: (callback) => ipcRenderer.on('tray-disconnect', () => callback()),
    onGetStrategiesForTray: (callback) => ipcRenderer.on('get-strategies-for-tray', () => callback()),
	updateShouldStartInTray: (value) => ipcRenderer.send('update-should-start-in-tray', value),
});