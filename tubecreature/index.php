<!DOCTYPE html>
<html lang="en">
<head>
	<meta http-equiv="Content-Type" content="text/html;charset=utf-8" />
	<meta property="og:title" content="Tube Creature - London Tube Data Maps" />
	<meta property="og:url" content="http://tubecreature.com/#tongues" />
	<meta property="og:description" content="A datamap based around London's tube network." />
	<meta property="og:site_name" content="Tube Creature - London Tube Data Maps" /> 					
	<meta property="og:type" content="article" />
	<meta property="og:image" content="http://tubecreature.com/images/thumbnail.png" />
	<meta property="fb:admins" content="507348039" />    
	<meta property="fb:app_id" content="114474805306975" />    
	<meta name="viewport" content="width=device-width, initial-scale=0.7, user-scalable=no, minimal-ui">

	<title>Tube Creature</title>
	<link rel="stylesheet" type="text/css" media="all" href="http://vis.oobrien.com/js/openlayers/v4.6.4-dist/ol.css" />	
	<link rel="stylesheet" type="text/css" media="all" href="http://vis.oobrien.com/js/ol-cesium-v1.37/olcs.css" />	
	<link rel="stylesheet" type="text/css" media="all" href="http://vis.oobrien.com/js/jquery-ui-1.11.4/jquery-ui.structure.css" />		
	<link rel="stylesheet" type="text/css" media="all" href="http://vis.oobrien.com/js/jquery-ui-1.11.4/jquery-ui.theme.css" />		
	<link rel="stylesheet" type="text/css" media="all" href="style.css" />	
	<link href="https://fonts.googleapis.com/css?family=Varela+Round" rel="stylesheet">
	<link href="https://fonts.googleapis.com/css?family=Cabin+Condensed" rel="stylesheet">
	
	<script type="text/javascript" src="https://ajax.googleapis.com/ajax/libs/jquery/1.12.4/jquery.min.js"></script>	     
	<script type="text/javascript" src="http://vis.oobrien.com/js/jquery-ui-1.11.4/jquery-ui.js"></script>	     
	<script type="text/javascript" src="http://lib.oomap.co.uk/moment.js"></script>
	<script type="text/javascript" src="http://vis.oobrien.com/js/proj4.js"></script>	     
	<script type="text/javascript" src="http://vis.oobrien.com/js/openlayers/v4.6.4-dist/ol.js"></script> 
	<script type="text/javascript" src="http://vis.oobrien.com/js/ol-cesium-v1.37/Cesium/Cesium.js"></script> 
	<script type="text/javascript" src="http://vis.oobrien.com/js/ol-cesium-v1.37/olcesium.js"></script> 
	<script type="text/javascript" src="https://www.gstatic.com/charts/loader.js"></script>
	<script type="text/javascript" src="config.js?t=<?php echo time(); ?>"></script>
	<script type="text/javascript" src="main.js?t=<?php echo time(); ?>"></script>
	<!-- Global site tag (gtag.js) - Google Analytics -->
	<script async src="https://www.googletagmanager.com/gtag/js?id=UA-424605-14"></script>
	<script>
	  window.dataLayer = window.dataLayer || [];
	  function gtag(){dataLayer.push(arguments);}
	  gtag('js', new Date());

	  gtag('config', 'UA-424605-14');
	</script>
</head>
<body>   
	<div id="fb-root"></div>
	<script>(function(d, s, id) {
	  var js, fjs = d.getElementsByTagName(s)[0];
	  if (d.getElementById(id)) return;
	  js = d.createElement(s); js.id = id;
	  js.src = "//connect.facebook.net/en_GB/all.js#xfbml=1&appId=147487382078050";
	  fjs.parentNode.insertBefore(js, fjs);
	}(document, 'script', 'facebook-jssdk'));</script>

	<div id="mapcontainer">
	</div>	
	<div id='socialbuttons'>
		<table>
			<tr>
				<td>
					<div style='height: 25px; width: 140px;' class="fb-like" data-href="http://tubecreature.com/" data-layout="button_count" data-action="like" data-show-faces="false" data-share="true"></div>			
				</td>
				<td>
					<a href="https://twitter.com/share" class="twitter-share-button" data-via="oobr" data-hashtags="dataviz" data-dnt="true">Tweet</a>
					<script>!function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0],p=/^http:/.test(d.location)?'http':'https';if(!d.getElementById(id)){js=d.createElement(s);js.id=id;js.src=p+'://platform.twitter.com/widgets.js';fjs.parentNode.insertBefore(js,fjs);}}(document, 'script', 'twitter-wjs');</script>
				 </td>
			</tr>
		</table>
		<div id='about'>
			<span id='created'>Created by </span><a href="http://oobrien.com/">Oliver O'Brien</a>, UCL/<a href="http://cdrc.ac.uk/">CDRC</a>. 
			<a href="http://oobrien.com/2014/10/tube-tongues/">About this map</a>. <a href="http://github.com/oobrien/vis">GitHub</a>.<br />
			<div id='tip'>Tip: choose different data maps from the Metric drop-down.</div>
		<div id='status'>
			Load status: <span id='points'>Points</span> <span id='stats'>Stats</span> <span id='osis'>OSIs</span> <span id='lines'>Lines</span>
		</div>
			<a href='http://cdrc.ac.uk/'><img src='/images/cdrc_col_220.jpg' style='width: 220px; height: 69px; padding: 5px 15px' alt='CDRC' /></a>
			<div>A CDRC product. <a href="https://data.cdrc.ac.uk/dataset/stations">Download the station stats data</a></div>
		</div>
	</div>

	<div id="toppanel">
		<div id='creature'>
			<a href="/">
				<div class='cp' id='c1'>T</div>
				<div class='cp' id='c2'>U</div>
				<div class='cp' id='c3'>B</div>
				<div class='cp' id='c4'>E</div>
				<div class='cp' id='c5'>C</div>
				<div class='cp' id='c6'>R</div>
				<div class='cp' id='c7'>E</div>
				<div class='cp' id='c8'>A</div>
				<div class='cp' id='c9'>T</div>
				<div class='cp' id='c10'>U</div>
				<div class='cp' id='c11'>R</div>
				<div class='cp' id='c12'>E</div>
			</a>
		</div>
		
		<div id="title">London Tube Data Maps</div>
		<div id="subtitle">Select a metric from the drop-down...</div>
		<div id='optionstable'>
			<div>
				<div style='float: left; style='background-color: #5577bb;'>
					Metric
				</div>
				<div style='background-color: #5577bb;'>
					<select id='themetric' onchange='handleMetricChange(false)'>
						<option value='map'>Network Map</option>
						<option value='night'>Night Tube Map</option>
						<option value='osi'>Free Transfers</option> 
						<option value='total' selected='selected'>Annual Entries/Exits</option>
						<option value='in'>Weekday Entries</option>
						<option value='out'>Weekday Exits</option>
						<option value='early_in'>Weekday Early Entry</option>
						<option value='early_out'>Weekday Early Exit</option>
						<option value='am_in'>Weekday AM Peak Entry</option>
						<option value='am_out'>Weekday AM Peak Exit</option>
						<option value='mid_in'>Weekday Interpeak Entry</option>
						<option value='mid_out'>Weekday Interpeak Exit</option>
						<option value='pm_in'>Weekday PM Peak Entry</option>
						<option value='pm_out'>Weekday PM Peak Exit</option>
						<option value='late_in'>Weekday Evening Entry</option>
						<option value='late_out'>Weekday Evening Exit</option>
						<option value='sat_in'>Saturday Entry</option>
						<option value='sat_out'>Saturday Exit</option>
						<option value='sun_in'>Sunday Entry</option>
						<option value='sun_out'>Sunday Exit</option>
						<option value='am_inout'>Entries vs Exits (AM peak)</option>
						
						<option value='peaktime'>Peak Time of Entry</option>
						
						<option value='wdwe_out'>Weekday vs Saturday Exits</option>
						<option value='journeys'>Journey Destinations</option>
						<option value='tongues'>Tube Tongues</option>
						<option value='wardwords'>Tube Tongues (wards)</option>
						<option value='occupation'>Working Lines</option>
						<option value='wardwork'>Working Lines (wards)</option>
						<option value='livesontheline'>Lives on the Line</option>
						
						<option value='houseprices'>House Prices (live)</option>
						<option value='housepricesdiff'>House Prices &Delta;  (live)</option>
						
						<option value='closures'>Tube Disruption Map (live)</option>
						
						<option value='nrmap'>NR: Network Map</option>
						<option value='nrtotal'>NR: Annual Entries/Exits</option>
						<option value='nrtickets'>NR: Ticket Type</option>
						
					</select>
				</div>
			</div>
			<div>
				<div style='float: left; width: 80px; background-color: #7788aa;'>
					Data Year</div>
				<div style='background-color: #7788aa;'>
					<select id='year' onchange='handleChange()'>
					</select>
				</div>
			</div>
			<div>
				<div style='float:left; width: 80px; background-color: #7788aa;'>
					Compare with</div>
				<div style='background-color: #7788aa;'>
					<select id='yearcomp' onchange='handleChange()'>
					</select>
				</div>
			</div>
			<div>
				<div style='float: left; width: 80px; background-color: #7788aa;'>
					Network Year</div>
				<div style='background-color: #7788aa;'>
					<select id='networkYear' onchange='handleChange()'>
					</select>
				</div>
			</div>
			
		</div>
		<div id='layerbuttons'>
			<input type='checkbox' id='backgroundCB' checked='checked' onclick='toggleBackground()' />Basemap
            <input type='checkbox' id='aerialCB' onclick='toggleAerial()' />Satellite
            <input type='checkbox' id='threedCB' onclick='toggle3D()' />3D<br />
			<input type='checkbox' id='linesCB' checked='checked' onclick='toggleLines()' />Lines
			<input type='checkbox' id='stationsCB' checked='checked' onclick='toggleStations()' />Stations
			<input type='checkbox' id='zonesCB' onclick='toggleZones()' />Zones
			<div id='englishB' style='background-color: #7788aa;'>
				<button onclick='toggleEnglish()' />Show/hide English</button>
			</div>
		</div>

		<div id="key">
			<table id="keyTable">
				<tr><td><div id="key1" class='keyBox'></div></td><td><div id="key2" class='keyBox'></div></td></tr>
				<tr><td colspan='2'><div id="key1text"></div></td></tr>
			</table>
			<div id='closures'>
				<table id='counts'><th style='color: white;'>Stations<br />Open</th><th style='color: #ffaa00;'>Stations<br />Part-Closed</th><th style='color: #ff0000;'>Stations<br />Closed</th><th style='color: #ff0000;'>Disrupted<br />Segments</th></tr>
				<tr><td style='color: white;' id='countopen'></td><td style='color: #ffaa00;' id='countpc'></td><td style='color: #ff0000;' id='countclosed'></td><td  style='color: #ff0000;' id='countsegments'></td></tr></table>
			
				<div id='loadingDisruption'>Loading disruption data...<br /><img src='/images/spinner.gif' style='width: 16px; height: 16px;' alt='...' /></div>
			</div>
			<div id='linekey'></div>
		</div>	
		<div id='attribution'>
		Source data Crown &copy; & database right ONS, ORR, SDG, WDTK, OS, OSM & HERE. For full attribution, see the "i" button on the map.
		</div>
	</div>

	<div id="info">
		<div id='closebuttonpanel'>
			<button id='closebutton'>x</button>
		</div>
		<div id='infotitle'>
		</div>
		<div id='infotable1'>
			<div id='infotable1title'>
			</div>
			<div id='infotable1chart'>
			</div>
		</div>
		<div id='infotable2'>
			<div id='infotable2title'>
			</div>
			<div id='infotable2chart'>
			</div>
		</div>
	</div>

	<div id='areainfo'></div>

	<div style='display: none; position: absolute; bottom: 10px; right: 10px; width: 150px;' id="button">
		<button type="button" onclick="bust();">View in full browser window</button>
	</div>
	
</body>
</html>
