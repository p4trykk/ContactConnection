import networkx as nx
import sys
import json

graph = nx.Graph()

while True:
    line = sys.stdin.readline().strip()
    if line:
        data = json.loads(line)
        name = data['name']
        phone = data['phone']
        tags = data['tags']

        # Dodaj węzeł
        graph.add_node(name, phone=phone, group=tags)

        # Łączenie węzłów na podstawie tagów
        for tag in tags:
            for other_name in graph.nodes:
                if other_name != name:
                    graph.add_edge(name, other_name, relation=tag)

        graph_data = nx.node_link_data(graph)

        formatted_data = {
            'nodes': [
                {'id': node, 'label': node, 'phone': graph.nodes[node].get('phone', ''), 'group': graph.nodes[node].get('group', [])} for node in graph.nodes()
            ],
            'links': [
                {'source': edge[0], 'target': edge[1], 'relation': graph[edge[0]][edge[1]]['relation']}
                for edge in graph.edges()
            ]
        }

        sys.stdout.write(json.dumps(formatted_data) + '\n')
        sys.stdout.flush()
