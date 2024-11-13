from flask import Flask, render_template, request, redirect, url_for
from pyvis.network import Network
import os
import json

app = Flask(__name__)

# Dane węzłów i połączeń
graph_data = {
    "nodes": [],
    "links": []
}

# Kolory dla różnych grup hashtagów
group_colors = {
    "group1": "#FF5733",
    "group2": "#33FF57",
    "group3": "#3357FF",
    "group4": "#F0E68C"
}

def generate_graph():
    net = Network(height="750px", width="100%", bgcolor="#222222", font_color="white")
    
    # Dodaj węzły
    for node in graph_data["nodes"]:
        color = group_colors.get(node["group"], "#FFFFFF")  # Kolor na podstawie grupy
        net.add_node(node["id"], label=node["label"], title=node["phone"], color=color)
    
    # Dodaj krawędzie
    for link in graph_data["links"]:
        color = group_colors.get(link["relation"], "#FFFFFF")
        net.add_edge(link["source"], link["target"], color=color)
    
    # Zapisz graf jako plik HTML bez wywoływania 'show()'
    net.write_html("static/graph.html")

@app.route("/", methods=["GET", "POST"])
def index():
    if request.method == "POST":
        # Pobierz dane z formularza
        name = request.form["name"]
        phone = request.form["phone"]
        tags = request.form["tags"].split()  # Zakładamy, że tagi są oddzielone spacjami
        
        # Dodaj nowy węzeł
        new_id = f"node{len(graph_data['nodes']) + 1}"
        graph_data["nodes"].append({
            "id": new_id,
            "label": name,
            "phone": phone,
            "group": tags[0]  # Przypisujemy tylko pierwszy tag jako kolor grupy
        })

        # Tworzenie krawędzi na podstawie wspólnych tagów
        for tag in tags:
            for node in graph_data["nodes"]:
                if tag in node["group"] and node["id"] != new_id:
                    graph_data["links"].append({
                        "source": new_id,
                        "target": node["id"],
                        "relation": tag
                    })

        # Generuj graf
        generate_graph()
        return redirect(url_for("index"))

    return render_template("index.html")

if __name__ == "__main__":
    if not os.path.exists("static"):
        os.makedirs("static")
    generate_graph()  # Generuj początkowy graf
    app.run(debug=True)
