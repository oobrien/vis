<!DOCTYPE html>
<html lang="en">
<head>
	<meta http-equiv="Content-Type" content="text/html;charset=utf-8" />
	<meta property="og:title" content="London Tube Data Map" />
	<meta property="og:url" content="http://vis.oobrien.com/tube/#tongues" />
	<meta property="og:description" content="A datamap based around London's tube network." />
	<meta property="og:site_name" content="London Tube Data Map" /> 					
	<meta property="og:type" content="article" />
	<meta property="og:image" content="http://vis.oobrien.com/tube/images/thumbnail.png" />
	<meta property="fb:admins" content="507348039" />    
	<meta property="fb:app_id" content="114474805306975" />    
	<meta name="viewport" content="width=device-width, initial-scale=0.7, user-scalable=no, minimal-ui">

	<title>London Tube Data Map</title>
	<link rel="stylesheet" type="text/css" media="all" href="http://vis.oobrien.com/js/openlayers/v3.5.0-dist/ol.css" />	
	<link rel="stylesheet" type="text/css" media="all" href="style.css" />	
		<link rel="stylesheet" type="text/css" media="all" href="http://fonts.googleapis.com/css?family=Cabin+Condensed:400,500">

	<script type="text/javascript" src="http://vis.oobrien.com/js/jquery-1.11.1.min.js"></script>	     
	<script type="text/javascript" src="http://vis.oobrien.com/js/proj4.js"></script>	     
	<script type="text/javascript" src="http://vis.oobrien.com/js/openlayers/v3.5.0-dist/ol-debug.js"></script> 
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
					<div style='height: 25px; width: 140px;' class="fb-like" data-href="http://vis.oobrien.com/tube/" data-layout="button_count" data-action="like" data-show-faces="false" data-share="true"></div>			
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
		<div style='text-align: center; padding-bottom: 7px; '>Interactive map created by Oliver O'Brien, UCL. <a style='color: #666;' href="http://oobrien.com/2014/10/tube-tongues/">About</a>.<br /> 
		<!-- Tip: change the Metric drop-down to see other versions, or see <a style='color: #666;' href="http://oobrien.com/">my blog</a>.
		-->
		</div>
		<div id='poster'> 
			<div style='float: left; border: 2px dotted #aaf; padding: 3px 3px 0 3px; margin: 5px 5px 5px 5px; border-radius: 5px;'><a href="http://shop.oobrien.com/"><img src='images/tubetongues-micro.png' /></a></div>
			<div style='float: left; border: 2px dotted #aaf; padding: 3px 3px 0 3px; margin: 5px 5px 10px 5px; border-radius: 5px;'><a href="http://shop.oobrien.com/"><img src='images/northsouth-micro.png' /></a></div>
			<div style='text-align: center; padding: 13px 0; font-size: 12px; font-family: Apple Chancery, serif;'>
				<div><span style='color: red;'>New!</span> A print of Tube Tongues<br /> is available at <a style='color: #666;' href='http://shop.oobrien.com/'>shop.oobrien.com</a></div>
	</div>	
		</div>		
	</div>

	<div id="toppanel">
		<div id="title">London Tube Data Map</div>
		<table id='optionstable' style='font-size: 11px; border-collapse:collapse;'>
			<tr>

			<td style='background-color: #5577bb;'>
				Metric</td><td colspan='4' style='background-color: #5577bb;'><select id='metric' onchange='handleMetricChange()'>
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
				<option value='am_inout'>Entries vs Exits (Weekday AM Peak)</option>
				<option value='wdwe_out'>Weekday vs Saturday Exits</option>
				<option value='journeys'>Journeys (for 2012 & 2014)</option>
				<option value='tongues'>Tube Tongues</option>
				<option value='wardwords'>Tube Tongues (Wards)</option>
				<option value='occupation'>Working Lines</option>
				<option value='wardwork'>Working Lines (Wards)</option>
				<!-- <option value='crossrail'>Crossrail</option>
				<option value='overground'>Overground</option> -->

			</select></td>
				</tr>
				<tr><td style='height: 5px;' colspan='5'></td>
				<tr>
	
						<td style='background-color: #7788aa;'>
				Year</td><td style='background-color: #7788aa;'><select id='year' onchange='handleChange()'>
				<option value='none'> </option>
				<option value=2003>2003</option>
				<option value=2004>2004</option>
				<option value=2005>2005</option>
				<option value=2006>2006</option>
				<option value=2007>2007</option>
				<option value=2008>2008</option>
				<option value=2009>2009</option>
				<option value=2010>2010</option>
				<option value=2011>2011</option>
				<option value=2012>2012</option>
				<option value=2013>2013</option>
				<option value=2014>2014</option>
				<option value=2015 selected='selected'>2015</option>
				<option value=2016>2016</option>
				<option value=2017>2017</option>
				<option value=2018>2018</option>
				<option value=2019>2019</option>
				<option value=2020>2020</option>
			</select></td>
			<td></td>
			<td style='background-color: #778899;'>
				Compare with</td><td style='background-color: #778899;'><select id='yearcomp' onchange='handleChange()'>
				<option value='none' selected='selected'> </option>
				<option value=2003>2003</option>
				<option value=2004>2004</option>
				<option value=2005>2005</option>
				<option value=2006>2006</option>
				<option value=2007>2007</option>
				<option value=2008>2008</option>
				<option value=2009>2009</option>
				<option value=2010>2010</option>
				<option value=2011>2011</option>
				<option value=2012>2012</option>
				<option value=2013>2013</option>
				<option value=2014>2014</option>
			</select></td>
		
			</tr>
		</table>
		<div style='margin-top: 10px;'>
			<input type='checkbox' id='backgroundCB' checked='checked' onclick='toggleBackground()' />Background map
			<input type='checkbox' id='linesCB' checked='checked' onclick='toggleLines()' />Lines
			&nbsp;&nbsp;&nbsp;<button onclick='toggleEnglish()' id='englishB' style='display: none;' />Show/hide English</button>
		</div>
	</div>

	<div id="key">
		<div id='keytitle' onclick="toggleKey()">KEY</div>
		<!-- <div>Area proportional to selected metric value.</div><br /> -->
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
