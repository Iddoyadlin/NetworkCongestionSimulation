// set up SVG for D3



var w=window,
d=document,
e=d.documentElement,
g=d.getElementsByTagName('body')[0],
x=w.innerWidth||e.clientWidth||g.clientWidth,
y=w.innerHeight||e.clientHeight||g.clientHeight;

$('.modal').modal('show')

const width = Math.round(x*0.7);
const height = y;
const colors = ["#D3D3D3", "#ef476f", "#ffd166", "#06d6a0", "#118ab2", "#d48be8"];


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
  { id: 1},
  { id: 2},
  { id: 3}
];
let lastNodeId = nodes.length-1;
// let lastNodeId = 2;
const links = [
   { source: nodes[0], target: nodes[1], left: false, right: true, cost:'4.1' },
   { source: nodes[0], target: nodes[2], left: false, right: true, cost:'x'},
   { source: nodes[2], target: nodes[3], left: false, right: true, cost:'4.1'},
   { source: nodes[1], target: nodes[3], left: false, right: true, cost:'x' }
];

players = [
{"source":0, "target": 3},
{"source":0, "target": 3},
{"source":0, "target": 3}, 
{"source":0, "target": 3}, 
{"source":null, "target": null}, 
]


strategies = [ [0],[0],[0],[0],[] ] //list of nodes for each player. first node should be source of player, last should be target of player
// init D3 force layout
const force = d3.forceSimulation()
  .force('link', d3.forceLink().id((d) => d.id).distance(150))
  .force('charge', d3.forceManyBody().strength(-500))
  .force('x', d3.forceX(width / 2))
  .force('y', d3.forceY(height / 3))
  .on('tick', tick);


// init D3 drag support
const drag = d3.drag()
  // Mac Firefox doesn't distinguish between left/right click when Ctrl is held... 
  .filter(() => d3.event.button === 0 || d3.event.button === 2)
  .on('start', (d) => {
    if (!d3.event.active) force.alphaTarget(0.3).restart();
    force.stop()
    d.fx = d.x;
    d.fy = d.y;
  })
  .on('drag', (d) => {
     d.px += d3.event.dx;
     d.py += d3.event.dy;
     d.x += d3.event.dx;
     d.y += d3.event.dy; 
     tick();
  })
  .on('end', (d) => {
    if (!d3.event.active) force.alphaTarget(0.0);
    d.fixed=true
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
let selectedPlayer = null;



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
    return `M${sourceX},${sourceY}L${targetX},${targetY}`;
  });

  circle.attr('transform', (d) => `translate(${d.x},${d.y})`);
  
}


function updateLinksColors(player, strategies){
  if (player!=null){
    var strategyLinks= linksInStrategy(strategies[player], links)
    var strategyLinksindexes = []
    for (link of strategyLinks){
      strategyLinksindexes.push(link.index)
    }
  }
  else{
    var strategyLinksindexes = []
  }
  var t = d3.transition()
    .duration(750)
    .ease(d3.easeLinear);

  path.transition(t).style("stroke", function(d,i) {
        if (strategyLinksindexes.includes(i)){
          return colors[player+1]
        } return "#000"
      }
      )
}

function updateNodeColors(selectNode, player, strategies){
  circle.selectAll('circle')
    .style('fill', (d) => (d === selectNode) ? d3.rgb(getNodeColor(d, player, strategies)).brighter().toString() : getNodeColor(d, player, strategies))
}

function updateStatus(player, strategies){
  if (player!=null){
    strategyLinks= linksInStrategy(strategies[player], links)
    var strategyLinksindexes = []
    for (link of strategyLinks){
      strategyLinksindexes.push(link.index)
    }
  }
  else{
    var strategyLinksindexes = []
  }
  set_social_cost()
  set_potential()
  set_is_NE()
  set_table()
}


// update graph (called when needed)
function restart() {
  updateStatus(selectedPlayer, strategies)
  // path (link) group

  path = path.data(links);
  // update existing links
  path.classed('selected', (d) => d === selectedLink)
    .style('marker-start', (d) => d.left ? 'url(#start-arrow)' : '')
    .style('marker-end', (d) => d.right ? 'url(#end-arrow)' : '')
  updateLinksColors(selectedPlayer, strategies)


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
  updateNodeColors(selectedNode, selectedPlayer, strategies)
  circle.selectAll('circle')
    .style('fill', (d) => (d === selectedNode) ? d3.rgb(getNodeColor(d, selectedPlayer, strategies)).brighter().toString() : getNodeColor(d, selectedPlayer, strategies))

  // remove old nodes
  circle.exit().remove();

  // add new nodes
  const g = circle.enter().append('svg:g');

  g.append('svg:circle')
    .attr('class', 'node')
    .attr('r', 12)
    .style('fill', (d) => (d === selectedNode) ? d3.rgb(getNodeColor(d, selectedPlayer, strategies)).brighter().toString() : getNodeColor(d, selectedPlayer, strategies))
    .style('stroke', (d) => d3.rgb(getNodeColor(d, selectedPlayer, strategies)).darker().toString())
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
        links.push({ source, target, left: !isRight, right: isRight, cost: 1});
      }
      // select new link
      selectedLink = link;
      selectedNode = null;
      restart();
    });

    toggleCostElement()
      

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

  // force.alphaTarget(0.01).restart();
  force.restart()
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


function clearSelection(){
  selectedLink = null;
  selectedNode = null;
}

function toggleCostElement(){
  cost_element = document.getElementById("cost")
    if (selectedLink!=null){
        cost_element.removeAttribute('placeholder')
        cost_element.disabled=false 
        cost_element.focus()
    }else{
      cost_element.setAttribute("placeholder", "Please select edge")
      cost_element.disabled=true
    }
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
        if (getLink(links, lastNode, selectedNode.id)!=null){
          player_strategy.push(selectedNode.id)
          console.log('added to player ' + selectedPlayer.toString() + ' strategy: ['+ player_strategy.toString() +']')
        }
      clearSelection()
      restart();
      break
    }
    case 83: // S
      if (selectedNode!=null && selectedPlayer != null){
        strategies[selectedPlayer].length = 0 //empty array
        strategies[selectedPlayer].push(selectedNode.id)
        players[selectedPlayer]['source'] = selectedNode.id
        circle.selectAll('text:not(.id)').text(makeAssignmentString);
        clearSelection()
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
  buttons = document.getElementsByClassName('btn-secondary')
  for (var i = 0; i < buttons.length; i++){
    buttons[i].classList.remove("active")
    buttons[i].style.backgroundColor = colors[i+1]
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
      alert("Not a function of x !")
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

function getNodeColor(node, player, strategies){
  if (player==null){
    return colors[0]
  }
  in_strategy = strategies[player].includes(node.id)
  if (!in_strategy){
    return colors[0]
  }
  return colors[player+1]

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

function format_num(num){
  num_str = num.toString()
  if (num_str.includes('.')){
    spl = num_str.split('.')
    num_str = spl[0] +'.' + spl[1].substring(0,4)
  }
  return num_str
}


function set_social_cost(){
  social_cost_em = document.getElementById('social_cost')
  social_cost_em.text = format_num(total_social_cost(links,strategies))
}

function set_potential(){
  potential_em = document.getElementById('potential')
  potential_em.text = format_num(potential(links, strategies))
}

function set_is_NE(){
  ne_em = document.getElementById('NE')
  graph = {nodes:nodes, links:links}
  is_nes = isNashEquilibrium(graph, strategies, players)
  is_ne = is_nes.every(function (e){ return e})
  ne_em.text = is_ne.toString()
  document.getElementsByClassName("runBRD")[0].disabled = is_ne;
}

function set_best_response(){
  graph = {nodes:nodes, links:links}
  var strategy = getBetterStrategyIfExists(graph, strategies, players, selectedPlayer)
  if (strategy!=null){
    strategies[selectedPlayer] = strategy.path
    restart()  
  }
}

function set_table(){
  player_cost_ems = document.getElementsByClassName("player_cost")
  player_strategy_ems = document.getElementsByClassName("player_strategy")
  player_num_ems = document.getElementsByClassName("player_num")
  is_optimal_ems = document.getElementsByClassName("is_optimal")

  is_optimal = isNashEquilibrium(graph, strategies, players)
  for (var i = 0; i < player_cost_ems.length; i++){
      is_optimal_ems[i].innerHTML = is_optimal[i].toString()
      player_cost_ems[i].innerHTML = format_num(player_cost(i, strategies, links))
      text = strategies[i].slice(0,5).join('-') || 'NA'
      if (strategies[i].length>5){
        text= text + "..."
        player_strategy_ems[i].setAttribute('title', strategies[i].join(','))
      }
      player_strategy_ems[i].innerHTML = text

      if (players[i].source!=null && players[i].target==null ){
        player_num_ems[i].innerHTML = i.toString()+"*"
      }
    }
}


function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function start_simulation(){
  graph = {nodes:nodes, links:links}
  all_strategies = BestResponseDynamics(graph, strategies, players)
  for (var i = 0; i < all_strategies.length; i++){
    for (var j = 0; j < all_strategies[i].length; j++){
      currentStrategy= all_strategies[i][j]


      if (currentStrategy ==null || currentStrategy.length==0 ){ //no valid strategy for player
        continue
      }
      if (currentStrategy.toString() == strategies[j].toString() ){ //no change in strategy
        continue
      }

      console.log('next strategy for player ' + j.toString() +'is '+ currentStrategy.toString())
      console.log('current strategy for player ' + j.toString()+ 'is '+ strategies[j].toString())

      if (j!=selectedPlayer){
        await sleep(1500)
      }
      selectPlayer(j)
      await sleep(1500)
      strategies[j] = currentStrategy
      updateNodeColors(null, j, all_strategies[i])
      updateLinksColors(j, all_strategies[i])
      updateStatus(j, all_strategies[i])
      
  }    
  }
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
