const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let pythonProcess;

// Funkcja tworząca główne okno aplikacji
function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            //preload: path.join(__dirname, 'preload.js'),  // Opcjonalnie, jeśli chcesz używać preload.js
            nodeIntegration: true,
            contextIsolation: false,  // Musi być ustawione na false dla nodeIntegration
        }
    });

    win.loadFile('index.html');
}

// Funkcja uruchamiana po włączeniu aplikacji
app.whenReady().then(() => {
    createWindow();

    // Uruchamianie procesu backendowego w Pythonie
    pythonProcess = spawn('python', ['backend.py']);

    // Obsługa komunikacji: odbieranie danych kontaktu od interfejsu użytkownika
    ipcMain.on('add-contact', (event, contact) => {
        // Wysłanie danych do procesu Pythona przez stdin
        pythonProcess.stdin.write(JSON.stringify(contact) + '\n');
    });

    // Obsługa odbierania aktualizacji grafu z backendu
    pythonProcess.stdout.on('data', (data) => {
        // Konwersja danych JSON z backendu na obiekt JavaScript
        const graphData = JSON.parse(data.toString());
        // Przesłanie aktualnych danych grafu do frontend
        BrowserWindow.getAllWindows()[0].webContents.send('graph-updated', graphData);
    });

    // Zamknij proces backendu, jeśli aplikacja się zamyka
    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') app.quit();
    });

    app.on('will-quit', () => {
        if (pythonProcess) pythonProcess.kill();
    });
});

