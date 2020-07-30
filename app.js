// set up SVG for D3
const width = 960;
const height = 500;
const colors = d3.scaleOrdinal(d3.schemeCategory10);

// set default active player


const svg = d3.select('#graph')
  .append('svg')
  .on('contextmenu', () => { d3.event.preventDefault(); })
  .attr('width', width)
  .attr('height', height);

// set up initial nodes and links
//  - nodes are known by 'id', not by index in array.
//  - links are always source < target; edge directions are set by 'left' and 'right'.
const nodes = [
  { id: 0},
  //{ id: 1},
];
let lastNodeId = 0;
// let lastNodeId = 2;
const links = [
   //{ source: nodes[0], target: nodes[1], left: false, right: true },
  // { source: nodes[1], target: nodes[2], left: false, right: true }
];

players = [
{"source":null, "target": null}, 
{"source":null, "target": null}, 
{"source":null, "target": null}, 
{"source":null, "target": null}, 
{"source":null, "target": null}
]

strategies = [ [],[],[],[],[] ] //list of nodes for each player. first node should be source of player, last should be target of player

// TODO: DANIEL: write function to get number of player strategies passing through edge
// For total cost: RUN This function on all edges

function gravity(alpha) {
  return function(d) {
    d.y += (d.cy - d.y) * alpha;
    d.x += (d.cx - d.x) * alpha;
  };
}

// init D3 force layout
const force = d3.forceSimulation()
  .force('link', d3.forceLink().id((d) => d.id).distance(150))
  .force('charge', d3.forceManyBody().strength(-500))
  .force('x', d3.forceX(width / 2))
  .force('y', d3.forceY(height / 2))
  .force("gravity",gravity(100))
  .on('tick', tick);

// init D3 drag support
const drag = d3.drag()
  // Mac Firefox doesn't distinguish between left/right click when Ctrl is held... 
  .filter(() => d3.event.button === 0 || d3.event.button === 2)
  .on('start', (d) => {
    if (!d3.event.active) force.alphaTarget(0.3).restart();

    d.fx = d.x;
    d.fy = d.y;
  })
  .on('drag', (d) => {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  })
  .on('end', (d) => {
    if (!d3.event.active) force.alphaTarget(0);

    d.fx = null;
    d.fy = null;
  });

// define arrow markers for graph links
svg.append('svg:defs').append('svg:marker')
    .attr('id', 'end-arrow')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 6)
    .attr('markerWidth', 3)
    .attr('markerHeight', 3)
    .attr('orient', 'auto')
  .append('svg:path')
    .attr('d', 'M0,-5L10,0L0,5')
    .attr('fill', '#000');

svg.append('svg:defs').append('svg:marker')
    .attr('id', 'start-arrow')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 4)
    .attr('markerWidth', 3)
    .attr('markerHeight', 3)
    .attr('orient', 'auto')
  .append('svg:path')
    .attr('d', 'M10,-5L0,0L10,5')
    .attr('fill', '#000');

// line displayed when dragging new nodes
const dragLine = svg.append('svg:path')
  .attr('class', 'link dragline hidden')
  .attr('d', 'M0,0L0,0');

// handles to link and node element groups
let path = svg.append('svg:g').selectAll('path');
let circle = svg.append('svg:g').selectAll('g');



// mouse event vars
let selectedNode = null;
let selectedLink = null;
let mousedownLink = null;
let mousedownNode = null;
let mouseupNode = null;
let selectedPlayer = null



function resetMouseVars() {
  mousedownNode = null;
  mouseupNode = null;
  mousedownLink = null;
}

// update force layout (called automatically each iteration)
function tick() {
  // draw directed edges with proper padding from node centers
  path.attr('d', (d, i) => {
    const deltaX = d.target.x - d.source.x;
    const deltaY = d.target.y - d.source.y;
    const dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const normX = deltaX / dist;
    const normY = deltaY / dist;
    const sourcePadding = d.left ? 17 : 12;
    const targetPadding = d.right ? 17 : 12;
    const sourceX = d.source.x + (sourcePadding * normX);
    const sourceY = d.source.y + (sourcePadding * normY);
    const targetX = d.target.x - (targetPadding * normX);
    const targetY = d.target.y - (targetPadding * normY);

    if (d.cost!=null){
      if (sourceX < targetX){
        svg.selectAll('textPath').attr('href', '#linkId_' + d.index).text(d.cost.replace(/x/g, 'X'))
      }
      else{
        svg.selectAll('textPath').attr('href', '#linkId_' + d.index).text(flipString(d.cost))
      }
    }


    return `M${sourceX},${sourceY}L${targetX},${targetY}`;
  });

  circle.attr('transform', (d) => `translate(${d.x},${d.y})`);
  
}

// update graph (called when needed)
function restart() {
  // path (link) group
  path = path.data(links);

  // update existing links
  path.classed('selected', (d) => d === selectedLink)
    .style('marker-start', (d) => d.left ? 'url(#start-arrow)' : '')
    .style('marker-end', (d) => d.right ? 'url(#end-arrow)' : '');

  // remove old links
  path.exit().remove();

  // add new links
  path = path.enter().append('svg:path')
    .attr('class', 'link')
    .attr("id",function(d,i) { return "linkId_" + i; })
    .classed('selected', (d) => d === selectedLink)
    .style('marker-start', (d) => d.left ? 'url(#start-arrow)' : '')
    .style('marker-end', (d) => d.right ? 'url(#end-arrow)' : '')
    .on('mousedown', (d) => {
      if (d3.event.ctrlKey) return;

      // select link
      mousedownLink = d;
      selectedLink = (mousedownLink === selectedLink) ? null : mousedownLink;

      selectedNode = null;
      restart();
    })
    .merge(path);
  

  var linktext = svg.append("svg:g").selectAll("g.linklabelholder").data(links);
  linktext.enter().append("g").attr("class", "linklabelholder")
  .append("text")
  .attr("class", "linklabel")
  .style("font-size", "15px")
  .attr("dx", "50")
  .attr("dy", "-7")
  .attr("text-anchor", "middle")
  .style("fill","#00008B")
  .append("textPath")
  .attr("xlink:href", function(d, i) { return "#linkId_" + i;})
  .text(function(d) { 
      return d.cost; //Can be dynamic via d object 
  });

  // circle (node) group
  // NB: the function arg is crucial here! nodes are known by id, not by index!
  circle = circle.data(nodes, (d) => d.id);

  // update existing nodes (selected visual states)
  circle.selectAll('circle')
    .style('fill', (d) => (d === selectedNode) ? d3.rgb(getNodeColor(d)).brighter().toString() : getNodeColor(d))

  // remove old nodes
  circle.exit().remove();

  // add new nodes
  const g = circle.enter().append('svg:g');

  g.append('svg:circle')
    .attr('class', 'node')
    .attr('r', 12)
    .style('fill', (d) => (d === selectedNode) ? d3.rgb(getNodeColor(d)).brighter().toString() : getNodeColor(d))
    .style('stroke', (d) => d3.rgb(getNodeColor(d)).darker().toString())
    .on('mouseover', function (d) {
      if (!mousedownNode || d === mousedownNode) return;
      // enlarge target node
      d3.select(this).attr('transform', 'scale(1.1)');
    })
    .on('mouseout', function (d) {
      if (!mousedownNode || d === mousedownNode) return;
      // unenlarge target node
      d3.select(this).attr('transform', '');
    })
    .on('mousedown', (d) => {
      if (d3.event.ctrlKey) return;

      // select node
      mousedownNode = d;
      selectedNode = (mousedownNode === selectedNode) ? null : mousedownNode;
      selectedLink = null;

      // reposition drag line
      dragLine
        .style('marker-end', 'url(#end-arrow)')
        .classed('hidden', false)
        .attr('d', `M${mousedownNode.x},${mousedownNode.y}L${mousedownNode.x},${mousedownNode.y}`);

      restart();
    })
    .on('mouseup', function (d) {
      if (!mousedownNode) return;

      // needed by FF
      dragLine
        .classed('hidden', true)
        .style('marker-end', '');

      // check for drag-to-self
      mouseupNode = d;
      if (mouseupNode === mousedownNode) {
        resetMouseVars();
        return;
      }

      // unenlarge target node
      d3.select(this).attr('transform', '');

      // add link to graph (update if exists)
      // NB: links are strictly source < target; arrows separately specified by booleans
      const isRight = mousedownNode.id < mouseupNode.id;
      const source = isRight ? mousedownNode : mouseupNode;
      const target = isRight ? mouseupNode : mousedownNode;

      const link = links.filter((l) => l.source === source && l.target === target)[0];
      if (link) {
        link[isRight ? 'right' : 'left'] = true;
        link.append('svg:text')
        .style("pointer-events", "none")
            .attrs({
                'class': 'edgelabel',
                'id': function (d, i) {return 'edgelabel' + i},
                'font-size': 10,
                'fill': '#aaa'
            });
      } else {
        links.push({ source, target, left: !isRight, right: isRight });
      }

      // select new link
      selectedLink = link;
      selectedNode = null;
      
      restart();
    });

    cost_element = document.getElementById("cost")
    if (selectedLink!=null){
        console.log('selected')
        cost_element.removeAttribute('placeholder')
        cost_element.disabled=false 
        cost_element.focus()
    }else{
      console.log('not selected')
      cost_element.setAttribute("placeholder", "Please select edge")
      cost_element.disabled=true
    }
      

  // show node IDs
   g.append('svg:text')
      .attr('x', 0)
      .attr('y', 4)
      .attr('class', 'id')
      .text(function(d) { return d.id; });

    g.append('svg:text')
      .attr('x', 16)
      .attr('y', 4)
      .attr('class', 'shadow')
      .text(makeAssignmentString);

    // text foreground
  g.append('svg:text')
      .attr('x', 16)
      .attr('y', 4)
      .text(makeAssignmentString);

  circle = g.merge(circle);

  // set the graph in motion
  force
    .nodes(nodes)
    .force('link').links(links);

  force.alphaTarget(0.01).restart();
}

function mousedown() {
  // because :active only works in WebKit?
  svg.classed('active', true);

  if (d3.event.ctrlKey || mousedownNode || mousedownLink) return;

  // insert new node at point
  const point = d3.mouse(this);
  const node = { id: ++lastNodeId, x: point[0], y: point[1] };
  nodes.push(node);

  restart();
}

function mousemove() {
  if (!mousedownNode) return;

  // update drag line
  dragLine.attr('d', `M${mousedownNode.x},${mousedownNode.y}L${d3.mouse(this)[0]},${d3.mouse(this)[1]}`);
}

function mouseup() {
  if (mousedownNode) {
    // hide drag line
    dragLine
      .classed('hidden', true)
      .style('marker-end', '');
  }

  // because :active only works in WebKit?
  svg.classed('active', false);

  // clear mouse event vars
  resetMouseVars();
}

function spliceLinksForNode(node) {
  const toSplice = links.filter((l) => l.source === node || l.target === node);
  for (const l of toSplice) {
    links.splice(links.indexOf(l), 1);
  }
}

function removeNodeFromPlayers(node){
  for (var player = 0; player < players.length; player++){
          if (players[player]['source'] == node.id) {
              players[player]['source'] = null
          }
          if (players[player]['target'] == node.id) {
              players[player]['target'] = null
              }

        }
}


function checkIfinLinks(desired_source, desired_target){
  //  - links are always source < target; edge directions are set by 'left' and 'right'.
  if (desired_source< desired_target){
    source= desired_source
    target = desired_target
    should_right=true
    should_left=false
  }else{
    source= desired_target
    target = desired_source
    should_right=false
    should_left=true
  } 

  for (var i = 0; i < links.length; i++) {
    link = links[i]
    is_edge= link['source'].id ==source && link['target'].id == target
    is_direction= (should_left && link['left']) || (should_right && link['right'])
    if (is_edge && is_direction){
        return true
      }
    }

  return false
}

function clearSelection(){
  selectedLink = null;
  selectedNode = null;
}

// only respond once per keydown
let lastKeyDown = -1;

function keydown() {

  if (lastKeyDown !== -1) return;
  lastKeyDown = d3.event.keyCode;

  // ctrl
  if (d3.event.keyCode === 17) {
    circle.call(drag);
    svg.classed('ctrl', true);
    return;
  }

  if (selectedNode===null && !selectedLink) return;

  switch (d3.event.keyCode) {
    //case 8: // backspace
    case 46: // delete
      if (selectedNode) {
        nodes.splice(nodes.indexOf(selectedNode), 1);
        spliceLinksForNode(selectedNode);
        removeNodeFromPlayers(selectedNode)
      } else if (selectedLink) {
        links.splice(links.indexOf(selectedLink), 1);
      }
      clearSelection()
      restart();
      break;
    case 66: // B
      if (selectedLink) {
        // set link direction to both left and right
        selectedLink.left = true;
        selectedLink.right = true;
      }
      restart();
      break;
    case 76: // L
      if (selectedLink) {
        // set link direction to left only
        selectedLink.left = true;
        selectedLink.right = false;
      }
      restart();
      break;
    case 82: // R
      if (selectedLink) {
        // set link direction to left only
        selectedLink.left = false;
        selectedLink.right = true;
      }
      restart();
      break;
    
    case 80: // p
      if (selectedNode!=null && selectedPlayer != null){
        player_strategy = strategies[selectedPlayer]
        if (player_strategy.length==0){
          console.log('no source node')
          return clearSelection()
        }

        lastNode= player_strategy[player_strategy.length-1]

        if (player_strategy.includes(selectedNode.id)){
          console.log('node already in strategy')
          return clearSelection()
        }
        if (checkIfinLinks(lastNode, selectedNode.id)){
          player_strategy.push(selectedNode.id)
          console.log('added to player ' + selectedPlayer.toString() + ' strategy: ['+ player_strategy.toString() +']')
        }
      clearSelection()
      restart();
      break
    }
    case 83: // S
      if (selectedNode!=null && selectedPlayer != null){
        if (players[selectedPlayer]['source'] != selectedNode.id){
          strategies[selectedPlayer].length = 0 //empty array
          strategies[selectedPlayer].push(selectedNode.id)
          players[selectedPlayer]['source'] = selectedNode.id
          circle.selectAll('text:not(.id)').text(makeAssignmentString);
          clearSelection()
        }
      }
      
      restart();
      break
      
    case 84: // T
      if (selectedNode!=null && selectedPlayer !=null){
        players[selectedPlayer]['target'] = selectedNode.id
        circle.selectAll('text:not(.id)').text(makeAssignmentString);
        clearSelection()
      }
      
      restart();    
      break;
  } 
}


function keyup() {
  lastKeyDown = -1;

  // ctrl
  if (d3.event.keyCode === 17) {
    circle.on('.drag', null);
    svg.classed('ctrl', false);
  }
}

function selectPlayer(player){
  buttons = document.getElementsByClassName('btn')
  for (var i = 0; i < buttons.length; i++){
    buttons[i].classList.remove("active")
    buttons[i].style.backgroundColor = colors(i+1)
  }
  buttons[player].classList.add("active")

  selectedPlayer = player
  restart()
}

function submit(){
  if (selectedLink) {
    // set link cost function to user input
    var temp = document.getElementById("cost").value;
    var p = Polynomial(temp)
    var ok = true

    if (Object.values(p.coeff).every(function (e){ return !isNaN(e)})){
      for (var i = 1; i < players.length + 1; i++){
        if (p.eval(i) < 0){
          alert("Cost function must be non-negative !")
          ok = false
          break;
        }
      }
    }
    else{
      alert("Not a polynomial of x !")
      ok = false
    }
    if (ok){
      selectedLink.cost = temp
    }
    document.getElementById("cost").value = ""
    svg.selectAll('textPath').attr('href', '#linkId_' + selectedLink.id).text('')
  }
  clearSelection()
  restart();
}

function getNodeColor(node){
  if (selectedPlayer==null){
    return colors(0)
  }
  in_strategy = strategies[selectedPlayer].includes(node.id)
  if (!in_strategy){
    return colors(0)  
  }
  return colors(selectedPlayer+1)

}

// get source and target strings
function makeAssignmentString(node) {
  var s = ""
  for (var player = 0; player < players.length; player++) {
    if (node.id == players[player]["source"]){
      if (s=="") {
          s = "S"+(player).toString()
      }else{
          s = s+ ", S"+player.toString()
      }
    }
  }

  for (var player = 0; player < players.length; player++) {
    if (node.id == players[player]["target"]){
      if (s=="") {
          s = "T"+player.toString()
      }else{
          s = s+ ", T"+player.toString()
      }
    }
  }
  return s
}


function find_minimial_distance_node(Q, dist){
  q_arr = Array.from(Q)
  min_dist= Infinity
  min_node= null
  for (var i = 0; i < q_arr.length; i++){
    node = q_arr[i]
    //console.log("node is "+ node.toString() + "dist is" +dist[node].toString())
    if (dist[node]<min_dist){
      min_node = node
      min_dist= dist[node]
    }
  }
  console.log("min node is " + min_node.toString())

  return min_node
}

function get_neighbors(u, Q){
  q_arr = Array.from(Q)
  neighbors = []
  for (var i = 0; i < q_arr.length; i++){
    v = q_arr[i]
    if (checkIfinLinks(nodes[u].id, nodes[v].id)){
      neighbors.push(v)
    }
  }
return neighbors
}


function cost(u,v){
  return 1
}


function Dijkstra(source, target, links, nodes){
  prev = []
  dist= []
  Q = new Set()
  for (var i = 0; i < nodes.length; i++){
    if (nodes[i].id==source){
      dist.push(0)  
    }else{
      dist.push(Infinity)  
    }
    prev.push(null)
    Q.add(i)
  }

  while (Q.size>0){
    u = find_minimial_distance_node(Q, dist)
    Q.delete(u)
    if (u==target){
      break
   }
   neighbors = get_neighbors(u, Q)

    for (var i = 0; i < neighbors.length; i++){
      v = neighbors[i]
      alt = dist[u] + cost(u, v)
      if (alt < dist[v]){
        dist[v]=alt 
        prev[v]=u 
      }               
   }    
  }
  console.log("nodes are [" +nodes.toString() + "]")
  console.log("distances are [" +dist.toString() + "]")
  console.log("prevs are [" +prev.toString() + "]")
}


// app starts here
svg.on('mousedown', mousedown)
  .on('mousemove', mousemove)
  .on('mouseup', mouseup);

d3.select(window)
  .on('keydown', keydown)
  .on('keyup', keyup);



restart();
selectPlayer(0)



function flipString(aString)
{
  var last = aString.length - 1;
  //Thanks to Brook Monroe for the
  //suggestion to use Array.join
  var result = new Array(aString.length)
  for (var i = last; i >= 0; --i)
  {
    var c = aString.charAt(i)
    var r = flipTable[c]
    result[last - i] = r != undefined ? r : c
  }
  return result.join('')
}

var flipTable = {
'\u0021' : '\u00A1',
'\u0022' : '\u201E',
'\u0026' : '\u214B',
'\u0027' : '\u002C',
'\u0028' : '\u0029',
'\u002E' : '\u02D9',
'\u0033' : '\u0190',
'\u0034' : '\u152D',
'\u0036' : '\u0039',
'\u0037' : '\u2C62',
'\u003B' : '\u061B',
'\u003C' : '\u003E',
'\u003F' : '\u00BF',
'\u0041' : '\u2200',
'\u0042' : '\u10412',
'\u0043' : '\u2183',
'\u0044' : '\u25D6',
'\u0045' : '\u018E',
'\u0046' : '\u2132',
'\u0047' : '\u2141',
'\u004A' : '\u017F',
'\u004B' : '\u22CA',
'\u004C' : '\u2142',
'\u004D' : '\u0057',
'\u004E' : '\u1D0E',
'\u0050' : '\u0500',
'\u0051' : '\u038C',
'\u0052' : '\u1D1A',
'\u0054' : '\u22A5',
'\u0055' : '\u2229',
'\u0056' : '\u1D27',
'\u0059' : '\u2144',
'\u005B' : '\u005D',
'\u005F' : '\u203E',
'\u0061' : '\u0250',
'\u0062' : '\u0071',
'\u0063' : '\u0254',
'\u0064' : '\u0070',
'\u0065' : '\u01DD',
'\u0066' : '\u025F',
'\u0067' : '\u0183',
'\u0068' : '\u0265',
'\u0069' : '\u0131',
'\u006A' : '\u027E',
'\u006B' : '\u029E',
'\u006C' : '\u0283',
'\u006D' : '\u026F',
'\u006E' : '\u0075',
'\u0072' : '\u0279',
'\u0074' : '\u0287',
'\u0076' : '\u028C',
'\u0077' : '\u028D',
'\u0079' : '\u028E',
'\u007B' : '\u007D',
'\u203F' : '\u2040',
'\u2045' : '\u2046',
'\u2234' : '\u2235',
'2': '\u218A',
'^': '\u2304',
'x': 'X',
'1': '\u21c2'
}

for (i in flipTable)
{
  flipTable[flipTable[i]] = i
}
