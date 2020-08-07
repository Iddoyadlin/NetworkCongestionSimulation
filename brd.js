

function link_source(link){
  return link.right ? link.source : link.target
}

function link_target(link){
  return link.right ? link.target : link.source
}

function num_edge_users(link, strategies, extra_players=0) {
  source = link_source(link)
  target = link_target(link)
  var res = extra_players;
  for (strategy of strategies){
    for (var i = 0; i < strategy.length - 1; i++)
      if (strategy[i] === source.id && strategy[i + 1] === target.id){
        res++;
      }
  }
  return res;
}

function edge_social_cost(link, strategies, extra_players=0) {
  num_users = num_edge_users(link, strategies, extra_players)
  if (num_users === 0){
    return null;
  }
  return Polynomial(link.cost).eval(num_users)
}

function edge_player_switch_cost(link, strategies){
  return edge_social_cost(link, strategies, 1) / num_edge_users(link, strategies, 1)
}

function edge_player_cost(link, strategies){
  return edge_social_cost(link, strategies) / num_edge_users(link, strategies)
}

function links_in_strategy(strategy, links) {
    var res = []
    for (link_d of links){
        src_idx = strategy.indexOf(link_source(link_d).id)
        trg_idx = strategy.indexOf(link_target(link_d).id)
        if (src_idx >= 0 && trg_idx >= 0 && trg_idx - src_idx === 1){
            res.push(link_d)
        }
    }
    return res
}

function player_cost(player, strategies, links) {
    var res = 0
    for (link of links_in_strategy(strategies[player], links)){
        res += edge_player_cost(link, strategies)
    }
    return res
}

function total_social_cost(links, strategies) {
  var res = 0;
  for (var link of links){
    e_social_cost = edge_social_cost(link, strategies);
    if (e_social_cost!=null){
      res += e_social_cost  
    }
    
  }
  return res;
}

function potential(links, strategies) {
  var res = 0
  for (var link of links){
    var users = num_edge_users(link, strategies)
    if (users){
      for (var i = 1; i <= users; i++){
        res += Polynomial(link.cost).eval(i)
      }
    }
  }
  return res
}


function find_minimial_distance_node(Q, dist){
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
  console.log("min node is " + min_node.toString())

  return min_node
}

function get_neighbors(links, u, Q){
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


function copy_strategies(strategies){
    var len = strategies.length
    copy = new Array(len); // boost in Safari
    for (var i=0; i<len; ++i){
      copy[i] = strategies[i].slice(0);
    }
    return strategies
}


function findBetterStrategy(strategies, players, graph, player){
  player_strategy = strategies[player]
  new_strategies = copy_strategies(strategies)
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

function getBetterStrategyIfExists(graph, strategies, players, player){
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

  if (!isValidStrategy(strategies[player], players, player))
      strategy = getBetterStrategyIfExists(G, strategies, players, player)
      strategies[player] = strategy
      if (strategy==null){
        console.log('no valid strategy for player ' + player.toString())
      }
}

function BestResponseDynamics(G, strategies, players){
  var strategies  = copy_strategies(strategies)
  for (var player = 0; player < q_arr.length; i++){
    PickStrategy(G, strategies, players, player)
  }

  all_strategies = [];
  do {
    all_strategies.push(copy_strategies(strategies))
    NE = true
    for (var player = 0; player < q_arr.length; i++){
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
  console.log('source_index is ' + source_index.toString())
  console.log('target_index is ' + target_index.toString())


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
    u = find_minimial_distance_node(Q, dist)
    Q.delete(u)
    neighbors = get_neighbors(graph.links,u, Q)

    for (v of neighbors){
      var link = getLink(graph.links, u,v);
      alt = dist[u] + edge_player_switch_cost(link, strategies);
      console.log('link is (' +u.toString(), ',' +v.toString()+')'+ ' alt is ' + alt.toString());
      if (alt < dist[v]){
        dist[v]=alt 
        prev[v]=u 
      }               
   }    
  }
  console.log('dists are ' +dist.toString())
  console.log(prev)
  shortest_path = get_shortest_path(source_index, target_index, prev, graph.nodes)
  return {'path': shortest_path, 'cost': dist[target_index], prev: prev}
}


function get_shortest_path(source_index, target_index, prev, nodes){
  s=[]
  u= target_index
  if (prev[u] !=null || u==source_index){
    console.log('u is ' + u.toString())
    while (u!=null){
      s.unshift(nodes[u].id)
      u=prev[u]
    }
  }
  return s
}
