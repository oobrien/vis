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
var layerPointsLabels;
var layerOSICore;
var layerLines;
var layerLinesAll;
var layerBackground;
var layerAerial;
var pointSource;
var pointSourceNR;
var pointSource2;
var lineSource;
var lineSourceNR;

var pointsLoaded = false;
var statsLoaded = false;
var osisLoaded = false;
var linesLoaded = false;

var selectClick;
var selectedId = "*";
var selectedYear = ""; //We store this because we may not have one set yet.
var selectedYearComp = ""; //We store this because we may not have one set yet.
var showEnglish = false;
var keys = ["unused", "metric", "year", "yearcomp", "filter", "selected", "layers", "zoom", "lon", "lat"];
var args = [];

var DEFAULT_ZOOM = 13;
var DEFAULT_LAT = 51.52;
var DEFAULT_LON = -0.1;

//NR Tickets
var skewFactor = 3.0;
var boundary = 1.0/4.0;
var wasShowingZones = false;

var currentZoom = DEFAULT_ZOOM;
var currentLat = DEFAULT_LAT;
var currentLon = DEFAULT_LON;

var serviceFilter;
var scalingFactor;

var statsData = {};
var osis = {};

//Closures map
var disruptedSegCount = 0;
var disruptedSegs = [""];
var tfl_app_id = "8ee22a25";
var tfl_app_key = "f5b2bb26fbd6fe285da0c9f2bd4d28bc";
var blink = true;
var noBlinking = false;
var blinkTimer;
var dataTimer;
var countdown;

/* ****** Styles ****** */

function pointCoreStyle(feature, resolution)
{
    var zoomFactor = 0.15;
    if (resolution < 100) { zoomFactor = 0.2; }
    if (resolution < 50) { zoomFactor = 0.3; }
    if (resolution < 25) { zoomFactor = 0.4; }
    if (resolution < 12.5) { zoomFactor = 0.5; }

    return [
        new ol.style.Style({
            image: new ol.style.Circle({
                radius: feature.get("radius") * zoomFactor,
                fill: new ol.style.Fill({ color: (resolution > 50 && feature.get("labelColour") ? feature.get("labelColour") : feature.get("fillColour") )}),
            }),
        })    
    ] 
};

function pointLabelStyle(feature, resolution)
{
    if (resolution > 200) { return null; }
    if (resolution > 100 && pointsLoaded != "nrstations") { return null; }
    if (resolution > 50 && pointsLoaded != "nrstations"  && serviceFilter === undefined) { return null; }
    
    var zoomFactor = 0.25;
    var metricFontSize = 9;
    var labelFontSize = 9;
    if (resolution < 100) { zoomFactor = 0.35; labelFontSize = 10; }
    if (resolution < 50) { zoomFactor = 0.40; metricFontSize = 10; labelFontSize = 10; }
    if (resolution < 25) { zoomFactor = 0.47; metricFontSize = 12; labelFontSize = 10; }
    if (resolution < 12.5) { zoomFactor = 0.6; metricFontSize = 14; labelFontSize = 13; }

    var metricLabel = new ol.style.Style({
        text: new ol.style.Text({
            text: feature.get("datalabel"),
            textAlign: "center",
            font: "bold " + metricFontSize + "px Cabin Condensed, sans-serif",
            fill: new ol.style.Fill({ color: (feature.get("labelColour") ? feature.get("labelColour") : "#000000") }),
            stroke: new ol.style.Stroke({ color: "rgba(255, 255, 255, 0.75)", width: 3 })
        }),
        zIndex: 1,

    });
        
    var nameLabel = new ol.style.Style({
        text: new ol.style.Text({
            text: feature.get("geolabel").replace(" &", " &").replace(" ", "\n"),
            offsetX: ( feature.get("offsetX") ? feature.get("offsetX")*zoomFactor : 0),
            offsetY: ( feature.get("offsetY") ? feature.get("offsetY")*zoomFactor : 0),
            textAlign: ( feature.get("offsetX") ? (feature.get("offsetX") > 0 ? "left" : "right") : "center"),
            font: "bold " + labelFontSize + "px Varela Round, sans-serif",
            fill: new ol.style.Fill({ color: $("#themetric").val() == "night" ? "#ffffff" : "#000000" }),
            stroke: new ol.style.Stroke({ color: ($("#themetric").val() == "night" ? "rgba(0, 0, 0, 0.75)" : "rgba(255, 255, 255, 0.75)"), width: 3 })
        }),
        zIndex: 2,
    });            

    return [metricLabel, nameLabel];
};    

function pointCaseStyle(feature, resolution)
{
    var zoomFactor = 0.15;
    if (resolution < 100) { zoomFactor = 0.2; }
    if (resolution < 50) { zoomFactor = 0.3; }
    if (resolution < 25) { zoomFactor = 0.4; }
    if (resolution < 12.5) { zoomFactor = 0.5; }

    return [
        new ol.style.Style({
            image: new ol.style.Circle({
                radius: feature.get("radius") * zoomFactor, 
                stroke: (
                    feature.get("radius") == 0
                        ? undefined 
                        : (resolution > 100 && ($("#themetric").val() != "map" && $("#themetric").val() != "night" && $("#themetric").val() != "osi" && $("#themetric").val() != "closures") 
                            ? new ol.style.Stroke({ width: 2, color: feature.get("strokeColour") })
                            : (resolution > 50 && ($("#themetric").val() == "livesontheline" || $("#themetric").val() == "houseprices" || $("#themetric").val() == "housepricesdiff") 
                                ? new ol.style.Stroke({ width: 2, color: feature.get("strokeColour") })
                                : new ol.style.Stroke({ width: feature.get("strokeWidth"), color: feature.get("strokeColour") })
                        )
                    )
                )
            }),
        }),
    ] 
};    

function pointSelectStyle(feature, resolution)
{
    var zoomFactor = 0.15;
    var metricFontSize = 9;
    var labelFontSize = 9;
    if (resolution < 100) { zoomFactor = 0.2; labelFontSize = 10; }
    if (resolution < 50) { zoomFactor = 0.3; metricFontSize = 10; }
    if (resolution < 25) { zoomFactor = 0.4; metricFontSize = 12; labelFontSize = 10; }
    if (resolution < 12.5) { zoomFactor = 0.5; metricFontSize = 14; labelFontSize = 13; }

    return [
        new ol.style.Style({
            image: new ol.style.Circle({
                radius: feature.get("radius") * zoomFactor, 
                fill: new ol.style.Fill({ color: (resolution > 50 && feature.get("labelColour") ? feature.get("labelColour") : feature.get("fillColour") )}),
                stroke: (
                    feature.get("radius") == 0 || ($("#themetric").val() == "osi" && feature.get("osi") == false)
                        ? undefined 
                        : (resolution > 100 && ($("#themetric").val() != "map" && $("#themetric").val() != "night" && $("#themetric").val() != "osi" && $("#themetric").val() != "closures") 
                            ? new ol.style.Stroke({ width: 2, color: feature.get("strokeColour") })
                            : (resolution > 50 && ($("#themetric").val() == "livesontheline" || $("#themetric").val() == "houseprices" || $("#themetric").val() == "housepricesdiff") 
                                ? new ol.style.Stroke({ width: 2, color: feature.get("strokeColour") })
                                : new ol.style.Stroke({ width: feature.get("strokeWidth"), color: feature.get("strokeColour") })
                        )
                    )
                )
            }),
            text: new ol.style.Text({
                text: (resolution > 50 ? undefined : feature.get("datalabel")),
                textAlign: "center",
                font: "bold " + metricFontSize + "px Cabin Condensed, sans-serif",
                fill: new ol.style.Fill({ color: (feature.get("labelColour") ? feature.get("labelColour") : "#000000") }),
                stroke: new ol.style.Stroke({ color: "rgba(255, 255, 255, 1)", width: 4 })

            })
        }),
        new ol.style.Style({
            text: new ol.style.Text({
                text: (resolution > 50 ? undefined : feature.get("geolabel").replace(" &", " &").replace(" ", "\n")),
                offsetX: ( feature.get("offsetX") ? feature.get("offsetX")*zoomFactor*1.1 : 0),
                offsetY: ( feature.get("offsetY") ? feature.get("offsetY")*zoomFactor*1.3 : 0),
                textAlign: ( feature.get("offsetX") ? (feature.get("offsetX") > 0 ? 'left' : "right") : "center"),
                font: "bold " + labelFontSize + "px Varela Round, sans-serif",
                fill: new ol.style.Fill({ color: "#000000" }),
                stroke: new ol.style.Stroke({ color: "rgba(255, 255, 255, 1)", width: 4 })
            })
        })            
    ] 
};    

function lineStyle(feature, resolution)
{
    return [
        new ol.style.Style({
            stroke: new ol.style.Stroke({ width: feature.get("strokeWidth"), color: feature.get("strokeColour"), lineCap: feature.get("strokeLinecap"), lineDash: feature.get("strokeDashstyle") })
        })
    ] 
};

    
function osicaseStyle(feature, resolution)
{
    return [
        new ol.style.Style({
            stroke: ($("#themetric").val() == "osi" ? new ol.style.Stroke({ width: 5.5, color: "#000000" }) 
            : new ol.style.Stroke({ width: 5.5, color: feature.get("changetype") == 'outstation' ? "rgba(0,0,0,0)" : "rgba(0,0,0,1)" }))
        })
    ] 
};

function osicoreStyle(feature, resolution)
{
    return [
        new ol.style.Style({
            stroke: ($("#themetric").val() == "osi" ? new ol.style.Stroke({ width: 2.5, color: feature.get("changetype") == 'markedosi' ? '#ffaa66' : feature.get("changetype") == 'inoroutstation' ? '#bbbbff' : feature.get("changetype") == 'outbarrierinstation' ? '#ffff66' : feature.get("changetype") == 'inbarrier' ? '#ffffff' : feature.get("changetype") == 'samenamediffstation' ? '#bbffbb' : "#ff88dd" })
            : new ol.style.Stroke({ width: 2.5, color: feature.get("changetype") == 'outstation' ? "rgba(0,0,0,0)" : "rgba(255,255,255,1)" }))
        })
    ] 
};


function glaStyle(feature, resolution)
{
    return [
        new ol.style.Style({
            stroke: new ol.style.Stroke({ width: 7, color:"rgba(100, 65, 0, 0.2)" })
        })
    ]     
};

function zoneStyle(feature, resolution)
{
    return [
        new ol.style.Style({
            fill: new ol.style.Fill({ color: (["Zone 2", "Zone 4"].indexOf(feature.get("name")) >= 0) ? "rgba(0,0,0,0.06)" : (["Zone 6"].indexOf(feature.get("name")) >= 0) ? "rgba(0,0,0,0.09)" : "rgba(0,0,0,0.0)" }),
            //stroke: new ol.style.Stroke({ width: 3, color:"rgba(128, 128, 128, 0.2)" })
        })
    ]     
};

function thamesStyle(feature, resolution)
{
    return [
        new ol.style.Style({
            fill: new ol.style.Fill({ color: "rgba(128,190,205,0.6)" })
        })
    ] 
};

function init()
{
    /* Specified by user in URL. */
    var hash = window.location.hash;

    if (hash.length > 0)
    {
        var elements = hash.split("#");
        var pieces = elements[1].split("/");
        for(var i = 0; i < keys.length; i++)
        {
            if (pieces[i])
            {
                args[keys[i]] = pieces[i];            
            }
        }
    }

    //URL ARGUMENTS - historic conversion. 
    var hash = window.location.hash;
    if (hash.length > 0)
    {
        var elements = hash.split("&");
        elements[0] = elements[0].substring(1); /* Remove the # */

        for(var i = 0; i < elements.length; i++)
        {
            var pair = elements[i].split("=");
            if (pair.length > 1)
            {
                args[pair[0]] = pair[1];
            }
        }
    }
    
    if (args['zoom']) { currentZoom = parseInt(args['zoom']); }
    if (args['lon']) { currentLon = parseFloat(args['lon']); }
    if (args['lat']) { currentLat = parseFloat(args['lat']); }

    if (args['metric'])
    {
        $("#themetric").val(args['metric']);
    }
    else
    {
        $("#themetric").val("total");        
    }
    if (args['filter'])
    {
        for (var key in lineAttrs)
        {
            if (args['filter'] == lineAttrs[key].id)
            {
                serviceFilter = lineAttrs[key].id;
            }
        }
        for (var key in networkAttrs)
        {
            if (args['filter'] == networkAttrs[key].id)
            {
                serviceFilter = networkAttrs[key].id;
            }
        }
    }    
    
    if (args['year'])
    {
        selectedYear = args['year'];
    }
    if (args['yearcomp'])
    {
    	selectedYearComp = args['yearcomp'];
    }    
    if (args['selected'])
    {
        selectedId = args['selected'];
    }
                
    var colourList = ["", "#ff0000", "#ff4400", "#ff8800", "#ffbb00", "#ffff00", "#aaff00", "#66ff00", "#00ff00", "#00ff44", "#00ff88", "#00ffbb", "#00ffff"]

    for (var i = 1; i <= 12; i++)
    {
        $("#c" + i).css("backgroundColor", colourList[i]); 
        $("#c" + i).css("color", "black"); 
    }    
    
     /* ****** Layers and sources ****** */

    //    url: "http://tiles.oobrien.com/futurecity/{z}/{x}/{y}.png",
    //    url: "http://2.base.maps.cit.api.here.com/maptile/2.1/maptile/newest/normal.day/{z}/{x}/{y}/256/png8?app_id=YyCiz5fA5sFK593ZqCEG&app_code=hfwTGH-20M2rP3HyyWIltA",
       layerBackground = new ol.layer.Tile({
           source: new ol.source.XYZ({
            url: "http://2.base.maps.cit.api.here.com/maptile/2.1/maptile/newest/normal.day.grey/{z}/{x}/{y}/256/png8?app_id=YyCiz5fA5sFK593ZqCEG&app_code=hfwTGH-20M2rP3HyyWIltA",
            crossOrigin: null,
            //attributions: [ "Map data &copy; <a href='http://osm.org/'>OSM</a>" ]
            attributions: [ "<br />Background map and aerial imagery &copy; <a href='https://developer.here.com/'>HERE Maps/Navteq</a>. "]
        }),
        opacity: 0.25
    });
    layerAerial = new ol.layer.Tile({
                source: new ol.source.BingMaps({
                    key: "AtZti8EK8Nnv2Nb6w-7eGTmhK1nhYgixIXib0-xKzLLv9n_vsTkh_fWqtmqDppeX",
                    imagerySet: "Aerial"
                }),
                visible: false,
                opacity: 0.6
        });    
     
    pointSource = new ol.source.Vector({
        url: "data/tfl_stations.json",
        defaultProjection: "EPSG:4326",
        format: new ol.format.GeoJSON(),
        attributions: [ "<br />Metrics, live disruption data and OSI links &copy; <a href='http://www.tfl.gov.uk/'>TfL</a>. " 
                + "Some metrics &copy; <a href='https://www.whatdotheyknow.com/request/most_recent_passenger_numbers_pe#incoming-351969'>What Do They Know</a>, " 
                + "<a href='orr.gov.uk/statistics/published-stats/station-usage-estimates'>ORR and Steer Davies Gleave</a>. "
                + "<br />London tube/rail network map &copy; Oliver O'Brien, parts derived from OpenStreetMap, &copy; OpenStreetMap contributors. "
                + "<br />TfL station locations from OpenStreetMap. The <a href='https://github.com/oobrien/vis'>lines/stations geographic data</a> is on GitHub." 
        ]
    }) 
        
    pointSource.once("change", function() 
    {
        if (pointSource.getState() == "ready") 
        {
            var features = pointSource.getFeatures();
            for (var j in features)
            {
                features[j].set("radius", 15);
                features[j].set("fillColour", "#ffffff");
                features[j].set("strokeColour", "#000000");
                features[j].set("datalabel", "");
                features[j].set("geolabel", "");
                features[j].set("osi", false);
                features[j].set("strokeWidth", 3);
                //features[j].set("alt_id", features[j].get("alt_id")); //Legacy ID used for older stats (2003-2013).
                features[j].set("stat_id", features[j].get("nlc_id")); //Used for newer TfL stats (2014 onwards).
                features[j].setId(features[j].get("id"));

                var lines = features[j].get("lines");
                for (var k in lines)
                {
                    if (lines[k].name == "East London") { features[j].get("lines")[k].name = "London Overground"; }
                    if (lines[k].name == "TfL Rail") { features[j].get("lines")[k].name = "Crossrail"; }                                    
                }
            }                    
            pointsLoaded = "stations";
            $("#points").css("color", "green");                
            handleChange(true);    
        }
    });

    pointSource2 = new ol.source.Vector({
        url: "data/london_wards_2011_centroids.json",
        defaultProjection: "EPSG:4326",
        format: new ol.format.GeoJSON(),
        attributions: [ "<br />Demographic metrics and ward boundaries &copy; <a href='http://www.ons.gov.uk/'>ONS</a>." ],
    }) 
        
    pointSource2.once("change", function() 
    {
        if (pointSource2.getState() == "ready") 
        {
            var features = pointSource2.getFeatures();
            for (var j in features)
            {
                features[j].set("radius", 15);
                features[j].set("fillColour", "#ffffff");
                features[j].set("strokeColour", "#000000");
                features[j].set("datalabel", "");
                features[j].set("geolabel", "");
                features[j].set("strokeWidth", 3);
                features[j].set("stat_id", features[j].getId()); 
                //features[j].setId(features[j].get("id"));
            }                
            //if (["wardwork", "wardwords"].indexOf($("#themetric").val()) > -1)
            pointsLoaded = "wards";
            $("#points").css("color", "green");                
            handleChange(true);
        }
    });
    
    pointSourceNR = new ol.source.Vector({
        url: "data/nr_stations.json",
        defaultProjection: "EPSG:4326",
        format: new ol.format.GeoJSON(),
        attributions: [ "<br />Station locations and metrics &copy; ORR & SDG." ],
    }) 
        
    pointSourceNR.once("change", function() 
    {
        if (pointSourceNR.getState() == "ready") 
        {
            var features = pointSourceNR.getFeatures();
            for (var j in features)
            {
                features[j].set("radius", 15);
                features[j].set("fillColour", "#ffffff");
                features[j].set("strokeColour", "#000000");
                features[j].set("datalabel", "");
                features[j].set("geolabel", features[j].get("name"));                
                features[j].set("strokeWidth", 3);
                features[j].setId(features[j].get("tlc_id")); //We use the TLC codes for NR because they are the nicest looking!
                features[j].set("stat_id", features[j].get("nlc_id")); 
            }
            pointsLoaded = "nrstations";
            $("#points").css("color", "green");                
                handleChange(true);
        }
    });
    
     layerPoints = new ol.layer.Vector(
    {
        style: pointCoreStyle,
    });

     layerPointsLabels = new ol.layer.Vector(
    {
        declutter: true,
        style: pointLabelStyle,
    });
     layerPointsCase  = new ol.layer.Vector(
    {
        style: pointCaseStyle,
    });

     lineSource = new ol.source.Vector({
        url: "data/tfl_lines.json",
        defaultProjection: "EPSG:4326",
        format: new ol.format.GeoJSON(),
        //Attribution is elsewhere as this source is hidden normally.
    }) 
    
     layerLinesAll = new ol.layer.Vector(
    {
        style: lineStyle,
    });

    lineSource.once("change", function() 
    {
        if (lineSource.getState() == "ready") 
        {
            var features = lineSource.getFeatures();
            for (var j in features)
            {     
                var lines = features[j].get("lines");
                for (var k in lines)
                {
                    if (lines[k].name == "East London") { features[j].get("lines")[k].name = "London Overground"; }
                    if (lines[k].name == "TfL Rail") { features[j].get("lines")[k].name = "Crossrail"; }                                    
                }
            }    
            linesLoaded = "tfl";
            $("#lines").css("color", "green");
            processLines();    
        }
    });

     lineSourceNR = new ol.source.Vector({
        url: "data/nr_lines.json",
        defaultProjection: "EPSG:4326",
        format: new ol.format.GeoJSON(),
        attributions: [ "<br />National Rail network &copy; Crown Copyright and database right OS with modifications by Oliver O'Brien." ],
    }) 

    lineSourceNR.once("change", function() 
    {
        if (lineSourceNR.getState() == "ready") 
        {    
            linesLoaded = "nr";
            $("#lines").css("color", "green");                
            processLines();    
        }
    });    
     
     layerLines = new ol.layer.Vector(
    {
        source: new ol.source.Vector({}), 
        style: lineStyle,
    });
    
    var osiSource = new ol.source.Vector({
    });
    
    layerOSICore = new ol.layer.Vector(
    {
        source: osiSource,
        style: osicoreStyle,
    });

    var layerOSICase = new ol.layer.Vector(
    {
        source: osiSource,
        style: osicaseStyle,
    });


    var glaSource = new ol.source.Vector({
        url: "data/2247.json",
        defaultProjection: "EPSG:4326",
        format: new ol.format.GeoJSON(),
        attributions: [ "<br />GLA boundary and Thames Crown Copyright & database right OS." ],

    }) 

     layerGLA = new ol.layer.Vector(
    {
        source: glaSource, 
        style: glaStyle
    });

    var zoneSource = new ol.source.Vector({
        url: "data/zones1to6.json",
        defaultProjection: "EPSG:4326",
        format: new ol.format.GeoJSON(),
        attributions: [ "<br />Zones &copy; Oliver O'Brien, derived from multiple sources including TfL, Wikipedia, ORR and OSM data." ],
    }) 

     layerZones = new ol.layer.Vector(
    {
        source: zoneSource, 
        style: zoneStyle,
    });

    var thamesSource = new ol.source.Vector({
        url: "data/river_thames_simp.json",
        defaultProjection: "EPSG:4326",
        format: new ol.format.GeoJSON(),
    }) 

     layerThames = new ol.layer.Vector(
    {
        source: thamesSource, 
        style: thamesStyle,
    });
      
    olMap = new ol.Map({
        target: "mapcontainer",
        layers: [ layerBackground, layerAerial, layerLinesAll, layerThames, layerZones, layerGLA, layerLines, layerOSICase, layerPointsCase, layerOSICore, layerPoints, layerPointsLabels ],
        controls: ol.control.defaults({}).extend(
        [
            new ol.control.ScaleLine({'geodesic': true, 'units': "metric"}),
            //new ol.control.ZoomSlider({'className': "ol-zoomslider'})
                
        ]),
        view: new ol.View({        
            projection: "EPSG:3857",
            maxZoom: 16,
            minZoom: 7,
            zoom: currentZoom,
            center: ol.proj.transform([currentLon, currentLat], "EPSG:4326", "EPSG:3857"), 
            //extent: ol.proj.transformExtent([-1.5, 51, 1.0, 52], "EPSG:4326", "EPSG:3857")
            extent: ol.proj.transformExtent([-8, 49, 2, 62], "EPSG:4326", "EPSG:3857")
        })
    });
    
    layerZones.setVisible(false);
    
    if (args['layers'])
    {
        if (args['layers'][0] == "F")
        {
            $("#backgroundCB").prop("checked", false);
            layerBackground.setVisible(false);
        }
        if (args['layers'].length > 1 && args['layers'][1] == "T")
        {
            $("#aerialCB").prop("checked", true);
            layerAerial.setVisible(true);                        
        }
        if (args['layers'].length > 2 && args['layers'][2] == "F")
        {
            $("#linesCB").prop("checked", false);
            layerLines.setVisible(false);
        }
        else if (args['layers'].length > 2 && args['layers'][2] == "T")
        {
            $("#linesCB").prop("checked", true);
            layerLines.setVisible(true);        
        }
        if (args['layers'].length > 3 && args['layers'][3] == "T")
        {
            $("#zonesCB").prop("checked", true);
            layerZones.setVisible(true);
        }
    }

    /* ****** Interactions and events ****** */

    selectClick = new ol.interaction.Select({
        layers: [ layerPoints, layerPointsCase, layerPointsLabels ],
        condition: ol.events.condition.click,
        style: function(feature, resolution) { return pointSelectStyle(feature, resolution); }
      });
     olMap.getInteractions().extend([selectClick]);
     selectClick.on("select", function(evt)
     {
         console.log(evt);
        if ($("#themetric").val() == "journeys")
        {
            selectedId = "*";
            updateSelectedInfo();        
        }
        else if ($("#themetric").val() == "closures")
        {
            selectedId = "*";
            //NOOP
        }
        else
        {
            updateSelectedInfo();        
        };         
     });

    $(olMap.getViewport()).on("mousemove", function(evt) 
    {
          var pixel = olMap.getEventPixel(evt.originalEvent);
        displayFeatureInfo(pixel);
    });
        
    olMap.getView().on("change:resolution", handleZoom);    
    olMap.on("moveend", updateUrl);      

    key1source = new ol.source.Vector();
    var key1layer = new ol.layer.Vector({ source: key1source, style: pointCoreStyle });    
    var key1layerLabels = new ol.layer.Vector({ source: key1source, style: pointLabelStyle });    
    var key1layerCase = new ol.layer.Vector({ source: key1source, style: pointCaseStyle });    
    key1map = new ol.Map({ target: "key1", layers: [ key1layerCase, key1layer, key1layerLabels ], controls: [], view: new ol.View({ center: [0, 0], zoom: olMap.getView().getZoom() }) });

    key2source = new ol.source.Vector();
    var key2layer = new ol.layer.Vector({ source: key2source, style: pointCoreStyle });    
    var key2layerLabels = new ol.layer.Vector({ source: key2source, style: pointLabelStyle });    
    var key2layerCase = new ol.layer.Vector({ source: key2source, style: pointCaseStyle });    
    key2map = new ol.Map({ target: "key2", layers: [ key2layerCase, key2layer, key2layerLabels ], controls: [], view: new ol.View({ center: [0, 0], zoom: olMap.getView().getZoom() }) });

    if (top.location!= self.location) { $("#button").css("display", "block"); }
    
    $("#closebutton").button().click(function() 
    {
        $("#info").css("display", "none");
        selectClick.getFeatures().clear();
        updateUrl();
    });
    
    handleMetricChange(true);
}

var displayFeatureInfo = function(pixel)
{
    var features = [];
    var stationPresent = false;
    olMap.forEachFeatureAtPixel(pixel, function(feature, layer)
    {
        if (layer == layerPoints || layer == layerPointsCase || layer == layerPointsLabels)
        {
            stationPresent = true;
        }
        if (layer == layerZones && stationPresent)
        {
            //NOOP - For now, don't show zone information when hovering over the station, because it might not be the correct zone for the station (if a multizone station).
        }
        else if (layer != layerLines)
        {
            features.push(feature);
        }
    }.bind(this));
    
    if (features.length > 0) 
    {
        var name = false;
        var info = [];
        var i, ii;
        for (i = 0, ii = features.length; i < ii; ++i) 
        {
            if (features[i].get("name"))
            {
                if (info.indexOf(features[i].get("name")) < 0)
                {
                    info.push(features[i].get("name"));
                }
                name = true;
            }
            else if (features[i].get("id"))
            {
                if (info.indexOf(features[i].get("id")) < 0)
                {
                    info.push(features[i].get("id"));
                }
                name = true;
            }
        }
        if (name)
        {
            $("#areainfo").css("display", "block");
            $("#areainfo").html(info.join("<br />"));
        }
        else
        {
            $("#areainfo").css("display", "none");
        }
    } 
    else 
    {
        $("#areainfo").css("display", "none");
    }
}

function processLines()
{
    console.log("processLines");
    var metric = $("#themetric").val();
        
    if (["nrmap", "nrtotal", "nrtickets"].indexOf(metric) >= 0)
    {        
        layerLines.setSource(lineSourceNR);
        layerLinesAll.setVisible(false);    
        
        var features = layerLines.getSource().getFeatures();
        for (var i in features)
        {    
            features[i].set("strokeColour", "rgba(0, 0, 0, 0.2)");
            features[i].set("strokeWidth", 3);                    
            //features[i].set("strokeDashstyle", [4, 6]);
            features[i].set("strokeLinecap", "round");        
        }
        //layerGLA.setVisible(false);
        layerThames.setVisible(false);
        if (layerZones.getVisible())
        {
            wasShowingZones = true;
            layerZones.setVisible(false);
        }
        $("#linekey").html("");
        return;
    }
    else
    {
        //layerGLA.setVisible(true);
        layerLinesAll.setVisible(true);    
        layerThames.setVisible(true);
        if (wasShowingZones)
        {
            layerZones.setVisible(true);
            wasShowingZones = false;
        }    
    }

	/*
    if (["wardwords", "wardwork"].indexOf(metric) >= 0)
    {
        return;
    }
	*/

    layerLines.setSource(new ol.source.Vector({}));

    var year = $("#year").val();
    if (year == "current")
    {
        year = metricInfo[metric].currentDataYear;
    }
    if (["tongues", "wardwords", "occupation", "wardwork", "livesontheline", "houseprices", "housepricesdiff"].indexOf(metric) >= 0)
    {
        year = $("#networkYear").val();
        if (year == "default")
        {
            year = metricInfo[metric].defaultNetworkYear;
        }
    }
        
    year = parseInt(year);
    
    var features = layerLinesAll.getSource().getFeatures();
    for (var i in features)
    {    
        var lines = features[i].get("lines");
        if (lines)
        {
            for (j = 0; j < lines.length; j++)
            {
                lines[j].hide = false;
                    
                //Set up network line hide/display based on the config file.
                if (metricInfo[metric].availableDataYearsByNetwork)
                {
                    var yearsWithData = metricInfo[metric].availableDataYearsByNetwork[lineAttrs[lines[j].name].network];     
                    if (yearsWithData.indexOf(year) < 0)
                    {
                        lines[j].hide = true;
                    }
                }
        
                if (metric == "night" && (!lines[j].nightopened || lines[j].nightopened > year))
                {
                    lines[j].hide = true;            
                }
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
                    if (lineAttrs[lines[j].name].id != serviceFilter && networkAttrs[lineAttrs[lines[j].name].network].id != serviceFilter)
                    {
                        lines[j].hide = true;                        
                    }
                }
            }
            features[i].set("lines", lines);
        }
    }    

    var html = "<div style='text-align: left;'>";
    var html = "<div style='text-align: left;'>Line filter:</div><table style='width: 100%; margin: 5px 0 10px 0;'><tr><td style='vertical-align: top;'>";
    /* Build up the unique lines, ordered, for key. */
     var linesForKey = [];

    for (var j in features)
    {
        var lines = features[j].get("lines");
        for (var k in lines)
        {
            if (linesForKey.indexOf(lines[k].name) >= 0) {}
            else if (metric != 'night' || lines[k].nightopened)
            {
                linesForKey.push(lines[k].name)
            }                    
        }
    }     
    linesForKey.sort();
    
    if (["wardwords", "wardwork"].indexOf(metric) < 0)
    {
       html += "Line filter:</div><table style='width: 100%; margin: 5px 0 10px 0;'><tr><td style='vertical-align: top;'>";
       html += "<table>";
        for (var i in linesForKey)
        {
            if (lineAttrs[linesForKey[i]].network != "Tube")
            {
                html += ("<tr><td class='keyLineItem' style='text-decoration: line-through; background-color: " + lineAttrs[linesForKey[i]].colour + ";' onclick='filterLine(\"" + lineAttrs[linesForKey[i]].id + "\");'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td><td class='keyItemText'>"  + linesForKey[i] + "</td></tr>");                        
            }
            else
            {
                html += ("<tr><td class='keyLineItem' style='background-color: " + lineAttrs[linesForKey[i]].colour + ";' onclick='filterLine(\"" + lineAttrs[linesForKey[i]].id + "\");'>&nbsp;</td><td class='keyItemText'>"  + linesForKey[i] + "</td></tr>");            
            }
        }
        for (var network in networkAttrs)
        {
            if (!networkAttrs[network].multiline)
            {
                continue;
            }
            if (network != "Tube")
            {
                html += ("<tr><td class='keyLineItem' style='text-decoration: line-through; background-color: " + networkAttrs[network].colour + ";' onclick='filterLine(\"" + networkAttrs[network].id + "\");'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td><td class='keyItemText'>"  + network + "</td></tr>");            
            }
            else
            {
                html += ("<tr><td class='keyLineItem' style='background-color: " + networkAttrs[network].colour + ";' onclick='filterLine(\"" + networkAttrs[network].id + "\");'>&nbsp;</td><td class='keyItemText'>"  + network + "</td></tr>");                        
            }
        }
        html += "</table>";
    }
    else
    {
        html += "</div><table style='width: 100%; margin: 5px 0 10px 0;'><tr><td style='vertical-align: top;'>";
    }
    html += "</td>";    
    html += "<td>";
                
    if (["tongues", "wardwords", "occupation", "wardwork", "livesontheline", "houseprices", "housepricesdiff"].indexOf(metric) >= 0)
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
    
    if (["tongues", "wardwords", "occupation", "wardwork"].indexOf(metric) >= 0)
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
    if (metricInfo[metric]["additional"])
    {
        html += "<div id='additionalText'>" + metricInfo[metric]["additional"] + "</div>";        
    }
        
    $("#linekey").html(html);
    
    for (var i in features)
    {    
        var priLineDrawn = false;
        var secLineDrawn = false;
        var terLineDrawn = false;

        var lines = features[i].get("lines");
        
        /* for (var j in lines)
        {
            if (!lines[j].hide)        
            {
                    var priLine = features[i].clone();
                    //priLine.setId(features[i].get("id") + lines[j].name);
                    priLine.set("strokeColour", lineAttrs[features[i].get("lines")[j].name].colour);
                    priLine.set("strokeWidth", 1.5);
                    priLine.set("strokeLinecap", "butt");        
                    layerLines.getSource().addFeature(priLine);    
            }
        } */
        for (var j in lines)
        {
            if (!lines[j].hide)        
            {
                if (!priLineDrawn)
                {
                    var priLine = features[i].clone();
                    priLine.setId(features[i].get("id") + lines[j].name);
                    priLine.set("strokeColour", lineAttrs[lines[j].name].colour);
                    priLine.set("strokeWidth", 3); 
				    if (["Rail", "DLR", "Tramlink"].indexOf(lineAttrs[lines[j].name].network) > -1 && metric == "night" )
					{
						priLine.set("strokeWidth", 4);      
					}              
                   if (lineAttrs[lines[j].name].network == "Emirates Air Line")
                    {
                        priLine.set("strokeWidth", 4);                                   
                    }
                    priLine.set("strokeDashstyle", [4, 0]);
                    if (lines[j].limited)
                    {
                        priLine.set("strokeDashstyle", [10, 10]);                        
                    }
                    priLine.set("strokeLinecap", "butt");        
                    layerLines.getSource().addFeature(priLine);    
                    
                    if (["Rail", "DLR", "Tramlink"].indexOf(lineAttrs[lines[j].name].network) > -1)
                    {
                        var priLineMiddle = features[i].clone();
                        priLineMiddle.setId(features[i].get("id") + lines[j].name + "midline");
                        //priLineMiddle.set("strokeColour", metric == "night" ? '#000000' : "#ffffff");
                        priLineMiddle.set("strokeColour", "#ffffff");
                      	priLineMiddle.set("strokeWidth", 1.33);                    
                        priLineMiddle.set("strokeDashstyle", [4, 0]);
                        if (lines[j].limited)
                        {
                            priLineMiddle.set("strokeDashstyle", [10, 10]);                        
                        }
                        priLineMiddle.set("strokeLinecap", "square");        
                        layerLines.getSource().addFeature(priLineMiddle);                            
                    }
                    
                    if (lineAttrs[lines[j].name].network == "Emirates Air Line")
                    {
                        var priLineMiddle = features[i].clone();
                        priLineMiddle.setId(features[i].get("id") + lines[j].name + "midline");
                        priLineMiddle.set("strokeColour", "#ffffff");
                        priLineMiddle.set("strokeWidth", 2.4);                    
                        priLineMiddle.set("strokeLinecap", "square");        
                        layerLines.getSource().addFeature(priLineMiddle);
                                                    
                        var priLineMiddle2 = features[i].clone();
                        priLineMiddle2.setId(features[i].get("id") + lines[j].name + "midline2");
                        priLineMiddle2.set("strokeColour", lineAttrs[lines[j].name].colour);
                        priLineMiddle2.set("strokeWidth", 0.8);                    
                        priLineMiddle2.set("strokeLinecap", "square");        
                        layerLines.getSource().addFeature(priLineMiddle2);                                                
                    }
                    
                    
                    priLineDrawn = true;    
                }
                else if (!secLineDrawn)
                {
                    var secLine = features[i].clone();
                    secLine.setId(features[i].get("id") + lines[j].name);
                    secLine.set("strokeColour", lineAttrs[lines[j].name].colour);    
                    secLine.set("strokeWidth", 3);
                    secLine.set("strokeDashstyle", [4, 3]);
                    if (lines[j].limited)
                    {
                        secLine.set("strokeDashstyle", [10, 10]);                        
                    }
                    secLine.set("strokeLinecap", "butt");
                    layerLines.getSource().addFeature(secLine);

                    if (["Rail", "DLR", "Tramlink"].indexOf(lineAttrs[lines[j].name].network) > -1)
                    {
                        var secLineMiddle = features[i].clone();
                        secLineMiddle.setId(features[i].get("id") + lines[j].name + "midline");
                        secLineMiddle.set("strokeColour", "#ffffff");
                        secLineMiddle.set("strokeWidth", 1.33);                    
                        secLineMiddle.set("strokeDashstyle", [2.67, 4.33]);
                        if (lines[j].limited)
                        {
                            secLineMiddle.set("strokeDashstyle", [10, 10]);                        
                        }
                        secLineMiddle.set("strokeLinecap", "square");        
                        layerLines.getSource().addFeature(secLineMiddle);                            
                    }

                    secLineDrawn = true;
                }
                else if (!terLineDrawn)
                {
                    var terLine = features[i].clone();
                    terLine.setId(features[i].get("id") + lines[j].name);
                    terLine.set("strokeColour", lineAttrs[features[i].get("lines")[j].name].colour);    
                    terLine.set("strokeWidth", 3);
                    terLine.set("strokeDashstyle", [4, 10]);
                    if (lines[j].limited)
                    {
                        priLine.set("strokeDashstyle", [10, 10]);                        
                    }
                    terLine.set("strokeLinecap", "butt");
                    layerLines.getSource().addFeature(terLine);
                    terLineDrawn = true;
                }            
            }
        }
    }    
    layerLinesAll.setVisible(false);
    
    /*
    var featuresToDraw = layerLines.getSource().getFeatures();
    for (var k in featuresToDraw)
    {
        //Additional properties for GIS styling.
        var rgb_arr = hex2rgb(featuresToDraw[k].get("strokeColour"));

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
        featuresToDraw[k].set("rgbStrokeColor", "" + rgb_arr[0] + "," + rgb_arr[1] + "," + rgb_arr[2] + ",255");    
        featuresToDraw[k].set("rgbRed", rgb_arr[0]);    
        featuresToDraw[k].set("rgbGreen", rgb_arr[1]);    
        featuresToDraw[k].set("rgbBlue", rgb_arr[2]);    
    
    }
    */
    /* console.log("<svg>" + layerPoints.renderer.root.innerHTML + "</svg>"); */
    
}

/* ****** AJAX data requests ****** */

function requestStatsData()
{
    $("#stats").css("color", "yellow");
    var theurl = 'data/stats.json';
    var dType = 'json';
    if (metricInfo[$("#themetric").val()]["file"] !== undefined)
    {
        theurl = "data/" + metricInfo[$("#themetric").val()]["file"];
    }
    if ($("#themetric").val() == "journeys")
    {
        dType = 'text';
    }
    $.ajax(
    {
        url: theurl,
        success: function(data) 
        {
              handleStatsData(data);
        },
        error: function(obj, error) { console.log(error); },
        dataType: dType,
        async:true
      });
}

function requestOSIData()
{
    $("#osis").css("color", "yellow");
    $.ajax(
    {
        url: "data/osis.json",
        success: function(data) 
        {
              handleOSIData(data);
        },
        dataType: "json",
        async:true
      });
}

function requestDisruptionData()
{
    $("#stats").css("color", "yellow");
    $("#osis").css("color", "yellow");
    clearInterval(blinkTimer);
    clearInterval(dataTimer);
    blinkTimer = null;
    dataTimer = null;
    
    $("#loadingDisruption").css("display", "block");
    
    var theurl = 'https://api.tfl.gov.uk/Line/Mode/tube,dlr,overground,tram,tflrail/Status?detail=true&app_id=' + tfl_app_id + '&app_key=' + tfl_app_key;
    var thestationurl = 'https://api.tfl.gov.uk/StopPoint/Mode/tube,dlr,overground,tram,tflrail/Disruption?app_id=' + tfl_app_id + '&app_key=' + tfl_app_key;

    $.ajax(
    {
        url: theurl,
        success: function(data)
        {
            handleDisruptionData(data);
        },
        dataType: "json",
        async:true
    });
    $.ajax(
    {
        url: thestationurl,
        success: function(data)
        {
            handleStationDisruptionData(data);
        },
        error: function()
        {
            handleStationDisruptionData(null);
        },
        dataType: "json",
        async:true
    });
    
}

/* ****** Handle responses from AJAX data requests ****** */
function handleOSIData(data)
{
    osis = data;
    osisLoaded = true;
    $("#osis").css("color", "green");
    
    handleChange(false);
}

//Keep running it for each year.
function processOSIs()
{
	console.log('processOSIs');
    var metric = $("#themetric").val();
    layerOSICore.getSource().clear();
    if (['map','osi','night'].indexOf(metric) < 0)
    {
        return;        
    }
    var source = layerPoints.getSource();
    var osiYear = $("#year").val();
    if (osiYear == "current")
    {
        osiYear = metricInfo[metric].currentDataYear;
    }

    if (!osis[osiYear])
    {
        return;
    }
    
    //Reset.
    var features = layerPoints.getSource().getFeatures();
    for (var j in features)
    {
        features[j].set("osi", false);
    }        

    //Set for current year.
    for (var pair in osis[osiYear])
    {
        var start = osis[osiYear][pair][0];
        var end = osis[osiYear][pair][1];
        layerPoints.getSource().getFeatureById(start).set("osi", true);
        layerPoints.getSource().getFeatureById(end).set("osi", true);
    }
}

function drawOSIs()
{
	console.log('drawOSIs');
    var metric = $("#themetric").val();
    layerOSICore.getSource().clear();
    if (['map','osi','night'].indexOf(metric) < 0)
    {
        return;        
    }
    var source = layerPoints.getSource();
    var osiYear = $("#year").val();
    if (osiYear == "current")
    {
        osiYear = metricInfo[metric].currentDataYear;
    }

    if (!osis[osiYear])
    {
        return;
    }
    
    layerOSICore.getSource().clear();
    
    for (var pair in osis[osiYear])
    {
        var start = osis[osiYear][pair][0];
        var end = osis[osiYear][pair][1];
        if (osis[osiYear][pair].length > 3 && osis[osiYear][pair][3])
        {
            var mid = osis[osiYear][pair][3];        
            var geom1 = new ol.geom.LineString([ source.getFeatureById(start).getGeometry().getCoordinates(), source.getFeatureById(mid).getGeometry().getCoordinates()]);
            var feature1 = new ol.Feature({ geometry: geom1 });
            feature1.set("changetype", osis[osiYear][pair][2]);
            var geom2 = new ol.geom.LineString([ source.getFeatureById(mid).getGeometry().getCoordinates(), source.getFeatureById(end).getGeometry().getCoordinates()]);
            var feature2 = new ol.Feature({ geometry: geom2 });
            feature2.set("changetype", osis[osiYear][pair][2]);
            if (source.getFeatureById(start).get("fillColour") != "rgba(0, 0, 0, 0)" && source.getFeatureById(end).get("fillColour") != "rgba(0, 0, 0, 0)")
            {
                layerOSICore.getSource().addFeature(feature1);        
                layerOSICore.getSource().addFeature(feature2);        
            }
        
        }
        else
        {
            var geom = new ol.geom.LineString([ source.getFeatureById(start).getGeometry().getCoordinates(), source.getFeatureById(end).getGeometry().getCoordinates()]);
            var feature = new ol.Feature({ geometry: geom });
            feature.set("changetype", osis[osiYear][pair][2]);
            if (source.getFeatureById(start).get("fillColour") != "rgba(0, 0, 0, 0)" && source.getFeatureById(end).get("fillColour") != "rgba(0, 0, 0, 0)")
            {
                layerOSICore.getSource().addFeature(feature);        
            }        
        }
    }
}

function handleStatsData(data)
{
    var metric = $("#themetric").val();
    
    if (metricInfo[metric]["file"])
    {
        statsData[metric] = data;    
        statsLoaded = metric;
    }
    else
    {
        statsData["map"] = data;
        statsLoaded = "map";
    }    
    $("#stats").css("color", "green");
    handleChange(true);
}

function processStationData()
{
    console.log("processStationData");
    var data = statsData["map"];
    var features = layerPoints.getSource().getFeatures();
    for (var i in data)
    {
        for (var j in features)
        {
            if (features[j].getId() == i || features[j].get("stat_id") == i || features[j].get("alt_id") == i)
            {
                if (features[j].get("yeardata") !== undefined)
                {
                    /* Merge the two objects together. */
                    var yeardata = features[j].get("yeardata");
                    for (var year in data[i]) 
                    {
                        yeardata[year] = data[i][year];
                    }
                    features[j].set("yeardata", yeardata);
                }
                else
                {
                    features[j].set("yeardata", data[i]); 
                }
                data[i].populated = true;
                break;
            }
        }    
    }
    
    for (var i in data)
    {
        delete data[i].populated;
    }

    for (var i in features)
    {        
        features[i].set("toHereCount", 0);
    }
}

function processODData()
{
    var rows = statsData["journeys"].split("\n")
    var header = rows[0];
    headerArr = header.split(",");

    var ignore = ["Unfinished", "Grand Total"];

    var features = layerPoints.getSource().getFeatures();
    for (var j in features)
    {
        features[j].set("flows", undefined);
    }

    for (var i = 1; i < rows.length; i++)
    {
        rowArr = rows[i].split(",");
        var rowYear = rowArr[0];
        var rowName = rowArr[1];
        var matched = false;
        var features = layerPoints.getSource().getFeatures();
        for (var j in features)
        {
            if (features[j].get("stat_id") == rowName)
            {
                matched = true;
                if (features[j].get("flows") === undefined)
                {
                    features[j].set("flows", new Array());
                }
                for (var k = 2; k < rowArr.length; k++)
                {
                    if (rowArr[k] > 0 && ignore.indexOf(headerArr[k]) < 0)
                    {
                        var flows = features[j].get("flows");

                        if (flows[rowYear] === undefined)
                        {
                            flows[rowYear] = new Array();
                        }                        
                        if (flows[rowYear][headerArr[k]] === undefined)
                        {
                            flows[rowYear][headerArr[k]] = 0;
                        }
                        flows[rowYear][headerArr[k]] += parseInt(rowArr[k]); 
                        features[j].set("flows", flows);
                    }
                }
            }
        }
    }
}

function handleStationDisruptionData(statusJSON)
{
	console.log('handleStationDisruptionData');
    var stations = layerPoints.getSource().getFeatures();
    for (var i in stations)
    {    
        stations[i].set("closed", false);
        stations[i].set("partclosed", false);
    }

    for (var sj in statusJSON)
    {
        var station = statusJSON[sj];
        for (var i in stations)
        {    
            if (stations[i].getId() == station.stationAtcoCode && (station.description.includes("is closed") || station.description.includes("be closed") || station.description.includes(": Closed -")) && station.type == "Part Closure")
            {
                if (stations[i].get("altmodeid"))
                {
                    stations[i].set("partclosed", true);        
                    console.log(stations[i].get("name") + " - marking as part closed as this station has two areas and IDs (e.g. Overground ID and Underground ID) and TfL doesn't let us know whether both or just one are closed. Note that both MIGHT be closed.");        
                }
                else
                {
                    stations[i].set("closed", true);
                }
            }
            if (stations[i].getId() == station.stationAtcoCode && station.type == "Part Closure")
            {
                stations[i].set("partclosed", true);
            }
        }
    }
    
    /* Manually close stations on the GOBLIN until Feb 2018 */    
    for (var i in stations)
    {    
        //if (["910GUPRHLWY", "910GCROUCHH", "910GHRGYGL", "910GSTOTNHM", "910GWLTHQRD", "910GLEYTNMR", "910GLYTNSHR", "910GWNSTDPK", "910GWDGRNPK"].indexOf(stations[i].getId()) > -1) { stations[i].set("closed", true); }
        //if ([].indexOf(stations[i].getId()) > -1) { stations[i].set("partclosed", true); }
    }

    var open = 0;
    var pc = 0;
    var closed = 0;
    for (var i in stations)
    {
        if (stations[i].get("hide")) { continue; }
        if (stations[i].get("closed")) { closed++; }
        else if (stations[i].get("partclosed")) { pc++; }
        else open++;
    }
    
    $("#countopen").html(open);
    $("#countpc").html(pc);
    $("#countclosed").html(closed);    

    $("#osis").css("color", "blue"); //Actually second stats set.
    if (!statsLoaded)
    {
        statsLoaded = "stationdisruption";
        handleChange(true);
    }
    else
    {
        handleChange(false);    
    }
}

function handleDisruptionData(statusJSON)
{
    console.log("handleDisruptionData");
    disruptedSegs = [];
    disruptedSegCount = 0;

    var features = layerLinesAll.getSource().getFeatures();
    for (var i in features)
    {    
        var lines = features[i].get("lines");
        if (lines)
        {
            for (j = 0; j < lines.length; j++)
            {
                features[i].get("lines")[j].end_sid_disrupted = false;
                features[i].get("lines")[j].otend_sid_disrupted = false;
                features[i].get("lines")[j].ot2end_sid_disrupted = false;
            }
        }
    }
    
    /* Manually close GOBLIN until Feb 2018 */    
    /* markClosed("910GGOSPLOK", "910GUPRHLWY", "Rail", "London Overground");    
    markClosed("910GUPRHLWY", "910GCROUCHH", "Rail", "London Overground");
    markClosed("910GCROUCHH", "910GHRGYGL", "Rail", "London Overground");
    markClosed("910GHRGYGL", "910GSTOTNHM", "Rail", "London Overground");
    markClosed("910GSTOTNHM", "910GBLCHSRD", "Rail", "London Overground");
    markClosed("910GBLCHSRD", "910GWLTHQRD", "Rail", "London Overground");
    markClosed("910GWLTHQRD", "910GLEYTNMR", "Rail", "London Overground");
    markClosed("910GLEYTNMR", "910GLYTNSHR", "Rail", "London Overground");
    markClosed("910GLYTNSHR", "910GWNSTDPK", "Rail", "London Overground");
    markClosed("910GWNSTDPK", "910GWDGRNPK", "Rail", "London Overground");
    markClosed("910GWDGRNPK", "910GBARKING", "Rail", "London Overground");
	*/
    
    for (var sj in statusJSON)
    {
        var line = statusJSON[sj];
        var lineid = line.id;
        var linename = line.name;
        var network = line.modeName;
        var startcode = null;
        var endcode = null;
        
        if (network == "tube") { network = "Tube"; }
        if (network == "overground") { network = "Rail"; }
        if (network == "dlr") { network = "DLR"; }
        if (network == "tram") { linename = "Tramlink"; network="Tramlink"; }
        if (network == "tflrail") { network = "Rail"; }        
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
                                stations[i].set("closed", true);
                            }
                        }
                    }                
                } */
                /* This is problematic, as sometimes TfL use special service and show the service using the disruption sequence, and sometimes they indicate a closed line with special service. Using the former for now. */    
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
                    if ((ls.disruption.isBlocking && ls.disruption.isWholeLine && ls.statusSeverityDescription == "Suspended") 
                        || (ls.disruption.isWholeLine && ls.disruption.closureText == "severeDelays") //Victoria line 16-Jan-2017
                    )
                    {
                        var segmentId = '#' + network + "-" + linename + "_";
                        console.log(segmentId); //Useful to debug, if the closures map doesn't line up with TfL's own map - normally due to an incorrect ID. */

                        for (var f in features)
                        {    
                            var disrupted = false;
                            var flines = features[f].get("lines");
                            if (flines)
                            {
                                for (j = 0; j < flines.length; j++)
                                {
                                    if (lineAttrs[flines[j].name].network == network && flines[j].name == linename)
                                    {
                                        features[f].get("lines")[j].end_sid_disrupted = true;
                                        features[f].get("lines")[j].otend_sid_disrupted = true;
                                        features[f].get("lines")[j].ot2end_sid_disrupted = true;
                                        disruptedSegCount++;
                                        disrupted = true;
                                    }
                                }
                            }
                            if (disrupted) { disruptedSegCount--; } //We counted by station rather than segment, so subtract one (as segments = stations - 1)
                        }                        
                    }
                }
            }
        }
    }
    
    clearInterval(blinkTimer);
    clearInterval(dataTimer);
    
    var interval_ms_blink = 1000;
    var interval_ms = 600000;
    $("#loadingDisruption").css("display", "none");
    if (!noBlinking)
    {
        blinkTimer = setInterval(flashLines, interval_ms_blink); //Every second (blink on/off)
    }
    dataTimer = setInterval(requestDisruptionData, interval_ms); //Every 10 minutes
    countdown = interval_ms/interval_ms_blink;
    $("#countsegments").html(disruptedSegCount);

    $("#stats").css("color", "green"); //Actually second stats set.
    if (!statsLoaded)
    {
        statsLoaded = "disruption";
        handleChange(true);
    }
    else
    {
        handleChange(false);    
    }
}

function markClosed(startcode, endcode, network, linename)
{
    var segmentId = '#' + network + "-" + linename + "_" + startcode + "_" + endcode;
    var altId = '#' + network + "-" + linename + "_" + endcode + "_" + startcode;
    if (disruptedSegs.indexOf(segmentId) < 0 && disruptedSegs.indexOf(altId) < 0 && startcode != null && endcode != null && startcode != endcode)
    {        
        disruptedSegs.push(segmentId);
        disruptedSegCount++;
    }
    if (startcode && endcode && startcode != endcode)
    {
        console.log(segmentId); //Useful to debug, if the closures map doesn't line up with TfL's own map - normally due to an incorrect ID. */

        var features = layerLinesAll.getSource().getFeatures();
        for (var f in features)
        {    
            var flines = features[f].get("lines");
            if (flines)
            {
                for (j = 0; j < flines.length; j++)
                {
                    if (lineAttrs[flines[j].name].network == network && flines[j].name == linename)
                    {
                        if (startcode == flines[j].start_sid || endcode == flines[j].start_sid)
                        {
                            if (startcode == flines[j].end_sid || endcode == flines[j].end_sid) 
                            {
                                features[f].get("lines")[j].end_sid_disrupted = true;
                            }
                            if (startcode == flines[j].otend_sid || endcode == flines[j].otend_sid) 
                            {
                                features[f].get("lines")[j].otend_sid_disrupted = true;
                            }
                            if (startcode == flines[j].ot2end_sid || endcode == flines[j].ot2end_sid) 
                            {
                                features[f].get("lines")[j].ot2end_sid_disrupted = true;
                            }
                        }                                                            
                    }
                }
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
        if (stations[i].get("closed") && !stations[i].get("hide")) 
        {
            if (blink && !noBlinking)
            {
                stations[i].set("fillColour", "rgba(0,0,0,0)");
                stations[i].set("strokeColour", "rgba(0,0,0,0)");        
                stations[i].set("label", "");    
            }
            else if (!blink && !noBlinking)
            {
                stations[i].set("fillColour", "#ff0000");                    
                stations[i].set("strokeColour", stations[i].get("strokeColorNormal"));        
                stations[i].set("label", stations[i].get("labelNormal"));        
            }
        }
        else if (stations[i].get("partclosed") && !stations[i].get("hide"))
        {
            if (!blink || noBlinking)
            {
                stations[i].set("fillColour", "#ffaa00");                    
            }
            else
            {
                stations[i].set("fillColour", "#ffffff");                                
            }            
        }
    }
    
    if (key1source.getFeatures().length > 0 && key2source.getFeatures().length > 0)
    {
        if (blink && !noBlinking)
        {
            key2source.getFeatures()[0].set("fillColour", "rgba(0,0,0,0)");
            key2source.getFeatures()[0].set("strokeColour", "rgba(0,0,0,0)");
            key1source.getFeatures()[0].set("fillColour", "#ffffff");    
            $("#blinking").css("color", "rgba(0,0,0,0)");
        }
        else
        {
            key2source.getFeatures()[0].set("fillColour", "#ff0000");
            key2source.getFeatures()[0].set("strokeColour", "#000000");
            key1source.getFeatures()[0].set("fillColour", "#ffaa00");
            $("#blinking").css("color", "white");
        }
    }

    layerLines.setSource(new ol.source.Vector({}));

    var features = layerLinesAll.getSource().getFeatures();
    for (var i in features)
    {    
        var priLineDrawn = false;
        var secLineDrawn = false;
        var terLineDrawn = false;
        
        var lines = features[i].get("lines");
        
        lines.sort(sortLinesByDisruption);
        
        for (var j in lines)
        {
            var disrupted = (lines[j].end_sid_disrupted && (!lines[j].otend_sid || lines[j].otend_sid_disrupted) && (!lines[j].ot2end_sid || lines[j].ot2end_sid_disrupted));

            if (!lines[j].hide)        
            {
                var line = features[i].clone();
                line.setId(features[i].get("id") + lines[j].name);
                line.set("strokeLinecap", "butt");                            
                if (!priLineDrawn)
                {
                    line.set("strokeDashstyle", [8, 0]);
                    if (disrupted)
                    {
                        line.set("strokeDashstyle", [0.1, 7.9]);                    
                    }
                    priLineDrawn = true;    
                }
                else if (!secLineDrawn)
                {
                    line.set("strokeDashstyle", [8, 8]);
                    if (disrupted)
                    {
                        line.set("strokeDashstyle", [0.1, 15.9]);                    
                    }
                    secLineDrawn = true;
                }
                else if (!terLineDrawn)
                {
                    line.set("strokeDashstyle", [4, 4]);
                    if (disrupted)
                    {
                        line.set("strokeDashstyle", [0.1, 11.9]);                    
                    }
                    terLineDrawn = true;
                }

                line.set("strokeColour", lineAttrs[features[i].get("lines")[j].name].colour);
                if (disrupted)
                {
                    line.set("strokeLinecap", "round");                            
                    if ((blink && !noBlinking) || (!blink && noBlinking))
                    {
                        line.set("strokeColour", "rgba(0,0,0,0)");
                    }
                }
                line.set("strokeWidth", olMap.getView().getZoom() - 8); //Was 5
                layerLines.getSource().addFeature(line);    
            }
        }
    }
    if (!noBlinking)
    {
        blink = !blink;
    }
    $("#countdown").html(countdown);
    countdown--;
}

function resetDisplay()
{
    console.log("resetDisplay");
    if ($("#themetric").val() == "journeys")
    {
        var features = layerPoints.getSource().getFeatures();
        for (var i in features)
        {
            features[i].set("toHereCount", 0);
            if (features[i].get("flows") !== undefined)
            {
                features[i].set("radius", 10);
                features[i].set("fillColour", "rgba(255, 255, 255, 1)");                    
            }     
            features[i].changed();
        }
    }
    updateUrl();
}

function switchPointsAndLines(pointsToLoad)
{
    console.log("switchPointsAndLines");
    if (pointsToLoad == pointsLoaded)
    {
        $("#points").css("color", "green");
        $("#lines").css("color", "green");
        processLines();
        linesLoaded = pointsToLoad;
        console.log("switchPointsAndLines not needed");
        return;
    }

    layerLinesAll.setVisible(true);
    pointsLoaded = false;
    linesLoaded = false;
    $("#points").css("color", "red");
    $("#lines").css("color", "red");
    if (pointsToLoad == "stations")
    {
        layerLinesAll.setSource(lineSource);
        layerPoints.setSource(pointSource);
        layerPointsLabels.setSource(pointSource);
        layerPointsCase.setSource(pointSource);
    }
    else if (pointsToLoad == "wards")
    {
        layerLinesAll.setSource(lineSource);
		//layerLinesAll.setSource(null);
        //linesLoaded = "wards";
        //$("#lines").css("color", "green");    
        //processLines();        
        layerPoints.setSource(pointSource2);
        layerPointsLabels.setSource(pointSource2);
        layerPointsCase.setSource(pointSource2);
    }
    else if (pointsToLoad == "nrstations")
    {
        layerLinesAll.setSource(lineSourceNR);
        //layerLines.changed();
        layerPoints.setSource(pointSourceNR);
        layerPointsLabels.setSource(pointSourceNR);
        layerPointsCase.setSource(pointSourceNR);
    }
    layerPoints.changed();
    layerPointsLabels.changed();
    layerPointsCase.changed();
    selectClick.getFeatures().clear();
    if (layerPoints.getSource().getFeatures().length > 0)
    {
        pointsLoaded = pointsToLoad;
        $("#points").css("color", "green");
    }
    if (layerLinesAll.getSource() != null && layerLinesAll.getSource().getFeatures().length > 0)
    {
        linesLoaded = pointsToLoad;
        $("#lines").css("color", "green");
        processLines();    
    }
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
    handleChange(false);
}

function handleMetricChange(firstload)
{
    console.log("handleMetricChange, firstload is " + firstload);
    $("#points").css("color", "red");            
    $("#stats").css("color", "red");            
    $("#lines").css("color", "red");    

    clearInterval(blinkTimer);
    clearInterval(dataTimer);
    blinkTimer = null;
    dataTimer = null;

    var metric = $("#themetric").val();
    if (!metric)
    {
        return;
    }
    
    //TODO Put in warning for if Crossrail 2 is selected and networkyear is <2035 or is default and default <2035.
    if (serviceFilter == "2")
    {
    
    }

    if (serviceFilter == "X")
    {
    
    }

    var currYear = $("#year").val();
    var currYearInt = $("#year").val();
    var currYearComp = $("#yearcomp").val();
    var currNetworkYear = $("#networkYear").val();

	if (firstload)
	{
		currYear = selectedYear;
		currYearInt = selectedYear;
		currYearComp = selectedYearComp;
	}

    if (currYear == "current")
    {
        currYearInt = metricInfo[metric].currentDataYear;
    }
    
    //Setup year menus.
    $("#year").empty();
    $("#yearcomp").empty();
    $("#networkYear").empty();
    
    var dataYears = metricInfo[metric].availableDataYears;
    var tieNetworkToData = metricInfo[metric].tieNetworkToData;
    var yearcomp = metricInfo[metric].yearcomp;

    for (var i in dataYears)
    {
        $("#year").append($("<option>", { value : dataYears[i] }).text(dataYears[i]));    
    }    
    $("#year").append($("<option>", { value : "current" }).text("Current"));        
    $("#yearcomp").append($("<option>", { value : "same" }).text("None"));    
    if (yearcomp)
    {
        for (var i in dataYears)
        {
            $("#yearcomp").append($("<option>", { value : dataYears[i] }).text(dataYears[i]));    
        }        
    }
    
    if (tieNetworkToData)
    {
        for (var i in dataYears)
        {
            $("#networkYear").append($("<option>", { value : dataYears[i] }).text(dataYears[i]));    
        }            
    }
    else
    {
        for (var i = 2003; i <= 2020; i++)
        {
            $("#networkYear").append($("<option>", { value : i }).text(i));    
        }                
        $("#networkYear").append($("<option>", { value : 2035 }).text(2035));    
    }
    $("#networkYear").append($("<option>", { value : "default" }).text("Default"));    

    //Change current view if not available in year menus. 
    if (currYear == null || dataYears.indexOf(parseInt(currYear)) < 0)
    {
        $("#year").val("current"); 
    }
    else
    {
        $("#year").val(currYear);     
    }
    if (yearcomp)
    {
        if (currYearComp == null || dataYears.indexOf(parseInt(currYearComp)) < 0)
        {
            $("#yearcomp").val("same");     
        }
        else
        {
            $("#yearcomp").val(currYearComp);         
        }
    }
    if (tieNetworkToData)
    {
        if (currYear == null || dataYears.indexOf(parseInt(currYear)) < 0)
        {
            $("#networkYear").val("default");             
        }
        else
        {
            $("#networkYear").val(currYear);             
        }
    }
    else
    {
        if (currNetworkYear === null)
        {
            $("#networkYear").val("default");             
        }
        else
        {
            $("#networkYear").val(currNetworkYear);             
        }
    }
    
    $("#yearcomp").prop("disabled", !yearcomp);
    $("#networkYear").prop("disabled", tieNetworkToData);

    scalingFactor = metricInfo[metric]["scale"];    
    //document.title = metricInfo[metric]["title"];        
    $("#title").html(metricInfo[metric]["title"]);
    $("#subtitle").html(metricInfo[metric]["subtitle"]);        

    //Change geographies.
    if (["nrmap", "nrtotal", "nrtickets"].indexOf(metric) >= 0)    
    {
        switchPointsAndLines("nrstations");
    }
    else
    {
        if (["wardwords", "wardwork"].indexOf(metric) >= 0)    
        {
            switchPointsAndLines("wards"); 
        }
        else
        {
            switchPointsAndLines("stations");
        }
        
        //Let's jump back to London, if we were outside of the boundary.
        var centre = olMap.getView().getCenter();
        var extent = layerGLA.getSource().getExtent();
        
        if (layerGLA.getSource().getFeatures().length > 0 && !ol.extent.containsCoordinate(extent, centre))
        {
            olMap.getView().setCenter(ol.proj.transform([DEFAULT_LON, DEFAULT_LAT], "EPSG:4326", "EPSG:3857"));
            if (olMap.getView().getZoom() < 11) { olMap.getView().setZoom(11); }
        }
    }
    if (["map", "osi", "night"].indexOf(metric) >= 0 && osis.length === undefined)
    {
        requestOSIData();        
    }
    else if (metric != "closures")
    {
        $("#osis").css("color", "black");
    }

    //Metric-specific map display.
    if (["wardwords", "wardwork"].indexOf(metric) >= 0 && !firstload)
    {
        $("#linesCB").prop("checked", false);
        toggleLines();    
    }
    else if (["wardwords", "wardwork"].indexOf(metric) < 0) //This is muddled. Decide when the lines should show, and refactor.
    {
        $("#linesCB").prop("checked", true);
        toggleLines();        
    }
    if (metric == "map")
    {
        $("#zonesCB").prop("checked", true);
        layerZones.setVisible(true);
    }
    if (metric == "night")
    {
        $("body").css("backgroundColor", "#0c0c00");
    }
    else
    {
        $("body").css("backgroundColor", "#fff8f8");    
    }
    
    if (["wardwords", "tongues"].indexOf(metric) >= 0)
    {
        $("#englishB").css("display", "table-cell");
    }
    else
    {
        $("#englishB").css("display", "none");
    }    

    //Request additional data and build the map from the data.
    $("#areainfo").css("display", "none");
    $("#closures").css("display", "none");
    if (metric == "closures")
    {
        $("#closures").css("display", "block");
        $("#info").css("display", "none");

        statsLoaded = false;
        requestDisruptionData();
    }    
    else if ((metricInfo[metric].defaultkey !== undefined && statsData[metric] === undefined) || statsData["map"] === undefined)
    {
        statsLoaded = false;
        requestStatsData();        
    }
    else
    {    
        $("#stats").css("color", "green");            
        handleChange(true);
    }
}

function handleZoom()
{
    key1map.getView().setZoom(olMap.getView().getZoom());
    key2map.getView().setZoom(olMap.getView().getZoom());
    updateUrl();
}

function handleChange(metricChange)
{
    console.log("try handleChange");
    var metric = $("#themetric").val();

	if (!pointsLoaded) // tfl stations, wards or NR stations
	{
		console.log("points data not loaded yet. Will try again once loaded");
		return;    
	}
	if (!statsLoaded) //demographics, ODs and station stats
	{
		console.log("stats data not loaded yet. Will try again once loaded");
		return;    
	}
	if (!osisLoaded && metric == "osi")
	{
		console.log("osis data not loaded yet. Will try again once loaded");
		return;          	
	}

    if (metricChange)
    {
        console.log("handleChange now proceeding");
        /* Needed in case we hide/show lines based on the newly selected options. */

        if (metricInfo[metric]["file"])
        {
            if (metric == "journeys")
            {
                processODData();
            }
        }
        else
        {
            processStationData();
        }  
        
    }
	
    if (selectedId == "*" && metric == "journeys") 
    {
        var features = layerPoints.getSource().getFeatures();
        selectClick.getFeatures().push(features[metricInfo["journeys"].defaultkey]);
    }
    else if (selectedId != "*" && (selectClick.getFeatures().getLength() == 0))
    {
        var features = layerPoints.getSource().getFeatures();
        for (var i in features)
        {
            if (features[i].getId() == selectedId)
            {    
                selectClick.getFeatures().push(features[i]);
            }
        }
    }

    if (metricInfo[metric].tieNetworkToData)
    {
    	if ($("#year").val() == "current")
    	{
       		$("#networkYear").val("default");
    	}
    	else
    	{
        	$("#networkYear").val($("#year").val());
		}
    }
    
    if (metricChange)
    {
        //Already done.
    }
    else
    {
        processLines(); //Year may have changed.
    }
        
    var year = $("#year").val();
    var yearcomp = $("#yearcomp").val();
    var networkYear = $("#networkYear").val();

    if (year == "current")
    {
        year = metricInfo[metric].currentDataYear;
    }
    if (networkYear == "default")
    {
        networkYear = metricInfo[metric].defaultNetworkYear;
    }

	//These need to be called always, as we process differently based on year, not metric.
	if (osisLoaded)
	{
		processOSIs();
	}      
        
    var features = layerPoints.getSource().getFeatures();
    for (var i in features)
    {
        var feature = features[i];
        var show = false;
        for (var j in feature.get("lines"))
        {
            
            if ((feature.get("lines")[j].opened === undefined || feature.get("lines")[j].opened <= networkYear) && 
                    (feature.get("lines")[j].closed === undefined || feature.get("lines")[j].closed >= networkYear))
            {
                if (feature.get("lines")[j].name == "National Rail")
                {
                    continue;
                }
                if (serviceFilter !== undefined)
                {
                    if (lineAttrs[feature.get("lines")[j].name].id == serviceFilter && (metric != "night" || (feature.get("lines")[j].nightopened && feature.get("lines")[j].nightopened <= networkYear)))
                    {
                        show = true;
                    }
                    if (networkAttrs[lineAttrs[feature.get("lines")[j].name].network].id == serviceFilter && (metric != "night" || (feature.get("lines")[j].nightopened && feature.get("lines")[j].nightopened <= networkYear)))
                    {
                        show = true;
                    }
                }
                else
                {
                    if (metric == "night")
                    {
                        if (feature.get("lines")[j].nightopened && feature.get("lines")[j].nightopened <= networkYear)
                        {
                            show = true;
                        }
                    }
                    else if (metricInfo[metric].availableDataYearsByNetwork === undefined)
                    {
                        show = true;
                    }
                    else
                    {
                        var network = lineAttrs[feature.get("lines")[j].name].network;
                        if (metricInfo[metric].availableDataYearsByNetwork[network].indexOf(parseInt(year)) >= 0)
                        {
                            show = true;
                        }
                    }
                }
            }
        }
                
        if (feature.get("lines") === undefined) //Ward words etc
        {
            show = true;
        }

        if (show)
        {
            features[i].set("radius", 5);
            features[i].set("fillColour", "#ffffff");
            features[i].set("strokeColour", "#000000");
            features[i].set("labelColour", undefined);
            features[i].set("datalabel", "");
            features[i].set("geolabel", "");
            features[i].set("offsetX", undefined);
            features[i].set("offsetY", undefined);                
            features[i].set("strokeWidth", 4);
            if (metric == "livesontheline" || metric == "houseprices" || metric == "housepricesdiff")
            {
                if (features[i].get("cartography") && features[i].get("cartography")['display_name'])
                {
                    features[i].set("geolabel", features[i].get("cartography")['display_name']);                                
                }
                else
                {
                    features[i].set("geolabel", features[i].get("name"));                
                }
                features[i].set("offsetX", 1.5*features[i].get("cartography")['labelX']);
                features[i].set("offsetY", 1.5*features[i].get("cartography")['labelY']);
            }
            
            if (metric == "map" || metric == "night" || metric == "osi" || metric == "closures")
            {    
                features[i].set("strokeWidth", 4);
                if (features[i].get("cartography")['display_name'])
                {
                    features[i].set("geolabel", features[i].get("cartography")['display_name']);                                
                }
                else
                {
                    features[i].set("geolabel", features[i].get("name"));                
                }
                features[i].set("offsetX", features[i].get("cartography")['labelX']);
                features[i].set("offsetY", features[i].get("cartography")['labelY']);                

                var colour = false;
                var fillColour = false;
                var linesToShow = 0;
                for (var j in feature.get("lines"))
                {                
                    if ((feature.get("lines")[j].opened === undefined || feature.get("lines")[j].opened <= networkYear) && 
                            (feature.get("lines")[j].closed === undefined || feature.get("lines")[j].closed >= networkYear) &&
                            (metric != "night" || (feature.get("lines")[j].nightopened && feature.get("lines")[j].nightopened <= networkYear)))
                    {
                        if (feature.get("lines")[j].name == "National Rail")
                        {
                            continue;
                        }
                        if (feature.get("lines")[j].name == "Circle")
                        {
                            continue;
                        }
                        linesToShow++;
                        if (!colour) { colour = lineAttrs[feature.get("lines")[j].name].colour; }
                    }
                }
                    
                if (metric == "closures" || metric == "osi")
                {
                    features[i].set("radius", scalingFactor/1.5);    
                    if (metric == "osi" && !features[i].get("osi"))
                    {
                        features[i].set("radius", scalingFactor/3.0);                    
                        features[i].set("geolabel", "");                    
                    }
                    if (linesToShow == 1)
                    {
                        features[i].set("strokeColour",  colour);                            
                    }
                }
                else
                {
                    features[i].set("radius", scalingFactor/1.5);                                        
                    if (linesToShow == 1)
                    {
                        features[i].set("strokeColour", colour);            
                        features[i].set("strokeWidth", 4);            
                        features[i].set("radius", scalingFactor/2.0);                                        
                    }
                }                
            }
            else if (metric == "nrmap")
            {
                features[i].set("fillColour", "#ffffff");
                features[i].set("strokeColour", "#000000");
                features[i].set("strokeWidth", 3);
                features[i].set("datalabel", "");
                features[i].set("geolabel", features[i].get("name"));                
                features[i].set("radius", scalingFactor/1.1);    
                features[i].set("offsetX", 40);
                features[i].set("offsetY", 0);    
            }
            else if (metric == "journeys")
            {
                //handled in updateSelectedInfo
            }
            else if (["tongues", "wardwords", "occupation", "wardwork"].indexOf(metric) >= 0)
            {
                var stats = statsData[metric][features[i].get("stat_id")];
                if (stats === undefined)
                {
                    stats = statsData[metric][features[i].getId()];
                }
                
                if (stats !== undefined)
                {
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
                
                    features[i].set("radius", scalingFactor*Math.sqrt(ratio));
                    if (demographicMap[metric][max_cap] !== undefined && ratio > metricInfo[metric]['infolimit'])
                    {
                        features[i].set("fillColour", demographicMap[metric][max_cap][1]);    
                        features[i].set("datalabel", demographicMap[metric][max_cap][0]);
                    }
                    else
                    {
                        features[i].set("fillColour", "#aaaaaa");
                        features[i].set("datalabel", "");                    
                        if (!demographicMap[metric][max_cap])
                        {
                            console.log(max_cap);                            
                        }
                    }
                    features[i].set("strokeWidth", 4);                    
                }
                else
                {
                    console.log("Unmapped data for " + features[i].get("stat_id"));
                }
            }
            else if (metric == "livesontheline")
            {
                var stats = statsData[metric][features[i].getId()];
                features[i].set("radius", scalingFactor*0.15); 
                if (stats === undefined)
                {
                    console.log("Statistic missing for: " + features[i].getId());
                }
                else
                {
                    features[i].set("labelColour", demographicMap[metric][stats][1]);
                    features[i].set("datalabel", '' + stats);
                    features[i].set("strokeWidth", 3);
                }
            }
            else if (metric == "houseprices")
            {
                var stats = statsData[metric][features[i].getId()];
                if (stats)
                {
                    features[i].set("radius", scalingFactor*0.15); 
                    /* if (stats[1] == "100")
                    {
                        stats[1] = "100+";
                    } */
                    features[i].set("geolabel", features[i].get("geolabel") + " (" + stats[1] + ")"); 
                    ratio = ((stats[0]-250000.0)/750000.0)    
                    if (ratio < 0) { ratio = 0; }
                    if (ratio > 1) { ratio = 1; } 
                    features[i].set("labelColour", getGBRColour(ratio));
                    features[i].set("datalabel", '' + 10*parseInt(stats[0]/10000.00));
                    features[i].set("strokeWidth", 3);
                }
                else
                {
                    features[i].set("radius", scalingFactor*0.07); 
                    features[i].set("labelColour", "#bbbbbb");                
                    features[i].set("datalabel", "");
                    features[i].set("strokeWidth", 3);                
                }
            }
            else if (metric == "housepricesdiff")
            {
                var stats = statsData[metric][features[i].getId()];
                if (stats)
                {
                    features[i].set("radius", scalingFactor*0.15); 
                    /* if (stats[1] == "100")
                    {
                        stats[1] = "100+";
                    } */
                    features[i].set("geolabel", features[i].get("geolabel") + " (" + stats[1] + ")"); 
                    ratio = ((stats[0]+50000.0)/100000.0)    
                    if (ratio < 0) { ratio = 0; }
                    if (ratio > 1) { ratio = 1; } 
                    features[i].set("labelColour", getGWRColour(1-ratio));
                    features[i].set("datalabel", '' + 1*parseInt(stats[0]/1000.00));
                    features[i].set("strokeWidth", 3);
                }
                else
                {
                    features[i].set("radius", scalingFactor*0.07); 
                    features[i].set("labelColour", "#000000");                
                    features[i].set("datalabel", "");
                    features[i].set("strokeWidth", 3);                
                }
            }
            else if (metric == "am_inout")
            {
                if (features[i].get("yeardata") !== undefined
                    && features[i].get("yeardata")[year] !== undefined)
                {
                    var entry = features[i].get("yeardata")[year]['am_in'];
                    var exit = features[i].get("yeardata")[year]['am_out'];
                    var value = entry+exit
                    var ratio = exit*1.0/(entry*1.0+exit*1.0);
                    features[i].set("radius", scalingFactor*Math.sqrt(value));
                    features[i].set("fillColour", getGWRColour(ratio));
                }        
            }
            else if (metric == "wdwe_out")
            {
                if (features[i].get("yeardata") !== undefined
                    && features[i].get("yeardata")[year] !== undefined)
                {
                    var wdexit = features[i].get("yeardata")[year]['out'];
                    var weexit = features[i].get("yeardata")[year]['sat_out'];
                    var value = wdexit+weexit
                    var ratio = weexit*1.0/(wdexit*1.0+weexit*1.0);
                    features[i].set("radius", scalingFactor*Math.sqrt(value));
                    features[i].set("fillColour", getGWRColour(ratio));
                }        
            }
            else if (metric == "peaktime")
            {
                if (features[i].get("yeardata") !== undefined
                    && features[i].get("yeardata")[year] !== undefined)
                {
                    var rt = features[i].get("yeardata")[year]['early_in']+features[i].get("yeardata")[year]['am_in'];
                    var gt = features[i].get("yeardata")[year]['mid_in']+features[i].get("yeardata")[year]['pm_in']+features[i].get("yeardata")[year]['late_in'];
                    var bt = features[i].get("yeardata")[year]['sun_in'];
                    var total = rt+gt+bt

                    var radius = scalingFactor*Math.sqrt(features[i].get("yeardata")[year]['total']/364);
                    if (radius < 10) { radius = 10; }
                    features[i].set("radius", radius);
                    
                    if (rt === undefined) { rt = 0; }
                    if (gt === undefined) { gt = 0; }
                    if (bt === undefined) { bt = 0; }
                                        
                    var r = rt*1.0/total;
                    var g = gt*1.0/total;
                    var b = bt*1.0/total;
        
                    //Emphasise extreme values so they look less "grey".
                    r = enhance(r, skewFactor, boundary);
                    g = enhance(g, skewFactor, boundary);
                    b = enhance(b, skewFactor, boundary);
                    var colourHex = rgb2Hex(r, g, b);
                    features[i].set("fillColour", "#" + colourHex);                    
                    /*
                    if (features[i].get("radius") > 50)
                    {
                        features[i].set("geolabel", features[i].get("name"));                
                    }*/
                }        
            }
            else if (metric == "nrtickets")
            {
                if (features[i].get("yeardata") !== undefined
                    && features[i].get("yeardata")[year] !== undefined)
                {
                    var rt = features[i].get("yeardata")[year]['s_yr'];
                    var gt = features[i].get("yeardata")[year]['r_yr'];
                    var bt = features[i].get("yeardata")[year]['f_yr'];
                    var total = features[i].get("yeardata")[year]['total'];

                    var radius = scalingFactor*Math.sqrt(total);
                    if (radius < 10) { radius = 10; }
                    features[i].set("radius", radius);
                    
                    if (rt === undefined) { rt = 0; }
                    if (gt === undefined) { gt = 0; }
                    if (bt === undefined) { bt = 0; }
                                        
                    var r = rt*1.0/total;
                    var g = gt*1.0/total;
                    var b = bt*1.0/total;
        
                    //Emphasise extreme values so they look less "grey".
                    r = enhance(r, skewFactor, boundary);
                    g = enhance(g, skewFactor, boundary);
                    b = enhance(b, skewFactor, boundary);
                    var colourHex = rgb2Hex(r, g, b);
                    features[i].set("fillColour", "#" + colourHex);
                    
                    /*
                    if (features[i].get("radius") > 50)
                    {
                        features[i].set("geolabel", features[i].get("name"));                
                    }*/
                }        
            }
            else if (yearcomp != "same")
            {
                if (metric == "nrtotal") { metric = "total"; }
                if (features[i].get("yeardata") !== undefined && features[i].get("yeardata")[year] !== undefined)
                {
                    var value = features[i].get("yeardata")[year][metric];
                    var compvalue = 0;
                    if (features[i].get("yeardata")[yearcomp] !== undefined)
                    {
                        compvalue = features[i].get("yeardata")[yearcomp][metric];
                    }        
                    var diffvalue = value - compvalue;
                    if (diffvalue > 0)
                    {
                        features[i].set("strokeColour", "#008800");                    
                    }
                    else
                    {
                        features[i].set("strokeColour", "#FF0000");
                        diffvalue = -diffvalue;
                    }
                    features[i].set("radius", scalingFactor*Math.sqrt(diffvalue));
                }        
            }
            else
            {
                if (features[i].get("yeardata") !== undefined
                    && features[i].get("yeardata")[year] !== undefined)
                {
                    if (metric == "nrtotal") { metric = "total"; }
                    var value = features[i].get("yeardata")[year][metric];
                    features[i].set("radius", scalingFactor*Math.sqrt(value));
                }
            }
        }
        else
        {
            features[i].set("dotColour", "rgba(0, 0, 0, 0)");
            features[i].set("fillColour", "rgba(0, 0, 0, 0)");
            features[i].set("strokeColour", "rgba(0, 0, 0, 0)");
            features[i].set("datalabel", "");
            features[i].set("geolabel", "");
        }        
    }

	//These need to be called always, as we process differently based on year, not metric.
	if (osisLoaded)
	{
		drawOSIs();
	}      

    updateSelectedInfo();
    /*
    for (var i in features)
    {        
        //Additional properties for GIS styling.
        features[i].set("sizeArea", features[i].get("radius") * features[i].get("radius"));
        var rgb_arr = hex2rgb(features[i].get("fillColour"));
        features[i].set("rgbFillColor", "'" + rgb_arr[0] + "," + rgb_arr[1] + "," + rgb_arr[2] + ",255'");    
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
        features[i].set("rgbRed", rgb_arr[0]);    
        features[i].set("rgbGreen", rgb_arr[1]);    
        features[i].set("rgbBlue", rgb_arr[2]);    
        features[i].changed();
    } 
    */
    
    var caption = metricInfo[metric]["keyexample"];
    var fills = ["#ffffff", "#ffffff"];
    var strokes = ["#000000", "#000000"];
    var labelcolours = [undefined, undefined];
    var strokeWidths = [3, 3];
    var labels = ["", ""];
    var key = metricInfo[metric]["defaultkey"];
        
    if (metric == "journeys")
    {
        caption = "<table class='keycaptiontable'><tr><td>" + metricInfo[metric].keyValues[0] + " journeys end here (red=down)</td><td>Selected start station</td></tr></table><i>Select a station to see journeys<br />that start at it.</i>";
        fills = ["#ffaa00", "#00ff00"]
        strokeWidths[0] = 2;
    }

    else if (metric == "am_inout")
    {
        caption = "<table class='keycaptiontable'><tr><td>" + metricInfo[metric].keyValues[0] + "&nbsp;entries, 0 exits</td><td>" + metricInfo[metric].keyValues[1]/4 + " entries, " + 3*metricInfo[metric].keyValues[1]/4 + " exits</td></tr></table>";
        fills = ["#00ff00", "#ff8888"]
    }
    else if (metric == "wdwe_out")
    {
        caption = "<table class='keycaptiontable'><tr><td>" + metricInfo[metric].keyValues[0] + "&nbsp;weekday exits, 0 weekend exits</td><td>" + metricInfo[metric].keyValues[1]/4 + " weekday exits, " + 3*metricInfo[metric].keyValues[1]/4 + " weekend exits</td></tr></table>";
        fills = ["#00ff00", "#ff8888"]
    }
    else if (["tongues", "occupation", "wardwords", "wardwork"].indexOf(metric) >= 0)
    {
        caption = "<table class='keycaptiontable'><tr><td>5%</td><td>10%</td></tr><tr><td colspan='2'>" + metricInfo[metric]["keyexample"]+ "</td></tr></table>";
        fills = [demographicMap[metric][key][1], demographicMap[metric][key][1]]
        strokeWidths = [4, 4];
        labels = [demographicMap[metric][key][0], demographicMap[metric][key][0]]
    
    }
    else if ("livesontheline" == metric)
    {
        caption = metricInfo[metric]["keyexample"];
        fills = ['#ffffff", "#ffffff'];
        labelcolours = [demographicMap[metric][75][1], demographicMap[metric][90][1]];
        strokeWidths = [3, 3];
        labels = [demographicMap[metric][75][0], demographicMap[metric][90][0]];
    }
    else if ("houseprices" == metric)
    {
        caption = metricInfo[metric]["keyexample"];
        fills = ['#ffffff", "#ffffff'];
        labelcolours = [getGBRColour(0), getGBRColour(1)];
        strokeWidths = [3, 3];
        labels = ["250", "1000"];
    
    }
    else if ("housepricesdiff" == metric)
    {
        caption = metricInfo[metric]["keyexample"];
        fills = ['#ffffff", "#ffffff'];
        labelcolours = [getGWRColour(1), getGWRColour(0)];
        strokeWidths = [3, 3];
        labels = ["-50", "50"];
    
    }
    else if (metric == "map" || metric == "night")
    {
        strokes = [lineAttrs["London Overground"].colour, "#000000"];
        strokeWidths = [6, 4];
        caption = "Station, Multiple-line station";
    }
    else if (metric == "osi")
    {
        strokes = [lineAttrs["London Overground"].colour, "#000000"];
        strokeWidths = [6, 4];
        caption = "<div style='font-size: 10px; text-align: left;'>Free transfers:"
             + "<div><div style='background-color: #bbbbff; width: 20px; height: 5px; float: left; margin: 3px 5px 3px 0;'></div><div>Within or out-of-barrier</div></div>"    
            + "<div><div style='background-color: #ffff66; width: 20px; height: 5px; float: left; margin: 3px 5px 3px 0;'></div><div>Out-of-barrier, within station</div></div>"
            + "<div><div style='background-color: #ffaa66; width: 20px; height: 5px; float: left; margin: 3px 5px 3px 0;'></div><div>Official out-of-station transfer</div></div>"
            + "<div><div style='background-color: #ff88dd; width: 20px; height: 5px; float: left; margin: 3px 5px 13px 0;'></div><div>Unmarked out-of-station transfer (only shown on this map)</div></div>"
            + "<div><div style='background-color: #bbffbb; width: 20px; height: 5px; float: left; margin: 3px 5px 3px 0;'></div><div>Same name, different station</div></div>"
            + "<div><div style='background-color: #ffffff; width: 20px; height: 5px; float: left; margin: 3px 5px 20px 0;'></div><div>Within-barrier interchange between different networks or stations</div></div>"
            + "<div>N.B. (1) If out-of-barrier, only a single transfer is free. (2) Certain free out-of-barrier transfers only available from/to one end of an in-barrier transfer area.</div>";
    }    
    else if (metric == "nrmap")
    {
        caption = "Station";
    }
    else if (metric == "total" || metric == "nrtotal")
    {
        caption = "<table><tr><td>" + metricInfo[metric].keyValues[0]/1000000 + "M entries & exits</td><td>" + metricInfo[metric].keyValues[1]/1000000 + "M entries & exits</td></tr></table>";
        if (yearcomp != "same")
        {    
            caption = "<table class='keycaptiontable'><tr><td>" + metricInfo[metric].keyValues[0]/1000000 + "M more entries & exits</td><td>" + metricInfo[metric].keyValues[1]/1000000 + "M fewer entries & exits</td></tr></table>";
            strokes = ["#008800", "#FF0000"];
        }
    }
    else if (metric == "closures")
    {
        caption = "<table class='keycaptiontable'><tr><td>Part-closed station</td><td>Closed station</td></tr></table>";
        fills = ["#ffaa00", "#ff0000"];
        strokeWidths = [4, 4];
    
    }
    else if (metric == "peaktime")
    {
        caption = "<table class='keycaptiontable'><tr><td>Mainly entries before 10am on weekdays</td><td>Mainly entries after 10am on weekdays (green) or on Sundays (blue)</td></tr></table>";
        fills = ["#ff0000", "#00ffff"];
    }
    else if (metric == "nrtickets")
    {
        caption = "<table class='keycaptiontable'><tr><td>" + metricInfo[metric].keyValues[0]/1000000 + "M entries/exits, 50% full fare tickets (blue) 50% reduced fare tickets (green)</td><td>" + metricInfo[metric].keyValues[1]/1000000 + "M entries/exits, 100% season tickets</td></tr></table>";
        fills = ["#00ffff", "#ff0000"];
    }
    else 
    {
        if (yearcomp != "same")
        {    
            caption = "<table class='keycaptiontable'><tr><td>" + metricInfo[metric].keyValues[0] + " more entries</td><td>" + metricInfo[metric].keyValues[1] + " fewer entries</td></tr></table>";        
            if (metric.substr(metric.length - 4) == "_out")
            {
                caption = "<table class='keycaptiontable'><tr><td>" + metricInfo[metric].keyValues[0] + " more exits</td><td>" + metricInfo[metric].keyValues[1] + " fewer exits</td></tr></table>";
            }
            strokes = ["#008800", "#FF0000"];
        }
        else
        {
            caption = "<table class='keycaptiontable'><tr><td>" + metricInfo[metric].keyValues[0] + " entries</td><td>" + metricInfo[metric].keyValues[1] + " entries</td></tr></table>";        
            if (metric.substr(metric.length - 4) == "_out")
            {
                caption = "<table class='keycaptiontable'><tr><td>" + metricInfo[metric].keyValues[0] + " exits</td><td>" + metricInfo[metric].keyValues[1] + " exits</td></tr></table>";        
            }    
        }
    }
    
    var point1 = new ol.Feature({ geometry: new ol.geom.Point([0, 0]) });
    point1.set("fillColour", fills[0]);
    point1.set("strokeWidth", strokeWidths[0]);
    point1.set("strokeColour", strokes[0]);
    point1.set("labelColour", labelcolours[0]);
    point1.set("radius", scalingFactor*Math.sqrt(metricInfo[metric].keyValues[0]));
    point1.set("datalabel", labels[0]);
    point1.set("geolabel", "");

    var point2 = new ol.Feature({ geometry: new ol.geom.Point([0, 0]) });
    point2.set("fillColour", fills[1]);
    point2.set("strokeWidth", strokeWidths[1]);
    point2.set("strokeColour", strokes[1]);
    point2.set("labelColour", labelcolours[1]);
    point2.set("radius", scalingFactor*Math.sqrt(metricInfo[metric].keyValues[1]));
    point2.set("datalabel", labels[1]);
    point2.set("geolabel", "");


    key1source.clear();
    key1source.addFeatures([point1]); 
    key2source.clear();
    key2source.addFeatures([point2]); 
    $("#key1text").html(caption);    

    updateUrl(); //Not working correctly here.
    //TODO - Fix - on initial load, url not updating to show a selected item, and the selected item popup is not appearing    either.
}

function updateSelectedInfo()
{
    console.log("updatedSelectedInfo");
    $("#info").css("display", "block");
    var metric = $("#themetric").val();    
    if (!metric)
    {
        return;
    }
    
    var selectFeature = selectClick.getFeatures().item(0);
    
    if (selectFeature === undefined)
    {
        selectedId = "*";
        resetDisplay();
        $("#info").css("display", "none");
        $("#infotitle").html("");
        return;
    }

    var feature = layerPoints.getSource().getFeatureById(selectFeature.getId());
    selectedId = feature.getId();

    var networkYear = $("#networkYear").val();
    if (networkYear == "default")
    {
        networkYear = metricInfo[metric].defaultNetworkYear;
    }

    var htmlstr = "<div style='font-size: 21px;' title='" + feature.get("stat_id") + "'>" + feature.get("name") + "</div>";
    htmlstr += "<div style='font-size: 14px;'>" + feature.getId() + "</div>";
    if (feature.get("zone"))
    {
        htmlstr += "<div>Zone " + feature.get("zone") + "</div>"; 
    }
    
    if (feature.get("lines") !== undefined)
    {
        htmlstr += "<div id='keyCircles'>";

        if (metricInfo[metric].availableDataYearsByNetwork || metricInfo[metric].tieNetworkToData)
        {
            htmlstr += "<div style='float: left; padding: 5px; font-size: 9px;'>Showing stats for:<br />";
        
            var primaryBalls = [];
            var otherBalls = [];    
            var primaryOrderPos = 9999;
        
            for (var j = 0; j < feature.get("lines").length; j++)
            {
                var network = lineAttrs[feature.get("lines")[j].name].network;
                if (primaryOrder.indexOf(network) < primaryOrderPos && 
                    (feature.get("lines")[j].opened === undefined || feature.get("lines")[j].opened <= networkYear) && 
                    (feature.get("lines")[j].closed === undefined || feature.get("lines")[j].closed >= networkYear))
                {
                    primaryOrderPos = primaryOrder.indexOf(network);
                }
            }
            var primaryNetwork = primaryOrder[primaryOrderPos];
    
            for (var j = 0; j < feature.get("lines").length; j++)
            {
                if ((feature.get("lines")[j].opened === undefined || feature.get("lines")[j].opened <= networkYear) && 
                    (feature.get("lines")[j].closed === undefined || feature.get("lines")[j].closed >= networkYear))
                var thehtml = "<div class='keyCircleContainer'><div class='keyCircleCircle' style='background-color: " 
                    + lineAttrs[feature.get("lines")[j].name].colour + ";'>"
                    + lineAttrs[feature.get("lines")[j].name].id
                    + "</div></div>";             
                else continue;

                var network = lineAttrs[feature.get("lines")[j].name].network;
                if (network == primaryNetwork)
                {
                    primaryBalls.push(thehtml);        
                }
                else
                {
                    otherBalls.push(thehtml);                    
                }
            }
            for (var i in primaryBalls)
            {
                htmlstr += primaryBalls[i];
            }
            htmlstr += "</div>";
            if (otherBalls.length > 0)
            {
                htmlstr += "<div style='float: left; padding: 5px; font-size: 9px;'>Other lines:<br />";
                for (var i in otherBalls)
                {
                    htmlstr += otherBalls[i];
                }
                htmlstr += "</div>";
            }
        }
        else
        {
            for (var j = 0; j < feature.get("lines").length; j++)
            {
                if ((feature.get("lines")[j].opened === undefined || feature.get("lines")[j].opened <= networkYear) && 
                    (feature.get("lines")[j].closed === undefined || feature.get("lines")[j].closed >= networkYear))
                htmlstr += "<div class='keyCircleContainer'><div class='keyCircleCircle' style='background-color: " 
                    + lineAttrs[feature.get("lines")[j].name].colour  + ";'>"
                    + lineAttrs[feature.get("lines")[j].name].id
                    + "</div></div>";
            }             
        }
        htmlstr += "</div>";
    }

    $("#infotitle").html(htmlstr);
    
    if (metric == "journeys")
    {
        if (!statsLoaded)
        {
            console.log("stats not ready yet!");
            //TODO pop up a modal that goes with stats loaded.
            return;
        }

        /* Reset from previous population. */
        var features = layerPoints.getSource().getFeatures();
        for (var j in features)
        {
            features[j].set("toHereCount", 0);
        }

        if (feature.get("flows"))
        {
            var year = $("#year").val();
            if (year == "current")
            {
                year = metricInfo[metric].currentDataYear;
            }
            if (year != $("#yearcomp").val() && $("#yearcomp").val() != "same")
            {
                var flows = feature.get("flows")[year];
                var compflows = feature.get("flows")[$("#yearcomp").val()];
                for (var toStationName in flows)
                {
                    var matched = false;
                    for (var j in features)
                    {
                        if (features[j].get("stat_id") == toStationName)
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
                                features[j].set("toHereCount", features[j].get("toHereCount") + newflows - oldflows);
                            }
                        }
                    }
                    if (!matched) { console.log("Ignoring data for journeys ending at: " + toStationName); }
                }
            
            }
            else
            {
                var flows = feature.get("flows")[year];
                for (var toStationName in flows)
                {
                    var matched = false;
                    for (var j in features)
                    {
                        if (features[j].get("stat_id") == toStationName)
                        {
                            matched = true;
                            if (flows[toStationName] > 0)
                            {
                                features[j].set("toHereCount", features[j].get("toHereCount") + flows[toStationName]);
                            }
                        }
                    }
                    if (!matched) { console.log("Ignoring data for journeys ending at: " + toStationName); }
                }
            }
                
            var tuples = [];
 
            var features = layerPoints.getSource().getFeatures();
            for (var i in features)
            {
                if (features[i].getId() == selectedId)
                {
                    features[i].set("strokeWidth", 2);
                    features[i].set("fillColour", "#00ff00");
                    features[i].set("radius", 20);
                }
                else
                {
                    if (features[i].get("flows") !== undefined)
                    {
                        features[i].set("strokeWidth", 2);
                        features[i].set("radius", 10);
                        features[i].set("fillColour", "rgba(255, 255, 255, 1)");                    
                    }     
                    if (features[i].get("toHereCount") > 0)
                    {
                        features[i].set("radius", Math.sqrt(features[i].get("toHereCount")) * scalingFactor);
                        features[i].set("fillColour", "#ffaa00");                                
                    }    
                    if (features[i].get("toHereCount") < 0)
                    {
                        features[i].set("radius", Math.sqrt(-1*features[i].get("toHereCount")) * scalingFactor);
                        features[i].set("fillColour", "#ff0000");                                
                    }    
                }            
                 tuples.push([features[i].get("name"), features[i].get("toHereCount"), features[i].get("lines")]);
            }
            
            tuples.sort(function(a, b) {
                a = a[1];
                b = b[1];

                return a < b ? 1 : (a > b ? -1 : 0);
            });

            var infohtml = 'Top destination stations for journeys starting here, on a typical weekday:';
            infohtml += "<table>";
            for (var i = 0; i < tuples.length; i++) 
            {
                var key = tuples[i][0];
                var value = tuples[i][1];
                if (value > 0) 
                {
                    infohtml += "<tr><td style='font-size: 11px;'>" + key + "</td><td>&nbsp;</td><td>";
                    for (var j = 0; j < tuples[i][2].length; j++)
                    {
                        infohtml += "<div class='keyBall' style='background-color: " + lineAttrs[tuples[i][2][j].name].colour + ";'>&nbsp;</div>";             
                    }
                
                    infohtml += "</td><th style='font-size: 11px;'>" + value + "</th></tr>";
                }
                if (i == 15) { break; }
            }
        
            infohtml += "</table>";    
            $("#infotable1title").html(infohtml);
            $("#infotable1chart").html("");        
            $("#infotable2title").html("");
            $("#infotable2chart").html("");        
        }
        else
        {
            //Defer. We call this again once the OD data is actually in.
        }        
    }
    else if (["tongues", "occupation", "wardwords", "wardwork"].indexOf(metric) >= 0)
    {
        /* Set up HTML table. */
        var tuples = [];
        var sum = 0;

        for (var j in statsData[metric][feature.get("stat_id")]) 
        {
            if (j != "c001")
            {
                tuples.push([j, statsData[metric][feature.get("stat_id")][j]]);
            }
            else
            {
                sum = statsData[metric][feature.get("stat_id")][j];
            }
        }
        tuples.sort(function(a, b) {
            a = a[1];
            b = b[1];

            return a < b ? 1 : (a > b ? -1 : 0);
        });

        var infohtml = "<div id='subinfo' title='Population: " + sum + "'>" + metricInfo[metric]["subinfo"] + "</div>";
        infohtml += "<table id='keysubtable'>";
        for (var i = 0; i < tuples.length; i++) 
        {
            var key = tuples[i][0];
            var value = tuples[i][1];
            if (value > 0 && value/(sum*1.0) >= metricInfo[metric]["infolimit"] && value >= metricInfo[metric]["infolimit"]*1000 && i < 20) 
            {
                infohtml += "<tr><td>";
                if ( demographicMap[metric][key] !== undefined)
                {
                    infohtml += "<div style='margin: 1px 5px; width: 10px; height: 10px; border-radius: 5px; background-color: " + demographicMap[metric][key][1] + ";'>&nbsp;</div><td>" + demographicMap[metric][key][0];
                }
                else
                {
                    infohtml += "</td><td>" + key;    
                    console.log(key);        
                }
                infohtml += "</td><td>" + Math.round(1000*(value/(sum*1.0)))/10.0 + "%</td></tr>";
            }
        }        
        infohtml += "</table>";
        $("#infotable1title").html(infohtml);
        $("#infotable1chart").html("");
        $("#infotable2title").html("");
        $("#infotable2chart").html("");
    }
    else if (metric == "livesontheline" || metric == "houseprices" || metric == "housepricesdiff")
    {
        $("#infotable1title").html(metricInfo[metric]["subinfo"]);
        $("#infotable1chart").html("");
        $("#infotable2title").html("");
        $("#infotable2chart").html("");
    }
    else
    {
        $("#infotable1title").html("Daily Entries & Exits");    
        $("#infotable2title").html("Time of Day Entries/Exits");    

        console.log(metric);
        if (["nrmap", "nrtotal", "nrtickets"].indexOf(metric) >= 0)
        {
            $("#infotable1title").html("Annual Entries & Exits (National Rail)");    
            $("#infotable2title").html("Ticket Type: Full / Reduced / Season");            
        }

        var dataTable = new google.visualization.DataTable();
        dataTable.addColumn("string", "Year");
        dataTable.addColumn("number", "In (Weekday)");
        dataTable.addColumn("number", "In (Saturday)");
        dataTable.addColumn("number", "In (Sunday)");
        dataTable.addColumn("number", "Out (Weekday)");
        dataTable.addColumn("number", "Out (Saturday)");
        dataTable.addColumn("number", "Out (Sunday)");
        dataTable.addColumn("number", "Average Daily Total");

        var dataTable2 = new google.visualization.DataTable();
        dataTable2.addColumn("string", "Year");
        dataTable2.addColumn("number", "Early (In) %");
        dataTable2.addColumn("number", "Early (Out) %");
        dataTable2.addColumn("number", "AM Peak (In) %");
        dataTable2.addColumn("number", "AM Peak (Out) %");
        dataTable2.addColumn("number", "Interpeak (In) %");
        dataTable2.addColumn("number", "Interpeak (Out) %");
        dataTable2.addColumn("number", "PM Peak (In) %");
        dataTable2.addColumn("number", "PM Peak (Out) %");
        dataTable2.addColumn("number", "Evening (In) %");
        dataTable2.addColumn("number", "Evening (Out) %");
        dataTable2.addColumn("number", "Full Fare %");
        dataTable2.addColumn("number", "Reduced Fare %");
        dataTable2.addColumn("number", "Season Ticket %");

        var rows = [];
        var rows2 = [];

        var yeardata = feature.get("yeardata");

        if (yeardata !== undefined)
        {
            var keys = Object.keys(yeardata).sort();
            for (var k in keys)
            {
                var year = keys[k];
                var total = yeardata[year]['total']/364;
                if (["nrmap", "nrtotal", "nrtickets"].indexOf(metric) >= 0)
                {
                    total = yeardata[year]['total'];
                }
                rows.push([
                    year, 
                    yeardata[year]['in'], 
                    yeardata[year]['sat_in'], 
                    yeardata[year]['sun_in'], 
                    yeardata[year]['out'], 
                    yeardata[year]['sat_out'], 
                    yeardata[year]['sun_out'],
                    total
                ]);
                var row2total = 0.01*(
                    yeardata[year]['early_in'] + yeardata[year]['early_out'] +
                    yeardata[year]['am_in'] + yeardata[year]['am_out'] +
                    yeardata[year]['mid_in'] + yeardata[year]['mid_out'] +
                    yeardata[year]['pm_in'] + yeardata[year]['pm_out'] +
                    yeardata[year]['late_in'] + yeardata[year]['late_out']                
                );
                
                var f_yr = yeardata[year]['f_yr'];
                var r_yr = yeardata[year]['r_yr'];
                var s_yr = yeardata[year]['s_yr'];
                if (f_yr == undefined) { f_yr = 0; }
                if (r_yr == undefined) { r_yr = 0; }
                if (s_yr == undefined) { s_yr = 0; }
                var row2NRtotal = 0.01*(f_yr+r_yr+s_yr); //Not "total" as (unlike above) we only want a total here, if there is component data.
                
                if (row2total > 0 || row2NRtotal > 0)
                {
                    rows2.push([
                        year,
                        yeardata[year]['early_in']/row2total, 
                        yeardata[year]['early_out']/row2total, 
                        yeardata[year]['am_in']/row2total, 
                        yeardata[year]['am_out']/row2total, 
                        yeardata[year]['mid_in']/row2total, 
                        yeardata[year]['mid_out']/row2total, 
                        yeardata[year]['pm_in']/row2total, 
                        yeardata[year]['pm_out']/row2total, 
                        yeardata[year]['late_in']/row2total,
                        yeardata[year]['late_out']/row2total,
                        f_yr/row2NRtotal,
                        r_yr/row2NRtotal,
                        s_yr/row2NRtotal,
                    ]);
                }                    
            }
        }
        
        dataTable.addRows(rows);
        dataTable2.addRows(rows2);
        coloursForKey = ["#ff0000", "#00ff00", "#00aaff", "#aa0000", "#00aa00", "#0055aa", "#aaaaaa", "#aaaaaa"];
        coloursForKey2 = ["#ff0000", "#aa0000", "#ffff00", "#aaaa00", "#00ff00", "#00aa00", "#00ffff", "#00aaaa", "#0000ff", "#0000aa", "#0000ff", "#00ff00", "#ff0000"];

        var options = {
            chart: {
              pointsVisible: true,
              fontSize: 10
            },
            backgroundColor: { fill: "transparent" },
            chartArea: { backgroundColor: "transparent" },
            colors: coloursForKey,
            legend: {position: "none"},
            //tooltip: { isHtml: true, textStyle: { fontSize: 11 } },
            width: 250,
            height: 180,
            hAxis: {
                textStyle: { fontName: "Arial", fontSize: "10", color: "white", bold: false },
                baselineColor: "#444",
                title: "",
            },
            vAxis: {
                minValue: 0,
                viewWindow: { min: 0 },
                textStyle: { fontName: "Arial", fontSize: "10", color: "white", bold: false },
                gridlines: { color: "#444" },
            }    
        };

        var options2 = {
            chart: {
              pointsVisible: true,
              fontSize: 10
            },
            backgroundColor: { fill: "transparent" },
            chartArea: { backgroundColor: "transparent" },
            bars: "horizontal",
            isStacked: true,
            series: {
                0: { color: coloursForKey2[0], }, 
                1: { color: coloursForKey2[1], }, 
                2: { color: coloursForKey2[2], }, 
                3: { color: coloursForKey2[3], }, 
                4: { color: coloursForKey2[4], }, 
                5: { color: coloursForKey2[5], }, 
                6: { color: coloursForKey2[6], }, 
                7: { color: coloursForKey2[7], }, 
                8: { color: coloursForKey2[8], }, 
                9: { color: coloursForKey2[9], }, 
                10: { color: coloursForKey2[10], }, 
                11: { color: coloursForKey2[11], }, 
                12: { color: coloursForKey2[12], }, 
            },                
            legend: {position: "none"},
            width: 250,
            height: 170,
            hAxis: {
                //format: "EEE HH:mm",
                gridlines: { color: "#444", count: 4 },
                textStyle: { fontName: "Arial", fontSize: "10", color: "white", bold: false },
                baselineColor: "#444",
                title: "",
            },
            vAxis: {
                textStyle: { fontName: "Arial", fontSize: "10", color: "white", bold: false },
                gridlines: { color: "#444" },
                title: "",
            }    
        };

        var optionsMaterial = google.charts.Line.convertOptions(options);
        var chart = new google.charts.Line(document.getElementById("infotable1chart"));        
        chart.draw(dataTable, optionsMaterial);
        
        if (rows2.length > 0)
        {
            $("#infotable2").css("display", "block");        
            var optionsMaterial2 = google.charts.Bar.convertOptions(options2);
            var chart2 = new google.charts.Bar(document.getElementById("infotable2chart"));        
            chart2.draw(dataTable2, optionsMaterial2);
        }
        else
        {
            $("#infotable2").css("display", "none");
        }
    }
    updateUrl();
        
}

function updateUrl()
{
    var layerString = "";
    layerBackground.getVisible() ? layerString += "T" : layerString += "F";
    layerAerial.getVisible() ? layerString += "T" : layerString += "F";
    layerLines.getVisible() ? layerString += "T" : layerString += "F";
    layerZones.getVisible() ? layerString += "T" : layerString += "F";

    var centre = ol.proj.transform(olMap.getView().getCenter(), "EPSG:3857", "EPSG:4326");  
    if (selectClick != undefined)
    {
        var selectFeatures = selectClick.getFeatures();
        if (selectFeatures.getLength() > 0)
        {
            selectedId = selectFeatures.item(0).getId();
        }
    }

    var filter = "*";
    if (serviceFilter != undefined)
    {    
        filter = serviceFilter
    }
    window.location.hash = "/" + $("#themetric").val() + "/" + $("#year").val() + "/" + $("#yearcomp").val() + "/" + filter + "/" + selectedId + "/" + layerString + "/" + olMap.getView().getZoom() + "/" + centre[0].toFixed(4) + "/" + centre[1].toFixed(4) + "/"; 
}

/* ****** Ad-hoc actions ****** */

function toggleBackground()
{
    if ($("#backgroundCB").prop("checked"))
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
        if ($("#aerialCB").prop("checked"))
        {
                layerAerial.setVisible(true);
        }
        else
        {
                layerAerial.setVisible(false);
        }
        updateUrl();
}

function toggleLines()
{
    layerLines.setVisible(($("#linesCB").prop("checked")));
    updateUrl();
}

function toggleZones()
{
    layerZones.setVisible(($("#zonesCB").prop("checked")));
    updateUrl();
}


function filterLine(reqFilter)
{
    if (serviceFilter === reqFilter)
    {
        serviceFilter = undefined;
    }
    else
    {
        serviceFilter = reqFilter;
    }
    handleChange(false);
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

function getRWTColour(ratio)
{
    var r = (2*ratio);
    var g = 2-(2*ratio);
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

//RatioNum between 0 and 1. Skew factor 0 = no effect. Boundary is the neutral value, between 0 and 1.
function enhance(ratioNum, skewFactor, boundary)
{
    if (ratioNum == 0) { return 0; }
    
    if (ratioNum < boundary)
    {
        ratioNum = ratioNum * Math.pow(ratioNum*(1.0/boundary), skewFactor);
    }
    else
    {
        ratioNum = 1.0 - (1.0-ratioNum) * Math.pow((1.0-ratioNum)*1.0/(1.0-boundary), skewFactor);
    }

    //Fix extremes to prevent conversion problems.
    if (ratioNum < 0.001)
    {
        ratioNum = 0.001;
    }
    if (ratioNum > 0.999)
    {
        ratioNum = 0.999;
    }    
    return ratioNum;
}

/*
function hex2rgb(hex) {
    if (hex.lastIndexOf("#") >= 0) {
        hex = hex.replace(/#/, '0x");
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

/*
function getKML()
{
    var features = [];
      layerPoints.getSource().forEachFeature(function(feature) 
      {
        var clone = feature.clone();
        clone.setId(feature.getId());  // clone does not set the id
        clone.getGeometry().transform("EPSG:3857", "EPSG:4326");
        features.push(clone);
      });
      var string = new ol.format.KML().writeFeatures(features);
    console.log(string);
}
*/

google.charts.load("current", {'packages':['line', 'bar']});
google.charts.setOnLoadCallback(function()
{
    $(document).ready(function()
    {
        init();
    });
});
