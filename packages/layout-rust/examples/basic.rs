use antv_layout::{ForceGraph, ForceGraphHelper, Simulation, SimulationParameters};

fn main() {
    // initialize a graph
    let mut graph: ForceGraph<(), ()> = ForceGraph::default();

    // add nodes to it
    let one = graph.add_force_node("one", ());
    let two = graph.add_force_node("two", ());
    let _three = graph.add_force_node("three", ());
    graph.add_edge(one, two, ());

    // create a simulation from the graph
    let mut simulation = Simulation::from_graph(graph, SimulationParameters::default());

    // your event/render loop
    for frame in 0..50 {
        // update the nodes positions based on force algorithm
        simulation.update(0.035);

        // render (print) your nodes new locations.
        println!("---- frame {frame} ----");
        for node in simulation.get_graph().node_weights() {
            println!("\"{}\" - {:?}", node.name, node.location);
        }
    }
}
