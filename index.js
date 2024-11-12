const { ipcRenderer } = require('electron');
const cytoscape = require('cytoscape');

// Inicjalizacja grafu
let cy = cytoscape({
    container: document.getElementById('graph'),

    elements: [], // Pusty graf na początku

    style: [
        {
            selector: 'node',
            style: {
                'background-color': '#666',
                'label': 'data(label)',
                'color': '#fff',
                'text-valign': 'center',
                'text-halign': 'center',
            }
        },
        {
            selector: 'edge',
            style: {
                'width': 3,
                'line-color': '#ccc',
                'target-arrow-color': '#ccc',
                'target-arrow-shape': 'triangle',
                'label': 'data(label)'
            }
        }
    ],

    layout: {
        name: 'grid',
        rows: 1
    }
});

// Obsługa formularza dodawania kontaktów
document.getElementById('add-contact-form').onsubmit = (event) => {
    event.preventDefault();

    // Pobieranie wartości z formularza
    const name = document.getElementById('name').value;
    const relationName = document.getElementById('relation_name').value;
    const relationType = document.getElementById('relation_type').value;

    // Wysłanie danych do backendu
    ipcRenderer.send('add-contact', { name, relationName, relationType });

    // Wyczyszczenie formularza
    document.getElementById('add-contact-form').reset();
};

// Odbieranie aktualizacji grafu z backendu
ipcRenderer.on('graph-updated', (event, graphData) => {
    // Zaktualizowanie grafu
    cy.elements().remove();  // Usuwamy obecne elementy grafu

    // Dodawanie nowych węzłów i krawędzi
    graphData.nodes.forEach((node) => {
        cy.add({
            group: 'nodes',
            data: { id: node.id, label: node.label || node.id }
        });
    });

    graphData.links.forEach((link) => {
        cy.add({
            group: 'edges',
            data: { source: link.source, target: link.target, label: link.relation || "" }
        });
    });

    // Ustawienie nowego layoutu
    cy.layout({ name: 'grid' }).run();
});
