proj4.defs("EPSG:27700", "+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +datum=OSGB36 +units=m +no_defs");
proj4.defs('urn:ogc:def:crs:EPSG::27700', proj4.defs('EPSG:3857'));

var olMap;
var layerPoints;
var layerOSICore;
var layerLines;
var layerLinesAll;
var layerBackground;
var blinkTimer;
var dataTimer;
var serviceFilter;
var linesForKey;

var args = [];
var osis = {};

var year = 2017;
var currentZoom = 13;
var currentLat = 51.51;
var currentLon = -0.15;
var blink = true;
var noBlinking = false;

var tfl_app_id = "8ee22a25";
var tfl_app_key = "f5b2bb26fbd6fe285da0c9f2bd4d28bc";

var here_app_id = "YyCiz5fA5sFK593ZqCEG";
var here_app_code = "hfwTGH-20M2rP3HyyWIltA";

var serviceFilterCodes = { "Bakerloo": "B", "Central": "C", "Circle": "I", "DLR": "L", "District": "D", "East London": "E", 
	"Emirates Air Line": "A", "Hammersmith & City": "H", "Jubilee": "J", "Metropolitan": "M", "Northern": "N", "London Overground": "O", "TfL Rail": "X", 
	"Piccadilly": "P", "Tramlink": "T", "Victoria": "V", "Waterloo & City": "W" };

function init()
{
	//URL ARGUMENTS
	var hash = window.location.hash;
	if (hash.length > 0)
	{
		var elements = hash.split('&');
		elements[0] = elements[0].substring(1); /* Remove the # */

		for(var i = 0; i < elements.length; i++)
		{
			var pair = elements[i].split('=');
			if (pair.length > 1)
			{
				args[pair[0]] = pair[1];
			}
		}
	}

	if (args.filter)
	{
		for (var key in serviceFilterCodes)
		{
			if (args.filter == serviceFilterCodes[key])
			{
				serviceFilter = key;
			}
		}
	}

	if (args.dates)
	{
		$('#dates').val(args.dates);
	}
	else
	{
		$('#dates').val('live');
	}
				
	if (args.zoom)
	{
		currentZoom = args.zoom;
	}
	if (args.lat && args.lon)
	{
		currentLat = parseFloat(args.lat); /* Necessary for lat (only) for some reason, otherwise was going to 90-val. Very odd... */
		currentLon = parseFloat(args.lon);		
	}

	function pointStyle(feature, resolution) 
	{
		var zoomFactor = 0.15;
		if (resolution < 100) { zoomFactor = 0.2; }
		if (resolution < 50) { zoomFactor = 0.3; }
		if (resolution < 25) { zoomFactor = 0.4; }
		if (resolution < 12.5) { zoomFactor = 0.5; }

		return [
			new ol.style.Style({ 
				image: new ol.style.Circle({ 
					radius: feature.get('radius') * zoomFactor, 
					fill: new ol.style.Fill({ color: feature.get('fillColor') }),
					stroke: new ol.style.Stroke({ width: (feature.get('highlight') ? 4 : feature.get('strokeWidth')), color: feature.get('strokeColor')})
				}),
				text: new ol.style.Text({
					text: (resolution > 25 ? undefined : feature.get('label')),
					offsetX: ( feature.get('offsetX') ? feature.get('offsetX')*zoomFactor : 0),
					offsetY: ( feature.get('offsetY') ? feature.get('offsetY')*zoomFactor : 0),
					textAlign: ( feature.get('offsetX') ? (feature.get('offsetX') > 0 ? 'left' : 'right') : 'center'),
					font: (resolution < 12.5 ? '12px Hammersmith One, sans-serif' : '9px Hammersmith One, sans-serif'),
					fill: new ol.style.Fill({ color: "#003688" }),
					stroke: new ol.style.Stroke({ color: 'rgba(255, 255, 255, 0.6)', width: 3 })

				})
			})			
		]; 
	}
		
	function lineStyle(feature, resolution) 
	{
		return [
			new ol.style.Style({ 
				stroke: new ol.style.Stroke({ width: 4, color: feature.get('strokeColor'), lineCap: feature.get('strokeLinecap'), lineDash: feature.get('strokeDashstyle') })
			})
		]; 
	}
	
		
	function osicaseStyle(feature, resolution) 
	{
		return [
			new ol.style.Style({ 
				stroke: new ol.style.Stroke({ width: 5.5, color: '#000000' })
			})
		]; 
	}
	
	function osicoreStyle(feature, resolution) 
	{
		return [
			new ol.style.Style({ 
				stroke: new ol.style.Stroke({ width: 2.5, color: '#ffffff' })
			})
		]; 
	}
	
	function glaStyle(feature, resolution)
	{
		return [
			new ol.style.Style({ 
				stroke: new ol.style.Stroke({ width: 5, color: 'rgba(0, 0, 0, 0.25)' })
			})
		];	
	}
	
	function thamesStyle(feature, resolution)
	{
		return [
			new ol.style.Style({ 
				fill: new ol.style.Fill({ color: 'rgba(128,190,205,0.6)' })
			})
		]; 
	}

	pointSource = new ol.source.Vector({
		url: '../data/tfl_stations.json',
		defaultProjection: 'EPSG:4326',
		format: new ol.format.GeoJSON(),
		attributions: [ 
			new ol.Attribution({ 'html': "derived from OSM which is &copy; OpenStreetMap contributors (ODbL). "
				+ "<a href='https://gist.github.com/oobrien/8525859'>Lines/stations</a> on GitHub." 
			})
		]
	});
		
	pointSource.once('change', function() 
	{
		if (pointSource.getState() == 'ready') 
		{
			var features = pointSource.getFeatures();
			for (var j in features)
			{
				features[j].set('radius', 15);
				features[j].set('highlight', false);
				features[j].set('fillColor', "#ffffff");
				features[j].set('strokeColor', "#000000");
				features[j].set('label', "");
				features[j].set('strokeColorNormal', "#000000");
				features[j].set('labelNormal', "");
				features[j].set('strokeWidth', 1.5);
				features[j].setId(features[j].get('id'));
			}					
			handleChange();
			requestOSIData();		
		}
	});
	
	layerPoints = new ol.layer.Vector(
	{ 
		source: pointSource, 
		style: function(feature, resolution) { return pointStyle(feature, resolution); }
	});
	
	var lineAllSource = new ol.source.Vector({
		url: '../data/tfl_lines.json',
		defaultProjection: 'EPSG:4326',
		format: new ol.format.GeoJSON()
	});
	
	layerLinesAll = new ol.layer.Vector(
	{ 
		source: lineAllSource, 
		style: function(feature, resolution) { return lineStyle(feature, resolution); }
	});

	lineAllSource.once('change', function() 
	{
		if (lineAllSource.getState() == 'ready') 
		{
			handleChange();
		}
	});

	var lineSource = new ol.source.Vector({
	});
		
	layerLines = new ol.layer.Vector(
	{ 
		source: lineSource, 
		style: function(feature, resolution) { return lineStyle(feature, resolution); }
	});
	
	var osiSource = new ol.source.Vector({
	});
	
	layerOSICore = new ol.layer.Vector(
	{
		source: osiSource,
		style: function(feature, resolution) { return osicoreStyle(feature, resolution); }
	});

	var layerOSICase = new ol.layer.Vector(
	{
		source: osiSource,
		style: function(feature, resolution) { return osicaseStyle(feature, resolution); }
	});


	var glaSource = new ol.source.Vector({
		url: '../data/2247.json',
		defaultProjection: 'EPSG:4326',
		format: new ol.format.GeoJSON()
	}); 

	layerGLA = new ol.layer.Vector(
	{ 
		source: glaSource, 
		style: function(feature, resolution) { return glaStyle(feature, resolution); }
	});

	var thamesSource = new ol.source.Vector({
		url: '../data/river_thames_simp.json',
		defaultProjection: 'EPSG:4326',
		format: new ol.format.GeoJSON()
	});

	layerThames = new ol.layer.Vector(
	{ 
		source: thamesSource, 
		style: function(feature, resolution) { return thamesStyle(feature, resolution); }
	});
	
	//	url: "http://casa.oobrien.com/tiles/futurecity/{z}/{x}/{y}.png",
	layerBackground = new ol.layer.Tile({
		source: new ol.source.XYZ({
			url: "http://2.base.maps.cit.api.here.com/maptile/2.1/maptile/newest/normal.day.grey/{z}/{x}/{y}/256/png8?app_id=" + here_app_id + "&app_code=" + here_app_code,
			crossOrigin: null,
			//attribution: "Map data &copy; <a href='http://osm.org/'>OSM</a>"
			attributions: [ new ol.Attribution({ 'html': "Map data &copy; <a href='https://developer.here.com/'>HERE Maps/Navteq</a>" })]
		}),
		opacity: 0.25
	});

	if (args.background)
	{
		layerBackground.setVisible(args.background == "true");
	}

	olMap = new ol.Map({
		target: "mapcontainer",
		layers: [ layerBackground, layerLinesAll, layerThames, layerGLA, layerLines, layerOSICase, layerPoints, layerOSICore  ],
		controls: ol.control.defaults({}).extend(
		[
			new ol.control.ScaleLine({'geodesic': true, 'units': 'metric'}),
			new ol.control.Zoom()
				
		]),
		view: new ol.View({		
			projection: "EPSG:3857",
			maxZoom: 18,
			minZoom: 11,
			zoom: currentZoom,
			center: ol.proj.transform([currentLon, currentLat], "EPSG:4326", "EPSG:3857"), 
			extent: ol.proj.transformExtent([-1.5, 51, 1.0, 52], "EPSG:4326", "EPSG:3857")
		})
	});
	
    //INTERACTIONS AND EVENTS		
	olMap.on("moveend", updateUrl);
}

function requestOSIData()
{
	$.ajax(
	{
		url: '../data/osis.json',
		success: function(data)
		{
			handleOSIData(data);
		},
		dataType: 'json',
		async:true
	});
}

function requestDisruptionData()
{
	clearInterval(blinkTimer);
	clearInterval(dataTimer);
	blinkTimer = null;
	dataTimer = null;
	
	$('#loadingDisruption').css('display', 'block');
	
	var theurl = "";
	var timerange = $('#dates').val();
	
	var today = moment().format('YYYY-MM-DD');
	
	var thissa = moment().day(6).format('YYYY-MM-DD'); //Doesn't work when viewing on Sundays.
	var thissu = moment().day(6).add(1, 'days').format('YYYY-MM-DD'); //Doesn't work when viewing on Sundays.
	var nextsa = moment().day(13).format('YYYY-MM-DD');
	var nextsu = moment().day(13).add(1, 'days').format('YYYY-MM-DD');
				
	if (timerange == "live") { theurl = 'https://api.tfl.gov.uk/Line/Mode/tube,dlr,overground,tram,tflrail/Status?detail=true&app_id=' + tfl_app_id + '&app_key=' + tfl_app_key; }
	if (timerange == "today") { theurl = 'https://api.tfl.gov.uk/Line/Mode/tube,dlr,overground,tram,tflrail/Status?startDate=' + today + '&endDate=' + today + 'T23:59:59&detail=true&app_id=' + tfl_app_id + '&app_key=' + tfl_app_key; }
	if (timerange == "thiswe") { theurl = 'https://api.tfl.gov.uk/Line/Mode/tube,dlr,overground,tram,tflrail/Status?startDate=' + thissa + '&endDate=' + thissu + 'T23:59:59&detail=true&app_id=' + tfl_app_id + '&app_key=' + tfl_app_key; }
	if (timerange == "nextwe") { theurl = 'https://api.tfl.gov.uk/Line/Mode/tube,dlr,overground,tram,tflrail/Status?startDate=' + nextsa + '&endDate=' + nextsu + 'T23:59:59&detail=true&app_id=' + tfl_app_id + '&app_key=' + tfl_app_key; }
	if (timerange == "2015-05-31") { theurl = "../data/2015-05-31.json"; }
	if (timerange == "2015-06-07") { theurl = "../data/2015-06-07.json"; }

	if (timerange == "live") { thestationurl = 'https://api.tfl.gov.uk/StopPoint/Mode/tube,dlr,overground,tram,tflrail/Disruption?app_id=' + tfl_app_id + '&app_key=' + tfl_app_key; }
	if (timerange == "today") { thestationurl = 'https://api.tfl.gov.uk/StopPoint/Mode/tube,dlr,overground,tram,tflrail/Disruption?startDate=' + today + '&endDate=' + today + 'T23:59:59&app_id=' + tfl_app_id + '&app_key=' + tfl_app_key; }
	if (timerange == "thiswe") { thestationurl = 'https://api.tfl.gov.uk/StopPoint/Mode/tube,dlr,overground,tram,tflrail/Disruption?startDate=' + thissa + '&endDate=' + thissu + 'T23:59:59&app_id=' + tfl_app_id + '&app_key=' + tfl_app_key; }
	if (timerange == "nextwe") { thestationurl = 'https://api.tfl.gov.uk/StopPoint/Mode/tube,dlr,overground,tram,tflrail/Disruption?startDate=' + nextsa + '&endDate=' + nextsu + 'T23:59:59&app_id=' + tfl_app_id + '&app_key=' + tfl_app_key; }
	if (timerange == "2015-05-31") { thestationurl = "../data/2015-05-31-station.json"; }
	if (timerange == "2015-06-07") { thestationurl = "../data/2015-06-07-station.json"; }

	
	$.ajax(
	{
		url: theurl,
		success: function(data)
		{
			handleDisruptionData(data);
		},
		dataType: 'json',
		async:true
	});
	$.ajax(
	{
		url: thestationurl,
		success: function(data)
		{
			handleStationDisruptionData(data);
		},
		dataType: 'json',
		async:true
	});
	
}


function handleOSIData(data)
{
	osis = data;
	requestDisruptionData();
}


function handleStationDisruptionData(statusJSON)
{
	var stations = layerPoints.getSource().getFeatures();
	for (var i in stations)
	{	
		stations[i].set('closed', false);
		stations[i].set('partclosed', false);
	}

	for (var sj in statusJSON)
	{
		var station = statusJSON[sj];
		for (var i in stations)
		{	
			if (stations[i].getId() == station.stationAtcoCode && (station.description.includes("is closed") || station.description.includes("be closed")) && station.type == "Part Closure")
			{
				if (stations[i].get('altid'))
				{
					stations[i].set('partclosed', true);		
					console.log(stations[i].get('name') + " - marking as part closed as this station has two areas and IDs (e.g. Overground ID and Underground ID) and TfL doesn't let us know whether both or just one are closed. Note that both MIGHT be closed.");		
				}
				else
				{
					stations[i].set('closed', true);
				}
			}
			if (stations[i].getId() == station.stationAtcoCode && station.type == "Part Closure")
			{
				stations[i].set('partclosed', true);
			}
		}
	}
	
	/* Manually close stations on the GOBLIN until Feb 2017 */
	for (var i in stations)
	{	
		if (["910GUPRHLWY", "910GCROUCHH", "910GHRGYGL", "910GSTOTNHM", "910GWLTHQRD", "910GLEYTNMR", "910GLYTNSHR", "910GWNSTDPK", "910GWDGRNPK"].indexOf(stations[i].getId()) > -1) { stations[i].set('closed', true); }
		//if ([].indexOf(stations[i].getId()) > -1) { stations[i].set('partclosed', true); }
	}
	
	var open = 0;
	var pc = 0;
	var closed = 0;
	for (var i in stations)
	{
		if (stations[i].get('hide')) { continue; }
		if (stations[i].get('closed')) { closed++; }
		else if (stations[i].get('partclosed')) { pc++; }
		else open++;
	}
	
	$('#countopen').html(open);
	$('#countpc').html(pc);
	$('#countclosed').html(closed);
	
	processOSIs();
}

function handleDisruptionData(statusJSON)
{

	var features = layerLinesAll.getSource().getFeatures();
	for (var i in features)
	{	
		var lines = features[i].get('lines');
		if (lines)
		{
			for (j = 0; j < lines.length; j++)
			{
				features[i].get('lines')[j].end_sid_disrupted = false;
				features[i].get('lines')[j].otend_sid_disrupted = false;
				features[i].get('lines')[j].ot2end_sid_disrupted = false;
			}
		}
	}
	
	/* Manually close GOBLIN until Feb 2017 */
	markClosed("910GGOSPLOK", "910GUPRHLWY", "Overground", "London Overground");	
	markClosed("910GUPRHLWY", "910GCROUCHH", "Overground", "London Overground");
	markClosed("910GCROUCHH", "910GHRGYGL", "Overground", "London Overground");
	markClosed("910GHRGYGL", "910GSTOTNHM", "Overground", "London Overground");
	markClosed("910GSTOTNHM", "910GBLCHSRD", "Overground", "London Overground");
	markClosed("910GBLCHSRD", "910GWLTHQRD", "Overground", "London Overground");
	markClosed("910GWLTHQRD", "910GLEYTNMR", "Overground", "London Overground");
	markClosed("910GLEYTNMR", "910GLYTNSHR", "Overground", "London Overground");
	markClosed("910GLYTNSHR", "910GWNSTDPK", "Overground", "London Overground");
	markClosed("910GWNSTDPK", "910GWDGRNPK", "Overground", "London Overground");
	markClosed("910GWDGRNPK", "910GBARKING", "Overground", "London Overground");
	
	for (var sj in statusJSON)
	{
		var line = statusJSON[sj];
		var lineid = line.id;
		var linename = line.name;
		var network = line.modeName;
		var startcode = null;
		var endcode = null;
		
		if (network == "tube") { network = "Tube"; }
		if (network == "overground") { network = "Overground"; }
		if (network == "dlr") { network = "DLR"; }
		if (network == "tram") { linename = "Tramlink"; network="Tramlink"; }
		if (network == "tflrail") { network = "Crossrail"; }		
		if (linename == "TFL Rail") { linename = "TfL Rail"; } //Upstream typo.
				
		if (line.lineStatuses)
		{
			
			for (var j in line.lineStatuses)
			{
				var ls = line.lineStatuses[j];
				/*
				if (ls.disruption && ls.disruption.affectedStops && ls.disruption.closureText != "specialService")
				{
					for (var l in ls.disruption.affectedStops)
					{
						var as0 = ls.disruption.affectedStops[l];
						//console.log(as0.id);
						
						for (var i in stations)
						{	
							if (stations[i].getId() == as0.id)
							{
								stations[i].set('closed', true);
							}
						}
						//TODO Future enhancement: Show station alert dots.
					}				
				} */
				
				if (ls.disruption && ls.disruption.closureText != "minorDelays" && ls.disruption.closureText != "specialService" && ls.disruption.affectedRoutes)
				{	
					for (var k in ls.disruption.affectedRoutes)
					{
						var ar = ls.disruption.affectedRoutes[k];
						if (ar.routeSectionNaptanEntrySequence)
						{
							for (var m in ar.routeSectionNaptanEntrySequence)
							{
								var rsnes = ar.routeSectionNaptanEntrySequence[m];
								if (rsnes.stopPoint)
								{
									if (!startcode)
									{
										startcode = rsnes.stopPoint.id;
									}
									else
									{
										startcode = endcode;
										endcode = rsnes.stopPoint.id;
									}
									markClosed(startcode, endcode, network, linename);
								}
							}
						}
					}
					if (ls.disruption.isBlocking && ls.disruption.isWholeLine && ls.statusSeverityDescription == "Suspended")
					{
						var segmentId = '#' + network + "-" + linename + "_";
						//console.log(segmentId);

						for (var f in features)
						{	
							var flines = features[f].get('lines');
							if (flines)
							{
								for (j = 0; j < flines.length; j++)
								{
									if (flines[j].network == network && flines[j].name == linename)
									{
										features[f].get('lines')[j].end_sid_disrupted = true;
										features[f].get('lines')[j].otend_sid_disrupted = true;
										features[f].get('lines')[j].ot2end_sid_disrupted = true;
									}
								}
							}
						}						
					}
				}
			}
		}
	}
	
	clearInterval(blinkTimer);
	clearInterval(dataTimer);
	
	processLines();

	$('#loadingDisruption').css('display', 'none');
	blinkTimer = setInterval(flashLines, 1000); //Every second (blink on/off)
	if ($('#dates').val() == "live")
	{
		dataTimer = setInterval(requestDisruptionData, 600000); //Every 10 minutes
	}
	else
	{
		dataTimer = setInterval(requestDisruptionData, 3600000); //Hourly	
	}
}

function markClosed(startcode, endcode, network, linename)
{
	if (startcode && endcode && startcode != endcode)
	{
		var segmentId = '#' + network + "-" + linename + "_" + startcode + "_" + endcode;
		//console.log(segmentId);

		var features = layerLinesAll.getSource().getFeatures();
		for (var f in features)
		{	
			var flines = features[f].get('lines');
			if (flines)
			{
				for (j = 0; j < flines.length; j++)
				{
					if (flines[j].network == network && flines[j].name == linename)
					{
						if (startcode == flines[j].start_sid || endcode == flines[j].start_sid)
						{
							if (startcode == flines[j].end_sid || endcode == flines[j].end_sid) 
							{
								features[f].get('lines')[j].end_sid_disrupted = true;
							}
							if (startcode == flines[j].otend_sid || endcode == flines[j].otend_sid) 
							{
								features[f].get('lines')[j].otend_sid_disrupted = true;
							}
							if (startcode == flines[j].ot2end_sid || endcode == flines[j].ot2end_sid) 
							{
								features[f].get('lines')[j].ot2end_sid_disrupted = true;
							}
						}															
					}
				}
			}
		}
	}
}


function processOSIs()
{
	var source = layerPoints.getSource();	
	layerOSICore.getSource().clear();	
	for (var pair in osis[year])
	{
		var start = osis[year][pair][0];
		var end = osis[year][pair][1];
		if (source.getFeatureById(start) && source.getFeatureById(end))
		{
			var geom = new ol.geom.LineString([ source.getFeatureById(start).getGeometry().getCoordinates(), source.getFeatureById(end).getGeometry().getCoordinates()]);
			var feature = new ol.Feature({ geometry: geom});
			if (!source.getFeatureById(start).get('fillColor') != 'rgba(0, 0, 0, 0)' && source.getFeatureById(end).get('fillColor') != 'rgba(0, 0, 0, 0)'
				&& !source.getFeatureById(start).get('closed') && !source.getFeatureById(end).get('closed'))
			{
				layerOSICore.getSource().addFeature(feature);		
			}
		}
	}
}

function sortLinesByDisruption(a, b)
{
	if (!a.end_sid_disrupted && !b.end_sid_disrupted && !a.otend_sid_disrupted && !b.otend_sid_disrupted && !a.ot2end_sid_disrupted && !b.ot2end_sid_disrupted) return 0;
	if (a.end_sid_disrupted || a.otend_sid_disrupted || a.ot2end_sid_disrupted) return 1;
	if (b.end_sid_disrupted || b.otend_sid_disrupted || b.ot2end_sid_disrupted) return -1;
	return 0;
}

function flashLines()
{
	var stations = layerPoints.getSource().getFeatures();
	for (var i in stations)
	{
		if (stations[i].get('closed') && !stations[i].get('hide'))
		{
			if (blink && !noBlinking)
			{
				stations[i].set('fillColor', 'rgba(0,0,0,0)');
				stations[i].set('strokeColor', 'rgba(0,0,0,0)');		
				stations[i].set('label', '');		
			}
			else
			{
				stations[i].set('fillColor', "#ff0000");					
				stations[i].set('strokeColor', stations[i].get('strokeColorNormal'));		
				stations[i].set('label', stations[i].get('labelNormal'));		
			}
		}
		else if (stations[i].get('partclosed') && !stations[i].get('hide'))
		{
				stations[i].set('fillColor', "#ffaa00");					
		}

	}

	layerLines.getSource().clear();

	var features = layerLinesAll.getSource().getFeatures();
	for (var i in features)
	{	
		var priLineDrawn = false;
		var secLineDrawn = false;
		var terLineDrawn = false;
		
		var lines = features[i].get('lines');
		
		lines.sort(sortLinesByDisruption);
		
		for (var j in lines)
		{
			var disrupted = (lines[j].end_sid_disrupted && (!lines[j].otend_sid || lines[j].otend_sid_disrupted) && (!lines[j].ot2end_sid || lines[j].ot2end_sid_disrupted));

			if (!lines[j].hide)		
			{
				var line = features[i].clone();
				line.setId(features[i].get('id') + lines[j].name);
				line.set('strokeLinecap', "butt");							
				if (!priLineDrawn)
				{
					line.set('strokeDashstyle', [8, 0]);
					if (disrupted)
					{
						line.set('strokeDashstyle', [0.1, 7.9]);					
					}
					priLineDrawn = true;	
				}
				else if (!secLineDrawn)
				{
					line.set('strokeDashstyle', [8, 8]);
					if (disrupted)
					{
						line.set('strokeDashstyle', [0.1, 15.9]);					
					}
					secLineDrawn = true;
				}
				else if (!terLineDrawn)
				{
					line.set('strokeDashstyle', [4, 4]);
					if (disrupted)
					{
						line.set('strokeDashstyle', [0.1, 11.9]);					
					}
					terLineDrawn = true;
				}

				line.set('strokeColor', features[i].get('lines')[j].colour);
				if (disrupted)
				{
					line.set('strokeLinecap', "round");							
					if (blink && !noBlinking)
					{
						line.set('strokeColor', 'rgba(0,0,0,0)');
					}
				}
				
				layerLines.getSource().addFeature(line);	
			}
		}
	}
	blink = !blink;
}

/* This method is designed to be called frequently, to restyle and show/hide lines. */
function processLines()
{
	var stations = layerPoints.getSource().getFeatures();
	for (var i in stations)
	{
		stations[i].set('fillColor', "#ffffff");
	}

	layerLinesAll.setVisible(false);

	var features = layerLinesAll.getSource().getFeatures();
	for (var i in features)
	{	
		var lines = features[i].get('lines');
		if (lines)
		{
			for (j = 0; j < lines.length; j++)
			{
				lines[j].hide = false;			

				if (typeof lines[j].closed !== undefined 
					&& year > lines[j].closed)
				{
					lines[j].hide = true;
				}
				if (typeof lines[j].opened !== undefined 
					&& year < lines[j].opened)
				{
					lines[j].hide = true;
				}
				if (serviceFilter !== undefined)
				{
					if (lines[j].name != serviceFilter)
					{
						lines[j].hide = true;						
					}
				}
				if (lines[j].name == "Emirates Air Line") { lines[j].hide = true; }
				if (features[i].get('id') == "BatterseaParkSpur") { lines[j].hide = true; }
				
			}
			features[i].set('lines', lines);
		}
	}	

	var html = "<table style='width: 100%'><tr><td style='vertical-align: top;'>";
	/* Build up the unique lines, ordered, for key. */
	linesForKey = {};

	for (var j in features)
	{
		var flines = features[j].get('lines');
		for (var k in flines)
		{
			if (flines[k].name in linesForKey || ["Emirates Air Line","East London", "Crossrail"].indexOf(flines[k].name) > -1) {}
			else
			{
				linesForKey[flines[k].name] = flines[k].colour;
			}			
		}
	}

	var linesForKeySorted = [];
	for (var l in linesForKey)
	{
		linesForKeySorted.push([l, linesForKey[l]]);
	}	
				
	linesForKeySorted.sort(function(a, b) {
			a = a[0];
			b = b[0];
			return a < b ? -1 : (a > b ? 1 : 0);
	});
	
	for (var line in linesForKeySorted)
	{
		html += ("<div style='clear: both;'><div class='keyLineItem' style='background-color: " + linesForKeySorted[line][1] + ";' onclick='filterLine(\"" + linesForKeySorted[line][0] + "\");'>&nbsp;</div><div class='keyItemText'>"  + linesForKeySorted[line][0] + "</div>");
	}
	html += "</td>";	
	html += "<td>";	
	html += "</td></tr></table>";
			
	$("#linekey").html(html);
	
	flashLines();
	processOSIs();
}

function handleChange()
{
	/* Needed in case we hide/show lines based on the newly selected options. */
	processLines();	
		
	var features = layerPoints.getSource().getFeatures();
	for (var i in features)
	{
		var feature = features[i];
		var show = false;
		features[i].set('hide', true);

		for (var j in feature.get('lines'))
		{
			if ((feature.get('lines')[j].opened === undefined || feature.get('lines')[j].opened <= year) && 
					(feature.get('lines')[j].closed === undefined || feature.get('lines')[j].closed >= year) &&
					feature.get('lines')[j].name != "Emirates Air Line" && feature.get('name') != "Battersea Park")
			{
				if (serviceFilter !== undefined)
				{
					if (feature.get('lines')[j].name == serviceFilter)
					{
						show = true;
						features[i].set('hide', false);
					}
				}
				else
				{
					show = true;
					features[i].set('hide', false);
				}
			}
		}
		
		if (show)
		{
			features[i].set('radius', 0);
			features[i].set('fillColor', '#ffffff');
			features[i].set('strokeColor', "#000000");
			features[i].set('label', "");
			features[i].set('offsetX', undefined);
			features[i].set('offsetY', undefined);				
			features[i].set('strokeWidth', 2);				
			features[i].set('radius', 13);	
			features[i].set('fillColor', "#ffffff");
			if (features[i].get('cartography')['labelX'])
			{
				if (features[i].get('cartography')['display_name'])
				{
					features[i].set('label', features[i].get('cartography')['display_name']);								
				}
				else
				{
					features[i].set('label', features[i].get('name'));				
				}
				features[i].set('offsetX', features[i].get('cartography')['labelX']);
				features[i].set('offsetY', features[i].get('cartography')['labelY']);				
			}
			
			var lineCount = 0;
			var colour = "";
			if (linesForKey !== undefined)
			{
				for (var k in feature.get('lines'))
				{
					if ((feature.get('lines')[k].opened === undefined || feature.get('lines')[k].opened <= year) && 
							(feature.get('lines')[k].closed === undefined || feature.get('lines')[k].closed >= year))
					{
						lineCount++;
						colour = linesForKey[feature.get('lines')[k].name];
					}
				}
				
				if (lineCount == 1)
				{
					if (colour)
					{
						features[i].set('strokeColor', colour);			
					}
				}
			}
			features[i].set('labelNormal', features[i].get('label'));
			features[i].set('strokeColorNormal', features[i].get('strokeColor'));

		}
		else
		{
			features[i].set('fillColor', 'rgba(0, 0, 0, 0)');
			features[i].set('strokeColor', 'rgba(0, 0, 0, 0)');
			features[i].set('label', "");
		}
	}	
	
		
	processOSIs();	
	updateUrl();	
}

function toggleKey()
{
	if ($("#linekey").css('display') != 'none')
	{
		$("#linekey").css('display', 'none');
		$("#explanationkey").css('display', 'none');
	}
	else
	{
		$("#linekey").css('display', "block");
		$("#explanationkey").css('display', 'block');
	}	
}

function toggleBackground()
{
	layerBackground.setVisible(!layerBackground.getVisible());
	updateUrl();
}

function toggleBlinking()
{
	noBlinking = !noBlinking;
}

function filterLine(lineName)
{
	if (serviceFilter === lineName)
	{
		serviceFilter = undefined;
	}
	else
	{
		serviceFilter = lineName;
	}
	handleChange();
}

function updateUrl()
{
	var hash = "dates=" + $('#dates').val();
	hash += "&background=" + layerBackground.getVisible();
	if (serviceFilter !== undefined)
	{	
		hash += "&filter=" + serviceFilterCodes[serviceFilter];
	}
	var centre = ol.proj.transform(olMap.getView().getCenter(), "EPSG:3857", "EPSG:4326");
	hash += "&zoom=" + olMap.getView().getZoom() + "&lon=" + centre[0].toFixed(4) + "&lat=" + centre[1].toFixed(4); 
	window.location.hash = hash;
}

$(document).ready(function() {
	init();
});
