/*
Tube Heartbeat was created by Oliver O'Brien (http://oobrien.com/) using the HERE Maps 
Javascript and REST APIs, the Google Visualisation platform, and JQuery/JQueryUI.
It uses data from Transport for London which is made available under the 
Open Government Licence and is Crown Copyright and Database Right Transport for London 2016.
Code and concept (C) Oliver O'Brien 2016.
*/

var ui;
var map;

var stations = [];
var lines = [];
var totals = [];
var stationGroup = new H.map.Group();
var segGroup = new H.map.Group();

var nightMode = false;
var timeofday =9;
var OLD_YEAR = "aut2012";
var NEW_YEAR = "aut2015";
var yearstr = NEW_YEAR;
var showGraphs = false;
var nlcGraph = -1;
var nlcStartGraph = -1;
var nlcEndGraph = -1;

var materialStation;
var materialLine1;
var materialLine2;
var dayChart;

var shortAnim = false;

var direction = 'directionRbusiest';
var dataset = 'datasetRnewer';
var object = 'objectRboth';

var defaultLayers;

var stationStyle = {
  strokeColor: 'black',
  fillColor: 'rgba(255, 255, 255, 0.8)',
  lineWidth: 3
};

var nightLayer;
var dayLayer;

function init()
{
	var platform = new H.service.Platform({
	  'app_id': 'pzyHlMgMiCMOaN31GPTv',
	  'app_code': 'm3pB0Jpyy3AXx6rVPQmZXQ'
	});

	/* Obtain the default map types from the platform object: */
	defaultLayers = platform.createDefaultLayers();

	/* 
	var baseLayer = defaultLayers.normal.xbase;
	baseLayer = defaultLayers.normal.day.grey;
	baseLayer.setData({opacity: 0.8}); 
	*/

	var mapTileService = platform.getMapTileService({ 'type': 'base' });
	dayLayer = mapTileService.createTileLayer(
	  'maptile', 
	  'normal.day.grey', 
	  256, 
	  'png8', 
	  { opacity: 0.5 });

 	nightLayer = mapTileService.createTileLayer(
	  'maptile', 
	  'normal.night', 
	  256, 
	  'png8', 
	  { opacity: 0.5 });

	// Instantiate (and display) a map object:
	map = new H.Map(
	  document.getElementById('mapcontainer'),
	  //defaultLayers.terrain.base,
	  dayLayer,
	  {
		zoom: 12,
		center: { lat: 51.525, lng: -0.135 },
	  }
	);
	
	/*
	map.addLayer(dayLayer);
	map.addLayer(defaultLayers.normal.mapnight);
	map.addLayer(defaultLayers.normal.labels); 
	*/
	
	var customStyle = {
	  /* fillColor: 'rgba(0, 0, 0, 0.3)', */
	  fillColor: 'rgba(240, 240, 240, 0.35)'
	};

	/* Create a rectangle and pass the custom style as an options parameter: */
	var rect = new H.map.Rect(new H.geo.Rect(42, -7, 58, 7), 
	  { style: customStyle });

	/*  Add the rectangle to the map: */
	map.addObject(rect);

	/*  Create the default UI: */
	ui = H.ui.UI.createDefault(map, defaultLayers);
	ui.getControl('mapsettings').setVisibility(false);

	/*  Enable the event system on the map instance: */
	var mapEvents = new H.mapevents.MapEvents(map);

	/* Add event listeners: */
	map.addEventListener('tap', function(evt) 
	{
	   if (evt.target instanceof H.map.Object && evt.target.getData())
	   {
	   		if (!showGraphs) { $('#itemprofilepanel').slideToggle(); showGraphs = true; }
	   		if (evt.target.getData().nlc)
	   		{
		   		updateStationGraph(evt.target.getData().nlc);
			}
			else if (evt.target.getData().startnlc && evt.target.getData().endnlc)
			{
				updateLineGraphs(evt.target.getData().startnlc, evt.target.getData().endnlc);
			}	   			
	   }
	   else
	   {
	   		if (showGraphs) { $('#itemprofilepanel').slideToggle(); showGraphs = false; }	   
	   }
		
	});

	/* Instantiate the default behavior, providing the mapEvents object: */
	var behavior = new H.mapevents.Behavior(mapEvents);
	requestStationData();		
	map.addObject(segGroup);
	map.addObject(stationGroup);  
}

function showStationPanel(nlc)
{
	if (!showGraphs) { $('#itemprofilepanel').slideToggle(); showGraphs = true; }
	updateStationGraph(nlc);
}

function showLinePanel(startnlc, endnlc)
{
	if (!showGraphs) { $('#itemprofilepanel').slideToggle(); showGraphs = true; }
	updateLineGraphs(startnlc, endnlc);
}

function updateStationGraph(nlc)
{
	nlcGraph = nlc;
	nlcStartGraph = -1;
	nlcEndGraph = -1;
	
	var html = "" + stations[nlc].name + "";
	var station = stations[nlc];
	/* html += station.A.current; */
	
	$('#itemprofilepaneltitle').html(html);	  
  	$('#itemprofilepanelkey').html("");	   	
	$('#itemprofilepanelstationchart').css('display', 'block');	  
	$('#itemprofilepaneldir1chartpanel').css('display', 'none');	  
	$('#itemprofilepaneldir2chartpanel').css('display', 'none');	  
		
	var data = new google.visualization.DataTable();
	data.addColumn('datetime');/*, 'Time of Day'); */
	var isA = station['A'] && station['A'][yearstr];
	var isE = station['E'] && station['E'][yearstr];
	var isI = station['I'] && station['I'][yearstr];

	// Set first column to GMT, so that the graphs display correctly when viewing site in other timezones.
	var dateFormat = new google.visualization.DateFormat({timeZone: 0});
	dateFormat.format(data, 0);

	var colours = [];
	if (isA) { data.addColumn('number', 'Entries'); colours.push('#ff0000'); }
	if (isE) { data.addColumn('number', 'Exits'); colours.push('#008800'); }
	if (isI) { data.addColumn('number', 'Interchanges'); colours.push('#000000'); }

	var maxval = 0;
	var maxtime = 0;
	var maxvalEntry = 0;
	var maxtimeEntry = 0;
	for (var i = 0; i < 84; i++)
	{
		var A = 0;
		var E = 0;
		var I = 0;
		if (isA) { A = station['A'][yearstr][i]; }
		if (isE) { E = station['E'][yearstr][i]; }
		if (isI) { I = station['I'][yearstr][i]; }
		
		var h = parseInt(getHour(i));
		var m = parseInt(getMoh(i));
		if (isA && isE && isI) { data.addRow([new Date(2016, 1, 1, h, m), A, E, I]); }
		else if (isA && isE) { data.addRow([new Date(2016, 1, 1, h, m), A, E]); }
		else if (isA && isI) { data.addRow([new Date(2016, 1, 1, h, m), A, I]); }
		else if (isE && isI) { data.addRow([new Date(2016, 1, 1, h, m), E, I]); }
		else if (isA) {  data.addRow([new Date(2016, 1, 1, h, m), A]); }
		else if (isE) {  data.addRow([new Date(2016, 1, 1, h, m), E]); }
		else if (isI) {  data.addRow([new Date(2016, 1, 1, h, m), I]); }
		
		if (A+E+I > maxval) { maxval = A+E+I; maxtime = i; }
		if (A > maxvalEntry) { maxvalEntry = A; maxtimeEntry = i; }	
	}
	
	var options = {
		legend: { position: 'none' },
		bar: { groupWidth: '120%' },
		colors: colours,
		chart: {
			/*
			title: 'Station Entries, Exits and Interchanges',
			subtitle: 'Counts for 15-minute intervals across typical weekday',
			*/
		},
		hAxis: {
			/* title: 'Time of Day', */
			format: 'H:mm'
		},
		vAxis: {
			/* title: 'Number' */
		}
	};
	  
	var html = "<div class='chartsubtitle'>Numbers for fifteen-minute intervals across a typical weekday. ";

	if (isA) { html += "<div class='panelkeyitem' style='background-color: #ff0000; color: white;'>Entries</div>"; } 
	if (isE) { html += "<div class='panelkeyitem' style='background-color: #008800; color: white;'>Exits</div>"; } 
	if (isI) { html += "<div class='panelkeyitem' style='background-color: #000000; color: white;'>Interchanges</div>"; } 
	if (maxtimeEntry > 0)
	{
		if (yearstr == "both") { html += "Peak Entry Increase: " + getTimeOfDay(maxtimeEntry) + "</div>"; }
		else { html += "Peak Entry: " + getTimeOfDay(maxtimeEntry) + "</div>"; }	
	}
	else
	{
		if (yearstr == "both") { html += "Peak Increase: " + getTimeOfDay(maxtime) + "</div>"; }
		else { html += "Peak: " + getTimeOfDay(maxtime) + "</div>"; }	
	}
	$('#itemprofilepanelkey').html(html);	   	

  	try
	{
		materialStation = new google.charts.Bar($('#itemprofilepanelstationchart')[0]);
		materialStation.draw(data, google.charts.Bar.convertOptions(options));
	}
	catch(err) {}
}

function updateLineGraphs(startnlc, endnlc)
{
	nlcGraph = -1;
	nlcStartGraph = startnlc;
	nlcEndGraph = endnlc;

	var html = "Between " + stations[startnlc].name + " and " + stations[endnlc].name + "";
   $('#itemprofilepaneltitle').html(html);	   	
  	$('#itemprofilepanelkey').html("");	   	

	$('#itemprofilepanelstationchart').css('display', 'none');	  
	$('#itemprofilepaneldir1chart').html("");	  
	$('#itemprofilepaneldir2chart').html("");	  
	$('#itemprofilepaneldir1charttitle').html("");	  
	$('#itemprofilepaneldir2charttitle').html("");	  
	$('#itemprofilepaneldir1chartpanel').css('display', 'block');	  
	$('#itemprofilepaneldir2chartpanel').css('display', 'block');
	  
	var chart1data = new google.visualization.DataTable();
	chart1data.addColumn('datetime');

	var chart2data = new google.visualization.DataTable();
	chart2data.addColumn('datetime'); //, 'Time of Day');

	// Set first column to GMT, so that the graphs display correctly when viewing site in other timezones.
	var dateFormat = new google.visualization.DateFormat({timeZone: 0});
	dateFormat.format(chart1data, 0);
	dateFormat.format(chart2data, 0);

	var linesToGraph = [];
	var colourArr = [];
	for (var line in stations[startnlc]["lines"])
	{
	  	if (stations[startnlc]["lines"][line] && stations[startnlc]["lines"][line][endnlc] && stations[startnlc]["lines"][line][endnlc]["from"] && stations[startnlc]["lines"][line][endnlc]["from"][yearstr])
	  	{
	  		chart1data.addColumn('number', lines[line].name);
			linesToGraph.push(line);
			colourArr.push(lines[line].hexcolour);
	  	}
	  	if (stations[startnlc]["lines"][line] && stations[startnlc]["lines"][line][endnlc] && stations[startnlc]["lines"][line][endnlc]["to"] && stations[startnlc]["lines"][line][endnlc]["to"][yearstr])
	  	{
	  		chart2data.addColumn('number', lines[line].name);
	  		if (!stations[startnlc]["lines"][line][endnlc]["from"] || !stations[startnlc]["lines"][line][endnlc]["from"][yearstr])
	  		{
				linesToGraph.push(line);
				colourArr.push(lines[line].hexcolour);	  		
	  		}
	  	}
	}
	  
	var maxval = 0; 
	var maxval1 = 0;
	var maxtime1 = 0;
	var maxtime2 = 0;
	var maxval2 = 0;
	var minval = 0;
	
	for (var i = 0; i < 84; i++)
	{
		if (linesToGraph.length == 1)
		{
			var valFrom1 = 0;
			if (stations[startnlc]["lines"][linesToGraph[0]][endnlc]["from"])
			{
				var h = parseInt(getHour(i));
				var m = parseInt(getMoh(i));
				valFrom1 = stations[startnlc]["lines"][linesToGraph[0]][endnlc]["from"][yearstr][i];
				chart1data.addRow([new Date(2016, 1, 1, h, m), valFrom1]);	
			}
			var valTo = 0;
			if (stations[startnlc]["lines"][linesToGraph[0]][endnlc]["to"])
			{
				var h = parseInt(getHour(i));
				var m = parseInt(getMoh(i));
				valTo1 = stations[startnlc]["lines"][linesToGraph[0]][endnlc]["to"][yearstr][i];
				chart2data.addRow([new Date(2016, 1, 1, h, m), valTo1]);
			}
			if (minval > valFrom1) { minval = valFrom1; } 	
			if (minval > valTo1) { minval = valTo1; } 	
			if (maxval < valFrom1) { maxval = valFrom1; } 	
			if (maxval < valTo1) { maxval = valTo1; } 	
			
			if (maxval1 < valFrom1) { maxval1 = valFrom1; maxtime1 = i; }
			if (maxval2 < valTo1) { maxval2 = valTo1; maxtime2 = i; }
		}
		if (linesToGraph.length == 2)
		{
			var valFrom1 = stations[startnlc]["lines"][linesToGraph[0]][endnlc]["from"][yearstr][i];
			var valTo1 = stations[startnlc]["lines"][linesToGraph[0]][endnlc]["to"][yearstr][i];
			var valFrom2 = stations[startnlc]["lines"][linesToGraph[1]][endnlc]["from"][yearstr][i];
			var valTo2 = stations[startnlc]["lines"][linesToGraph[1]][endnlc]["to"][yearstr][i];
			var h = parseInt(getHour(i));
			var m = parseInt(getMoh(i));
			chart1data.addRow([new Date(2016, 1, 1, h, m), valFrom1, valFrom2]);	
			chart2data.addRow([new Date(2016, 1, 1, h, m), valTo1, valTo2]);	
			if (minval > valFrom1) { minval = valFrom1; } 	
			if (minval > valTo1) { minval = valTo1; } 	
			if (maxval < valFrom1) { maxval = valFrom1; } 	
			if (maxval < valTo1) { maxval = valTo1; } 	
			if (minval > valFrom2) { minval = valFrom2; } 	
			if (minval > valTo2) { minval = valTo2; } 	
			if (maxval < valFrom2) { maxval = valFrom2; } 	
			if (maxval < valTo2) { maxval = valTo2; } 	

			if (maxval1 < valFrom1+valFrom2) { maxval1 = valFrom1+valFrom2; maxtime1 = i; }
			if (maxval2 < valTo1+valTo2) { maxval2 = valTo1+valTo2; maxtime2 = i; }
		}
		if (linesToGraph.length == 3)
		{
			var valFrom1 = stations[startnlc]["lines"][linesToGraph[0]][endnlc]["from"][yearstr][i];
			var valTo1 = stations[startnlc]["lines"][linesToGraph[0]][endnlc]["to"][yearstr][i];
			var valFrom2 = stations[startnlc]["lines"][linesToGraph[1]][endnlc]["from"][yearstr][i];
			var valTo2 = stations[startnlc]["lines"][linesToGraph[1]][endnlc]["to"][yearstr][i];
			var valFrom3 = stations[startnlc]["lines"][linesToGraph[2]][endnlc]["from"][yearstr][i];
			var valTo3 = stations[startnlc]["lines"][linesToGraph[2]][endnlc]["to"][yearstr][i];
			var h = parseInt(getHour(i));
			var m = parseInt(getMoh(i));
			chart1data.addRow([new Date(2016, 1, 1, h, m), valFrom1, valFrom2, valFrom3]);	
			chart2data.addRow([new Date(2016, 1, 1, h, m), valTo1, valTo2, valTo3]);	
			if (minval > valFrom1) { minval = valFrom1; } 	
			if (minval > valTo1) { minval = valTo1; } 	
			if (maxval < valFrom1) { maxval = valFrom1; } 	
			if (maxval < valTo1) { maxval = valTo1; } 	
			if (minval > valFrom2) { minval = valFrom2; } 	
			if (minval > valTo2) { minval = valTo2; } 	
			if (maxval < valFrom2) { maxval = valFrom2; } 	
			if (maxval < valTo2) { maxval = valTo2; } 	
			if (minval > valFrom3) { minval = valFrom3; } 	
			if (minval > valTo3) { minval = valTo3; } 	
			if (maxval < valFrom3) { maxval = valFrom3; } 	
			if (maxval < valTo3) { maxval = valTo3; } 	
			if (maxval1 < valFrom1+valFrom2+valFrom3) { maxval1 = valFrom1+valFrom2+valFrom3; maxtime1 = i; }
			if (maxval2 < valTo1+valTo2+valTo3) { maxval2 = valTo1+valTo2+valTo3; maxtime2 = i; }
		}
    }
	  
	var options = {
		legend: { position: 'none' },
		bar: { groupWidth: '120%' },
		colors: colourArr,
		chart: {
			/* 
			title: 'From ' + stations[startnlc].name + ' to ' + stations[endnlc].name,
			subtitle: 'Counts for 15-minute intervals across typical weekday',
			*/
		},
		hAxis: {
			format: 'H:mm'
		},
		vAxis: {
			viewWindow: { max: maxval, min: minval }
		  	/* , title: 'Number' */
		}
	};

	var html = "";
	for (var i in linesToGraph)
	{
		html += "<div class='panelkeyitem' style='background-color: " + lines[linesToGraph[i]].hexcolour + "; color: " + lines[linesToGraph[i]].textcolour + ";'>" + lines[linesToGraph[i]].name + "</div>";
	}	
	html += "<div class='chartsubtitle'>Numbers for fifteen-minute intervals across a typical weekday.</div>";
  	$('#itemprofilepanelkey').html(html);	
	
	try
	{
		if (maxtime1 < maxtime2 && maxval1 != 0 && maxval2 != 0)
		{
			$('#itemprofilepaneldir1charttitle').html('From ' + stations[endnlc].name + ' to ' + stations[startnlc].name + "<br />Peak: " + getTimeOfDay(maxtime1));
			materialLine1 = new google.charts.Bar($('#itemprofilepaneldir1chart')[0]);
			materialLine1.draw(chart1data, google.charts.Bar.convertOptions(options));
	  
			$('#itemprofilepaneldir2charttitle').html('From ' + stations[startnlc].name + ' to ' + stations[endnlc].name + "<br />Peak: " +  getTimeOfDay(maxtime2));
			materialLine2 = new google.charts.Bar($('#itemprofilepaneldir2chart')[0]);
			materialLine2.draw(chart2data, google.charts.Bar.convertOptions(options));	
		}
		else
		{
			if (maxval1 > 0)
			{
				$('#itemprofilepaneldir2charttitle').html('From ' + stations[endnlc].name + ' to ' + stations[startnlc].name + "<br />Peak: " + getTimeOfDay(maxtime1));
				materialLine1 = new google.charts.Bar($('#itemprofilepaneldir2chart')[0]);
				materialLine1.draw(chart1data, google.charts.Bar.convertOptions(options));
			}	  
			if (maxval2 > 0)
			{
				$('#itemprofilepaneldir1charttitle').html('From ' + stations[startnlc].name + ' to ' + stations[endnlc].name + "<br />Peak: " +  getTimeOfDay(maxtime2));
				materialLine2 = new google.charts.Bar($('#itemprofilepaneldir1chart')[0]);
				materialLine2.draw(chart2data, google.charts.Bar.convertOptions(options));
			}
		}
	}
	catch(err) {}
}

function requestStationData()
{

	$( "#dataloadwaitpanel" ).dialog( "open" );	

	$.ajax(
	{
    	url: 'data/stations.csv',
    	success: function(data) 
    	{
	      	handleStationData(data);
    	},
    	dataType: 'text',
    	async: true,
    	cache: true /* For dev use cache false. */
  	});
}

function handleStationData(data)
{
	var items = data.split('\n');
	for (var i in items)
	{
		if (i < 1) { continue; }
		var tokens = items[i].split(',');
		if (tokens[1] < 1) { continue; }
		/* console.log(tokens);	*/
		stations[tokens[0]] = { nlc: Number(tokens[0]), name: tokens[2], lat: Number(tokens[4]), lon: Number(tokens[3]), lines: {} };
	}
	initialiseStations();
	requestLineData();
}

function requestLineData()
{
	$.ajax(
	{
    	url: 'data/lines.csv',
    	success: function(data) 
    	{
	      	handleLineData(data);
    	},
    	dataType: 'text',
    	async: true,
	   	cache: true /* For dev use cache false. */

  	});

}

function handleLineData(data)
{	
	var items = data.split('\n');
	for (var i in items)
	{
		if (i < 1) { continue; }
		var tokens = items[i].split("\t");
		if (tokens[0].length < 1) { continue; }	
		lines[tokens[0]] = { name: tokens[1], colour: tokens[2], hexcolour: tokens[3], textcolour: tokens[4], zorder: tokens[5], keyorder: tokens[6] }; 	
	}	
	requestPlatformData();
}

function requestPlatformData()
{
	$.ajax(
	{
    	url: 'data/platforms.csv',
    	success: function(data) 
    	{
	      	handlePlatformData(data);
    	},
    	dataType: 'text',
    	async: true,
       	cache: true /* For dev use cache false. */
  	});

}

function handlePlatformData(data)
{
	requestSegData(yearstr);
}

function requestSegData(yearstr)
{
	$( "#dataloadwaitpanel" ).dialog( "open" );	/* In case it is not already open. */

	$.ajax(
	{
    	url: 'data/segs_' + yearstr + '.csv',
    	success: function(data) 
    	{
	      	handleSegData(data, yearstr);
    	},
    	dataType: 'text',
    	async: true,
    	cache: true /* For dev use cache false. */
  	});
}

function handleSegData(data, yearstr)
{
	/* segGroup.removeAll(); */
	/* Load it here. */	
	var items = data.split('\n');
	for (var i in items)
	{
		if (i < 1) { continue; }
		var tokens = items[i].split(',');
		if (tokens[0].length < 1) { continue; }

		var values = tokens.slice(11);
		var values1 = [];
		var values2 = [];
		for (var j = 0; j < values.length; j++)
		{
			values1[j] = parseInt(values[j]);
			values2[j] = parseInt(values[j]);
		}

		if (!stations[tokens[2]]["lines"][tokens[4]])
		{
			stations[tokens[2]]["lines"][tokens[4]] = {};
		}
		if (!stations[tokens[2]]["lines"][tokens[4]][tokens[3]])
		{
			stations[tokens[2]]["lines"][tokens[4]][tokens[3]] = {};
		}
		if (!stations[tokens[2]]["lines"][tokens[4]][tokens[3]]["to"])
		{
			stations[tokens[2]]["lines"][tokens[4]][tokens[3]]["to"] = {};
		}
		if (!stations[tokens[2]]["lines"][tokens[4]][tokens[3]]["to"][yearstr])
		{
			stations[tokens[2]]["lines"][tokens[4]][tokens[3]]["to"][yearstr] = values1;		
		}
		else
		{
			for (var j = 0; j < values1.length; j++)
			{
				stations[tokens[2]]["lines"][tokens[4]][tokens[3]]["to"][yearstr][j] += values1[j];			
			}			
		}

		if (!stations[tokens[3]]["lines"][tokens[4]])
		{
			stations[tokens[3]]["lines"][tokens[4]] = {};
		}
		if (!stations[tokens[3]]["lines"][tokens[4]][tokens[2]])
		{
			stations[tokens[3]]["lines"][tokens[4]][tokens[2]] = {};
		}
		if (!stations[tokens[3]]["lines"][tokens[4]][tokens[2]]["from"])
		{
			stations[tokens[3]]["lines"][tokens[4]][tokens[2]]["from"] = {};
		}
		if (!stations[tokens[3]]["lines"][tokens[4]][tokens[2]]["from"][yearstr])
		{	
			stations[tokens[3]]["lines"][tokens[4]][tokens[2]]["from"][yearstr] = values2;
		}
		else 
		{
			for (var j = 0; j < values2.length; j++)
			{
				stations[tokens[3]]["lines"][tokens[4]][tokens[2]]["from"][yearstr][j] += values2[j];			
			}
		}

	}
	/* drawLines(yearstr, timeofday); */
	requestStationFlowData(yearstr);
}

function calculateDifferenceData()
{
	for (var stationID in stations)
	{
		var lines = stations[stationID]["lines"];
		for (var lineID in lines)
		{
			var endStations = stations[stationID]["lines"][lineID];	
			for (var endStationID in endStations)
			{
				if (stations[stationID]["lines"][lineID][endStationID]["to"])
				{
					var oldF = stations[stationID]["lines"][lineID][endStationID]["to"][OLD_YEAR];
					var newF = stations[stationID]["lines"][lineID][endStationID]["to"][NEW_YEAR];
					if (oldF && newF)
					{
						stations[stationID]["lines"][lineID][endStationID]["to"]["both"] = [];
						for (var i = 0; i < oldF.length; i++)
						{
							stations[stationID]["lines"][lineID][endStationID]["to"]["both"][i] = newF[i] - oldF[i];				
						}
					}				
				}
				if (stations[stationID]["lines"][lineID][endStationID]["from"])
				{
					var oldF = stations[stationID]["lines"][lineID][endStationID]["from"][OLD_YEAR];
					var newF = stations[stationID]["lines"][lineID][endStationID]["from"][NEW_YEAR];
					if (oldF && newF)
					{
						stations[stationID]["lines"][lineID][endStationID]["from"]["both"] = [];
						for (var i = 0; i < oldF.length; i++)
						{
							stations[stationID]["lines"][lineID][endStationID]["from"]["both"][i] = newF[i] - oldF[i];				
						}
					}				
				}
			}	
		}		
		
		
		if (stations[stationID]['A'] && stations[stationID]['A'][OLD_YEAR] && stations[stationID]['A'][NEW_YEAR])
		{
			stations[stationID]['A']["both"] = [];		
			for (var i = 0; i < stations[stationID]['A'][OLD_YEAR].length; i++)
			{
				stations[stationID]['A']["both"][i] = stations[stationID]['A'][NEW_YEAR][i] - stations[stationID]['A'][OLD_YEAR][i];
			}
		}
		if (stations[stationID]['E'] && stations[stationID]['E'][OLD_YEAR] && stations[stationID]['E'][NEW_YEAR])
		{
			stations[stationID]['E']["both"] = [];		
			for (var i = 0; i < stations[stationID]['E'][OLD_YEAR].length; i++)
			{
				stations[stationID]['E']["both"][i] = stations[stationID]['E'][NEW_YEAR][i] - stations[stationID]['E'][OLD_YEAR][i];
			}
		}
		if (stations[stationID]['I'] && stations[stationID]['I'][OLD_YEAR] && stations[stationID]['I'][NEW_YEAR])
		{
			stations[stationID]['I']["both"] = [];		
			for (var i = 0; i < stations[stationID]['I'][OLD_YEAR].length; i++)
			{
				stations[stationID]['I']["both"][i] = stations[stationID]['I'][NEW_YEAR][i] - stations[stationID]['I'][OLD_YEAR][i];
			}
		}
	}
	
	totals["both"] = [];
	totals["both"]["arriving"] = [];
	totals["both"]["leaving"] = [];
	totals["both"]["transit"] = [];
	totals["both"]["total"] = [];
	
	for (var i = 0; i < totals[yearstr]["arriving"].length; i++)
	{
		totals["both"]["arriving"][i] = totals[NEW_YEAR]["arriving"][i] - totals[OLD_YEAR]["arriving"][i];
		totals["both"]["leaving"][i] = totals[NEW_YEAR]["leaving"][i] - totals[OLD_YEAR]["leaving"][i];
		totals["both"]["transit"][i] = totals[NEW_YEAR]["transit"][i] - totals[OLD_YEAR]["transit"][i];
		totals["both"]["total"][i] = totals[NEW_YEAR]["total"][i] - totals[OLD_YEAR]["total"][i];
	}	
	
}

function buildSegment(startLat, startLon, endLat, endLon, lineID, flow, arrows)
{
	var thewidth = flow*0.013;
	var flowdropColour = "rgba(255,128,0, 0.8)";
	var flowdrop = false;

	if (thewidth < 0) // Difference map.
	{
		thewidth = -thewidth;
		flowdrop = true;
	}

	if (thewidth > 0 && thewidth < 2) { thewidth = 2; }
	if (thewidth > 100) { thewidth = 100; }
	var arrowWidth = 0.8;
	var arrowFreq = 3;
	if (thewidth > 20) { arrowWidth = 0.5; arrowFreq = 2; }
	if (thewidth > 35) { arrowWidth = 0.3; arrowFreq = 1;}
	if (thewidth > 50) { arrowWidth = 0.2; arrowFreq = 1;}
	var strip = new H.geo.Strip();
	strip.pushPoint({ lat: startLat, lng: startLon });
	strip.pushPoint({ lat: endLat, lng: endLon });
	/* console.log(flow); */
	var polyline;
	var flowColour = lines[lineID].colour;
	if (flowdrop)
	{
		flowColour = flowdropColour;
	} 
	if (arrows)
	{
		polyline = new H.map.Polyline(strip, { style: { lineWidth: thewidth, strokeColor: flowColour, lineCap: 'round' }, arrows: { fillColor: 'rgba(255, 255, 255, 0.5)', frequency: arrowFreq, width: arrowWidth, length: arrowWidth*1.5 }});
	}
	else
	{
		polyline = new H.map.Polyline(strip, { style: { lineWidth: thewidth, strokeColor: flowColour, lineCap: 'round' } });	
	}
	polyline.zorder = lines[lineID].zorder;
	return polyline;							
}

function drawLines(yearstr, timeofday)
{
	var segsToDraw = [];
	segGroup.removeAll();
	
	for (var startStationID in stations)
	{
		var stationLines = stations[startStationID]["lines"];
		for (var lineID in stationLines)
		{
			for (var endStationID in stationLines[lineID])
			{
				/* We only want to draw one line between each pair. */
				if (endStationID > startStationID)
				{
					if (stationLines[lineID][endStationID]["from"] && stationLines[lineID][endStationID]["from"][yearstr] 
						&& stationLines[lineID][endStationID]["to"] && stationLines[lineID][endStationID]["to"][yearstr])
					{
						var flowFrom = stationLines[lineID][endStationID]["from"][yearstr][timeofday];
						var flowTo = stationLines[lineID][endStationID]["to"][yearstr][timeofday];
						
						var currFlowFrom = 0;
						var currFlowTo  = 0;
						if (yearstr == "both")
						{
							var currFlowFrom = stationLines[lineID][endStationID]["from"][OLD_YEAR][timeofday] +
								stationLines[lineID][endStationID]["from"][NEW_YEAR][timeofday];
							var currFlowTo = stationLines[lineID][endStationID]["to"][OLD_YEAR][timeofday] +
								stationLines[lineID][endStationID]["to"][NEW_YEAR][timeofday];						
						}
						
						if ((yearstr == "both" && currFlowTo < currFlowFrom) || (yearstr != "both" && flowFrom > flowTo))
						{
							var polyline = buildSegment(stations[endStationID].lat, stations[endStationID].lon, stations[startStationID].lat, stations[startStationID].lon, lineID, flowFrom, true);
							polyline.setData({startnlc: startStationID, endnlc: endStationID});
							segsToDraw.push(polyline);							
						}
						else
						{
							var polyline = buildSegment(stations[startStationID].lat, stations[startStationID].lon, stations[endStationID].lat, stations[endStationID].lon, lineID, flowTo, true);
							polyline.setData({startnlc: startStationID, endnlc: endStationID});
							segsToDraw.push(polyline);													
						}
					} 
					else if (stationLines[lineID][endStationID]["from"] && stationLines[lineID][endStationID]["from"][yearstr]) // One-way flow.
					{
						var flowFrom = stationLines[lineID][endStationID]["from"][yearstr][timeofday];
						var polyline = buildSegment(stations[endStationID].lat, stations[endStationID].lon, stations[startStationID].lat, stations[startStationID].lon, lineID, flowFrom, true);
						polyline.setData({startnlc: startStationID, endnlc: endStationID});
						segsToDraw.push(polyline);								
					}
					else if (stationLines[lineID][endStationID]["to"] && stationLines[lineID][endStationID]["to"][yearstr]) // One-way flow.
					{
						var flowTo = stationLines[lineID][endStationID]["to"][yearstr][timeofday];
						var polyline = buildSegment(stations[startStationID].lat, stations[startStationID].lon, stations[endStationID].lat, stations[endStationID].lon, lineID, flowTo, true);
						polyline.setData({startnlc: startStationID, endnlc: endStationID});
						segsToDraw.push(polyline);							
					}
					
				}
			}
		}
	}
		
	segsToDraw.sort(segSort);	
	for (var i in segsToDraw)
	{
		segGroup.addObject(segsToDraw[i]);									
	}		
}

function segSort(a, b)
{

	var lineA = parseInt(a.zorder);
	var lineB = parseInt(b.zorder);
	/*
	console.log(lineA);
	var lineA = parseInt(lines[a].zorder);
	var lineB = parseInt(lines[b].zorder);
	*/

	if (lineA == lineB) return 0;	
	if (lineA < lineB) return -1;
	return 1;
}


function requestStationFlowData(yearstr)
{
	$.ajax(
	{
    	url: 'data/stationflows_' + yearstr + '.csv',
    	success: function(data) 
    	{
	      	handleStationFlowData(data, yearstr);
    	},
    	dataType: 'text',
    	async: true,
    	cache: true /* For dev use cache false. */
  	});}

function handleStationFlowData(data, yearstr)
{
	if (totals[yearstr] === undefined)
	{
		totals[yearstr] = [];
		totals[yearstr]["arriving"] = [];
		totals[yearstr]["leaving"] = [];
		totals[yearstr]["transit"] = [];
		totals[yearstr]["total"] = [];
	}

	/* Load it here. */
	var items = data.split('\n');
	for (var i in items)
	{
		if (i < 1) { continue; }
		var tokens = items[i].split(',');
		if (tokens[0].length < 1) { continue; }	
		
		if (stations[tokens[0]])
		{		
			var values = tokens.slice(9);
			var values1 = [];
			
			for (var j = 0; j < values.length; j++)
			{
				values1[j] = parseInt(values[j]);
			}

			if (!stations[tokens[0]][tokens[1]])
			{
				stations[tokens[0]][tokens[1]] = [];
			}
			stations[tokens[0]][tokens[1]][yearstr] = values1;
			
			for (var j = 0; j < values1.length; j++)
			{
				if (totals[yearstr]["arriving"][j] === undefined) { totals[yearstr]["arriving"][j] = 0; }
				if (totals[yearstr]["leaving"][j] === undefined) { totals[yearstr]["leaving"][j] = 0; }
				if (totals[yearstr]["transit"][j] === undefined) { totals[yearstr]["transit"][j] = 0; }
				if (totals[yearstr]["total"][j] === undefined) { totals[yearstr]["total"][j] = 0; }
				if (tokens[1] == 'A')
				{
					totals[yearstr]["arriving"][j] += values1[j];
				}
				if (tokens[1] == 'E')
				{
					totals[yearstr]["leaving"][j] += values1[j];
				}
				if (tokens[1] == 'I')
				{
					totals[yearstr]["transit"][j] += values1[j];
				}
			}						
		}
		/* else { console.log("No station location, but station flow data for: " + tokens[0] + " - " + tokens[1]) } */
				
	}
	
	var grandtotal = 0;
	for (var i = 0; i < totals[yearstr]["arriving"].length; i++)
	{
		grandtotal += totals[yearstr]["arriving"][i];
		totals[yearstr]["total"][i] += grandtotal;
	}
	
	if (yearstr == NEW_YEAR)
	{
		yearstr = OLD_YEAR
		requestSegData(yearstr);
	}
	else
	{
		yearstr = NEW_YEAR;
		calculateDifferenceData();
		drawObjects(yearstr, timeofday);	
		updateNumbers(yearstr, timeofday);

		$( "#dataloadwaitpanel" ).dialog( "close" );	
	}

}

function startAnim()
{
	pauseStory = true;
	$('#story1').html('');
	$('#story2').html('');
	$('#story3').html('');

	$('#animateB').css('display', 'none');
	$('#pauseB').css('display', 'block');
	if (timeofday == 94)
	{
		timeofday = 0;
	}
	pauseMe = false;
	advanceAnim();
}

function stopAnim()
{
	pauseMe = true;
	shortAnim = false;
	$('#animateB').css('display', 'block');
	$('#pauseB').css('display', 'none');
	if (showGraphs) 
	{ 
		if (nlcGraph != -1) 
		{ 
			materialStation.setSelection(null); 
		} 
		else if (nlcStartGraph != -1 && nlcEndGraph != -1) 
		{ 
			materialLine1.setSelection(null); 
			materialLine2.setSelection(null); 
		} 
	}

}

function advanceAnim()
{
	timeofday = timeofday + 1;
	if (shortAnim && timeofday > 5 && timeofday < 7)
	{
		shortAnim = false;
		pauseMe = true;
	}

	if (timeofday > 83)
	{
		timeofday = 0;
	}
	
	if (!pauseMe)
	{
		$( "#slider" ).slider("value", timeofday);
		updateSlider(timeofday);
		setTimeout("advanceAnim()", 180);
	}
	else
	{
		stopAnim();
	}
}

var animGraphPos = 0;
var pauseStory = false;

function advanceStoryAnim()
{
	animGraphPos++;
	if (animGraphPos == 84)
	{
		animGraphPos = 0;
	}
	dayChart.setSelection([{"row":animGraphPos,"column":1}]); 
	$('#storydaynumber').html(storydaynumbers[animGraphPos+1][1]); 
	if (!pauseStory)
	{
		setTimeout("advanceStoryAnim()", 100);
	}
}

function getTimeOfDay(slidepos)
{
	var startmins = 300+15*slidepos;
	var endmins = startmins + 15;
	
	if (startmins > 1439) { startmins = startmins - 1440; }
	if (endmins > 1439) { endmins = endmins - 1440; }
	
	var starthour = Math.floor( startmins / 60);
	var endhour = Math.floor( endmins / 60); 
	var startmoh = startmins % 60;
	var endmoh = endmins % 60;

	/* 
	if (starthour < 10) { starthour = "0" + starthour; }
	if (endhour < 10) { endhour = "0" + endhour; }
	*/
	if (startmoh < 10) { startmoh = "0" + startmoh; }
	if (endmoh < 10) { endmoh = "0" + endmoh; }
	
	return "" + starthour + ":" + startmoh + "-" + endhour + ":" + endmoh;
}

function getHour(arraypos)
{
	return Math.floor((300+arraypos*15)/60);
}

function getMoh(arraypos)
{
	return (300+arraypos*15) % 60;
}

function updateSlider(value)
{
	$( "#amount" ).html( getTimeOfDay(value) );
	if (value > 58 && !nightMode)
	{
		/*
		$( "#toppanel" ).css('backgroundColor', 'black'); 
		$( "#toppanel" ).css('color', '#ffff00');
		$( "#linespanel" ).css('backgroundColor', 'black');
		$( "#linespanel" ).css('color', '#ffff00');
		$( "#numberpanel" ).css('backgroundColor', 'black');
		$( "#numberpanel" ).css('color', '#ffff00');
		*/
		/* map.removeLayer(dayLayer); */
		map.setBaseLayer(nightLayer);
		nightMode = true;
	}
	if (value <= 58 && nightMode)
	{
		/*
		$( "#toppanel" ).css('backgroundColor', 'rgb(33,71,142)');
		$( "#toppanel" ).css('color', 'white');
		$( "#linespanel" ).css('backgroundColor', 'rgb(33,71,142)');
		$( "#linespanel" ).css('color', 'white');
		$( "#numberpanel" ).css('backgroundColor', 'rgb(33,71,142)');
		$( "#numberpanel" ).css('color', 'white'); 
		*/
		/* map.addLayer(dayLayer); */
		map.setBaseLayer(dayLayer);
		nightMode = false;
	
	}
	timeofday = value;

	drawObjects(yearstr, timeofday);
	updateNumbers(yearstr, timeofday);
	if (showGraphs) 
	{ 
		if (nlcGraph != -1) 
		{ 
			materialStation.setSelection([{"row":timeofday,"column":1},{"row":timeofday,"column":2},{"row":timeofday,"column":3}]); 
		} 
		else if (nlcStartGraph != -1 && nlcEndGraph != -1) 
		{ 
			materialLine1.setSelection([{"row":timeofday,"column":1},{"row":timeofday,"column":2},{"row":timeofday,"column":3}]); 
			materialLine2.setSelection([{"row":timeofday,"column":1},{"row":timeofday,"column":2},{"row":timeofday,"column":3}]); 
		} 
	}
}


function updateNumbers(yearstr, timeofday)
{
	$('#numarriving').html(totals[yearstr]["arriving"][timeofday]);
	$('#numleaving').html(totals[yearstr]["leaving"][timeofday]);
	$('#numtransit').html(totals[yearstr]["transit"][timeofday]);
	$('#numtotal').html(totals[yearstr]["total"][timeofday]);
}

function drawObjects(yearstr, timeofday)
{
	if (object == 'objectRline' || object == 'objectRboth')
	{
    	drawLines(yearstr, timeofday);
	}
	if (object == 'objectRstation' || object == 'objectRboth')
	{
	    drawStations(yearstr, timeofday);
	}
}

function resetLines()
{
	var segsToDraw = [];
	segGroup.removeAll();
	
	for (var startStationID in stations)
	{
		var stationLines = stations[startStationID]["lines"];
		for (var lineID in stationLines)
		{
			for (var endStationID in stationLines[lineID])
			{
				/* We only want to draw one line between each pair. */
				if (endStationID > startStationID)
				{
					var polyline = buildSegment(stations[endStationID].lat, stations[endStationID].lon, stations[startStationID].lat, stations[startStationID].lon, lineID, 500, false);
					polyline.setData({startnlc: startStationID, endnlc: endStationID});
					segsToDraw.push(polyline);
				}						
			}
		}
	}
		
	segsToDraw.sort(segSort);
	
	for (var i in segsToDraw)
	{
		segGroup.addObject(segsToDraw[i]);									
	}		
}

function initialiseStations()
{
	stationGroup.removeAll();
	for (var i in stations)
	{
		var circle = new H.map.Circle({lat: Number(stations[i].lat), lng: Number(stations[i].lon)}, 100, { style: stationStyle });
		circle.setData({ nlc: stations[i].nlc });
		stationGroup.addObject(circle);	
		$('#stationJumpS').append($('<option>', { value : stations[i].nlc }).text(stations[i].name));			
	}
}

function jumpToStation()
{
	var val = $("#stationJumpS").val();
	for (var i in stations)
	{
		if (stations[i].nlc == val)
		{
			map.setZoom(15);
			map.setCenter({lat:stations[i].lat, lng:stations[i].lon});
			showStationPanel(val);
			break;
		}	
	}  	
}

/* 
var svgMarkup = '<svg width="24" height="24" xmlns="http://www.w3.org/2000/svg"> <rect stroke="white" fill="#1b468d" x="-11" y="-11" width="22" height="22" /> <text x="0" y="0" font-size="12pt" font-family="Arial" font-weight="bold" text-anchor="middle" fill="white">&lt;></text></svg>';
var icon = new H.map.Icon(svgMarkup);
*/

function drawStations(yearstr, timeofday)
{
	stationGroup.removeAll();	
	for (var i in stations)
	{
		var max = 0; 
		var stationColour = 'rgba(255, 0, 0, 0.8)';
		var stationType = 'A';
		var size = 10;
		if (stations[i]['A'] && stations[i]['A'][yearstr])
		{
			size = stations[i]['A'][yearstr][timeofday];		
			max = size;
		}
		if (stations[i]['E'] && stations[i]['E'][yearstr])
		{
			var sizeE = stations[i]['E'][yearstr][timeofday];
			size += sizeE
			if (sizeE > max)  { max = sizeE; stationType = 'E'; stationColour = 'rgba(0, 160, 0, 0.8)'; }	
		}
		if (stations[i]['I'] && stations[i]['I'][yearstr])
		{
			var sizeI = stations[i]['I'][yearstr][timeofday];		
			size += sizeI;
			if (sizeI > max) { max = sizeI; stationType = 'I'; stationColour = 'rgba(0, 0, 0, 0.8)'; } 			
		}
		if (yearstr == "both")
		{
			stationColour = 'rgba(0, 0, 255, 0.8)';		
		}
		if (size < 0)
		{
			size = -size;
			stationColour = 'rgba(255, 128, 0, 0.8)';
		}
		var radius = Math.sqrt(25*size);
		/* 
		if (radius < 50) { radius = 50; }
		console.log(radius);
		*/
		var circle = new H.map.Circle({lat: Number(stations[i].lat), lng: Number(stations[i].lon)} , radius, { style: { strokeColor: stationColour, fillColor: 'rgba(255, 255, 255, 0.8)', lineWidth: 3 } });
		circle.setData({ nlc: stations[i].nlc });
		stationGroup.addObject(circle);	

		/* 
		if (stationType == 'I')
		{
		  coords = {lat: Number(stations[i].lat), lng: Number(stations[i].lon)},
		  marker = new H.map.Marker(coords, {icon: icon});
			stationGroup.addObject(marker)
		}
		*/
	}
}

var storydaynumbers = [];
function drawStory1Charts()
{
	storydaynumbers = [
		 ['', 'No of Station Entries'],
		['0500-0515', 3053], ['0515-0530', 5516], ['0530-0545', 9133], ['0545-0600', 14037], ['0600-0615', 21559], ['0615-0630', 30849], ['0630-0645', 41393], ['0645-0700', 53855], ['0700-0715', 67981], ['0715-0730', 82279], ['0730-0745', 98431], ['0745-0800', 118321], ['0800-0815', 136446], ['0815-0830', 143230], ['0830-0845', 134956], ['0845-0900', 117271], ['0900-0915', 98626], ['0915-0930', 82012], ['0930-0945', 67810], ['0945-1000', 56554], ['1000-1015', 50826], ['1015-1030', 48433], ['1030-1045', 46401], ['1045-1100', 43968], ['1100-1115', 43208], ['1115-1130', 43344], ['1130-1145', 43542], ['1145-1200', 44287], ['1200-1215', 46572], ['1215-1230', 48230], ['1230-1245', 48736], ['1245-1300', 48938], ['1300-1315', 50227], ['1315-1330', 50532], ['1330-1345', 49516], ['1345-1400', 48652], ['1400-1415', 49769], ['1415-1430', 50765], ['1430-1445', 51321], ['1445-1500', 52864], ['1500-1515', 57087], ['1515-1530', 60967], ['1530-1545', 65516], ['1545-1600', 71702], ['1600-1615', 80087], ['1615-1630', 84122], ['1630-1645', 90139], ['1645-1700', 101563], ['1700-1715', 119884], ['1715-1730', 131139], ['1730-1745', 136607], ['1745-1800', 136075], ['1800-1815', 133161], ['1815-1830', 121159], ['1830-1845', 104901], ['1845-1900', 89299], ['1900-1915', 78003], ['1915-1930', 67296], ['1930-1945', 57675], ['1945-2000', 51146], ['2000-2015', 47772], ['2015-2030', 44372], ['2030-2045', 40881], ['2045-2100', 38418], ['2100-2115', 37395], ['2115-2130', 35622], ['2130-2145', 33788], ['2145-2200', 33713], ['2200-2215', 35291], ['2215-2230', 35337], ['2230-2245', 33256], ['2245-2300', 30729], ['2300-2315', 28953], ['2315-2330', 26418], ['2330-2345', 22567], ['2345-0000', 17821], ['0000-0015', 12686], ['0015-0030', 7347], ['0030-0045', 2897], ['0045-0100', 444], ['0100-0115', 89], ['0115-0130', 25], ['0130-0145', 16], ['0145-0200', 15]
	];
	chart3data = google.visualization.arrayToDataTable(storydaynumbers);
  
  var options = {
	   legend: { position: 'none' },
		 bar: { groupWidth: '120%' },
    };
  
  	try
  	{
   		dayChart = new google.charts.Bar($('#storydaygraph')[0]);
   		dayChart.draw(chart3data, google.charts.Bar.convertOptions(options));	
   		advanceStoryAnim();
	}
	catch(err) {}
}

/*
function drawStory2Charts()
{
	var chart1data = google.visualization.arrayToDataTable([
	 ['', 'Population'],
		['1961', 7977000], ['1962', 7970000], ['1963', 7926000], ['1964', 7894000], ['1965', 7857000], ['1966', 7810000], ['1967', 7761000], ['1968', 7693000], ['1969', 7619000], ['1970', 7530000], ['1971', 7529400], ['1972', 7442800], ['1973', 7362400], ['1974', 7263600], ['1975', 7179000], ['1976', 7089100], ['1977', 7012000], ['1978', 6946800], ['1979', 6887600], ['1980', 6850600], ['1981', 6805600], ['1982', 6765100], ['1983', 6753000], ['1984', 6754700], ['1985', 6767000], ['1986', 6774200], ['1987', 6765600], ['1988', 6729300], ['1989', 6751600], ['1990', 6798800], ['1991', 6829300], ['1992', 6829400], ['1993', 6844500], ['1994', 6873500], ['1995', 6913100], ['1996', 6974400], ['1997', 7014800], ['1998', 7065500], ['1999', 7153900], ['2000', 7236700], ['2001', 7322400], ['2002', 7376700], ['2003', 7394800], ['2004', 7432700], ['2005', 7519000], ['2006', 7597800], ['2007', 7693500], ['2008', 7812200], ['2009', 7942600], ['2010', 8061500], ['2011', 8204400], ['2012', 8308400], ['2013', 8416500], ['2014', 8538700], ['2015', 8673700], ['2016', 8810800]
	]);
	
	var chart2data = google.visualization.arrayToDataTable([
	 ['', 'No of Journeys'],
		['2003/04', 947531000], ['2004/05', 975877000], ['2005/06', 971086000], ['2006/07', 1014333000], ['2007/08', 1072469000], ['2008/09', 1089497000], ['2009/10', 1064694258], ['2010/11', 1107343000], ['2011/12', 1178362780], ['2012/13', 1229329020], ['2013/14', 1264595098], ['2014/15', 1305364520], ['2015/16', 1349338694]
	]);

  
  var options = {
	   legend: { position: 'none' },
		 bar: { groupWidth: '120%' },
		 //Doesn't work with Material 
		 //animation: { duration: 3000, 'easing': 'out', startup: true },

		 //colors: ['#00aaff'],
		chart: {
		  //title: 'From ' + stations[startnlc].name + ' to ' + stations[endnlc].name,
		  //subtitle: 'Counts for 15-minute intervals across typical weekday',
		},
		hAxis: {
		//format: 'H:mm',
		//viewWindow: {
		//	min: [5, 0, 0],
		//	max: [26, 0, 0]
	  //}
	},
	vAxis: {
		//viewWindow: { max: maxval, min: minval }
	  //title: 'Number'
	}
  };
	//growthChart = new google.visualization.ColumnChart($('#storypopgrowthgraph')[0]);
    //growthChart.draw(chart1data, options);
  try
  {
	  //var growthChart = new google.charts.Bar($('#storypopgrowthgraph')[0]);
	  //growthChart.draw(chart1data, google.charts.Bar.convertOptions(options));
  
	  //growthChart.set([{"row":chart1data.length,"column":1}]); 
  
	  //var tubeChart = new google.charts.Bar($('#storytubegrowthgraph')[0]);
	  //tubeChart.draw(chart2data, google.charts.Bar.convertOptions(options));	
	//TODO Use this: https://github.com/louisremi/jquery-smartresize - to make the Google charts all responsive.
	}
	catch(err) {} 
}
*/
  
$(document).ready(function() 
{	
	google.charts.load('current', {packages: ['corechart', 'bar']});

 	$( "#dataloadwaitpanel" ).dialog({
    	resizable: false,
    	width: 300,
    	modal: true,
    	autoOpen: false
	});
	
 	$( "#aboutpanel" ).dialog({
    	resizable: false,
    	width: 500,
    	modal: true,
    	autoOpen: false,
    	buttons: {
    		Ok: function() {
        		$( this ).dialog( "close" );
    		}
      	}
	});

 	$( "#keypanel" ).dialog({
    	resizable: false,
    	width: 500,
    	modal: true,
    	autoOpen: false,
    	buttons: {
    		Ok: function() {
        		$( this ).dialog( "close" );
    		}
    	}
	});

	$( "#slider" ).slider({
    	value:timeofday,
    	min: 0,
    	max: 83,
    	step: 1,
    	slide: function( event, ui ) 
    	{
      		updateSlider(ui.value);      	
      	}
    });
    
    $( "#amount" ).html( getTimeOfDay($( "#slider" ).slider( "value" )) );
	
	$( "#animateB").button().click(function() {
		startAnim();
	});
	
	$( "#storyanimateB").button().click(function() {	
		$('#storypanel').css('display', 'none');
		startAnim();
	});	
	
	$( "#storystationB").button().click(function() {	
		$('#storypanel').css('display', 'none');
		map.setZoom(15);
		map.setCenter({lat:51.5153, lng:-0.142});
		showStationPanel(669);
		startAnim();
	});	
		
	$( "#storylineB").button().click(function() {	
		$('#storypanel').css('display', 'none');
		map.setZoom(15);
		map.setCenter({lat:51.5057, lng:-0.119}); 
		showLinePanel(542, 747);
		startAnim();
	});

	$( "#storycentralpiccadillyB").button().click(function() {	
		$('#storypanel').css('display', 'none');
		map.setZoom(15);
		map.setCenter({lat:51.51124, lng:-0.12851});
		showStationPanel(631);
		startAnim();
	});	
	
	$( "#storycentralsouthkenB").button().click(function() {	
		$('#storypanel').css('display', 'none');
		map.setZoom(15);
		map.setCenter({lat:51.49387, lng:-0.17420});
		showStationPanel(708);
		startAnim();
	});	

	$( "#storyoxfordstreetB").button().click(function() {	
		$('#storypanel').css('display', 'none');
		map.setZoom(15);
		map.setCenter({lat:51.51356, lng:-0.15858});
		showStationPanel(640);
		startAnim();
	});	

	$( "#storyouterlondonB").button().click(function() {	
		$('#storypanel').css('display', 'none');
		map.setZoom(15);
		map.setCenter({lat:51.61080, lng:-0.42377});
		showStationPanel(661);
		startAnim();
	});	
	
	$( "#storywesthamB").button().click(function() {	
		$('#storypanel').css('display', 'none');
		map.setZoom(15);
		map.setCenter({lat:51.52776, lng:0.00414});
		showStationPanel(757);
		startAnim();
	});	
	
	$( "#storystratfordB").button().click(function() {	
		$('#storypanel').css('display', 'none');
		map.setZoom(15);
		map.setCenter({lat:51.54148, lng:-0.00384});
		showStationPanel(719);
		startAnim();
	});	
	
	$( "#pauseB").button().click(function() {
		stopAnim();
	});

	$( "#aboutbutton").button().click(function() {
			$( "#aboutpanel" ).dialog( "open" );	
	});

	$( "#keybutton").button().click(function() {
			$( "#keypanel" ).dialog( "open" );	
	});
	
	$( "#profilecloseB").button().click(function() {
		$('#itemprofilepanel').slideToggle(); showGraphs = false;
	});
	
	$('input[name=datasetR]').click(function()
	{
		dataset = $('input[name=datasetR]:checked').val();
		if (dataset == "datasetRolder")
		{
			yearstr = OLD_YEAR;
		}
		else if (dataset == "datasetRnewer")
		{
			yearstr = NEW_YEAR;		
		}
		else if (dataset == "datasetRcompare")
		{
			yearstr = "both";
		}
		resetLines();
		initialiseStations();
		drawObjects(yearstr, timeofday);
		if (showGraphs) 
		{ 
			if (nlcGraph != -1) 
			{ 
				updateStationGraph(nlcGraph); 
			} 
			else if (nlcStartGraph != -1 && nlcEndGraph != -1) 
			{ 
				updateLineGraphs(nlcStartGraph, nlcEndGraph);  
			} 
		}	
	});
	
	$('input[name=directionR]').click(function()
	{
		direction = $('input[name=directionR]:checked').val();
		
	});
	
	$('input[name=objectR]').click(function()
	{
		object = $('input[name=objectR]:checked').val();
		resetLines();
		initialiseStations();
		drawObjects(yearstr, timeofday);
	});
	
	$('#tubedot1').css('border-color', '#0000aa');

	google.charts.setOnLoadCallback(function() {
		drawStory1Charts();
	});

	$('#storyskip').button().click(function() {
		$('#storypanel').css('display', 'none');
		pauseStory = true;
		shortAnim = true;
		$('#story1').html('');
		$('#story2').html('');
		$('#story3').html('');
		startAnim();
	});
	$('#storynext').button().click(function() {
		if ($('#story1').css('display') == "block")
		{
			pauseStory = true;
			$('#story1').html('');
			$('#story1').css('display', 'none');
			$('#story2').css('display', 'block');
			$('#tubedot1').css('border-color', '#000000');
			$('#tubedot2').css('border-color', '#0000aa');
			//if (google.visualization) { drawStory2Charts(); }
		}
		else if ($('#story2').css('display') == "block")
		{
			$('#story2').html('');
			$('#story2').css('display', 'none');
			$('#story3').css('display', 'block');
			$('#tubedot2').css('border-color', '#000000');
			$('#tubedot3').css('border-color', '#0000aa');
		}
		/*
		else if ($('#story3').css('display') == "block")
		{
			$('#story3').css('display', 'none');
			$('#story4').css('display', 'block');
			$('#tubedot3').css('border-color', '#000000');
			$('#tubedot4').css('border-color', '#cc0000');
		} 
		*/
		else
		{
			$('#storypanel').css('display', 'none');
			pauseStory = true;
			shortAnim = true;
			$('#story1').html('');
			$('#story2').html('');
			$('#story3').html('');
			startAnim();
		}
	});
		
  	init();
});

  