from flask import Flask, render_template, request, redirect, url_for
from pyvis.network import Network
import os

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
        group_tag = node["group"][0] if isinstance(node["group"], list) else node["group"]
        color = group_colors.get(group_tag, "#FFFFFF")
        net.add_node(node["id"], label=node["label"], title=node["phone"], color=color)
    
    # Dodaj krawędzie
    for link in graph_data["links"]:
        color = group_colors.get(link["relation"], "#FFFFFF")
        net.add_edge(link["source"], link["target"], color=color, width=2)
    
    net.write_html("templates/graph.html")

@app.route("/", methods=["GET", "POST"])
def index():
    if request.method == "POST":
        name = request.form["name"]
        phone = request.form["phone"]
        tags = request.form["tags"].split()
        
        new_id = f"node{len(graph_data['nodes']) + 1}"
        graph_data["nodes"].append({
            "id": new_id,
            "label": name,
            "phone": phone,
            "group": tags
        })

        for tag in tags:
            for node in graph_data["nodes"]:
                if tag in node["group"] and node["id"] != new_id:
                    graph_data["links"].append({
                        "source": new_id,
                        "target": node["id"],
                        "relation": tag
                    })

        generate_graph()
        return redirect(url_for("index"))

    return render_template("index.html", graph_data=graph_data)

@app.route("/contact_list")
def contact_list():
    return render_template("contact_list.html", graph_data=graph_data)

@app.route("/about")
def about():
    return render_template("about.html")

@app.route("/edit/<node_id>", methods=["GET", "POST"])
def edit_node(node_id):
    node = next((node for node in graph_data["nodes"] if node["id"] == node_id), None)
    if not node:
        return redirect(url_for("index"))

    if request.method == "POST":
        node["label"] = request.form["name"]
        node["phone"] = request.form["phone"]
        node["group"] = request.form["tags"].split()
        
        updated_links = []
        for tag in node["group"]:
            for other_node in graph_data["nodes"]:
                if tag in other_node["group"] and other_node["id"] != node["id"]:
                    updated_links.append({
                        "source": node["id"],
                        "target": other_node["id"],
                        "relation": tag
                    })
        
        graph_data["links"] = [link for link in graph_data["links"] if not (link["source"] == node["id"] or link["target"] == node["id"])]
        graph_data["links"].extend(updated_links)
        
        generate_graph()
        return redirect(url_for("index"))

    return render_template("edit_node.html", node=node)

if __name__ == "__main__":
    if not os.path.exists("static"):
        os.makedirs("static")
    generate_graph()
    app.run(debug=True)
