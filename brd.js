
function numEdgeUsers(u,v, strategies, extra_players=0) {
  var res = extra_players;
  for (strategy of strategies){
    for (var i = 0; i < strategy.length - 1; i++)
      if (strategy[i]==u && strategy[i + 1]==v){
        res++;
      }
  }
  return res;
}

function EdgeSocialCost(u,v,cost, strategies, extra_players=0) {
  num_users = numEdgeUsers(u,v, strategies, extra_players)
  if (num_users === 0){
    return null;
  }
  return Polynomial(cost).eval(num_users)
}

function edgePlayerSwitchCost(u,v,cost, strategies){
  return EdgeSocialCost(u,v,cost,strategies, 1) / numEdgeUsers(u,v, strategies, 1)
}

function edgePlayerCost(u,v,cost, strategies){
  return EdgeSocialCost(u,v,cost,strategies) / numEdgeUsers(u,v, strategies)
}

function linksInStrategy(strategy, links) {
    var res = []
    for (var i = 0; i < strategy.length-1; i++){
        sourceNode =  strategy[i]
        targetNode =  strategy[i+1]
        link_d = getLink(links, sourceNode, targetNode)
        if (link_d!=null){
            res.push(link_d)
        }
    }
    return res
}

function player_cost(player, strategies, links) {
    var res = 0
    var strategy = strategies[player]
    for (var i = 0; i < strategy.length-1; i++){
        u = strategy[i]
        v = strategy[i+1]
        res += edgePlayerCost(u,v, getLink(links, u,v).cost, strategies)
    }
    return res
}

function total_social_cost(links, strategies) {
  res= 0
  calculated_edges = new Set()
  for (var k = 0; k < strategies.length; k++){
    for (var j = 0; j < strategies[k].length-1; j++){

      u= strategies[k][j]
      v= strategies[k][j+1]
      key = u.toString() + ", " +v.toString()
      
      if (!calculated_edges.has(key)){
        calculated_edges.add(key)
        res+= EdgeSocialCost(u,v, getLink(links, u,v).cost, strategies)
      }
    }
  }
  return res;
}


function potential(links, strategies) {
  res= 0
  calculated_edges = new Set()
  for (var k = 0; k < strategies.length; k++){
    for (var j = 0; j < strategies[k].length-1; j++){
      u= strategies[k][j]
      v= strategies[k][j+1]
      key = u.toString() + ", " +v.toString()
      if (!calculated_edges.has(key)){
        calculated_edges.add(key)
        var users = numEdgeUsers(u,v, strategies)
        if (users){
          cost = getLink(links, u,v).cost
          for (var i = 1; i <= users; i++){
            res += Polynomial(cost).eval(i)
          }
        }
      }
    }
  }
  return res;
}


function findMinimialDistanceNode(Q, dist){
  q_arr = Array.from(Q)
  min_dist= Infinity
  min_node= null
  for (var i = 0; i < q_arr.length; i++){
    node = q_arr[i]
    if (dist[node]<min_dist){
      min_node = node
      min_dist= dist[node]
    }
  }
  // console.log("min node is " + min_node.toString())

  return min_node
}

function getNeighbors(links, u, Q){
  q_arr = Array.from(Q)
  neighbors = []
  for (var i = 0; i < q_arr.length; i++){
    v = q_arr[i]
    if (getLink(links, nodes[u].id, nodes[v].id)){
      neighbors.push(v)
    }
  }
    return neighbors
}


function CopyStrategies(strategies){
    copy = new Array(strategies.length);
    for (var i=0; i<strategies.length; ++i){
      copy[i] = strategies[i].slice(0);
    }
    return copy
}


function findBetterStrategy(strategies, players, graph, player){
  player_strategy = strategies[player]
  new_strategies = CopyStrategies(strategies)
  new_strategies[player] = []
  new_strategy = Dijkstra(players[player].source,players[player].target, graph, new_strategies, player)
  return new_strategy
}

function getLink(links, desired_source, desired_target){
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

  for (link of links) {
    is_edge= link['source'].id ==source && link['target'].id == target
    is_direction= (should_left && link['left']) || (should_right && link['right'])
    if (is_edge && is_direction){
        return link
      }
    }

  return null
}

function isValidStrategyPath(strategyPath, players, player){
  return strategyPath!=null && strategyPath.length>0 && strategyPath[strategyPath.length-1] == players[player].target
}


function validPlayer(players, player){
  return players[player].source !=null && players[player].target!=null
}

function getBetterStrategyIfExists(graph, strategies, players, player){
  if (!validPlayer(players, player)){
    return null
  }
  var strategy = findBetterStrategy(strategies, players, graph, player)
  if (!isValidStrategyPath(strategy.path, players, player)){
    return null
  }
  var current_strategy = strategies[player]
  var isImproving= !isValidStrategyPath(current_strategy, players, player)  ||  strategy.cost< player_cost(player, strategies, links)
  if (isImproving){
    return strategy;
    }
  return null;
}


function PickStrategy(G, strategies, players, player){
  if (!isValidStrategyPath(strategies[player], players, player))
      strategy = getBetterStrategyIfExists(G, strategies, players, player)
      if (strategy==null){
        console.log('no valid strategy for player ' + player.toString())
      }else{
        strategies[player] = strategy.path
      }
      
      
}

function isNashEquilibrium(G, strategies, players){
  var newStrategies  = CopyStrategies(strategies)
  for (var player = 0; player < players.length; player++){
    betterStrategy = getBetterStrategyIfExists(G, newStrategies, players, player) 
    if (betterStrategy!=null){
      return false
    }

  }
  return true
}




function BestResponseDynamics(G, strategies, players){
  var strategies  = CopyStrategies(strategies)
  for (var player = 0; player < players.length; player++){
    PickStrategy(G, strategies, players, player)
  }

  var all_strategies = [];
  do {
    console.log('here')
    all_strategies.push(CopyStrategies(strategies))
    NE = true
    for (var player = 0; player < players.length; player++){
      invalid_strategy = strategies[player] ==null
      if (invalid_strategy){
        continue
      }
      new_strategy = getBetterStrategyIfExists(G, strategies, players, player)
      if (new_strategy!=null){
        strategies[player] = new_strategy.path
        NE = false
      }
    }
  }
  while (!NE);
  return all_strategies
}

function Dijkstra(source_id, target_id, graph, strategies){
  source_index = graph.nodes.findIndex( function (node) {return node.id==source_id})
  target_index = graph.nodes.findIndex( function (node) {return node.id==target_id})
  // console.log('source_index is ' + source_index.toString())
  // console.log('target_index is ' + target_index.toString())


  prev = []
  dist= []
  Q = new Set()
  for (var i = 0; i < graph.nodes.length; i++){
    if (i==source_index){
      dist.push(0)  
    }else{
      dist.push(Infinity)  
    }
    prev.push(null)
    Q.add(i)
  }

  while (Q.size>0){
    u = findMinimialDistanceNode(Q, dist)
    if (u==null) { //there are no more connected nodes to the graph
      break
    }
    Q.delete(u)
    neighbors = getNeighbors(graph.links,u, Q)

    for (v of neighbors){
      var link = getLink(graph.links, u,v);
      alt = dist[u] + edgePlayerSwitchCost(u,v,link.cost, strategies);
      // console.log('link is (' +u.toString(), ',' +v.toString()+')'+ ' alt is ' + alt.toString());
      if (alt < dist[v]){
        dist[v]=alt 
        prev[v]=u 
      }               
   }    
  }
  // console.log('dists are ' +dist.toString())
  shortest_path = get_shortest_path(source_index, target_index, prev, graph.nodes)
  return {'path': shortest_path, 'cost': dist[target_index], prev: prev}
}


function get_shortest_path(source_index, target_index, prev, nodes){
  s=[]
  u= target_index
  if (prev[u] !=null || u==source_index){
    // console.log('u is ' + u.toString())
    while (u!=null){
      s.unshift(nodes[u].id)
      u=prev[u]
    }
  }
  return s
}
