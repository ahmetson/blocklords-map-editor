var width = 1015,
	height = 561,
	colors = d3.scale.category10();
	
var svg = d3.select('.graph-container')
			.append('svg')
			.attr('width',width)
			.attr('height',height)
			.attr('style', "background-image:url(regions.png);");

// Init the list of nodes and edges with some nodes?
// >>>>>>>>>>>>>>>>
var nodes = [ 	
			// {id : 0, x : 100, y : 100 },
			// {id : 1, x : 200, y : 200 },
			// {id : 2, x : 300, y : 300 }
		],
	links = [	
			// {source : nodes[0], target : nodes[1], weight : 1},
			// {source : nodes[1], target : nodes[2], weight : 1 }
		];

var drag_line = svg.append('svg:path')
	.attr('class', 'link dragline hidden')
	.attr('d', 'M0,0L0,0');
// <<<<<<<<<<<<<<<<<<<<

var path; 
var circle; 
var weight;
var selected_node = null,
    selected_link = null,
    mousedown_link = null,
    mousedown_node = null,
    mouseup_node = null;
 
function resetMouseVars() {
  mousedown_node = null;
  mouseup_node = null;
  mousedown_link = null;
}


function restart()
{
	reListVertices();
	reListEdges();

	// redraw everything
	
	svg.selectAll('g').remove();
	
	path =  svg.append('svg:g').selectAll('path'),
	circle = svg.append('svg:g').selectAll('g');
	weight = svg.append('svg:g').selectAll('text');
	
	circle = circle.data(nodes, function(d) { return d.id; });
	circle.selectAll('circle')
		.style('fill', function(d) { return (d === selected_node) ? d3.rgb(colors(d.id)).brighter().toString() : colors(d.id); });
	
	var g = circle.enter().append('svg:g');

	g.append('svg:circle')
		.attr('class','node')
		.attr('r',12)
		.attr('cx', function (d) { return d.x; })
		.attr('cy', function (d) { return d.y; })
		.style('fill', function(d) { return (d === selected_node) ? d3.rgb(colors(d.id)).brighter().toString() : colors(d.id); })
		.style('stroke', function(d) { return d3.rgb(colors(d.id)).darker().toString(); })
		.on('mousedown', function(d) {
			if (d3.event.ctrlKey) return;
			
			mousedown_node = d;
			if (mousedown_node === selected_node) selected_node = null;
			else selected_node = mousedown_node;
			
			selected_link = null;
 
			  // reposition drag line
			drag_line
				/*
				.style('marker-end', 'url(#end-arrow)')
				*/
				.classed('hidden', false)
				.attr('d', 'M' + mousedown_node.x + ',' + mousedown_node.y + 'L' + mousedown_node.x + ',' + mousedown_node.y);
		 	
			restart();
		})
		.on('mouseup', function(d) {
			if (!mousedown_node) return;
			
			drag_line
        .classed('hidden', true)
		/*
        .style('marker-end', '');
		*/
 
		  // check for drag-to-self
		  mouseup_node = d;
		  if(mouseup_node === mousedown_node) { resetMouseVars(); return; }
	 
	 
		  // add link to graph (update if exists)
		  // NB: links are strictly source < target; arrows separately specified by booleans
		  var source, target, direction;
		  if(mousedown_node.id < mouseup_node.id) {
			source = mousedown_node;
			target = mouseup_node;
			//direction = 'right';
		  } else {
			source = mouseup_node;
			target = mousedown_node;
			//direction = 'left';
		  }
	 
		  var link;
		  link = links.filter(function(l) {
			return (l.source === source && l.target === target);
		  })[0];
	 
		  if(link) {
			//link[direction] = true;
		  } else {
		    var dist = parseInt(Math.sqrt(Math.pow(source.x - target.x,2) + Math.pow(source.y - target.y,2)));
			
		    //////////////////////////////////////////////
		    /// We do not support the edge weights. Remove the command line below
		    ///	to support the edge weights
		    //////////////////////////////////////////////
			dist = 1;
			link = {source: source, target: target, weight: dist};
			//link[direction] = true;
			links.push(link);
		  }

		  addEdgeToGraph(mousedown_node, mouseup_node);
	 
		  // select new link
		  selected_link = link;
		  selected_node = null;
		  restart();
		})
	;
	
	g.append('svg:text')
		.attr('x', function(d) { return d.x; })
		.attr('y', function(d) { return d.y; })
		//.attr('y', function (d) { return 4; })
		.attr('class','id')
		.text(function(d) { return d.id; });
	
	//circle.exit().remove();
	
	// drawing paths
	
	path = path.data(links);
	
	path.classed('selected', function(d) { return d === selected_link; });
	
	path.enter().append('svg:path')
		.attr('class','link')
		.classed('selected',function(d) {return d === selected_link; })
		.attr('d', function (d)
		{
			var deltaX = d.target.x - d.source.x,
			deltaY = d.target.y - d.source.y,
			dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY),
			normX = deltaX / dist,
			normY = deltaY / dist,
			/*
			sourcePadding = d.left ? 17 : 12,
			targetPadding = d.right ? 17 : 12,
			*/
			sourcePadding = 12;
			targetPadding = 12;
			sourceX = d.source.x + (sourcePadding * normX),
			sourceY = d.source.y + (sourcePadding * normY),
			targetX = d.target.x - (targetPadding * normX),
			targetY = d.target.y - (targetPadding * normY);
			return 'M' + sourceX + ',' + sourceY + 'L' + targetX + ',' + targetY;
		})
		.on('mousedown', function(d) {
			if(d3.event.ctrlKey) return;
		 
			// select link
			mousedown_link = d;
			if(mousedown_link === selected_link) selected_link = null;
			else selected_link = mousedown_link;
			selected_node = null;
			restart();
		})
		;
	
	// start weight display
	weight = weight.data(links);
	
	weight.enter().append('svg:text')
		.attr('class','weight')
		.attr('x', function(d) 
		{
			var x = weightXY(d.source.x,d.source.y,d.target.x,d.target.y).x;
			// console.log("X = " + x);
			return x;
		})
		.attr('y', function(d)
		{
			var y = weightXY(d.source.x,d.source.y,d.target.x,d.target.y).y;
			// console.log("Y = " + y);
			return y;
		})
		.text(function(d) { return d.weight; })
		;
}

function weightXY(x1,y1,x2,y2)
{
	var dist = Math.sqrt(Math.pow(x2-x1,2) + Math.pow(y2-y1,2));
	//console.log(dist);
	var x2 = (x1 + x2)/2;
	var y2 = (y1 + y2)/2;
	
	if (x1 === x2) return {x : midX + 10, y: midY};
	
	var m1 = (y2 - y1)/(x2-x1);
	//console.log(m1);
	var c1 = y1 - m1*x1;
	//console.log(c1);
	var m2 = -1 / m1;
	//console.log(m2);
	var c2 = y2 - m2*x2;
	//console.log(c2);
	var d = Math.sqrt(Math.pow(x2-x1,2) + Math.pow(y2-y1,2));
	//console.log(d);
	
	var v = 16;
	d = d*d + v*v;
	var D = d;
	//console.log(D);
	var z1 = c2 - y1;
	
	var a = 1 + m2*m2;
	var b = 2*m2*z1 - 2*x1;
	var c = x1*x1 + z1*z1 - D;
	
	var delta = b*b - 4*a*c;
	
	delta = Math.sqrt(delta);
	
	var x_1 = (-b + delta)/(2*a);
	var y_1 = m2*x_1 + c2;
	
	return {x : x_1, y: y_1};
}

function mousedown() {
  svg.classed('active', true);
 
  if(d3.event.ctrlKey || mousedown_node || mousedown_link) return;
 
  // insert new node at point
  var point = d3.mouse(this);
  var node = {id: getColorByCoord(point[0], point[1]), x: point[0], y: point[1]};

  if (isNodeOnGraph(node)) {
  	console.warn("Region with a color #"+node.id+" on graph already");
  	return;
  }

  nodes.push(node);
 	
  addNodeToGraph(node);

  restart();
}


function mousemove() {
  if(!mousedown_node) return;
 
  // update drag line
  drag_line.attr('d', 'M' + mousedown_node.x + ',' + mousedown_node.y + 'L' + d3.mouse(this)[0] + ',' + d3.mouse(this)[1]);
 
  restart();
}
 
function mouseup() {
  if(mousedown_node) {
    // hide drag line
    drag_line
      .classed('hidden', true)
      //.style('marker-end', '');
  }
 
  // because :active only works in WebKit?
  svg.classed('active', false);
 
  // clear mouse event vars
  resetMouseVars();
}

function spliceLinksForNode(node) {
  var toSplice = links.filter(function(l) {
    return (l.source === node || l.target === node);
  });
  toSplice.map(function(l) {
    links.splice(links.indexOf(l), 1);
  });
}
var lastKeyDown = -1;


var drag = d3.behavior.drag()
	.on("drag", function (d)
	{
		//console.log("dragging");
	
		var dragTarget = d3.select(this).select('circle');
		
		// console.log(this);
		// console.log(dragTarget);
		
		var new_cx, new_cy;
		
		// console.log(d);
		
		dragTarget
		.attr("cx", function()
		{
			new_cx = d3.event.dx + parseInt(dragTarget.attr("cx"));
			return new_cx;
		})
		.attr("cy", function()
		{
			new_cy = d3.event.dy + parseInt(dragTarget.attr("cy"));
			return new_cy;
		});
				// return;

		d.x = new_cx;
		d.y = new_cy;
		// console.log(d.x + " " + d.y);
		
		addNodeToGraph(d);
		restart();
	});

function move()
{
}

function keydown() {
  d3.event.preventDefault();
 
  //if(lastKeyDown !== -1) return;
  lastKeyDown = d3.event.keyCode;
 
  // ctrl
  if(d3.event.keyCode === 17) {
    circle.call(drag);
    svg.classed('ctrl', true);
  }
 
  if(!selected_node && !selected_link) return;
  
  switch(d3.event.keyCode) {
    //case 8: // backspace
    case 46: // delete
      if(selected_node) 
	  {
        nodes.splice(nodes.indexOf(selected_node), 1);
        spliceLinksForNode(selected_node);
      } else if(selected_link) {
        links.splice(links.indexOf(selected_link), 1);
      }
      selected_link = null;
      selected_node = null;
      restart();
      break;
	  
	case 13: //enter
	  if (selected_link)
	  {
	    var newWeight = prompt("Enter new weight : ");
		
		var idx = links.indexOf(selected_link);
		links[idx].weight = newWeight;
	  }
	  
	  restart();
	  break;
  }
}
 
function keyup() {
  lastKeyDown = -1;
 
  // ctrl
  if(d3.event.keyCode === 17) {
    circle
      .on('mousedown.drag', null)
      .on('touchstart.drag', null);
    svg.classed('ctrl', false);
  }
}
svg.on('mousedown', mousedown)
	.on('mousemove', mousemove)
	.on('mouseup', mouseup);
d3.select(window)
	.on('keydown',keydown)
	.on('keyup',keyup);
restart();