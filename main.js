const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let pythonProcess;
let graphData = { nodes: [], links: [] };

// Kolory dla grup
const groupColors = {
    'group1': '#FF5733',
    'group2': '#33FF57',
    'group3': '#3357FF',
    'group4': '#FF33A1',
};

function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
    });

    win.loadFile('index.html');
}

app.whenReady().then(() => {
    createWindow();

    pythonProcess = spawn('python', ['backend.py']);

    ipcMain.on('add-contact', (event, { name, phone, tags }) => {
        const newId = `node${graphData.nodes.length + 1}`;
        graphData.nodes.push({
            id: newId,
            label: name,
            phone: phone,
            group: tags.join(','),
        });

        tags.forEach((tag) => {
            const existingNodes = graphData.nodes.filter(n => n.group.includes(tag));
            existingNodes.forEach(existingNode => {
                if (existingNode.id !== newId) {
                    graphData.links.push({
                        source: newId,
                        target: existingNode.id,
                        relation: tag,
                    });
                }
            });
        });

        event.reply('graph-updated', graphData);
    });

    ipcMain.on('update-contact', (event, { id, name, phone, tags }) => {
        const node = graphData.nodes.find(node => node.id === id);
        if (node) {
            node.label = name;
            node.phone = phone;
            node.group = tags.join(',');

            // Aktualizacja połączeń dla edytowanego węzła
            graphData.links = graphData.links.filter(link => link.source !== id && link.target !== id);

            tags.forEach(tag => {
                const connectedNodes = graphData.nodes.filter(n => n.group.includes(tag));
                connectedNodes.forEach(existingNode => {
                    if (existingNode.id !== id) {
                        graphData.links.push({
                            source: id,
                            target: existingNode.id,
                            relation: tag,
                        });
                    }
                });
            });
        }

        event.reply('graph-updated', graphData);
    });

    pythonProcess.stdout.on('data', (data) => {
        const newGraphData = JSON.parse(data.toString());
        graphData.nodes = newGraphData.nodes;
        graphData.links = newGraphData.links;

        BrowserWindow.getAllWindows()[0].webContents.send('graph-updated', graphData);
    });

    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') app.quit();
    });

    app.on('will-quit', () => {
        if (pythonProcess) pythonProcess.kill();
    });
});
