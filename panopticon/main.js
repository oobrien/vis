var counterInterval;
var currcount;
var lon;
var lat;

var locations = {};
locations.trafalgarsq = [51.50799, -0.12816];
locations.oxfordcircus = [51.51527, -0.14246];
locations.camdentown = [51.53874, -0.14245];
locations.oldstreet = [51.52565, -0.08692];
locations.tottenhamhale = [51.5883, -0.0562];
locations.bigben = [51.50068, -0.12458];
locations.stratford = [51.54189, 0.00048];
locations.blackfriars = [51.50990, -0.10436];

var args;

function init()
{
	args = []

	var hash = window.location.search;

	if (hash.length > 0)
	{
		var elements = hash.split('&');
		elements[0] = elements[0].substring(1); /* Remove the # */

		for(var i = 0; i < elements.length; i++)
		{
			var pair = elements[i].split('=');
			args[pair[0]] = pair[1];
		}
	}
	
	if ((args['lat'] && args['lon']) || args['location'])
	{
		setLocationURL();
	}
	else
	{
		$('#location').val('geo');
		setLocationFromGeo();							
	}

}

function setLocationFromGeo()
{
	$('#countdown').css('display', 'none');
	if (navigator.geolocation) 
	{
		navigator.geolocation.getCurrentPosition(function(position)
		{
			lat = position.coords.latitude;
			lon = position.coords.longitude;
			//if (lat > 52 && lat < 52 && lon > 1 && lon < 1) //Test for defaulting.
			if (lat > 51 && lat < 52 && lon > -1 && lon < 1)			
			{
				requestCams();
				$('#locationText').html("Location: " + lat + ', ' + lon + '');
			}
			else
			{
				alert("It looks like you aren't near London. The Panopticon will therefore default to Trafalgar Square.");
				useDefaultLocation(null);
			}
		}, useDefaultLocation, { enableHighAccuracy: true, timeout: 5000, maximumAge: 300000 });
	}
	else
	{
		useDefaultLocation(null);
	}
}

function useDefaultLocation(error)
{
	$('#location').val('trafalgarsq');
	lat = locations.trafalgarsq[0];
	lon = locations.trafalgarsq[1];
	requestCams();
	$('#locationText').html("Location: " + lat + ', ' + lon + ' (default)');
}

function setLocationManual()
{
	if ($('#location').val() == "geo")
	{
		setLocationFromGeo();
	}
	else
	{	
		lat = locations[$('#location').val()][0];
		lon = locations[$('#location').val()][1];
		requestCams();
	}
	$('#locationText').html("Location: " + lat + ', ' + lon + '');
}

function setLocationURL()
{
	if (args['lat'] && args['lon'])
	{
		lat = args['lat'];
		lon = args['lon'];
	}
	else
	{
		for (var location in locations)
		{
			if (location === args['location'])
			{
				lat = locations[location][0];
				lon = locations[location][1];
				$('#location').val(location);
				continue;
			}
		}
	}
	requestCams();
	$('#locationText').html("Location: " + lat + ', ' + lon + '');
}

function requestCams()
{
	clearInterval(counterInterval);
	counterInterval = null;
	
	$('#countdown').css('display', 'none');
	$('#loadingDisruption').css('display', 'block');
	
	$.ajax(
	{
		//url: "jamcams-camera-list.xml",
		//url: "https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/jamcams-camera-list.xml",
		url: "https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/jamcams-camera-list.xml",
		success: function(data)
		{
			handleCams(data);
		},
		dataType: 'xml',
		async:true
	});

}

function sortCamsbydistance(a, b)
{
	if (a[3] == b[3]) return 0;
	if (a[3] < b[3]) return -1;
	else return 1;
}

function handleCams(data)
{
	
	var camlist = [];
	var cams = data.getElementsByTagName('syndicatedFeed')[0].getElementsByTagName('cameraList')[0].getElementsByTagName('camera');
	for (var i = 0; i < cams.length; i++)
	{
		var cam = cams[i];
	
		var camlat = cam.getElementsByTagName('lat')[0].innerHTML;
		var camlon = cam.getElementsByTagName('lng')[0].innerHTML;
		var camname = cam.getElementsByTagName('location')[0].innerHTML;
		var camid = cam.getElementsByTagName('file')[0].innerHTML;
		if (camid.length >4) 
		{
			camid = camid.substring(0, camid.length-4) + ".mp4";

		}
		var hacklat = 1.607*lat; // 1/cos 51.51 degrees.
		var camhacklat = 1.607*camlat;
		var opp = camlon-lon;
		var adj = camhacklat-hacklat;
		var hackanglec = Math.atan(opp/adj)*180/Math.PI;
		var hackdistance = (adj*adj) + (opp*opp);
		
		if (opp > 0 && adj > 0) { hackanglec = hackanglec; } 
		if (opp < 0 && adj > 0) { hackanglec = 360 + hackanglec } 
		if (opp > 0 && adj < 0) { hackanglec = 180 + hackanglec } 
		if (opp < 0 && adj < 0) { hackanglec = 180 + hackanglec } 
		
		camlist.push([camid, camname, hackanglec, hackdistance]);			
	}
	
	camlist.sort(sortCamsbydistance);
	
	// N 337.5 - 22.5
	// NE 22.5 - 67.5
	// E 67.5 - 112.5
	// SE 112.5 - 157.5
	// S 157.5 - 202.5
	// SW 202.5 - 247.5
	// W 247.5 - 292.5
	// NW 292.5 - 337.5
	var wincams = { };
	var wincount = 0;
	
	for (var j = 0; j < camlist.length; j++)
	{		
		if (wincount > 7) { break; }

		var hackangle = camlist[j][2];
				
		if (((hackangle > 337.5 && hackangle < 360) || (hackangle >= 0 && hackangle <= 22.5)) && !wincams.N)
		{
			wincams.N = [camlist[j][0], camlist[j][1]];
			wincount++;
		}
		else if (hackangle > 22.5 && hackangle <=67.5 && !wincams.NE)
		{
			wincams.NE = [camlist[j][0], camlist[j][1]];
			wincount++;
		}
		else if (hackangle > 67.5 && hackangle <=112.5 && !wincams.E)
		{
			wincams.E = [camlist[j][0], camlist[j][1]];
			wincount++;
		}
		else if (hackangle > 112.5 && hackangle <=157.5 && !wincams.SE)
		{
			wincams.SE = [camlist[j][0], camlist[j][1]];
			wincount++;
		}
		else if (hackangle > 157.5 && hackangle <=202.5 && !wincams.S)
		{
			wincams.S = [camlist[j][0], camlist[j][1]];
			wincount++;
		}
		else if (hackangle > 202.5 && hackangle <=247.5 && !wincams.SW)
		{
			wincams.SW = [camlist[j][0], camlist[j][1]];
			wincount++;
		}
		else if (hackangle > 247.5 && hackangle <=295.5 && !wincams.W)
		{
			wincams.W = [camlist[j][0], camlist[j][1]];
			wincount++;
		}
		else if (hackangle > 295.5 && hackangle <=337.5 && !wincams.NW)
		{
			wincams.NW = [camlist[j][0], camlist[j][1]];
			wincount++;
		}
		//console.log(camlist[j][0] + ", " + camlist[j][1] + ", " + camlist[j][2] + ", " + camlist[j][3])
	}

	var time = new Date().getTime();
	
	if (!wincams.NW) { wincams.NW = ["", "No camera"]; }
	if (!wincams.N) { wincams.N = ["", "No camera"]; }
	if (!wincams.NE) { wincams.NE = ["", "No camera"]; }
	if (!wincams.E) { wincams.E = ["", "No camera"]; }
	if (!wincams.SE) { wincams.SE = ["", "No camera"]; }
	if (!wincams.S) { wincams.S = ["", "No camera"]; }
	if (!wincams.SW) { wincams.SW = ["", "No camera"]; }
	if (!wincams.W) { wincams.W = ["", "No camera"]; }
	$('#camimgNW').html('<video autoplay="true" width="100%" height="100%" loop="true" src="https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/' + wincams.NW[0] + '?t=' + time + '">');
	$('#camimgN').html('<video autoplay="true" width="100%" height="100%" loop="true" src="https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/' + wincams.N[0] + '?t=' + time + '">');
	$('#camimgNE').html('<video autoplay="true" width="100%" height="100%" loop="true" src="https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/' + wincams.NE[0] + '?t=' + time + '">');
	$('#camimgW').html('<video autoplay="true" width="100%" height="100%" loop="true" src="https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/' + wincams.W[0] + '?t=' + time + '">');
	$('#camimgE').html('<video autoplay="true" width="100%" height="100%" loop="true" src="https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/' + wincams.E[0] + '?t=' + time + '">');
	$('#camimgSW').html('<video autoplay="true" width="100%" height="100%" loop="true" src="https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/' + wincams.SW[0] + '?t=' + time + '">');
	$('#camimgS').html('<video autoplay="true" width="100%" height="100%" loop="true" src="https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/' + wincams.S[0] + '?t=' + time + '">');
	$('#camimgSE').html('<video autoplay="true" width="100%" height="100%" loop="true" src="https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/' + wincams.SE[0] + '?t=' + time + '">');
	$('#camnameNW').html(wincams.NW[1]);
	$('#camnameN').html(wincams.N[1]);
	$('#camnameNE').html(wincams.NE[1]);
	$('#camnameW').html(wincams.W[1]);
	$('#camnameE').html(wincams.E[1]);
	$('#camnameSW').html(wincams.SW[1]);
	$('#camnameS').html(wincams.S[1]);
	$('#camnameSE').html(wincams.SE[1]);

	
	$('#loadingDisruption').css('display', 'none');
	$('#countdown').css('display', 'block');
	currcount = 120;
	counterInterval = setInterval(decrementCounter, 1000);
}

function decrementCounter()
{
	$('#countdowntimer').html(currcount--);
	if (currcount === 0)
	{
		clearInterval(counterInterval);
		counterInterval = null;
		$('#loadingDisruption').css('display', 'block');
		$('#countdown').css('display', 'none');
		requestCams();
	}
	
}

$(document).ready(function() {
	init();
});
