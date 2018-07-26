var cy = window.cy = cytoscape({
  container: document.getElementById('cy'),

  boxSelectionEnabled: false,
  autounselectify: true,

  layout: {
    name: 'dagre'
  },

  style: [
    {
      selector: 'node',
      style: {
        'content': 'data(id)',
        'text-opacity': 0.5,
        'text-valign': 'center',
        'text-halign': 'right',
        'background-color': '#11479e'
      }
    },

    {
      selector: 'edge',
      style: {
        'curve-style': 'bezier',
        'width': 4,
        'target-arrow-shape': 'triangle',
        'line-color': '#9dbaea',
        'target-arrow-color': '#9dbaea'
      }
    }
  ],

  elements: {
    nodes: [
      { data: { id: 'n0' } },
      { data: { id: 'n1' } },
      { data: { id: 'n2' } },
      { data: { id: 'n3' } },
      { data: { id: 'n4' } },
      { data: { id: 'n5' } },
      { data: { id: 'n6' } },
      { data: { id: 'n7' } },
      { data: { id: 'n8' } },
      { data: { id: 'n9' } },
      { data: { id: 'n10'} },
      { data: { id: 'n11' } },
      { data: { id: 'n12' } },
      // { data: { id: 'n13' } },
      // { data: { id: 'n14' } },
      // { data: { id: 'n15' } },
    ],
    edges: [
      { data: { source: 'n1', target: 'n0' } },
      { data: { source: 'n2', target: 'n1' } },
      { data: { source: 'n3', target: 'n1' } },

      { data: { source: 'n4', target: 'n2' } },
      { data: { source: 'n4', target: 'n3' } },

      { data: { source: 'n5', target: 'n4' } },
      { data: { source: 'n6', target: 'n4' } },


      { data: { source: 'n7', target: 'n5' } },
      { data: { source: 'n7', target: 'n6' } },

      { data: { source: 'n8', target: 'n5' } },
      { data: { source: 'n8', target: 'n6' } },

      { data: { source: 'n9', target: 'n7' } },
      { data: { source: 'n9', target: 'n8' } },

      { data: { source: 'n10', target: 'n9' } },
      { data: { source: 'n11', target: 'n9' } },

      { data: { source: 'n12', target: 'n10' } },
      { data: { source: 'n12', target: 'n11' } },

      // { data: { source: 'n13', target: 'n12' } },
      // { data: { source: 'n14', target: 'n13' } },
      // { data: { source: 'n15', target: 'n14' } },
    ]
  },
});
