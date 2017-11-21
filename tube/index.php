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
	<link rel="stylesheet" type="text/css" media="all" href="http://lib.oomap.co.uk/openlayers/v4.5.0-dist/ol.css" />	
	<link rel="stylesheet" type="text/css" media="all" href="style.css" />	
	<link href="https://fonts.googleapis.com/css?family=Varela+Round" rel="stylesheet">
	<link href="https://fonts.googleapis.com/css?family=Cabin+Condensed" rel="stylesheet">
	
	<script type="text/javascript" src="http://lib.oomap.co.uk/jquery-1.12.4.js"></script>	     
	<script type="text/javascript" src="http://lib.oomap.co.uk/proj4.js"></script>	     
	<script type="text/javascript" src="http://lib.oomap.co.uk/openlayers/v4.5.0-dist/ol-debug.js"></script> 
	<script type="text/javascript" src="config.js"></script>
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
				<?php //<td>
				//	<a href="https://twitter.com/oobr" class="twitter-follow-button" data-show-count="false" data-dnt="true">Follow @oobr</a>
				//	<script>!function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0],p=/^http:/.test(d.location)?'http':'https';if(!d.getElementById(id)){js=d.createElement(s);js.id=id;js.src=p+'://platform.twitter.com/widgets.js';fjs.parentNode.insertBefore(js,fjs);}}(document, 'script', 'twitter-wjs');</script>
				//</td> ?>
			</tr>
		</table>
		<div style='text-align: center; padding-bottom: 7px; '>Interactive map created by Oliver O'Brien, UCL. <a style='color: #666;' href="http://oobrien.com/2014/10/tube-tongues/">About</a>.<br /><a href="http://tubecreature.com/closures/">See the live closures map</a>.<br /> 
		<!-- Tip: change the Metric drop-down to see other versions, or see <a style='color: #666;' href="http://oobrien.com/">my blog</a>.
		-->
		</div>
		
		<div id='poster'> <!--
			<div style='float: left; border: 2px dotted #aaf; padding: 3px 3px 0 3px; margin: 5px 5px 5px 5px; border-radius: 5px;'><a href="http://shop.oobrien.com/"><img src='images/tubetongues-micro.png' /></a></div>
			<div style='float: left; border: 2px dotted #aaf; padding: 3px 3px 0 3px; margin: 5px 5px 10px 5px; border-radius: 5px;'><a href="http://shop.oobrien.com/"><img src='images/northsouth-micro.png' /></a></div>
			<div style='text-align: center; padding: 13px 0; font-size: 12px; font-family: Apple Chancery, serif;'>
			<div><span style='color: red;'>New!</span> A print of Tube Tongues<br /> is available at <a style='color: #666;' href='http://shop.oobrien.com/'>shop.oobrien.com</a></div>
		-->
		</div>	
			
		</div>		
	</div>

	<div id="toppanel">
		<div id='creature'><div id='p1'>&nbsp;</div><div id='p2'>&nbsp;</div><div id='p3'>&nbsp;</div><div id='p4'>&nbsp;</div><div id='p5'>&bull;&bull;</div></div>
		<div id="supertitle">Tube Creature</div>
		<div id="title">London Tube Data Maps</div>
		<div id="subtitle">Loading...</div>
		<table id='optionstable'>
			<tr>
				<td style='background-color: #5577bb;'>
					Metric
				</td>
				<td colspan='4' style='background-color: #5577bb;'>
					<select id='themetric' onchange='handleMetricChange()'>
						<option value='map'>Network Map</option>
						<option value='night'>Night Tube Map</option>
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
						<option value='wdwe_out'>Weekday vs Saturday Exits</option>
						<option value='journeys'>Journey Destinations</option>
						<option value='tongues'>Tube Tongues</option>
						<option value='wardwords'>Tube Tongues (wards)</option>
						<option value='occupation'>Working Lines</option>
						<option value='wardwork'>Working Lines (wards)</option>
						<option value='livesontheline'>Lives on the Line</option>
						<option value='houseprices'>House Prices</option>
						<option value='housepricesdiff'>House Prices &Delta;</option>
						<option value='closures'>Tube Disruption Map (live!)</option>
						<!-- <option value='crossrail'>Crossrail</option>
						<option value='overground'>Overground</option> -->
					</select>
				</td>
			</tr>
			<tr>	
				<td style='background-color: #7788aa;'>
					Data Year</td><td style='background-color: #7788aa;'>
					<select id='year' onchange='handleChange()'>
					</select>
				</td>
				<td></td>
				<td style='background-color: #778899;'>
					Compare with</td><td style='background-color: #778899;'>
					<select id='yearcomp' onchange='handleChange()'>
					</select>
				</td>
			</tr>	
			<tr>	
				<td style='background-color: #7788aa;'>
					Network Year</td><td style='background-color: #7788aa;'>
					<select id='networkYear' onchange='handleChange()'>
					</select>
				</td>
				<td></td>
				<td id='englishB' style='background-color: #7788aa;' colspan='2'><button onclick='toggleEnglish()' />Show/hide English</button>
				</td>
			</tr>
			
		</table>
		<div style='margin-top: 10px;'>
			<input type='checkbox' id='backgroundCB' checked='checked' onclick='toggleBackground()' />Background map
            <input type='checkbox' id='aerialCB' onclick='toggleAerial()' />Aerial image
			<input type='checkbox' id='linesCB' checked='checked' onclick='toggleLines()' />Lines
			<input type='checkbox' id='zonesCB' onclick='toggleZones()' />Zones
		</div>
	</div>

	<div id="key">
		<div id='keytitle' onclick="toggleKey()">KEY</div>
		<!-- <div>Area proportional to selected metric value.</div><br /> -->
		<div id='areainfo'></div>
		<table id="keyTable">
			<tr><td><div id="key1" class='keyBox'></div></td><td><div id="key2" class='keyBox'></div></td></tr>
			<tr><td colspan='2'><div id="key1text"></div></td></tr>
		</table>

		<div id='linekey'>

		</div>
	</div>	
	<div id="info">
	</div>

	<div style='display: none; position: absolute; bottom: 10px; left: 10px; width: 150px;' id="button">
		<button type="button" onclick="bust();">View in full browser window</button>
	</div>
	
</body>
</html>
