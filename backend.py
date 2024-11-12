import networkx as nx
import sys
import json

graph = nx.Graph()  # Tworzymy pusty graf

# Obsługa wejścia (kontakty) przez stdin
while True:
    line = sys.stdin.readline().strip()
    if line:
        data = json.loads(line)
        name = data['name']
        relation_name = data['relationName']
        relation_type = data['relationType']

        # Dodanie węzłów i krawędzi do grafu
        graph.add_node(name)
        graph.add_node(relation_name)
        graph.add_edge(name, relation_name, relation=relation_type)

        # Przesyłanie grafu w formacie JSON do Electron
        graph_data = nx.node_link_data(graph)
        
        # Upewnij się, że frontend otrzymuje odpowiednią strukturę
        formatted_data = {
            'nodes': [{'id': node, 'label': node} for node in graph.nodes()],
            'links': [{'source': edge[0], 'target': edge[1], 'relation': graph[edge[0]][edge[1]]['relation']} for edge in graph.edges()]
        }

        sys.stdout.write(json.dumps(formatted_data) + '\n')
        sys.stdout.flush()
