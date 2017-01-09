<!DOCTYPE html>
<html lang="en">
<head>
	<meta http-equiv="Content-Type" content="text/html;charset=utf-8" />
	<meta property="og:title" content="Tube Line Closure Map" />
	<meta property="og:url" content="http://vis.oobrien.com/tube/closures/" />
	<meta property="og:description" content="A datamap based around London's tube network." />
	<meta property="og:site_name" content="Tube Line Closures Map" /> 					
	<meta property="og:type" content="article" />
	<meta property="og:image" content="http://vis.oobrien.com/tube/closures/thumbnail.png" />
	<meta property="fb:admins" content="507348039" />    
	<meta property="fb:app_id" content="114474805306975" />    
	<meta name="viewport" content="width=device-width, initial-scale=0.7, user-scalable=no, minimal-ui">

	<title>Tube Line Closure Map</title>
	<link rel="stylesheet" type="text/css" media="all" href="http://vis.oobrien.com/js/openlayers/v3.19.1-dist/ol.css" />	
	<link rel="stylesheet" type="text/css" media="all" href="style.css" />	
	<link rel="stylesheet" type="text/css" media="all" href="http://fonts.googleapis.com/css?family=Hammersmith+One">
	<link rel="stylesheet" type="text/css" media="all" href="http://vis.oobrien.com/js/jquery-ui-1.10.4/themes/base/jquery-ui.css" />		

	<script type="text/javascript" src="http://vis.oobrien.com/js/jquery-1.11.1.min.js"></script>	     
	<script type="text/javascript" src="http://vis.oobrien.com/js/jquery-ui-1.10.4/ui/jquery-ui.js"></script>
	<script type="text/javascript" src="moment.js"></script>
	<script type="text/javascript" src="http://vis.oobrien.com/js/proj4.js"></script>	     
	<script type="text/javascript" src="http://vis.oobrien.com/js/openlayers/v3.19.1-dist/ol-debug.js"></script> 
	<script type="text/javascript" src="main.js"></script>
	<script>
	  (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
	  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
	  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
	  })(window,document,'script','//www.google-analytics.com/analytics.js','ga');

	  ga('create', 'UA-424605-12', 'oobrien.com');
	  ga('send', 'pageview');
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
	
	<div id="toppanel">
		<div id="title">Tube Line Closure Map</div>
				Show: <select id='dates' onchange='requestDisruptionData()'>
				<option value='live'>Live right now</option>
				<option value='today'>Today (any time)</option>
				<option value='thiswe'>This Weekend (any time)</option>
				<option value='nextwe'>Next Weekend (any time)</option>
				<option value='2015-05-31'>31 May 2015 (locally cached)</option>
				<option value='2015-06-07'>7 June 2015 (locally cached)</option>
			</select><br /><div style='margin-top: 10px;'>
		Toggle: <button onclick='toggleBackground()'>Background Map</button><button onclick='toggleBlinking()'>Blinking</button></div>
			<div id='explanationkey' style='width: 240px; margin: 10px 0; text-align: left; font-size: 9px;'>This map uses 
				the live disruption data from the <a href="https://www.tfl.gov.uk/info-for/open-data-users/">TfL API</a>, on a geographically accurate tube map <a href="https://github.com/oobrien/vis/tree/master/tube/data">derived from OpenStreetMap data</a>. 
				Disrupted line sections are shown as flashing dots. Free <a href="http://www.oyster-rail.org.uk/interchanging-trains/">out-of-station interchanges</a> are shown with connecting blobs. Red stations are closed. Orange stations are partially closed.
			See the <a href="https://tfl.gov.uk/tube-dlr-overground/status/">official site</a> for details of the disruptions. 
			Data updates every few minutes.
			
			<table id='counts'><th style='color: white;'>Stations<br />Open</th><th style='color: #ffaa00;'>Stations<br />Part-Closed</th><th style='color: #ff0000;'>Stations<br />Closed</th></tr>
			<tr><td style='color: white;' id='countopen'></td><td style='color: #ffaa00;' id='countpc'></td><td style='color: #ff0000;' id='countclosed'></td></tr></table>
			
			Background map: <a href="https://developer.here.com/rest-apis">HERE Maps</a>. Lines/stations: <a href="http://osm.org/">OpenStreetMap</a>. Created by <a href="http://oobrien.com/">Oliver O'Brien</a> (<a href="http://twitter.com/oobr">@oobr</a>).
		</div>

		<div id='socialbuttons'>
			<table>
				<tr>
					<td>
						<div style='height: 25px; width: 140px;' class="fb-like" data-href="http://vis.oobrien.com/tube/closures/" data-layout="button_count" data-action="like" data-show-faces="false" data-share="true"></div>			
					</td>
					<td>
						<a href="https://twitter.com/share" class="twitter-share-button" data-via="oobr" data-related="spatialanalysis" data-hashtags="dataviz" data-dnt="true">Tweet</a>
						<script>!function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0],p=/^http:/.test(d.location)?'http':'https';if(!d.getElementById(id)){js=d.createElement(s);js.id=id;js.src=p+'://platform.twitter.com/widgets.js';fjs.parentNode.insertBefore(js,fjs);}}(document, 'script', 'twitter-wjs');</script>
					 </td>
				</tr>
			</table>
		</div>
		<div id='loadingDisruption'>Loading closure data...<br /><img src='spinner.gif' style='width: 16px; height: 16px;' alt='...' /></div>
	</div>

	<div id="key">
		<div id='keytitle' onclick="toggleKey()">KEY</div>
		Lines (click bar to filter)
		<div id='linekey'>

		</div>
	</div>	
	<div id="info">
	</div>
	
	</body>
</html>
