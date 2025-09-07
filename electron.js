const { app, BrowserWindow, ipcMain, Menu, Tray, nativeImage } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const startMenuPath = path.join(os.homedir(), 'AppData', 'Roaming', 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup');
const vbsShortcutPath = path.join(startMenuPath, 'Zapret UI.vbs');

if (process.platform === 'win32') {
    app.setAppUserModelId(app.getName());
}

let mainWindow;
let tray = null;
let isQuitting = false;
let runInTray = false;
let trayMenuData = {
    isConnected: false,
    selectedStrategy: 'general_ALT3',
    strategies: []
};


function createShortcut() {
    const appExecutablePath = app.getPath('exe');
    const vbsContent = `
Set WshShell = WScript.CreateObject("WScript.Shell")
WshShell.Run Chr(34) & "${appExecutablePath}" & Chr(34), 0
Set WshShell = Nothing
`.trim();
    fs.writeFileSync(vbsShortcutPath, vbsContent, 'utf-8');
    console.log('[Main Process]: Ярлык для автозапуска создан.');
}

function deleteShortcut() {
    if (fs.existsSync(vbsShortcutPath)) {
        fs.unlinkSync(vbsShortcutPath);
        console.log('[Main Process]: Ярлык для автозапуска удален.');
    }
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 450,
        height: 520,
        minWidth: 450,
        minHeight: 520,
        resizable: false,
        frame: false,
        transparent: true,
        backgroundColor: '#00000000',
        title: 'Zapret UI',
        webPreferences: {
            preload: path.join(app.getAppPath(), 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            devTools: !app.isPackaged
        }
    });

    const htmlFilePath = app.isPackaged
        ? path.join(__dirname, 'index.html')
        : path.join(app.getAppPath(), 'client', 'build', 'index.html');

    mainWindow.loadFile(htmlFilePath);

    mainWindow.webContents.on('before-input-event', (event, input) => {
        if (input.type === 'keyDown' && input.key === 'Tab') {
            event.preventDefault();
        }
    });

    if (app.isPackaged) {
        Menu.setApplicationMenu(null);
    }

    mainWindow.on('close', async (event) => {
        if (!isQuitting && runInTray) {
            event.preventDefault();
            mainWindow.hide();
        } else {
            event.preventDefault();
            console.log('[Main Process]: Window close event detected. Checking Zapret process...');
            
            const isZapretRunning = await checkZapretProcessLogic();
            if (isZapretRunning) {
                console.log('[Main Process]: Zapret process (winws.exe) is running. Attempting to terminate it before closing UI.');
                await terminateZapretProcessLogic();
            } else {
                console.log('[Main Process]: Zapret process not running. Closing UI directly.');
            }
            mainWindow.destroy();
        }
    });

}

app.on('before-quit', () => {
    isQuitting = true;
});


app.whenReady().then(() => {
    createWindow();

    const iconPath = path.join(app.getAppPath(), 'assets', 'icon.ico');
    const icon = nativeImage.createFromPath(iconPath);
    tray = new Tray(icon);

    tray.on('double-click', () => {
        mainWindow.show();
    });
    
    const setInitialTrayMenu = async () => {
        try {
            const statusResult = await getZapretStatusLogic();
            const isConnected = statusResult.success && statusResult.status && statusResult.status.isRunning;
            
            const strategiesFromRenderer = [
                { id: 'general', name: 'Стандартный' },
                { id: 'general_ALT', name: 'ALT' },
                { id: 'general_ALT2', name: 'ALT2' },
                { id: 'general_ALT3', name: 'ALT3 (Рекомендованный)' },
                { id: 'general_ALT4', name: 'ALT4' },
                { id: 'general_ALT5', name: 'ALT5' },
                { id: 'general_ALT6', name: 'ALT6' },
                { id: 'general_FAKE_TLS', name: 'FAKE TLS' },
                { id: 'general_FAKE_TLS_ALT', name: 'FAKE TLS ALT' },
                { id: 'general_FAKE_TLS_AUTO', name: 'FAKE TLS AUTO' },
                { id: 'general_FAKE_TLS_AUTO_ALT', name: 'FAKE TLS AUTO ALT' },
                { id: 'general_FAKE_TLS_AUTO_ALT2', name: 'FAKE TLS AUTO ALT2' },
                { id: 'general_МГТС', name: 'MGTS' },
                { id: 'general_МГТС2', name: 'MGTS2' },
            ];
            const initialData = {
                isConnected: isConnected,
                selectedStrategy: 'general_ALT3',
                strategies: strategiesFromRenderer
            };
            updateTrayMenu(null, initialData);
        } catch (error) {
            console.error('[Main Process]: Ошибка при начальном обновлении меню трея:', error);
        }
    };
    setInitialTrayMenu();

});


app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});


ipcMain.on('update-run-in-tray', (event, value) => {
    runInTray = value;
});

const updateTrayMenu = (event, data) => {
    trayMenuData = data;
    if (tray) {
        const { isConnected, selectedStrategy, strategies } = trayMenuData;
        
        const connectMenuItem = {
            label: isConnected ? 'Отключиться' : 'Подключиться',
            click: () => {
                if (isConnected) {
                    mainWindow.webContents.send('tray-disconnect');
                } else {
                    mainWindow.webContents.send('tray-connect', selectedStrategy);
                }
            }
        };

        const strategiesSubmenu = strategies.map(strategy => ({
            label: strategy.name,
            type: 'radio',
            checked: strategy.id === selectedStrategy,
            enabled: !isConnected,
            click: () => {
                mainWindow.webContents.send('tray-connect', strategy.id);
            }
        }));

        const contextMenuTemplate = [
            connectMenuItem,
            {
                label: 'Сменить стратегию',
                submenu: strategiesSubmenu,
                enabled: !isConnected,
            },
            { type: 'separator' },
            { label: 'Показать', click: () => mainWindow.show() },
            { label: 'Выход', click: () => {
                isQuitting = true;
                app.quit();
            }}
        ];
        
        const contextMenu = Menu.buildFromTemplate(contextMenuTemplate);
        tray.setContextMenu(contextMenu);
    }
};

ipcMain.on('update-tray-menu', updateTrayMenu);

function getPs1ScriptsBasePath() {
    if (app.isPackaged) {
        return path.join(process.resourcesPath, 'app.asar.unpacked', 'bat_scripts', 'ps1');
    } else {
        return path.join(__dirname, 'bat_scripts', 'ps1');
    }
}

ipcMain.handle('toggle-run-at-startup', (event, enable) => {
    if (process.platform !== 'win32') {
        return { success: false, message: 'Автозапуск доступен только на Windows.' };
    }
    try {
        if (enable) {
            createShortcut();
        } else {
            deleteShortcut();
        }
        return { success: true };
    } catch (error) {
        console.error('[Main Process]: Ошибка при изменении автозапуска:', error);
        return { success: false, message: error.message };
    }
});

ipcMain.handle('get-run-at-startup-status', () => {
    try {
        const isEnabled = fs.existsSync(vbsShortcutPath);
        return { success: true, isEnabled: isEnabled };
    } catch (error) {
        console.error('[Main Process]: Ошибка при проверке статуса автозапуска:', error);
        return { success: false, message: error.message, isEnabled: false };
    }
});

ipcMain.on('minimize-window', () => {
    if (mainWindow) mainWindow.minimize();
});

ipcMain.on('close-window', () => {
    if (mainWindow) mainWindow.close();
});

ipcMain.handle('run-powershell-script', (event, scriptBaseName, args) => {
    return new Promise((resolve) => {
        const timeout = 60000;
        const scriptPath = path.join(getPs1ScriptsBasePath(), `${scriptBaseName}.ps1`);

        if (!fs.existsSync(scriptPath)) {
            const errorMessage = `Скрипт не найден: ${scriptPath}`;
            console.error(`[Main Process]: ${errorMessage}`);
            const result = { success: false, output: '', error: errorMessage };
            return resolve(result);
        }

        const commandToExecute = Array.isArray(args) ? args.join(' ') : args;
        const fullCommandString = `[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; . "${scriptPath}"; ${commandToExecute}`;

        console.log(`[Main Process]: Запуск PowerShell скрипта: "${scriptPath}" с аргументами: [${commandToExecute}]`);

        const psProcess = spawn('powershell.exe', [
            '-NoProfile',
            '-ExecutionPolicy', 'Bypass',
            '-Command', fullCommandString
        ], {
            stdio: ['pipe', 'pipe', 'pipe'],
            encoding: 'utf8',
            windowsHide: true
        });

        let output = '';
        let error = '';
        let hasResolved = false;

        const timer = setTimeout(() => {
            if (!hasResolved) {
                console.error('[Main Process]: PowerShell скрипт превысил таймаут и был принудительно завершен.');
                psProcess.kill();
                resolve({ success: false, output: output, error: 'Таймаут выполнения скрипта.' });
                hasResolved = true;
            }
        }, timeout);

        psProcess.stdout.on('data', (data) => {
            output += data.toString('utf8');
        });

        psProcess.stderr.on('data', (data) => {
            error += data.toString('utf8');
        });

        psProcess.on('close', (code) => {
            clearTimeout(timer);
            if (!hasResolved) {
                console.log(`[Main Process DEBUG]: PowerShell script finished. Exit code: ${code}`);
                console.log(`[Main Process DEBUG]: STDOUT captured: '${output.trim()}'`);
                console.log(`[Main Process DEBUG]: STDERR captured: '${error.trim()}'`);

                let result;
                if (code === 0) {
                    console.log(`[Main Process]: Скрипт ${scriptBaseName}.ps1 успешно выполнен.`);
                    result = { success: true, output: output, error: '' };
                } else {
                    const errorMessage = `Скрипт ${scriptBaseName}.ps1 завершился с ошибкой ${code}. Error: ${error}. Output: ${output}`;
                    console.error(`[Main Process]: ${errorMessage}`);
                    result = { success: false, output: output, error: error || `Процесс завершился с кодом: ${code}` };
                }

                console.log('[Main Process DEBUG]: Attempting to resolve with:', result);
                resolve(result);
                hasResolved = true;
            }
        });

        psProcess.on('error', (err) => {
            clearTimeout(timer);
            if (!hasResolved) {
                const errorMessage = `Не удалось запустить PowerShell для ${scriptBaseName}.ps1: ${err.message}`;
                console.error(`[Main Process]: ${errorMessage}`);
                const result = { success: false, output: '', error: errorMessage };
                console.log('[Main Process DEBUG]: Attempting to resolve on error with:', result);
                resolve(result);
                hasResolved = true;
            }
        });
    });
});


const getZapretStatusLogic = async () => {
    console.log('[Main Process]: Запрос статуса Zapret.');
    const serviceScriptPath = path.join(getPs1ScriptsBasePath(), 'service.ps1');

    if (!fs.existsSync(serviceScriptPath)) {
        const errorMessage = `Скрипт service.ps1 не найден: ${serviceScriptPath}`;
        console.error(`[Main Process]: ${errorMessage}`);
        return { success: false, status: null, output: '', error: errorMessage };
    }

    const commandContent = `
        [Console]::OutputEncoding = [System.Text.Encoding]::UTF8;
        . "${serviceScriptPath}";
        Get-ZapretBypassStatus | ConvertTo-Json -Compress;
    `;

    return new Promise((resolve) => {
        const psProcess = spawn('powershell.exe', [
            '-NoProfile',
            '-ExecutionPolicy', 'Bypass',
            '-Command', commandContent
        ], {
            stdio: 'pipe',
            encoding: 'utf8'
        });

        let psStdout = '';
        let psStderr = '';

        psProcess.stdout.on('data', (data) => {
            psStdout += data.toString('utf8');
        });

        psProcess.stderr.on('data', (data) => {
            psStderr += data.toString('utf8');
        });

        psProcess.on('close', async (code) => {
            if (code === 0) {
                try {
                    const status = JSON.parse(psStdout.trim());
                    console.log('[Main Process]: Статус Zapret получен успешно:', status);
                    resolve({ success: true, status: status, output: psStdout, error: '' });
                } catch (e) {
                    const errorMessage = `Ошибка парсинга JSON статуса: ${e.message}. Вывод PS: ${psStdout || 'Нет данных'}. Ошибка PS: ${psStderr}`;
                    console.error(`[Main Process]: ${errorMessage}`);
                    resolve({ success: false, status: null, output: psStdout || '', error: errorMessage });
                }
            } else {
                const errorMessage = `Скрипт статуса завершился с ошибкой ${code}. Error: ${psStderr}.`;
                console.error(`[Main Process]: ${errorMessage}`);
                resolve({ success: false, status: null, output: '', error: psStderr || `Процесс завершился с кодом: ${code}` });
            }
        });

        psProcess.on('error', (err) => {
            const errorMessage = `Не удалось запустить PowerShell для статуса: ${err.message}`;
            console.error(`[Main Process]: ${errorMessage}`);
            resolve({ success: false, status: null, output: '', error: errorMessage });
        });
    });
};

ipcMain.handle('get-zapret-status', async (event) => {
    return getZapretStatusLogic();
});


const terminateZapretProcessLogic = async () => {
    return new Promise((resolve) => {
        const command = 'powershell.exe';
        const scriptContent = `taskkill /IM winws.exe /T /F 2>&1 | Out-String -Stream`;
        const scriptArgs = ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', `[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; ${scriptContent}`];
        let stdoutBuffer = '';
        let stderrBuffer = '';
        let exitCode = 1;

        console.log(`[Main Process]: Terminating process using PowerShell: ${command} ${scriptArgs.join(' ')}`);

        const psProcess = spawn(command, scriptArgs);

        psProcess.stdout.on('data', (data) => {
            stdoutBuffer += data.toString('utf8');
        });

        psProcess.stderr.on('data', (data) => {
            stderrBuffer += data.toString('utf8');
        });

        psProcess.on('close', (code) => {
            exitCode = code;
            console.log(`[PowerShell Process] exited with code ${code}`);
            resolve({ stdout: stdoutBuffer, stderr: stderrBuffer, exitCode: code });
        });

        psProcess.on('error', (err) => {
            console.error(`[Main Process]: Failed to spawn PowerShell process: ${err.message}`);
            stderrBuffer += `Failed to spawn process: ${err.message}\n`;
            resolve({ stdout: stdoutBuffer, stderr: stderrBuffer, exitCode: 1 });
        });
    });
};

ipcMain.handle('terminate-zapret-process', async () => {
    return terminateZapretProcessLogic();
});

const checkZapretProcessLogic = async () => {
    return new Promise((resolve) => {
        const command = 'powershell.exe';
        const scriptContent = `tasklist /FI "IMAGENAME eq winws.exe" 2>&1`;
        const scriptArgs = ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', `[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; ${scriptContent}`];
        let stdoutBuffer = '';
        let stderrBuffer = '';

        console.log(`[Main Process]: Checking process presence using PowerShell: ${command} ${scriptArgs.join(' ')}`);

        const psProcess = spawn(command, scriptArgs);

        psProcess.stdout.on('data', (data) => {
            stdoutBuffer += data.toString('utf8');
        });

        psProcess.stderr.on('data', (data) => {
            stderrBuffer += data.toString('utf8');
        });

        psProcess.on('close', (code) => {
            if (code === 0) {
                const isRunning = stdoutBuffer.includes('winws.exe');
                console.log(`[Main Process]: winws.exe process ${isRunning ? 'found' : 'not found'}.`);
                resolve(isRunning);
            } else {
                console.error(`[Main Process]: Error executing tasklist: ${stderrBuffer.trim()}. Code: ${code}`);
                resolve(false);
            }
        });

        psProcess.on('error', (err) => {
            console.error(`[Main Process]: Failed to spawn PowerShell for tasklist: ${err.message}`);
            resolve(false);
        });
    });
};

ipcMain.handle('check-zapret-process', async () => {
    return checkZapretProcessLogic();
});

ipcMain.on('log-to-main', (event, message) => {
    console.log(`[Renderer Log]: ${message}`);
});