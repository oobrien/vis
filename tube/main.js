/*
	London Tube Data Maps
	Created by Oliver O'Brien (Twitter: @oobr)
	Live version: http://tubecreature.com/
	Source repository: https://github.com/oobrien/vis/
	Licensed under a Creative Commons CC-By-NC licence. 
	Please contact me (o.obrien [(at)] outlook.com) first if you would like to use this code in a commercial project.
*/

var olMap;
var key1map;
var key1source;
var key2map;
var key2source;
var layerPoints;
var layerPointsCase;
var layerOSICore;
var layerLines;
var layerLinesAll;
var layerBackground;
var layerAerial;
var pointsLoaded = "stations";
var selectClick;
var showEnglish = false;
var args = [];

var DEFAULT_ZOOM = 13;
var DEFAULT_LAT = 51.52;
var DEFAULT_LON = -0.15;

var currentZoom = DEFAULT_ZOOM;
var currentLat = DEFAULT_LAT;
var currentLon = DEFAULT_LON;

var serviceFilter;
var odRequested = false;

var demographicData = {};
var metricKey = {};

metricKey["total"] = "tf_yr";
metricKey["in"] = "i_w_t";
metricKey["out"] = "o_w_t"; 
metricKey["early_in"] = "i_w_pre"; 
metricKey["early_out"] = "o_w_pre"; 
metricKey["am_in"] = "i_w_apk"; 
metricKey["am_out"] = "o_w_apk"; 
metricKey["mid_in"] = "i_w_mid"; 
metricKey["mid_out"] = "o_w_mid"; 
metricKey["pm_in"] = "i_w_ppk"; 
metricKey["pm_out"] = "o_w_ppk";
metricKey["late_in"] = "i_w_eve"; 
metricKey["late_out"] = "o_w_eve"; 
metricKey["sat_in"] = "i_sa"; 
metricKey["sat_out"] = "o_sa"; 
metricKey["sun_in"] = "i_su"; 
metricKey["sun_out"] = "o_su"; 

var osis = {};

var serviceFilterCodes = { "Bakerloo": "B", "Central": "C", "Circle": "I", "Crossrail": "X", "DLR": "L", "District": "D", "East London": "E", 
	"Emirates Air Line": "A", "Hammersmith & City": "H", "Jubilee": "J", "Metropolitan": "M", "Northern": "N", "London Overground": "O", "TfL Rail": "R", "Piccadilly": "P", "Tramlink": "T", "Victoria": "V", "Waterloo & City": "W" };
var linesForKey;

var hidelabels = ['940GZZLUTCR', '910G950', '940GZZDLCAN', '940GZZLUNGW', '940GZZDLPOP', '940GZZLUCGN', '940GZZLUERB', '940GZZLUCST', '940GZZLUMMT', '910GWLTHQRD', '940GZZCRCEN', '940GZZCRWEL', '940GZZLUESQ', '940GZZLULSQ', '940GZZLUSPU', '940GZZLUBND', '940GZZDLRAL', '910GBTHNLGR', '940GZZLUGPS', '940GZZLUEMB', '940GZZLURGP'];

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

		if (elements[0] == 'map') { args['metric'] = "map"; }
		if (elements[0] == 'night') { args['metric'] = "night"; }
		if (elements[0] == 'tongues') { args['metric'] = "tongues"; }
		if (elements[0] == 'wardwords') { args['metric'] = "wardwords"; }
		if (elements[0] == 'occupation') { args['metric'] = "occupation"; }
		if (elements[0] == 'wardwork') { args['metric'] = "wardwork"; }
		if (elements[0] == 'in') { args['metric'] = "in"; }
		if (elements[0] == 'out') { args['metric'] = "out"; }
		if (elements[0] == 'early_in') { args['metric'] = "early_in"; }
		if (elements[0] == 'early_out') { args['metric'] = "early_out"; }
		if (elements[0] == 'am_in') { args['metric'] = "am_in"; }
		if (elements[0] == 'am_out') { args['metric'] = "am_out"; }
		if (elements[0] == 'mid_in') { args['metric'] = "mid_in"; }
		if (elements[0] == 'mid_out') { args['metric'] = "mid_out"; }
		if (elements[0] == 'pm_in') { args['metric'] = "pm_in"; }
		if (elements[0] == 'pm_out') { args['metric'] = "pm_out"; }
		if (elements[0] == 'late_in') { args['metric'] = "late_in"; }
		if (elements[0] == 'late_out') { args['metric'] = "late_out"; }
		if (elements[0] == 'sat_in') { args['metric'] = "sat_in"; }
		if (elements[0] == 'sat_out') { args['metric'] = "sat_out"; }
		if (elements[0] == 'sun_in') { args['metric'] = "sun_in"; }
		if (elements[0] == 'sun_out') { args['metric'] = "sun_out"; }

		for(var i = 0; i < elements.length; i++)
		{
			var pair = elements[i].split('=');
			if (pair.length > 1)
			{
				args[pair[0]] = pair[1];
			}
		}
	}
	
	if (args['metric'])
	{
		$('#themetric').val(args['metric']);
	}
	else
	{
		$('#themetric').val('total');		
	}
	if (args['filter'])
	{
		for (var key in serviceFilterCodes)
		{
			if (args['filter'] == serviceFilterCodes[key])
			{
				serviceFilter = key;
			}
		}
	}
	if (args['year'])
	{
		$('#year').val(args['year']);
	}
	if (args['yearcomp'])
	{
		$('#yearcomp').val(args['yearcomp']);
	}
				
	if (args['zoom'])
	{
		currentZoom = args['zoom'];
	}
	if (args['lat'] && args['lon'])
	{
		currentLat = parseFloat(args['lat']); /* Necessary for lat (only) for some reason, otherwise was going to 90-val. Very odd... */
		currentLon = parseFloat(args['lon']);		
	}

	function pointStyle(feature, resolution) 
	{
		var zoomFactor = 0.15;
		if (resolution < 100) { zoomFactor = 0.2; }
		if (resolution < 50) { zoomFactor = 0.3; }
		if (resolution < 25) { zoomFactor = 0.4; }
		if (resolution < 12.5) { zoomFactor = 0.5; }

		//console.log(feature);
		//console.log(feature.get('fillColor'));

		return [
			new ol.style.Style({ 
				image: new ol.style.Circle({ 
					radius: feature.get('radius') * zoomFactor, 
					fill: new ol.style.Fill({ color: (resolution > 50 && feature.get('labelcolor') ? feature.get('labelcolor') : feature.get('fillColor') )}),
				}),
				text: new ol.style.Text({
					text: (resolution > 50 ? undefined : feature.get('datalabel')),
					textAlign: 'center',
					font: (resolution < 12.5 ? 'bold 14px Cabin Condensed, sans-serif' : ( resolution < 25 ? 'bold 12px  Cabin Condensed, sans-serif' : (resolution < 50 ? 'bold 8.5px Cabin Condensed, sans-serif' : 'bold 8px Cabin Condensed, sans-serif'))),
					fill: new ol.style.Fill({ color: (feature.get('labelcolor') ? feature.get('labelcolor') : "#000000") }),
					stroke: new ol.style.Stroke({ color: 'rgba(255, 255, 255, 1)', width: 3 })

				})
			}),
			new ol.style.Style({
				text: new ol.style.Text({
                                       text: (resolution > 50 ? undefined : (resolution > 25 && (hidelabels.indexOf(feature.get('id')) > -1 || $('#themetric').val() == "houseprices" || $('#themetric').val() == "housepricesdiff") ? undefined : feature.get('geolabel'))),
                                        offsetX: ( feature.get('offsetX') ? feature.get('offsetX')*zoomFactor : 0),
                                        offsetY: ( feature.get('offsetY') ? feature.get('offsetY')*zoomFactor : 0),
                                        textAlign: ( feature.get('offsetX') ? (feature.get('offsetX') > 0 ? 'left' : 'right') : 'center'),
                                        font: (resolution < 12.5 ? '12px Cabin Condensed, sans-serif' : ( resolution < 25 ? '10px  Cabin Condensed, sans-serif' : '7px Cabin Condensed, sans-serif')),
                                        fill: new ol.style.Fill({ color: "#000000" }),
                                        stroke: new ol.style.Stroke({ color: 'rgba(255, 255, 255, 0.6)', width: 3 })
				})
			})			
		] 
	};
	
	function pointCaseStyle(feature, resolution) 
	{
		var zoomFactor = 0.15;
		if (resolution < 100) { zoomFactor = 0.2; }
		if (resolution < 50) { zoomFactor = 0.3; }
		if (resolution < 25) { zoomFactor = 0.4; }
		if (resolution < 12.5) { zoomFactor = 0.5; }

		//console.log(feature);
		//console.log(feature.get('fillColor'));
		return [
			new ol.style.Style({ 
				image: new ol.style.Circle({ 
					radius: feature.get('radius') * zoomFactor, 
					stroke: (feature.get('radius') == 0 ? undefined : (resolution > 100 && ($('#themetric').val() != "map" && $('#themetric').val() != "night") ? undefined : (resolution > 50 && ($('#themetric').val() == "livesontheline" || $('#themetric').val() == "houseprices" || $('#themetric').val() == "housepricesdiff") ? undefined : new ol.style.Stroke({ width: feature.get('strokeWidth'), color: feature.get('strokeColor') }))))
				}),
			}),
		] 
	};	

	function selectStyle(feature, resolution) 
	{
		var zoomFactor = 0.15;
		if (resolution < 100) { zoomFactor = 0.2; }
		if (resolution < 50) { zoomFactor = 0.3; }
		if (resolution < 25) { zoomFactor = 0.4; }
		if (resolution < 12.5) { zoomFactor = 0.5; }

		//console.log(feature);
		//console.log(feature.get('fillColor'));

		return [
			new ol.style.Style({ 
				image: new ol.style.Circle({ 
					radius: feature.get('radius') * zoomFactor, 
					fill: new ol.style.Fill({ color: (resolution > 50 && feature.get('labelcolor') ? feature.get('labelcolor') : feature.get('fillColor') )}),
					stroke: (resolution > 100 && ($('#themetric').val() != "map" && $('#themetric').val() != "night") ? undefined : (resolution > 50 && ($('#themetric').val() == "livesontheline" || $('#themetric').val() == "houseprices" || $('#themetric').val() == "housepricesdiff") ? undefined : new ol.style.Stroke({ width: feature.get('strokeWidth')*2, color: feature.get('strokeColor') })))
				}),
				text: new ol.style.Text({
					text: (resolution > 50 ? undefined : feature.get('datalabel')),
					textAlign: 'center',
					font: (resolution < 12.5 ? 'bold 14px Cabin Condensed, sans-serif' : ( resolution < 25 ? 'bold 12px  Cabin Condensed, sans-serif' : (resolution < 50 ? 'bold 8.5px Cabin Condensed, sans-serif' : 'bold 8px Cabin Condensed, sans-serif'))),
					fill: new ol.style.Fill({ color: (feature.get('labelcolor') ? feature.get('labelcolor') : "#000000") }),
					stroke: new ol.style.Stroke({ color: 'rgba(255, 255, 255, 1)', width: 3 })

				})
			}),
			new ol.style.Style({
				text: new ol.style.Text({
                                       text: (resolution > 50 ? undefined : (resolution > 25 && (hidelabels.indexOf(feature.get('id')) > -1 || $('#themetric').val() == "houseprices" || $('#themetric').val() == "housepricesdiff") ? undefined : feature.get('geolabel'))),
                                        offsetX: ( feature.get('offsetX') ? feature.get('offsetX')*zoomFactor : 0),
                                        offsetY: ( feature.get('offsetY') ? feature.get('offsetY')*zoomFactor : 0),
                                        textAlign: ( feature.get('offsetX') ? (feature.get('offsetX') > 0 ? 'left' : 'right') : 'center'),
                                        font: (resolution < 12.5 ? '12px Cabin Condensed, sans-serif' : ( resolution < 25 ? '10px  Cabin Condensed, sans-serif' : '7px Cabin Condensed, sans-serif')),
                                        fill: new ol.style.Fill({ color: "#000000" }),
                                        stroke: new ol.style.Stroke({ color: 'rgba(255, 255, 255, 0.6)', width: 3 })
				})
			})			
		] 
	};	
	
	
		
	function lineStyle(feature, resolution) 
	{
		return [
			new ol.style.Style({ 
				stroke: new ol.style.Stroke({ width: feature.get('strokeWidth'), color: feature.get('strokeColor'), lineCap: feature.get('strokeLinecap'), lineDash: feature.get('strokeDashstyle') })
			})
		] 
	};
	
		
	function osicaseStyle(feature, resolution) 
	{
		return [
			new ol.style.Style({ 
				stroke: new ol.style.Stroke({ width: 5.5, color: '#000000' })
			})
		] 
	};
	
	function osicoreStyle(feature, resolution) 
	{
		return [
			new ol.style.Style({ 
				stroke: new ol.style.Stroke({ width: 2.5, color: '#ff88dd' })
			})
		] 
	};
	
	
	function glaStyle(feature, resolution)
	{
		return [
			new ol.style.Style({ 
				stroke: new ol.style.Stroke({ width: 6, color:'rgba(128, 0, 0, 0.5)' })
			})
		] 	
	};

	function zoneStyle(feature, resolution)
	{
		return [
			new ol.style.Style({ 
				stroke: new ol.style.Stroke({ width: 6, color:'rgba(128, 128, 128, 0.25)' })
			})
		] 	
	};

	
	function thamesStyle(feature, resolution)
	{
		return [
			new ol.style.Style({ 
				fill: new ol.style.Fill({ color: 'rgba(128,190,205,0.6)' })
			})
		] 
	};

    //	url: "http://casa.oobrien.com/tiles/futurecity/{z}/{x}/{y}.png",
	//	url: "http://2.base.maps.cit.api.here.com/maptile/2.1/maptile/newest/normal.day/{z}/{x}/{y}/256/png8?app_id=YyCiz5fA5sFK593ZqCEG&app_code=hfwTGH-20M2rP3HyyWIltA",
   	//	url: "http://marlin.casa.ucl.ac.uk/~ollie/tiles/londonboroughs/{z}/{x}/{y}.png"
   	layerBackground = new ol.layer.Tile({
   		source: new ol.source.XYZ({
			url: "http://2.base.maps.cit.api.here.com/maptile/2.1/maptile/newest/normal.day.grey/{z}/{x}/{y}/256/png8?app_id=YyCiz5fA5sFK593ZqCEG&app_code=hfwTGH-20M2rP3HyyWIltA",
			crossOrigin: null,
			//attribution: "Map data &copy; <a href='http://osm.org/'>OSM</a>"
			attributions: [ new ol.Attribution({ 'html': "Map data &copy; <a href='https://developer.here.com/'>HERE Maps/Navteq</a>" })]
		}),
		opacity: 0.25
	});
	layerAerial = new ol.layer.Tile({
                source: new ol.source.BingMaps({
					key: 'AtZti8EK8Nnv2Nb6w-7eGTmhK1nhYgixIXib0-xKzLLv9n_vsTkh_fWqtmqDppeX',
					imagerySet: 'Aerial'
				}),
				visible: false,
                opacity: 0.6
        });	
 	
	 pointSource = new ol.source.Vector({
		url: 'data/tfl_stations.json',
		defaultProjection: 'EPSG:4326',
		format: new ol.format.GeoJSON(),
		attributions: [ 
			new ol.Attribution({ 'html': "metrics &copy; <a href='http://www.tfl.gov.uk/corporate/publications-and-reports/underground-services-performance'>TfL</a>, " 
				+ "<a href='https://www.whatdotheyknow.com/request/most_recent_passenger_numbers_pe#incoming-351969'>WDTK</a>, " 
				+ "<a href='http://www.ons.gov.uk/'>ONS</a>. "
				+ "<a href='https://gist.github.com/oobrien/8525859'>Lines/stations</a> on GitHub." 
			})
		]
	}) 
		
	pointSource.once('change', function() 
	{
		if (pointSource.getState() == 'ready') 
		{
			var features = pointSource.getFeatures();
			for (var j in features)
			{
				features[j].set('radius', 15);
				features[j].set('fillColor', "#ffffff");
				features[j].set('strokeColor', "#000000");
				features[j].set('datalabel', "");
				features[j].set('geolabel', "");
				features[j].set('strokeWidth', 3);
				if (features[j].get('id'))
				{
					features[j].setId(features[j].get('id'));
				}
				else
				{
					features[j].setId(features[j].get('name'));
				}				
			}					
  	  	
			requestData();	
			requestOSIData();		
		}
	});

	pointSource2 = new ol.source.Vector({
		url: 'data/london_wards_2011_centroids.json',
		defaultProjection: 'EPSG:4326',
		format: new ol.format.GeoJSON(),
		attributions: [ 
			new ol.Attribution({ 'html': "metrics &copy; <a href='http://www.ons.gov.uk/'>ONS</a>." 
			})
		]
	}) 
		
	pointSource2.once('change', function() 
	{
		if (pointSource2.getState() == 'ready') 
		{
			var features = pointSource2.getFeatures();
			for (var j in features)
			{
				features[j].set('radius', 15);
				features[j].set('fillColor', "#ffffff");
				features[j].set('strokeColor', "#000000");
				features[j].set('datalabel', "");
				features[j].set('geolabel', "");
				features[j].set('strokeWidth', 3);
				features[j].set('tfl_intid', features[j].getId()); //Eugh.
			}				
			//if (["wardwork", "wardwords"].indexOf($('#themetric').val()) > -1)
		
			handleMetricChange();
		}
	});
	
 	layerPoints = new ol.layer.Vector(
	{ 
		source: pointSource, 
		style: function(feature, resolution) { return pointStyle(feature, resolution); }
	});

 	layerPointsCase  = new ol.layer.Vector(
	{ 
		source: pointSource, 
		style: function(feature, resolution) { return pointCaseStyle(feature, resolution); }
	});

 	var lineAllSource = new ol.source.Vector({
		url: 'data/tfl_lines.json',
		defaultProjection: 'EPSG:4326',
		format: new ol.format.GeoJSON()
	}) 
	
 	layerLinesAll = new ol.layer.Vector(
	{ 
		source: lineAllSource, 
		style: function(feature, resolution) { return lineStyle(feature, resolution); }
	});

	lineAllSource.once('change', function() 
	{
		if (lineAllSource.getState() == 'ready') 
		{
			handleMetricChange();
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
		url: 'data/2247.json',
		defaultProjection: 'EPSG:4326',
		format: new ol.format.GeoJSON()
	}) 

 	layerGLA = new ol.layer.Vector(
	{ 
		source: glaSource, 
		style: function(feature, resolution) { return glaStyle(feature, resolution); }
	});

	var zoneSource = new ol.source.Vector({
		url: 'data/zones1to6.json',
		defaultProjection: 'EPSG:4326',
		format: new ol.format.GeoJSON()
	}) 

 	layerZones = new ol.layer.Vector(
	{ 
		source: zoneSource, 
		style: function(feature, resolution) { return zoneStyle(feature, resolution); }
	});


	var thamesSource = new ol.source.Vector({
		url: 'data/river_thames_simp.json',
		defaultProjection: 'EPSG:4326',
		format: new ol.format.GeoJSON()
	}) 

 	layerThames = new ol.layer.Vector(
	{ 
		source: thamesSource, 
		style: function(feature, resolution) { return thamesStyle(feature, resolution); }
	});
  	
	olMap = new ol.Map({
		target: "mapcontainer",
		layers: [ layerBackground, layerAerial, layerLinesAll, layerThames, layerZones, layerGLA, layerLines, layerOSICase, layerPointsCase, layerOSICore, layerPoints ],
		controls: ol.control.defaults({}).extend(
		[
			new ol.control.ScaleLine({'geodesic': true, 'units': 'metric'}),
			new ol.control.ZoomSlider({'className': 'ol-zoomslider'})
				
		]),
		view: new ol.View({		
			projection: "EPSG:3857",
			maxZoom: 16,
			minZoom: 10,
			zoom: currentZoom,
			center: ol.proj.transform([currentLon, currentLat], "EPSG:4326", "EPSG:3857"), 
			extent: ol.proj.transformExtent([-1.5, 51, 1.0, 52], "EPSG:4326", "EPSG:3857")
		})
	});
	
	if (args['layers'])
	{
		if (args['layers'][0] == "F")
		{
            $("#backgroundCB").prop('checked', false);
			layerBackground.setVisible(false);
		}
		if (args['layers'].length > 2 && args['layers'][2] == "F")
		{
            $("#linesCB").prop('checked', false);
			layerLines.setVisible(false);
		}
		if (args['layers'].length > 5 && args['layers'][5] == "T")
        {
            $("#aerialCB").prop('checked', true);
			layerAerial.setVisible(true);
						
		}
	}

    //INTERACTIONS AND EVENTS		
	selectClick = new ol.interaction.Select({
		layers: [ layerPoints ],
		condition: ol.events.condition.click,
		style: function(feature, resolution) { return selectStyle(feature, resolution); }
	  });
	 olMap.getInteractions().extend([selectClick]);

	$(olMap.getViewport()).on('click', function(evt) 
	{
		var pixel = olMap.getEventPixel(evt.originalEvent);
		var coordinate = olMap.getEventCoordinate(evt.originalEvent);
		var popupFeature;

		olMap.forEachFeatureAtPixel(pixel, function(feature, layer) 
		{
			if (layer == layerPoints && feature)
			{
				popupFeature = feature;				
			}
		}.bind(this));

		if (popupFeature)
		{
			//olMap.getOverlays().item(0).setPosition(coordinate);
          	if ($("#themetric").val() == "journeys")
			{
				handleChange();
			}
			else
			{
				updateSelectedInfo();		
			};
		}
		else
		{
			resetDisplay();
			$("#info").css('display', 'none');
			$("#info").html('');
		}
		updateUrl();
	});
	
	$(olMap.getViewport()).on('mousemove', function(evt) 
	{
	  	var pixel = olMap.getEventPixel(evt.originalEvent);
		displayFeatureInfo(pixel);
	});
	    
	olMap.getView().on('change:resolution', handleZoom);	
	olMap.on("moveend", updateUrl);	  

	key1source = new ol.source.Vector();
	var key1layer = new ol.layer.Vector({ source: key1source, style: function(feature, resolution) { return pointStyle(feature, resolution); } });	
	var key1layerCase = new ol.layer.Vector({ source: key1source, style: function(feature, resolution) { return pointCaseStyle(feature, resolution); } });	
	key1map = new ol.Map({ target: "key1", layers: [ key1layerCase, key1layer ], controls: [], view: new ol.View({ center: [0, 0], zoom: olMap.getView().getZoom() }) });

	key2source = new ol.source.Vector();
	var key2layer = new ol.layer.Vector({ source: key2source, style: function(feature, resolution) { return pointStyle(feature, resolution); } });	
	var key2layerCase = new ol.layer.Vector({ source: key2source, style: function(feature, resolution) { return pointCaseStyle(feature, resolution); } });	
	key2map = new ol.Map({ target: "key2", layers: [ key2layerCase, key2layer ], controls: [], view: new ol.View({ center: [0, 0], zoom: olMap.getView().getZoom() }) });

	if (top.location!= self.location) { $("#button").css('display', 'block'); }
}

var displayFeatureInfo = function(pixel)
{
	var features = [];
	olMap.forEachFeatureAtPixel(pixel, function(feature, layer)
	{
		features.push(feature);
	}.bind(this));
	
	if (features.length > 0) 
	{
		var name = false;
		var info = [];
		var i, ii;
		for (i = 0, ii = features.length; i < ii; ++i) 
		{
			if (features[i].get('name'))
			{
				if (info.indexOf(features[i].get('name')) < 0)
				{
					info.push(features[i].get('name'));
				}
				name = true;
			}
		}
		if (name)
		{
			document.getElementById('areainfo').innerHTML =  "<div class='areatitle'><br />" + info.join('<br />') || '' + "</div>";
		}
		else
		{
			document.getElementById('areainfo').innerHTML = '';		
		}
	} 
	else 
	{
		document.getElementById('areainfo').innerHTML = '';
	}
}

/* This method is designed to be called frequently, to restyle and show/hide lines. */
function processLines()
{
	layerLinesAll.setVisible(false);
	layerLines.getSource().clear();

	var metric = $("#themetric").val();
	var features = layerLinesAll.getSource().getFeatures();
	for (var i in features)
	{	
		var lines = features[i].get('lines');
		if (lines)
		{
			for (j = 0; j < lines.length; j++)
			{
				lines[j].hide = true;
				if (lines[j].network === "Tube")
				{
					lines[j].hide = false;
				}
				if ($("#themetric").val() == "total" 
					&& ($("#year").val() >= 2012 && $("#year").val() <= 2016) 
					&& ($("#yearcomp").val() == "none" || ($("#yearcomp").val() >= 2012 && $("#yearcomp").val() <= 2016))
					&& [ "DLR"].indexOf(lines[j].network) > -1)
				{
					lines[j].hide = false;			
				}
				if ($("#themetric").val() == "total" 
					&& ($("#year").val() >= 2010) 
					&& ($("#yearcomp").val() == "none" || ($("#yearcomp").val() >= 2010 && $("#yearcomp").val() <= 2015))
					&& [ "Tramlink"].indexOf(lines[j].network) > -1)
				{
					lines[j].hide = false;			
				}
				if ($("#themetric").val() == "total" 
					&& ($("#year").val() >= 2013 && $("#year").val() <= 2015) 
					&& ($("#yearcomp").val() == "none" || ($("#yearcomp").val() >= 2014 && $("#yearcomp").val() <= 2015))
					&& [ "Overground"].indexOf(lines[j].network) > -1)
				{
					lines[j].hide = false;			
				}
				/* if ($("#themetric").val() == "journeys" && ["Overground", "DLR"].indexOf(lines[j].network) > -1)
				{
					lines[j].hide = false;			
				} */				
				if (["tongues", "occupation", "livesontheline", "houseprices", "housepricesdiff"].indexOf(metric) > -1)
				{
					lines[j].hide = false;			
				}
				if (["wardwork", "wardwords"].indexOf(metric) > -1)
				{
					lines[j].hide = false;			
				}
				if (metric == "map" || metric == "night")
				{
					lines[j].hide = false;			
					if (metric == "night" && !lines[j].night)
					{
						lines[j].hide = true;			
					}
				}
				if (typeof lines[j].closed !== undefined 
					&& $("#year").val() > lines[j].closed)
				{
					lines[j].hide = true;
				}
				if (typeof lines[j].opened !== undefined 
					&& $("#year").val() < lines[j].opened)
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
			}
			features[i].set('lines', lines);
		}
	}	

	var html = "<table style='width: 100%'><tr><td style='vertical-align: top;'>";
	/* Build up the unique lines, ordered, for key. */
 	linesForKey = {};

	for (var j in features)
	{
		var lines = features[j].get('lines');
		for (var k in lines)
		{
			if (lines[k].name in linesForKey) {}
			else 
			{ 
				linesForKey[lines[k].name] = lines[k].colour;
			}					
		}
	} 	

	var linesForKeySorted = [];
	for (var k in linesForKey)
	{
		linesForKeySorted.push([k, linesForKey[k]]);

	};				
	linesForKeySorted.sort(function(a, b) {
			a = a[0];
			b = b[0];
			return a < b ? -1 : (a > b ? 1 : 0);
	});
	if (["wardwords", "wardwork"].indexOf(metric) == -1)
	{
		for (line in linesForKeySorted)
		{
			if (linesForKeySorted[line][0] == "Crossrail")
			{
				if (linesForKeySorted[line][0] == "Crossrail")
				{
					html += ("<div style='clear: both;'><div class='keyLineItem' style='background-color: " + linesForKeySorted[line][1] + ";' onclick='filterLine(\"" + linesForKeySorted[line][0] + "\");'>&nbsp;</div><div class='keyItemText'>Elizabeth</div>");							
				}
				else
				{
					html += ("<div style='clear: both;'><div class='keyLineItem' style='background-color: " + linesForKeySorted[line][1] + ";' onclick='filterLine(\"" + linesForKeySorted[line][0] + "\");'>&nbsp;</div><div class='keyItemText'>"  + linesForKeySorted[line][0] + "</div>");			
				}
			}
			else
			{
				html += ("<div style='clear: both;'><div class='keyLineItem' style='background-color: " + linesForKeySorted[line][1] + ";' onclick='filterLine(\"" + linesForKeySorted[line][0] + "\");'>&nbsp;</div><div class='keyItemText'>"  + linesForKeySorted[line][0] + "</div>");			
			}
		}
	}
	html += "</td>";	
	html += "<td>";
	
	var metric = $("#themetric").val();
	if (["tongues", "wardwords", "occupation", "wardwork", "livesontheline", "houseprices", "housepricesdiff"].indexOf(metric) > -1)
	{
	
		if (demographicMap["houseprices"] == undefined)
		{
			demographicMap["houseprices"] = {};
			for (var i = 250; i <= 1000; i = i + 50)
			{
				var ratio = (i-250.0)/750.0;	
				demographicMap["houseprices"][i] = ["£" + i.toString() + "K", getGBRColour(ratio)]
			}
		}
		if (demographicMap["housepricesdiff"] == undefined)
		{
			demographicMap["housepricesdiff"] = {};
			for (var i = -50; i <= 50; i = i + 5)
			{
				var ratio = (i+50.0)/100.0;	
				demographicMap["housepricesdiff"]['x' + i] = ["£" + i.toString() + "K", getGWRColour(1-ratio)]
			}
		}
	
		for (demographic in demographicMap[metric])
		{
			if (demographicMap[metric][demographic][1] !== undefined && demographicMap[metric][demographic][1] !== "#ffffff" && demographicMap[metric][demographic][1] !== "#222222")
			{
				html += ("<div style='clear: both;'><div class='keyBall' style='background-color: " + demographicMap[metric][demographic][1] + ";'>&nbsp;</div><div class='keyItemText'>"  + demographicMap[metric][demographic][0] + "</div>");
			}
		}
	}

	html += "</td></tr></table>";
	
	if (["tongues", "wardwords", "occupation", "wardwork"].indexOf(metric) > -1)
	{
		html += "<div id='keyItemExtra'><div class='keyBall' style='background-color: #ffffff;'>&nbsp;</div>";
		var first = true;
		for (demographic in demographicMap[metric])
		{
			if (demographicMap[metric][demographic][1] !== undefined && demographicMap[metric][demographic][1] === "#ffffff")
			{
				if (!first) { html += ", "; } else { first = false; }
				html += demographicMap[metric][demographic][0];
			}
		}
		html += "</div>";
	}
	if (["tongues", "wardwords", "occupation", "wardwork", "livesontheline", "houseprices", "housepricesdiff"].indexOf(metric) > -1)
	{
		html += "<div id='additionalText'>" + demographicInfo[metric]["additional"] + "</div>";		
	}
		
	$("#linekey").html(html);
	
	for (var i in features)
	{	
		var priLineDrawn = false;
		var secLineDrawn = false;
		var terLineDrawn = false;
		
		var lines = features[i].get('lines');
		for (var j in lines)
		{
			if (!lines[j].hide)		
			{
					var priLine = features[i].clone();
					//priLine.setId(features[i].get('id') + lines[j].name);
					priLine.set('strokeColor', features[i].get('lines')[j].colour);
					priLine.set('strokeWidth', 1.5);
					priLine.set('strokeLinecap', "butt");		
					layerLines.getSource().addFeature(priLine);	
			}
		}
		for (var j in lines)
		{
			if (!lines[j].hide)		
			{
				if (!priLineDrawn)
				{
					var priLine = features[i].clone();
					priLine.setId(features[i].get('id') + lines[j].name);
					priLine.set('strokeColor', features[i].get('lines')[j].colour);
					priLine.set('strokeWidth', 3);					
					priLine.set('strokeDashstyle', [4, 0]);
					//priLine.set('strokeDashstyle', [0.1, 3.9]);
					priLine.set('strokeLinecap', "square");		
					layerLines.getSource().addFeature(priLine);	
					priLineDrawn = true;	
				}
				else if (!secLineDrawn)
				{
					var secLine = features[i].clone();
					secLine.setId(features[i].get('id') + lines[j].name);
					secLine.set('strokeColor', features[i].get('lines')[j].colour);	
					secLine.set('strokeWidth', 3);
					secLine.set('strokeDashstyle', [1, 7]);
					//secLine.set('strokeDashstyle', [0.1, 7.9]);
					secLine.set('strokeLinecap', "square");
					layerLines.getSource().addFeature(secLine);
					secLineDrawn = true;
				}
				else if (!terLineDrawn)
				{
					var terLine = features[i].clone();
					terLine.setId(features[i].get('id') + lines[j].name);
					terLine.set('strokeColor', features[i].get('lines')[j].colour);	
					terLine.set('strokeWidth', 3);
					terLine.set('strokeDashstyle', [1, 11]);
					//terLine.set('strokeDashstyle', [0.1, 11.9]);
					terLine.set('strokeLinecap', "square");
					layerLines.getSource().addFeature(terLine);
					terLineDrawn = true;
				}			
			}
		}
	}
	
	/*
	var featuresToDraw = layerLines.getSource().getFeatures();
	for (var k in featuresToDraw)
	{
		//Additional properties for GIS styling.
		var rgb_arr = hex2rgb(featuresToDraw[k].get('strokeColor'));

		if (rgb_arr[0] == 0)
		{
			rgb_arr[0] = 1;
		}
		if (rgb_arr[1] == 0)
		{
			rgb_arr[1] = 1;
		}
		if (rgb_arr[2] == 0)
		{
			rgb_arr[2] = 1;
		}
		featuresToDraw[k].set('rgbStrokeColor', "" + rgb_arr[0] + "," + rgb_arr[1] + "," + rgb_arr[2] + ",255");	
		featuresToDraw[k].set('rgbRed', rgb_arr[0]);	
		featuresToDraw[k].set('rgbGreen', rgb_arr[1]);	
		featuresToDraw[k].set('rgbBlue', rgb_arr[2]);	
	
	}
	*/
	/* console.log("<svg>" + layerPoints.renderer.root.innerHTML + "</svg>"); */
	
}

function requestData()
{
	/*
	if ($("#themetric").val() == "map")
	{
		handleMetricChange();
		return;
	}
	*/

	$.ajax(
	{
    	url: 'data/stats.json',
    	success: function(data) 
    	{
	      	handleData(data);
    	},
    	dataType: 'json',
    	async:true
  	});
}

function requestOSIData()
{
	$.ajax(
	{
    	url: 'data/osis.json',
    	success: function(data) 
    	{
	      	handleOSIData(data);
    	},
    	dataType: 'json',
    	async:true
  	});
}

function requestDemographicData()
{
	$.ajax(
	{
    	url: "data/" + demographicInfo[$("#themetric").val()]["file"],
    	success: function(data) 
    	{
	      	handleDemographicData(data);
    	},
    	dataType: 'json',
    	async:true
  	});
}

function requestODData()
{
	odRequested = true;
	$.ajax(
	{
    	url: "data/rods_od.csv",
    	success: function(data) 
    	{
	      	handleODData(data);
    	},
    	async:true
  	});
}


function handleData(data)
{
	var features = layerPoints.getSource().getFeatures();
	for (var i in data)
	{
		for (var j in features)
		{
			if (features[j].get('tfl_statid') == i || features[j].get('tfl_intid') == i)
			{
				if (features[j].get('yeardata') !== undefined)
				{
					/* Merge the two objects together. */
					var yeardata = features[j].get('yeardata');
					for (var year in data[i]) 
					{ 
						yeardata[year] = data[i][year];
					}
					features[j].set('yeardata', yeardata);
				}
				else
				{
					features[j].set('yeardata', data[i]); 
				}
				data[i].populated = true;
				break;
			}
		}	
	}
	
	for (var i in data)
	{
		if (!data[i].populated)
		{
			/* console.log(i); TODO Should not output anything here. */
		}
		delete data[i].populated;
	}

	for (var i in features)
	{		
		features[i].set('toHereCount', 0);
	}
	
	handleMetricChange();
}

function handleOSIData(data)
{
	osis = data;
	processOSIs();
}

function processOSIs()
{
	layerOSICore.getSource().clear();

	if ($('#themetric').val() != 'map')
	{
		return;		
	}
	var source = layerPoints.getSource();
	var osiYear = $('#year').val();
	
	layerOSICore.getSource().clear();
	
	if (!osis[osiYear])
	{
		return;
	}
	
	for (var pair in osis[osiYear])
	{
		var start = osis[osiYear][pair][0];
		var end = osis[osiYear][pair][1];
		var geom = new ol.geom.LineString([ source.getFeatureById(start).getGeometry().getCoordinates(), source.getFeatureById(end).getGeometry().getCoordinates()]);
		var feature = new ol.Feature({ geometry: geom});
		if (source.getFeatureById(start).get('fillColor') != 'rgba(0, 0, 0, 0)' && source.getFeatureById(end).get('fillColor') != 'rgba(0, 0, 0, 0)')
		{
			layerOSICore.getSource().addFeature(feature);		
		}
	}

}

function handleDemographicData(data)
{
	var val = $("#themetric").val();
	demographicData[val] = data;
	handleChange();
}

function handleODData(dataText)
{
	console.log(dataText);
	var rows = dataText.split('\n')
	var header = rows[0];
	headerArr = header.split(',');

	var ignore = ["Unfinished", "Grand Total"];

	for (var i = 1; i < rows.length; i++)
	{
		
		rowArr = rows[i].split(',');
		var rowYear = rowArr[0];
		var rowName = rowArr[1];
		var matched = false;
		var features = layerPoints.getSource().getFeatures();
		for (var j in features)
		{
			if (features[j].get('tfl_intid') == rowName)
			{
				matched = true;
				if (features[j].get('flows') === undefined)
				{
					features[j].set('flows', new Array());
				}
				for (var k = 2; k < rowArr.length; k++)
				{
					if (rowArr[k] > 0 && ignore.indexOf(headerArr[k]) < 0)
					{
						var flows = features[j].get('flows');

						if (flows[rowYear] === undefined)
						{
							flows[rowYear] = new Array();
						}						
						if (flows[rowYear][headerArr[k]] === undefined)
						{
							flows[rowYear][headerArr[k]] = 0;
						}
						flows[rowYear][headerArr[k]] += parseInt(rowArr[k]); 
						features[j].set('flows', flows);
					}
				}
			}
		}
		if (!matched) { 
			//console.log("Ignoring data for journeys from: " + rowName); 
		}
	}
	showDefaultJourney();
	handleChange();
}

function showDefaultJourney()
{
	if (selectClick.getFeatures().getLength() == 0)
	{
		var features = layerPoints.getSource().getFeatures();
		for (var j in features)
		{
			features[j].set('toHereCount', 0);
		}		
		$("#info").css('display', 'none');
		$("#info").html("");
		console.log(features[defaultJourneyStart]);
		selectClick.getFeatures().push(features[defaultJourneyStart]);
	}
	else
	{
		updateSelectedInfo();
	}	
}

function resetDisplay()
{
	if ($("#themetric").val() == "journeys")
	{
		var features = layerPoints.getSource().getFeatures();
		for (var i in features)
		{
			features[i].set('fillColor', "#ffffff");					
			if (features[i].get('flows') !== undefined)
			{
				features[i].set('radius', 10);
			} 	
			else
			{
				features[i].set('fillColor', 'rgba(0,0,0,0)');
				features[i].set('strokeColor', 'rgba(0,0,0,0)');
			}
			features[i].changed();
		}
	}
}

function switchPoints()
{
	console.log('switchPoints');
	if (pointsLoaded == "wards")
	{
		layerPoints.setSource(pointSource);
		layerPointsCase.setSource(pointSource);
		pointsLoaded = "stations";
	}
	else
	{
		layerPoints.setSource(pointSource2);
		layerPointsCase.setSource(pointSource2);
		pointsLoaded = "wards";
	}
	layerPoints.changed();
	layerPointsCase.changed();
	selectClick.getFeatures().clear();
}	

function toggleEnglish()
{
	if (showEnglish)
	{
		
		showEnglish = false;
	}
	else
	{
		showEnglish = true;
	}
	handleChange();
}

function handleMetricChange()
{
	var metric = $("#themetric").val();

	if ((pointsLoaded == "wards" && ["wardwords", "wardwork"].indexOf(metric) == -1) || (pointsLoaded != "wards" && ["wardwords", "wardwork"].indexOf(metric) > -1))
	{
		switchPoints();
	}

	if (["wardwords", "wardwork"].indexOf(metric) > -1)
	{
		$("#linesCB").prop('checked', false);
		toggleLines();	
	}
	else
	{
		$("#linesCB").prop('checked', true);
		toggleLines();		
	}

	if ((["tongues", "wardwords", "occupation", "wardwork", "livesontheline", "houseprices", "housepricesdiff"].indexOf(metric) > -1) && demographicData[metric] === undefined)
	{
		requestDemographicData();
		return;
	}
	
	if (metric == "journeys")
	{
		if (!odRequested)
		{
			requestODData();
		}
		else
		{
			showDefaultJourney();
		}
	}
	
	handleChange();
}

function handleZoom()
{
	key1map.getView().setZoom(olMap.getView().getZoom());
	key2map.getView().setZoom(olMap.getView().getZoom());
	updateUrl();
}

function handleChange()
{
	/* console.log('handleChange'); */
	/* Needed in case we hide/show lines based on the newly selected options. */
	var metric = $("#themetric").val();
	
	if (metric == "closures")
	{
		window.location = "/closures/";
		return;
	}
	
	if (metric == "night")
	{
		$("body").css('backgroundColor', '#0c0c00');
	}
	else if (metric == "livesontheline")
	{
		$("body").css('backgroundColor', '#fff8f8');
	}
	else
	{
		$("body").css('backgroundColor', '#fff8f8');	
	}
	
	if (["wardwords", "tongues"].indexOf(metric) > -1)
	{
		$("#englishB").css('display', 'inline');
	}
	else
	{
		$("#englishB").css('display', 'none');
	}
	
	var scalingFactor = 0.4;
	$("#year").prop('disabled', false);
	$("#yearcomp").prop('disabled', false);
	$('#title').html("Station Entry/Exit Volumes");		
	
	if (metric == "journeys")
	{
		if ($("#year").val() > 2016)
		{
			$("#year").val(2016);
		}
		else if ($("#year").val() < 2012)
		{
			$("#year").val(2012);		
		}
		else if ($("#year").val() == 2013)
		{
			$("#year").val(2014);	
		}
		
		if ($("#yearcomp").val() > 2016)
		{
			$("#yearcomp").val(2016);
		}
		else if ($("#yearcomp").val() < 2012)
		{
			$("#yearcomp").val(2012);		
		}		
		else if ($("#yearcomp").val() == 2014)
		{
			$("#yearcomp").val(2014);	
		}

		$('#title').html("Journey Destinations");		
		//$("#year").prop('disabled', true);
		//$("#yearcomp").val('none');
		//$('#yearcomp').prop('disabled', true);		
		scalingFactor = 1.6;
	}
	else if (metric == "am_inout")
	{
		if ($("#year").val() > 2016)
		{
			$("#year").val(2016);
		}
		//$("#year").prop('disabled', true);
		$("#yearcomp").val('none');
		$('#yearcomp').prop('disabled', true);		
	}
	else if (metric == "wdwe_out")
	{
		if ($("#year").val() > 2016)
		{
			$("#year").val(2016);
		}
		//$("#year").prop('disabled', true);
		$("#yearcomp").val('none');
		$('#yearcomp').prop('disabled', true);	
		scalingFactor = 0.2;	
	}
	else if (["tongues", "wardwords", "wardwork", "occupation", "livesontheline", "houseprices", "housepricesdiff"].indexOf(metric) > -1)
	{
		if ($("#year").val() < 2011)
		{
			$("#year").val(2011);
		}
		
		if (["wardwords", "wardwork"].indexOf(metric) > -1)
		{
			$("#year").val(2011);
			$("#year").prop('disabled', true);
		}
		if (["livesontheline", "houseprices", "housepricesdiff"].indexOf(metric) > -1)
                {
                        $("#year").val(2019);
                        $("#year").prop('disabled', true);
                }
		
		$("#yearcomp").val('none');
		$('#yearcomp').prop('disabled', true);
		$('#title').html(demographicInfo[metric]["title"] + "<div style='font-size: 16px;'>" + demographicInfo[metric]["subtitle"] + "</div>");		
		document.title = demographicInfo[metric]["title"];		
		scalingFactor = demographicInfo[metric]["scale"];
	}
	else if (metric == "map")
	{
	    //$("#year").val(2015);
		$("#yearcomp").val('none');
		//$('#year').prop('disabled', true);		
		$('#yearcomp').prop('disabled', true);	
		scalingFactor = 15;
		$('#title').html("Geographical Tube Map");		
	
	}
	else if (metric == "night")
	{
	    $("#year").val(2017);
		$("#yearcomp").val('none');
		$('#year').prop('disabled', true);		
		$('#yearcomp').prop('disabled', true);	
		scalingFactor = 15;
		$('#title').html("Night Tube Map");		
	
	}
	else if (metric == 'total')
	{
		console.log($("#year").val());
		if (!$("#year").val() || $("#year").val() == 'none')
                {
                        $("#year").val(2016);
                }
		if ($("#year").val() > 2016)
		{
			$("#year").val(2016);		
		}
		scalingFactor = 0.01;
	}
	else
	{
		if ($("#year").val() == 'none' || $("#year").val() > 2016)
		{
			$("#year").val(2016);		
		}	
	}

	processLines();	
	resetDisplay();

	var year = $("#year").val();
	var yearcomp = $("#yearcomp").val();

	if (selectClick.getFeatures().getLength() > 0)
	{
		updateSelectedInfo();
	}
	
	var features = layerPoints.getSource().getFeatures();
	for (var i in features)
	{
		var feature = features[i];
		var show = false;
		for (var j in feature.get('lines'))
		{
			if ((feature.get('lines')[j].opened === undefined || feature.get('lines')[j].opened <= $("#year").val()) && 
					(feature.get('lines')[j].closed === undefined || feature.get('lines')[j].closed >= $("#year").val()))
			{
				if (serviceFilter !== undefined)
				{
					if (feature.get('lines')[j].name == serviceFilter)
					{
						show = true;
					}
				}
				else
				{
					show = true;
				}
			}
		}
		if (metric == "night" && !feature.get('night'))
		{
			show = false;
		}

		if (feature.get('lines') === undefined) //Ward words etc
		{
			show = true;
		}
		
		if (show)
		{
			features[i].set('radius', 0);
			features[i].set('fillColor', '#ffffff');
			features[i].set('strokeColor', "#000000");
			features[i].set('datalabel', "");
			features[i].set('geolabel', "");
            features[i].set('labelcolor', undefined);
			features[i].set('offsetX', undefined);
			features[i].set('offsetY', undefined);				
			features[i].set('strokeWidth', 4);
			if (metric == "livesontheline" || metric == "houseprices" || metric ==  "housepricesdiff")
			{
				if (features[i].get('cartography') && ['display_name'])
				{
					features[i].set('geolabel', features[i].get('cartography')['display_name']);								
				}
				else
				{
					features[i].set('geolabel', features[i].get('name'));				
				}
                features[i].set('offsetX', 1.5*features[i].get('cartography')['labelX']);
                features[i].set('offsetY', 1.5*features[i].get('cartography')['labelY']);
			}
	
			if (metric == "map" || metric == "night")
			{			
				features[i].set('radius', scalingFactor/1.1);	
				//features[i].set('strokeWidth', 2);			
				features[i].set('fillColor', "#ffffff");
				
				if (features[i].get('cartography')['display_name'])
				{
					features[i].set('geolabel', features[i].get('cartography')['display_name']);								
				}
				else
				{
					features[i].set('geolabel', features[i].get('name'));				
				}
				features[i].set('offsetX', features[i].get('cartography')['labelX']);
				features[i].set('offsetY', features[i].get('cartography')['labelY']);				
				
				var lineCount = 0;
				var colour = "";
				if (linesForKey !== undefined)
				{
					for (var j in feature.get('lines'))
					{
						if ((feature.get('lines')[j].opened === undefined || feature.get('lines')[j].opened <= $("#year").val()) && 
								(feature.get('lines')[j].closed === undefined || feature.get('lines')[j].closed >= $("#year").val()))
						{
							lineCount++;
							colour = linesForKey[feature.get('lines')[j].name];
						}
					}
					
					if (lineCount == 1)
					{
						//features[i].set('radius', parseInt(scalingFactor/1.1));		
						//features[i].set('strokeWidth', 2);	 
					
						//We might get here before the lines are loaded in (which have the colour information). So don't colour the circles.
						if (colour)
						{
							features[i].set('strokeColor', colour);			
						}
					}
				}
				//features[i].set('label', features[i].getId());
			}
			else if (metric == "journeys")
			{
				if (features[i].get('flows') !== undefined)
				{
					features[i].set('radius', 10);
					features[i].set('fillColor', "#ffffff");					
				} 	
				if (features[i].get('toHereCount') > 0)
				{
					features[i].set('radius', Math.sqrt(features[i].get('toHereCount')) * scalingFactor);
					features[i].set('fillColor', "#ffaa00");								
				}	
				if (features[i].get('toHereCount') < 0)
				{
					features[i].set('radius', Math.sqrt(-1*features[i].get('toHereCount')) * scalingFactor);
					features[i].set('fillColor', "#ff0000");								
				}	
				if (selectClick.getFeatures().getLength() > 0)
				{
					selectClick.getFeatures().item(0).set('fillColor', '#00ff00');
					selectClick.getFeatures().item(0).set('radius', 20);
				}
			}
			else if (["tongues", "wardwords", "occupation", "wardwork"].indexOf(metric) > -1)
			{
				if (demographicData[metric][features[i].get('tfl_intid')] !== undefined)
				{
					var stats = demographicData[metric][features[i].get('tfl_intid')];
					var totalpop = stats.c001;
				
					var max = -Infinity, x, max_cap;
					for( x in stats) {
						if( stats[x] > max && x != "c001")
						{
							max = stats[x];
							max_cap = x;
						}
					}
					var max2 = -Infinity, x2, max_cap2;
					for(x2 in stats) 
					{
						if( stats[x2] > max2 && x2 != max_cap  && x2 != "c001")
						{
							max2 = stats[x2];
							max_cap2 = x2;
						}
					}				
				
					//For tongues, we care about the second most popular, not first.
					if ((metric == "tongues" || metric == "wardwords") && !showEnglish) //TODO Include first if first is not English.
					{
						max = max2;
						max_cap = max_cap2;
					}

					var ratio = max/(totalpop*1.0)
				
					features[i].set('radius', scalingFactor*Math.sqrt(ratio));
					if (demographicMap[metric][max_cap] !== undefined && ratio > demographicInfo[metric]['infolimit'])
					{
						features[i].set('fillColor', demographicMap[metric][max_cap][1]);	
						features[i].set('datalabel', demographicMap[metric][max_cap][0]);
					}
					else
					{
						features[i].set('fillColor', "#aaaaaa");
						features[i].set('datalabel', '');					
						if (!demographicMap[metric][max_cap])
						{
							console.log(max_cap);							
						}
					}
					features[i].set('strokeWidth', 4);					
				}
			}
			else if (metric == "livesontheline")
			{
				var stats = demographicData[metric][features[i].get('id')];
				features[i].set('radius', scalingFactor*0.15); 
				features[i].set('labelcolor', demographicMap[metric][stats][1]);
                features[i].set('datalabel', '' + stats);
		        features[i].set('strokeWidth', 2.2);
			}
			else if (metric == "houseprices")
			{
				var stats = demographicData[metric][features[i].get('id')];
				if (stats)
				{
					//features[i].set('radius', scalingFactor*Math.sqrt(stats[1])*0.02); 
					features[i].set('radius', scalingFactor*0.15); 
					/* if (stats[1] == "100")
					{
						stats[1] = "100+";
					} */
					features[i].set('geolabel', features[i].get('geolabel') + "\n(" + stats[1] + ")"); 
					//features[i].set('labelcolor', "000000");	
					ratio = ((stats[0]-250000.0)/750000.0)	
					if (ratio < 0) { ratio = 0; }
					if (ratio > 1) { ratio = 1; } 
					features[i].set('labelcolor', getGBRColour(ratio));
					//features[i].set('labelcolor', demographicMap[metric][stats][1]);
					features[i].set('datalabel', '' + 10*parseInt(stats[0]/10000.00));
					features[i].set('strokeWidth', 2.4);
				}
				else
				{
					features[i].set('radius', scalingFactor*0.07); 
					features[i].set('labelcolor', "#000000");				
					//features[i].set('labelcolor', demographicMap[metric][stats][1]);
					features[i].set('datalabel', '');
					features[i].set('strokeWidth', 2.4);				
				}
				if (olMap.getView().getZoom() < 13)
				{
					features[i].set('geolabel', '');
				} 

			}
			else if (metric == "housepricesdiff")
			{
				var stats = demographicData[metric][features[i].get('id')];
				if (stats)
				{
					//features[i].set('radius', scalingFactor*Math.sqrt(stats[1])*0.02); 
					features[i].set('radius', scalingFactor*0.15); 
					/* if (stats[1] == "100")
					{
						stats[1] = "100+";
					} */
					features[i].set('geolabel', features[i].get('geolabel') + "\n(" + stats[1] + ")"); 
					//features[i].set('labelcolor', "000000");	
					ratio = ((stats[0]+50000.0)/100000.0)	
					if (ratio < 0) { ratio = 0; }
					if (ratio > 1) { ratio = 1; } 
					features[i].set('labelcolor', getGWRColour(1-ratio));
					//features[i].set('labelcolor', demographicMap[metric][stats][1]);
					features[i].set('datalabel', '' + 1*parseInt(stats[0]/1000.00));
					features[i].set('strokeWidth', 2.4);
				}
				else
				{
					features[i].set('radius', scalingFactor*0.07); 
					features[i].set('labelcolor', "#000000");				
					//features[i].set('labelcolor', demographicMap[metric][stats][1]);
					features[i].set('datalabel', '');
					features[i].set('strokeWidth', 2.4);				
				}
				if (olMap.getView().getZoom() < 13)
				{
					features[i].set('geolabel', '');
				} 

			}
			else if (metric == "am_inout" && year != "none")
			{
				if (features[i].get('yeardata') !== undefined
					&& features[i].get('yeardata')[year] !== undefined)
				{
					var entry = features[i].get('yeardata')[year]['i_w_apk'];
					var exit = features[i].get('yeardata')[year]['o_w_apk'];
					var value = entry+exit
					var ratio = exit*1.0/(entry*1.0+exit*1.0);
					features[i].set('radius', scalingFactor*Math.sqrt(value));
					features[i].set('fillColor', getGWRColour(ratio));
					/* console.log(ratio); */
				}		
			}
			else if (metric == "wdwe_out" && year != "none")
			{
				if (features[i].get('yeardata') !== undefined
					&& features[i].get('yeardata')[year] !== undefined)
				{
					var wdexit = features[i].get('yeardata')[year]['o_w_t'];
					var weexit = features[i].get('yeardata')[year]['o_sa'];
					var value = wdexit+weexit
					var ratio = weexit*1.0/(wdexit*1.0+weexit*1.0);
					features[i].set('radius', scalingFactor*Math.sqrt(value));
					features[i].set('fillColor', getGWRColour(ratio));
					/* console.log(ratio); */
				}		
			}
			else if (year != "none" && yearcomp != "none")
			{
				if (features[i].get('yeardata') !== undefined && features[i].get('yeardata')[year] !== undefined)
				{
					var value = features[i].get('yeardata')[year][metricKey[metric]];
					var compvalue = 0;
					if (features[i].get('yeardata')[yearcomp] !== undefined)
					{
						compvalue = features[i].get('yeardata')[yearcomp][metricKey[metric]];
					}		
					var diffvalue = value - compvalue;
					if (diffvalue > 0)
					{
						features[i].set('strokeColor', "#008800");					
					}
					else
					{
						features[i].set('strokeColor', "#FF0000");
						diffvalue = -diffvalue;
					}
					features[i].set('radius', scalingFactor*Math.sqrt(diffvalue));
				}
		
			}
			else if (year != "none")
			{
				if (features[i].get('yeardata') !== undefined
					&& features[i].get('yeardata')[year] !== undefined)
				{
					var value = features[i].get('yeardata')[year][metricKey[metric]];
					features[i].set('radius', scalingFactor*Math.sqrt(value));
				}
			}
		}
		else
		{
			features[i].set('fillColor', "rgba(0, 0, 0, 0)");
			features[i].set('strokeColor', "rgba(0, 0, 0, 0)");
			features[i].set('datalabel', "");
			features[i].set('geolabel', "");
		}		
	}
	
	processOSIs();

	/*
	for (var i in features)
	{		
		//Additional properties for GIS styling.
		features[i].set('sizeArea', features[i].get('radius') * features[i].get('radius'));
		var rgb_arr = hex2rgb(features[i].get('fillColor'));
		features[i].set('rgbFillColor', "'" + rgb_arr[0] + "," + rgb_arr[1] + "," + rgb_arr[2] + ",255'");	
		if (rgb_arr[0] == 0)
		{
			rgb_arr[0] = 1;
		}
		if (rgb_arr[1] == 0)
		{
			rgb_arr[1] = 1;
		}
		if (rgb_arr[2] == 0)
		{
			rgb_arr[2] = 1;
		}
		features[i].set('rgbRed', rgb_arr[0]);	
		features[i].set('rgbGreen', rgb_arr[1]);	
		features[i].set('rgbBlue', rgb_arr[2]);	
		features[i].changed();
	} 
	*/
	
	var caption;
	var fills = ["#ffffff", "#ffffff", "#ffffff"];
	var strokes = ["#000000", "#000000", "#000000"];
	var labelcolours = ["#000000", "#000000", "#000000"];
	var strokeWidths = [3, 3, 3];
	var labels = ["", "", ""];
		
	if (metric == "journeys")
	{
		values = [1000, 50]
		caption = "<table class='keycaptiontable'><tr><td>" + values[0] + " journeys end here (red=down)</td><td>Other station (no journeys end here)</td></tr></table><i>Select a station to see journeys<br />that start at it.</i>";
		fills = ["#ffaa00", "#ffffff"]
		strokeWidths[0] = 8;
	}

	else if (metric == "am_inout")
	{
		values = [10000, 10000]
		caption = "<table class='keycaptiontable'><tr><td>" + values[0] + "&nbsp;entries, 0 exits</td><td>" + values[1]/4 + " entries, " + 3*values[1]/4 + " exits</td></tr></table>";
		fills = ["#00ff00", "#ff8888"]
	}
	else if (metric == "wdwe_out")
	{
		values = [10000, 10000]
		caption = "<table class='keycaptiontable'><tr><td>" + values[0] + "&nbsp;weekday exits, 0 weekend exits</td><td>" + values[1]/4 + " weekday exits, " + 3*values[1]/4 + " weekend exits</td></tr></table>";
		fills = ["#00ff00", "#ff8888"]
	}
	else if (["tongues", "occupation", "wardwords", "wardwork"].indexOf(metric) > -1)
	{
		var key = demographicInfo[metric]["defaultkey"];
		values = [0.05, 0.10]
		caption = "<table class='keycaptiontable'><tr><td>5%</td><td>10%</td></tr><tr><td colspan='2'>" + demographicInfo[metric]["keyexample"]+ "</td></tr></table>";
		fills = [demographicMap[metric][key][1], demographicMap[metric][key][1]]
		strokeWidths = [4, 4];
		labels = [demographicMap[metric][key][0], demographicMap[metric][key][0]]
	
	}
	else if ("livesontheline" == metric)
	{
		var key = demographicInfo[metric]["defaultkey"];
		values = [0.023, 0.023];
		caption = demographicInfo[metric]["keyexample"];
		fills = ['#ffffff', '#ffffff'];
		labelcolours = [demographicMap[metric][75][1], demographicMap[metric][90][1]];
		strokeWidths = [2.2, 2.2];
		labels = [demographicMap[metric][75][0], demographicMap[metric][90][0]];
	}
	else if ("houseprices" == metric)
	{
		var key = demographicInfo[metric]["defaultkey"];
		values = [0.025, 0.025];
		caption = demographicInfo[metric]["keyexample"];
		fills = ['#ffffff', '#ffffff'];
		labelcolours = [getGBRColour(0), getGBRColour(1)];
		strokeWidths = [2.6, 2.6];
		labels = ["250", "1000"];
	
	}
	else if ("housepricesdiff" == metric)
	{
		var key = demographicInfo[metric]["defaultkey"];
		values = [0.025, 0.025];
		caption = demographicInfo[metric]["keyexample"];
		fills = ['#ffffff', '#ffffff'];
		labelcolours = [getGWRColour(1), getGWRColour(0)];
		strokeWidths = [2.6, 2.6];
		labels = ["-50", "50"];
	
	}
	else if (metric == "map" || metric == "night")
	{
		var values = [0.7, 0.7]
		caption = "Station, Multiple-line station";
	}
	else if (metric == "total")
	{
		var values = [1000000, 20000000]
		caption = "<table><tr><td>" + values[0]/1000000 + "M entries & exits</td><td>" + values[1]/1000000 + "M entries & exits</td></tr></table>";
		if (yearcomp != "none")
		{	
			caption = "<table class='keycaptiontable'><tr><td>" + values[0]/1000000 + "M more entries & exits</td><td>" + values[1]/1000000 + "M fewer entries & exits</td></tr></table>";
			strokes = ["#008800", "#FF0000", "#008800"]
		}
	}
	else 
	{
		var values = [1000, 5000]
		if (yearcomp != "none")
		{	
			caption = "<table class='keycaptiontable'><tr><td>" + values[0] + " more entries</td><td>" + values[1] + " fewer entries</td></tr></table>";		
			if (metric.substr(metric.length - 4) == "_out")
			{
				caption = "<table class='keycaptiontable'><tr><td>" + values[0] + " more exits</td><td>" + values[1] + " fewer exits</td></tr></table>";
			}
			strokes = ["#008800", "#FF0000"]
		}
		else
		{
			caption = "<table class='keycaptiontable'><tr><td>" + values[0] + " entries</td><td>" + values[1] + " entries</td></tr></table>";		
			if (metric.substr(metric.length - 4) == "_out")
			{
				caption = "<table class='keycaptiontable'><tr><td>" + values[0] + " exits</td><td>" + values[1] + " exits</td></tr></table>";		
			}	
		}
	}
	
	var point1 = new ol.Feature({ geometry: new ol.geom.Point([0, 0]) });
	point1.set('fillColor', fills[0]);
	point1.set('strokeWidth', strokeWidths[0]);
	point1.set('strokeColor', strokes[0]);
	point1.set('labelcolor', labelcolours[0]);
	point1.set('radius', scalingFactor*Math.sqrt(values[0]));
	point1.set('datalabel', labels[0]);

	var point2 = new ol.Feature({ geometry: new ol.geom.Point([0, 0]) });
	point2.set('fillColor', fills[1]);
	point2.set('strokeWidth', strokeWidths[1]);
	point2.set('strokeColor', strokes[1]);
	point2.set('labelcolor', labelcolours[1]);
	point2.set('radius', scalingFactor*Math.sqrt(values[1]));
	point2.set('datalabel', labels[1]);

	key1source.clear();
	key1source.addFeatures([point1]); 
	key2source.clear();
	key2source.addFeatures([point2]); 
	$("#key1text").html(caption);	

	updateUrl();
	
}

function updateSelectedInfo()
{
	var feature = selectClick.getFeatures().item(0);

	var htmlstr = "<div style='font-size: 28px;' title='" + feature.getId() + "'>" + feature.get('name') + "</div>"
	htmlstr += "<div>Zone " + feature.get('zone') + "</div>"; 
 	htmlstr += "<div style='padding: 10px 0;'>";
	var metric = $("#themetric").val();
	
	if (feature.get('lines') != undefined && linesForKey != undefined)
	{
		for (var j = 0; j < feature.get('lines').length; j++)
		{
			var dates = "";
			if (feature.get('lines')[j].opened)
			{
				dates += feature.get('lines')[j].opened + "-";
			}
			if (feature.get('lines')[j].closed)
			{
				if (dates == "")
				{
					dates += "-";
				}
				dates += feature.get('lines')[j].closed;
			}
			if ((feature.get('lines')[j].opened === undefined || feature.get('lines')[j].opened <= $("#year").val()) && 
				(feature.get('lines')[j].closed === undefined || feature.get('lines')[j].closed >= $("#year").val()))
			htmlstr += "<div class='keyCircle' style='background-color: " 
				+ linesForKey[feature.get('lines')[j].name] + ";'>"
				+ serviceFilterCodes[feature.get('lines')[j].name] 
				+ "<div style='margin: 10px 0; font-size: 9px;'>" 
				+ dates
				+ "</div></div>";		 	
		}
		htmlstr += "</div><br style='clear: both;'>";
	}
	if (metric == "journeys")
	{
		htmlstr += "<h3>Top 20 journeys from this station<br />typical day (RODS data)</h3>";

		/* Reset from previous population. */
		var features = layerPoints.getSource().getFeatures();
		for (var j in features)
		{
			features[j].set('toHereCount', 0);
		}

		if (feature.get('flows'))
		{
			if ($("#year").val() != $("#yearcomp").val())
			{
				var flows = feature.get('flows')[$("#year").val()];
				var compflows = feature.get('flows')[$("#yearcomp").val()];
				for (var toStationName in flows)
				{
					var matched = false;
					for (var j in features)
					{
						if (features[j].get('tfl_intid') == toStationName)
						{
							matched = true;
							if (flows[toStationName] > 0 || (compflows !== undefined && compflows[toStationName] > 0))
							{
								var newflows = flows[toStationName];
								if (newflows === undefined)
								{
									newflows = 0;
								}

								var oldflows = 0;
								if (compflows !== undefined && compflows[toStationName] !== undefined)
								{
									oldflows = compflows[toStationName];
								}
								features[j].set('toHereCount', features[j].get('toHereCount') + newflows - oldflows);
							}
						}
					}
					if (!matched) { console.log("Ignoring data for journeys ending at: " + toStationName); }
				}
			
			}
			else
			{
				var flows = feature.get('flows')[$("#year").val()];
				for (var toStationName in flows)
				{
					var matched = false;
					for (var j in features)
					{
						if (features[j].get('tfl_intid') == toStationName)
						{
							matched = true;
							if (flows[toStationName] > 0)
							{
								features[j].set('toHereCount', features[j].get('toHereCount') + flows[toStationName]);
							}
						}
					}
					if (!matched) { console.log("Ignoring data for journeys ending at: " + toStationName); }
				}
			}
		
			/* Set up HTML table. */
			var tuples = [];

			var features = layerPoints.getSource().getFeatures();
			for (var j in features) tuples.push([features[j].get('name'), features[j].get('toHereCount'), features[j].get('lines')]);

			tuples.sort(function(a, b) {
				a = a[1];
				b = b[1];

				return a < b ? 1 : (a > b ? -1 : 0);
			});

			htmlstr += "<div style='height: 180px; overflow-y: scroll;'><table>";
			for (var i = 0; i < tuples.length; i++) 
			{
				var key = tuples[i][0];
				var value = tuples[i][1];
				if (value > 0) 
				{
					htmlstr += "<tr><td style='font-size: 12px;'>" + key + "</td><td>&nbsp;</td><td>";
					for (var j = 0; j < tuples[i][2].length; j++)
					{
						htmlstr += "<div class='keyBall' style='background-color: " + linesForKey[tuples[i][2][j].name] + ";'>&nbsp;</div>";		 	
					}
				
					htmlstr += "</td><th style='font-size: 12px;'>" + value + "</th></tr>";
				}
				if (i == 19) { break; }
			}
		
			htmlstr += "</table></div>";		
		}
		else
		{
			//Defer. We call this again once the OD data is actually in.
		}		
	}
	else if (["tongues", "occupation", "wardwords", "wardwork"].indexOf(metric) > -1)
	{
		/* Set up HTML table. */
		var tuples = [];
		var sum = 0;

		for (var j in demographicData[metric][feature.get('tfl_intid')]) 
		{
			if (j != "c001")
			{
				tuples.push([j, demographicData[metric][feature.get('tfl_intid')][j]]);
			}
			else
			{
				sum = demographicData[metric][feature.get('tfl_intid')][j];
			}
		}
		tuples.sort(function(a, b) {
			a = a[1];
			b = b[1];

			return a < b ? 1 : (a > b ? -1 : 0);
		});

		htmlstr += "<div style='font-size: 18px;' title='Population: " + sum + "'>" + demographicInfo[metric]["subinfo"] + "</div></h1>";
		htmlstr += "<table id='keysubtable'>";
		for (var i = 0; i < tuples.length; i++) 
		{
			var key = tuples[i][0];
			var value = tuples[i][1];
			if (value > 0 && value/(sum*1.0) >= demographicInfo[metric]["infolimit"] && value >= demographicInfo[metric]["infolimit"]*1000) 
			{
				htmlstr += "<tr><td>";
				if ( demographicMap[metric][key] !== undefined)
				{
					htmlstr += "<div style='margin: 1px 5px; width: 10px; height: 10px; border-radius: 5px; background-color: " + demographicMap[metric][key][1] + ";'>&nbsp;</div><td>" + demographicMap[metric][key][0];
				}
				else
				{
					htmlstr += "</td><td>" + key;	
					console.log(key);		
				}
				htmlstr += "</td><td>" + Math.round(1000*(value/(sum*1.0)))/10.0 + "%</td></tr>";
			}
		}		
		htmlstr += "</table>";
	}
	else if (metric == "livesontheline" || metric == "houseprices" || metric == "housepricesdiff")
	{
		htmlstr += "</h1>" + demographicInfo[metric]["subinfo"];
	}
	else if (metric == "map" || metric == "night")
	{
		htmlstr += "</h1>";	
	}
	else
	{
		htmlstr += "<h3>Station Entries & Exits (Primary mode only)</h3></h1>";	
		htmlstr += "<table style='font-size: smaller;'><tr><th></th><th>Annual</th><th colspan='12'>Weekday</th><th colspan='2' rowspan='2'>Saturday</th><th colspan='2' rowspan='2'>Sunday</th></tr>";
		htmlstr += "<tr><th></th><th>Total</th><th colspan='2'>Total</th><th colspan='2'>Early</th><th colspan='2'>AM Peak</th><th colspan='2'>Interpeak</th><th colspan='2'>PM Peak</th><th colspan='2'>Evening</th></tr>";
		htmlstr += "<tr><th></th><th>(M)</th><th>Entry</th><th>Exit</th><th>Entry</th><th>Exit</th><th>Entry</th><th>Exit</th><th>Entry</th><th>Exit</th><th>Entry</th><th>Exit</th><th>Entry</th><th>Exit</th><th>Entry</th><th>Exit</th><th>Entry</th><th>Exit</th></tr>";
		var yeardata = feature.get('yeardata');

		if (yeardata !== undefined)
		{
			var keys = Object.keys(yeardata).sort();
			var prevyear = 0;
			/* console.log(keys); */
			for (var k in keys)
			{
				var year = keys[k];
				htmlstr += "<tr><th>" + year + "</th>" 
				+ compareValuesHTML(yeardata, "tf_yr", year, prevyear) 
				+ compareValuesHTML(yeardata, "i_w_t", year, prevyear) 
				+ compareValuesHTML(yeardata, "o_w_t", year, prevyear) 
				+ compareValuesHTML(yeardata, "i_w_pre", year, prevyear) 
				+ compareValuesHTML(yeardata, "o_w_pre", year, prevyear) 
				+ compareValuesHTML(yeardata, "i_w_apk", year, prevyear) 
				+ compareValuesHTML(yeardata, "o_w_apk", year, prevyear) 
				+ compareValuesHTML(yeardata, "i_w_mid", year, prevyear) 
				+ compareValuesHTML(yeardata, "o_w_mid", year, prevyear) 
				+ compareValuesHTML(yeardata, "i_w_ppk", year, prevyear) 
				+ compareValuesHTML(yeardata, "o_w_ppk", year, prevyear) 
				+ compareValuesHTML(yeardata, "i_w_eve", year, prevyear) 
				+ compareValuesHTML(yeardata, "o_w_eve", year, prevyear) 
				+ compareValuesHTML(yeardata, "i_sa", year, prevyear) 
				+ compareValuesHTML(yeardata, "o_sa", year, prevyear) 
				+ compareValuesHTML(yeardata, "i_su", year, prevyear) 
				+ compareValuesHTML(yeardata, "o_su", year, prevyear) 
				+ "</tr>";
				prevyear = year;
			}
		}	
		htmlstr += "</table>";
	}
		
	$("#info").html(htmlstr);
	$("#info").css('display', 'block');
}


function compareValuesHTML(yeardata, valIndex, year, prevyear)
{
	var number = yeardata[year][valIndex];
	var prevnumber = 0;
	
	if (yeardata[prevyear] !== undefined)
	{	
		prevnumber = yeardata[prevyear][valIndex];
	}
	if (number === undefined)
	{
		return "<td></td>";
	}
	if (valIndex == "tf_yr")
	{
		number = Math.round(number/10000.0)/100.0;			
		prevnumber = Math.round(prevnumber/10000.0)/100.0;		
	}
	if (prevyear == 0 || number == prevnumber)
	{ 
		return "<td>" + number + "</td>";
	}
	if (number > prevnumber)
	{
		return "<td style='color: #ccffcc;'>" + number + "</td>";
	}
	else
	{
		return "<td style='color: #ff4444;'>" + number + "</td>";	
	}
}

/* ****** Ad-hoc actions ****** */

function toggleBackground()
{
	if ($("#backgroundCB").prop('checked'))
	{
		layerBackground.setVisible(true);
	}
	else
	{
		layerBackground.setVisible(false);
	}	
	updateUrl();
}

function toggleAerial()
{
        if ($("#aerialCB").prop('checked'))
        {
                layerAerial.setVisible(true);
        }
        else
        {
                layerAerial.setVisible(false);
        }
        updateUrl();
}

function toggleKey()
{
	if ($("#keyTable").css('display') != 'none')
	{
		$("#keyTable").css('display', 'none');
		$("#linekey").css('display', 'none');
	}
	else
	{
		$("#keyTable").css('display', "block");
		$("#linekey").css('display', "block");
	}	
}


function toggleLines()
{
	layerLines.setVisible(($("#linesCB").prop('checked')));
	updateUrl();
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

/* ****** Utility methods ******* */

function getGWRColour(ratio)
{
	var r = (2*ratio);
	var g = 2-(2*ratio);
	var b = 1-Math.abs(-1+2*ratio);

	if (r < 0) { r = 0; }
	if (g < 0) { g = 0; }
	if (b < 0) { b = 0; }
	
	if (r > 0.999 ) { r = 0.999; }
	if (g > 0.999 ) { g = 0.999; }
	if (b > 0.999 ) { b = 0.999; }

	var colourHex = rgb2Hex(r, g, b);

	return "#" + colourHex;
}

function getGBRColour(ratio)
{
	var r = (2*ratio);
	var g = 1.5-(1.5*ratio);
	var b = 0.75-(5*ratio);
	
	if (ratio < 0.5)
	{
		g = 0.75;
	}

	if (r < 0) { r = 0; }
	if (g < 0) { g = 0; }
	if (b < 0) { b = 0; }
	
	if (r > 0.999 ) { r = 0.999; }
	if (g > 0.999 ) { g = 0.999; }
	if (b > 0.999 ) { b = 0.999; }

	var colourHex = rgb2Hex(r, g, b);

	return "#" + colourHex;
}

function getBWYColour(ratio)
{
	var r = (2*ratio);
	var g = (2*ratio);
	var b = 2-(2*ratio);

	if (r < 0) { r = 0; }
	if (g < 0) { g = 0; }
	if (b < 0) { b = 0; }
	
	if (r > 0.999 ) { r = 0.999; }
	if (g > 0.999 ) { g = 0.999; }
	if (b > 0.999 ) { b = 0.999; }

	var colourHex = rgb2Hex(r, g, b);

	return "#" + colourHex;

}

/* RGB values between 0 and 1. */
function rgb2Hex(r, g, b)   
{
	var colourHex = "";
	var hexArray = new Array( "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f" );
	var code1 = Math.floor(r*16);
	var code2 = Math.floor(r*256) - code1*16;
	colourHex += hexArray[code1];
	colourHex += hexArray[code2];
	var code1 = Math.floor(g*16);
	var code2 = Math.floor(g*256) - code1*16;
	colourHex += hexArray[code1];
	colourHex += hexArray[code2];
	var code1 = Math.floor(b*16);
	var code2 = Math.floor(b*256) - code1*16;
	colourHex += hexArray[code1];
	colourHex += hexArray[code2];
	return colourHex;
}

/*
function hex2rgb(hex) {
    if (hex.lastIndexOf('#') > -1) {
        hex = hex.replace(/#/, '0x');
    } else {
        hex = '0x' + hex;
    }
    var r = hex >> 16;
    var g = (hex & 0x00FF00) >> 8;
    var b = hex & 0x0000FF;
    return [r, g, b];
};
*/

function bust()
{
	top.location = self.location.href;
}

function updateUrl()
{
	var metric = $('#themetric').val();
	var selected = "";
	if (selectClick != undefined)
	{
		var selectFeatures = selectClick.getFeatures();
		if (selectFeatures.getLength() > 0)
		{
			selected = selectFeatures.item(0).get('id');
		}
	
	}
	
	var layerString = "";
	layerBackground.getVisible() ? layerString += "T" : layerString += "F";
	layerPoints.getVisible() ? layerString += "T" : layerString += "F";
	layerLines.getVisible() ? layerString += "T" : layerString += "F";
	layerThames.getVisible() ? layerString += "T" : layerString += "F";
	layerGLA.getVisible() ? layerString += "T" : layerString += "F";
    layerAerial.getVisible() ? layerString += "T" : layerString += "F";
	layerZones.getVisible() ? layerString += "T" : layerString += "F";

	var centre = ol.proj.transform(olMap.getView().getCenter(), "EPSG:3857", "EPSG:4326");
	var hash = "metric=" + metric;
	if ($('#year').val() != 'none')
	{
		hash += "&year=" + $('#year').val();
	}
	if ($('#yearcomp').val() != 'none')
	{
		hash += "&yearcomp=" + $('#yearcomp').val();
	}	
	if (serviceFilter != undefined)
	{	
		hash += "&filter=" + serviceFilterCodes[serviceFilter];
	}
	if (selected != "")
	{
		hash += "&selected=" + selected;
	}
	hash += "&layers=" + layerString + "&zoom=" + olMap.getView().getZoom() + "&lon=" + centre[0].toFixed(4) + "&lat=" + centre[1].toFixed(4); 
	window.location.hash = hash;
}

/*
function getKML()
{
	var features = [];
      layerPoints.getSource().forEachFeature(function(feature) 
      {
        var clone = feature.clone();
        clone.setId(feature.getId());  // clone does not set the id
        clone.getGeometry().transform('EPSG:3857', 'EPSG:4326');
        features.push(clone);
      });
      var string = new ol.format.KML().writeFeatures(features);
	console.log(string);
}
*/

$(document).ready(function() {
	init();
});
