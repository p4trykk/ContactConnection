const { ipcRenderer } = require('electron');
const cytoscape = require('cytoscape');

// Kolory dla grup
const groupColors = {
    'group1': '#FF5733',  // Czerwony
    'group2': '#33FF57',  // Zielony
    'group3': '#3357FF',  // Niebieski
    'group4': '#F0E68C',  // Żółty
};

// Inicjalizacja grafu
let cy = cytoscape({
    container: document.getElementById('graph'),
    elements: [],
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
            }
        }
    ],
});

// Nasłuchiwanie na dodanie nowego kontaktu
document.getElementById('add-contact-form').addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value;
    const phone = document.getElementById('phone').value;
    const tags = document.getElementById('tags').value.split(' ');  // Hashtagi

    ipcRenderer.send('add-contact', { name, phone, tags });
});

// Nasłuchiwanie na aktualizację grafu
ipcRenderer.on('graph-updated', (event, graphData) => {
    cy.elements().remove();  // Usuwanie poprzedniego grafu

    // Dodawanie węzłów
    graphData.nodes.forEach(node => {
        cy.add({
            data: { id: node.id, label: node.label, phone: node.phone, group: node.group },
            group: 'nodes',
        });
    });

    // Dodawanie krawędzi
    graphData.links.forEach(link => {
        cy.add({
            data: { source: link.source, target: link.target, relation: link.relation },
            group: 'edges',
        });
    });

    // Kolorowanie krawędzi na podstawie grup
    cy.edges().forEach(edge => {
        const relation = edge.data('relation');
        const color = groupColors[relation] || '#000000';
        edge.style('line-color', color);
    });

    cy.layout({ name: 'grid' }).run();
});

// Obsługa kliknięcia na węzeł
cy.on('tap', 'node', (event) => {
    const node = event.target;
    const nodeData = node.data();

    // Załaduj dane do formularza edycji
    document.getElementById('edit-name').value = nodeData.label;
    document.getElementById('edit-phone').value = nodeData.phone || '';  // Upewnij się, że telefon jest poprawnie wczytany
    document.getElementById('edit-tags').value = nodeData.group || '';

    document.getElementById('save-button').onclick = () => {
        const updatedName = document.getElementById('edit-name').value;
        const updatedPhone = document.getElementById('edit-phone').value;
        const updatedTags = document.getElementById('edit-tags').value.split(' ');

        ipcRenderer.send('update-contact', {
            id: nodeData.id,
            name: updatedName,
            phone: updatedPhone,
            tags: updatedTags
        });
    };
});
