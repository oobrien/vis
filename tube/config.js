var defaultJourneyStart = 322; /* Brixton */

var demographicMap = {};

demographicMap["tongues"] = { 
	"c002": ["English", "#222222"],
	"c012": ["French", "#ccccff"],
	"c013": ["Portuguese", "#00ff00"],
	"c014": ["Spanish", "#ccff00"],
	"c016": ["Italian", "#6666ff"],
	"c017": ["German", "#ffffff"],
	"c018": ["Polish", "#00cccc"],
	"c019": ["Slovak"],
	"c020": ["Czech"],
	"c021": ["Romanian", "#009999"],
	"c022": ["Lithuanian", "#006666"], 
	"c023": ["Latvian"],
	"c024": ["Hungarian"],
	"c025": ["Bulgarian"],
	"c026": ["Greek", "#aa0000"],
	"c027": ["Dutch", "#ffffff"],
	"c028": ["Swedish", "#ffffff"],
	"c031": ["Estonian"],
	"c036": ["Albanian", "#ffffff"],	
	"c037": ["Serbian/Croatian/Bosnian"],	
	"c040": ["Northern European Language (non EU)"],
	"c043": ["Yiddish", "#ffffff"],
	"c044": ["Russian", "#ffffff"],
	"c045": ["Turkish", "#ff0088"],
	"c046": ["Arabic", "#ffff00"],
	"c048": ["Hebrew", "#ffffff"],
	"c049": ["Kurdish"],
	"c050": ["Persian", "#444400"],
	"c051": ["Pashto"],
	"c052": ["West, Central Asian Language (not Hebrew, Kurdish, Persian/Farsi or Pashto)"],
	"c054": ["Urdu", "#ffcc00"],
	"c055": ["Hindi", "#ffffff"],
	"c056": ["Panjabi", "#ff3300"],
	"c058": ["Bengali", "#ff9900"],
	"c059": ["Gujarati", "#ffaaaa"],
	"c060": ["Marathi"],
	"c061": ["Telugu", "#ffffff"],
	"c062": ["Tamil", "#ff66ff"],
	"c063": ["Malayalam"],
	"c064": ["Sinhala"],
	"c065": ["Nepalese", "#ffffff"],
	"c066": ["South Asian Language (not Urdu, Hindi, Panjabi, Pahari/Mirpuri/Potwari, Bengali/Sylheti/Chatgaya, Gujarati, Marathi, Telugu, Tamil, Malayalam, Sinhala or Nepalese"],
	"c068": ["Mandarin"],
	"c069": ["Cantonese", "#ff0000"],
	"c070": ["Chinese ao", "#ff3333"],
	"c071": ["Japanese", "#8800ff"],
	"c072": ["Korean", "#ffffff"],
	"c073": ["Vietnamese"],
	"c074": ["Thai"],
	"c075": ["Malay"],
	"c076": ["Tagalog", "#00ffff"],
	"c077": ["East Asian Language (not Chinese languages, Japanese, Korean, Vietnamese, Thai, Malay or Tagalog/Filipino)"],
	"c084": ["Amharic"],
	"c085": ["Tigrinya"],
	"c086": ["Somali", "#0066ff"],
	"c088": ["Akan"],
	"c089": ["Yoruba", "#ffffff"],
	"c090": ["Igbo"],
	"c091": ["Swahili, Kiswahili"],
	"c092": ["Luganda"],
	"c095": ["Afrikaans", "#ffffff"],
	"c096": ["Other Nigerian languages (not Yoruba, Igbo)"],
	"c100": ["Miscellaneous languages"],
	"x": ["None significant", '#aaaaaa']
};

demographicMap["wardwords"] = demographicMap["tongues"];

demographicMap["occupation"] = {
	"c004": ["Chief exec/senior manager"],
	"c006": ["Functional\nmanager/\ndir", "#88bb88"],
	"c007": ["Financial institution manager/director", "#ffffff"],
	"c009": ["Protective (senior officer)", "#ffffff"],
	"c011": ["Retail manager/director", "#ffffff"],
	"c014": ["Hospitality or leisure manager/proprietor", "#ffffff"],
	"c016": ["Manager/proprietor (misc)", "#ffffff", "#ffffff"],
	"c019": ["Natural and Social Science professional", "#ffffff"],
	"c021": ["IT\nprof", "#aaaaff", "#ffffff"],
	"c025": ["Health\nprof", "#00ffff"],
	"c027": ["Nursing", "#66ffff"],
	"c029": ["Education", "#ff0000"],
	"c031": ["Legal\nprof", "#00ff00"],
	"c032": ["Business\nadmin\nprof", "#ff7700"],
	"c033": ["Architect, Town Planner, Surveyor"],	
	"c037": ["Media\nprof"],
	"c041": ["Draughtsperson or related architectural technician", "#ffffff"],
	"c047": ["Protective", "#ff00ff"],
	"c049": ["Artistic/\nLiterary/\nMedia", "#ffff00"],
	"c050": ["Design", "#ffffff"],
	"c055": ["Biz/fin\nasc prof", "#ddddaa"],
	"c056": ["Marketing\nasc prof", "#6644ff"],
	"c058": ["Public Services\nand misc\nasc prof", "#ffffff"],
	"c061": ["Government\nadmin", "#ffffff"],
	"c062": ["Financial\nadmin", "#ffffff"],
	"c063": ["Records\nadmin"],
	"c064": ["Admin - not government, finance or records"],
	"c067": ["Secretarial", "#00cc66"],
	"c075": ["Electrician", "#ffffff"],
	"c078": ["Construction", "#aa0066"],
	"c079": ["Building finishing"],
	"c084": ["Food prep/hospitality"],
	"c088": ["Childcare", "#ffffff"],
	"c090": ["Caring", "#66ff00"],
	"c092": ["Leisure/\ntravel", "#ffffff"],
	"c094": ["Housekeeping", "#ffffff"],
	"c098": ["Sales\nassist/\ncashier", "#ffaaaa"],
	"c102": ["Customer service"],
	"c106": ["Process operative"],
	"c111": ["Road Transport", "#00aaaa"],
	"c118": ["Elementary process plant"],
	"c121": ["Cleaning", "#aaaa00"],
	"c122": ["Security", "#cc00ff"],
	"c124": ["Elementary storage", "#000000"],
	"c125": ["Other\nelementary", "#996633"],	
};

demographicMap["wardwork"] = demographicMap["occupation"];

demographicMap["livesontheline"] = {
	75: ["75", "#ff0000"],
	76: ["76", "#ee1100"],
	77: ["77", "#dd2200"],
	78: ["78", "#cc3300"],
	79: ["79", "#bb4400"],
	80: ["80", "#aa5500"],
	81: ["81", "#996600"],
	82: ["82", "#887700"],
	83: ["83", "#778800"],
	84: ["84", "#669900"],
	85: ["85", "#55aa00"],
	86: ["86", "#44bb00"],
	87: ["87", "#33cc00"],
	88: ["88", "#22dd00"],
	89: ["89", "#11ee00"],
	90: ["90", "#00ff00"],
};

demographicMap["houseprices"];
demographicMap["housepricesdiff"];

var metricInfo = {};

metricInfo["map"] = {
	"title": "Geographical Tube Map",
	"subtitle": "The tube network in real life",
 	"defaultDataYear": 2017,
 	"availableDataYears": [2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020],
 	"defaultNetworkYear": 2017,
 	"tieNetworkToData": true,
 	"keyValues": [0.7, 0.7],
 	"yearcomp": false,
 	"scale": 15,
};

metricInfo["night"] = {
	"title": "Night Tube Map",
	"subtitle": "Friday/Saturday late nights",
 	"defaultDataYear": 2017,
 	"availableDataYears": [2017],
 	"defaultNetworkYear": 2017,
 	"tieNetworkToData": true,
 	"keyValues": [0.7, 0.7],
 	"yearcomp": false,
 	"scale": 15,
};

metricInfo["total"] = {
	"title": "London Tube Data Map",
	"subtitle": "Station Entry/Exit Volumes",
 	"defaultDataYear": 2016,
 	"availableDataYears": [2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016],
 	"availableDataYearsByNetwork": {
 		"Tube": [2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016],
 		"DLR": [2012, 2013, 2014, 2015, 2016],
 		"Tramlink": [2010, 2011, 2012, 2013, 2014],
 		"Overground": [2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015],
 		"Emirates Air Line": [],
 		"Crossrail": []
 	}, 
 	"defaultNetworkYear": 2016,
 	"tieNetworkToData": true,
 	"keyValues": [1000000, 20000000],
 	"yearcomp": true,
 	"scale": 0.01,
};

metricInfo["in"] = {
	"title": "London Tube Data Map",
	"subtitle": "Station Entry/Exit Volumes",
 	"defaultDataYear": 2016,
 	"availableDataYears": [2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016],
 	"availableDataYearsByNetwork": {
 		"Tube": [2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016],
 		"DLR": [2012, 2013, 2014, 2015, 2016],
 		"Tramlink": [],
 		"Overground": [],
 		"Emirates Air Line": [],
 		"Crossrail": []
 	}, 
 	"defaultNetworkYear": 2016,
 	"tieNetworkToData": true,
 	"keyValues": [1000, 5000],
 	"yearcomp": true,
 	"scale": 0.3,
};

metricInfo["out"] = metricInfo["in"];

metricInfo["early_in"] = {
	"title": "London Tube Data Map",
	"subtitle": "Station Entry/Exit Volumes",
 	"defaultDataYear": 2016,
 	"availableDataYears": [2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2014, 2015, 2016],
 	"availableDataYearsByNetwork": {
 		"Tube": [2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2014, 2015, 2016],
 		"DLR": [],
 		"Tramlink": [],
 		"Overground": [],
 		"Emirates Air Line": [],
 		"Crossrail": []
 	}, 
 	"defaultNetworkYear": 2016,
 	"tieNetworkToData": true,
 	"keyValues": [1000, 5000],
 	"yearcomp": true,
 	"scale": 0.4,
};

metricInfo["early_out"] = metricInfo["early_in"];
metricInfo["am_in"] = metricInfo["early_in"];
metricInfo["am_out"] = metricInfo["early_in"];
metricInfo["mid_in"] = metricInfo["early_in"];
metricInfo["mid_out"] = metricInfo["early_in"];
metricInfo["pm_in"] = metricInfo["early_in"];
metricInfo["pm_out"] = metricInfo["early_in"];
metricInfo["late_in"] = metricInfo["early_in"];
metricInfo["late_out"] = metricInfo["early_in"];

metricInfo["sat_in"] = metricInfo["in"];
metricInfo["sat_out"] = metricInfo["in"];
metricInfo["sun_in"] = metricInfo["in"];
metricInfo["sun_out"] = metricInfo["in"];

metricInfo["am_inout"] = {
	"title": "London Tube Data Map",
	"subtitle": "AM peak Entry vs Exit Volumes",
 	"defaultDataYear": 2016,
 	"availableDataYears": [2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2014, 2015, 2016],
 	"availableDataYearsByNetwork": {
 		"Tube": [2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2014, 2015, 2016],
 		"DLR": [],
 		"Tramlink": [],
 		"Overground": [],
 		"Emirates Air Line": [],
 		"Crossrail": []
 	}, 
 	"defaultNetworkYear": 2016,
 	"tieNetworkToData": true,
 	"keyValues": [10000, 10000],
 	"yearcomp": false,
 	"scale": 0.4,
};

metricInfo["wdwe_out"] = {
	"title": "London Tube Data Map",
	"subtitle": "Weekday vs Weekend Exit Volumes",
 	"defaultDataYear": 2016,
 	"availableDataYears": [2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016],
 	"availableDataYearsByNetwork": {
 		"Tube": [2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2014, 2015, 2016],
 		"DLR": [],
 		"Tramlink": [],
 		"Overground": [],
 		"Emirates Air Line": [],
 		"Crossrail": []
 	}, 
 	"defaultNetworkYear": 2016,
 	"tieNetworkToData": true,
 	"keyValues": [10000, 10000],
 	"yearcomp": false,
 	"scale": 0.2,
};

metricInfo["journeys"] = {
	"title": "Journey Destinations",
	"subtitle": "For selected start station",
 	"defaultDataYear": 2016,
 	"availableDataYears": [2012, 2014, 2015, 2016],
 	"availableDataYearsByNetwork": {
 		"Tube": [2012, 2014, 2015, 2016],
 		"DLR": [],
 		"Tramlink": [],
 		"Overground": [],
 		"Emirates Air Line": [],
 		"Crossrail": []
 	}, 
 	"defaultNetworkYear": 2016,
 	"tieNetworkToData": true,
 	"keyValues": [1000, 50],
 	"yearcomp": true,
 	"scale": 1.6,
};

metricInfo["tongues"] = {
	"additional": "Persian includes Farsi. Bengali includes Sylheti &amp;<br />Chatgaya. Chinese ao excludes those who specified<br />Mandarin or Cantonese. Tagalog includes Filipino.<br /><br /><i>Inspired by <a href='http://life.mappinglondon.co.uk/'>Lives on the Line</a> by James Cheshire<br />&amp; <a href='http://mappinglondon.co.uk/2013/second-languages/'>Second Languages</a> by Neal Hudson.</i>",
	"file": "qs204ew_tubebuffer200m.json",
	"title": "Tube Tongues",
	"subtitle": "Second languages near London's tube stations",
	"subinfo": "Top primary languages spoken<br />by people living near here:", 
	"keyexample": "...of people living near here speak French - the second most common.",
 	"defaultkey": "c012",
 	"defaultDataYear": 2011,
 	"availableDataYears": [2011],
 	"defaultNetworkYear": 2019,
 	"tieNetworkToData": false,
 	"keyValues": [0.05, 0.10],
 	"infolimit": 0.005,
 	"scale": 220,
 	"yearcomp": false,
};

metricInfo["wardwords"] = {
	"additional": "Persian includes Farsi. Bengali includes Sylheti &amp;<br />Chatgaya. Chinese ao excludes those who specified<br />Mandarin or Cantonese. Tagalog includes Filipino.<br /><br /><i>Inspired by <a href='http://life.mappinglondon.co.uk/'>Lives on the Line</a> by James Cheshire<br />&amp; <a href='http://mappinglondon.co.uk/2013/second-languages/'>Second Languages</a> by Neal Hudson.</i>",
	"file": "qs204ew_wardsingle.json",
	"title": "Tube Tongues (Wards)",
	"subtitle": "Second languages by ward",
	"subinfo": "Top primary languages spoken<br />by people living in this ward:", 
	"keyexample": "...of people living in this ward speak French - the second most common.",
 	"defaultkey": "c012",
 	"defaultDataYear": 2011,
 	"availableDataYears": [2011],
 	"defaultNetworkYear": 2011,
 	"tieNetworkToData": false,
 	"keyValues": [0.05, 0.10],
 	"infolimit": 0.005,
 	"scale": 220,
 	"yearcomp": false,
};

metricInfo["occupation"] = {
	"additional": "I am using highly abbreviated names to avoid clutter<br />on the map - see <a href='https://www.nomisweb.co.uk/census/2011/qs606ew.pdf'>here</a> for the full names.<br />* = professional, ^ = associate professional,<br />as = assistant/cashier, md = manager/director,<br />med = media, elem = elementary, $ = financial.<br /><br /><i>Working Lines was inspired by<br /><a href='http://life.mappinglondon.co.uk/'>Lives on the Line</a> by James Cheshire.</i>",
 	"file": "qs606ew_tubebuffer200m.json",
 	"title": "Working Lines",
 	"subtitle": "What do the locals do?",
 	"subinfo": "Top occupations of people<br />living near here:",
 	"keyexample": "...of people living near here have artistic, literary or media occupations - the most popular job type locally.",
 	"defaultkey": "c049",
 	"defaultDataYear": 2011,
 	"availableDataYears": [2011],
 	"defaultNetworkYear": 2019,
 	"tieNetworkToData": false,
 	"keyValues": [0.05, 0.10],
 	"infolimit": 0.03,
 	"scale": 220,
 	"yearcomp": false,
 };

metricInfo["wardwork"] = {
	"additional": "I am using highly abbreviated names to avoid clutter<br />on the map - see <a href='https://www.nomisweb.co.uk/census/2011/qs606ew.pdf'>here</a> for the full names.<br />* = professional, ^ = associate professional,<br />as = assistant/cashier, md = manager/director,<br />med = media, elem = elementary, $ = financial.<br /><br /><i>Working Lines was inspired by<br /><a href='http://life.mappinglondon.co.uk/'>Lives on the Line</a> by James Cheshire.</i>",
 	"file": "qs606ew_wardsingle.json",
 	"title": "Working Lines (Wards)",
 	"subtitle": "What do the locals do?",
 	"subinfo": "Top occupations of people<br />living in this ward:",
 	"keyexample": "...of people living in this ward have artistic, literary or media occupations - the most popular job type locally.",
 	"defaultkey": "c049",
 	"defaultDataYear": 2011,
 	"availableDataYears": [2011],
 	"defaultNetworkYear": 2011,
 	"tieNetworkToData": false,
 	"keyValues": [0.05, 0.10],
 	"infolimit": 0.03,
 	"scale": 220,
 	"yearcomp": false,
 };
 
 metricInfo["livesontheline"] = {
	"additional": "Inspired by <a href='http://life.mappinglondon.co.uk/'>Lives on the Line</a><br />by James Cheshire.</i>",
 	"file": "livesontheline20092013.json",
 	"title": "Lives on the Line",
 	"subtitle": "A Map of Life Expectancy at Birth (2009-13)",
 	"subinfo": "Life expectancies at birth<br />of people living in MSOAs<br />touching a 200m buffer around<br />the centroid of this station,<br />2009-13, Male+Female average",
 	"keyexample": "The number indicates the life expectancy at birth",
 	"defaultkey": "82",
 	"defaultDataYear": 2013,
 	"availableDataYears": [2013],
 	"defaultNetworkYear": 2019,
 	"tieNetworkToData": false,
 	"keyValues": [0.023, 0.023],
 	"infolimit": 0.01,
 	"scale": 220,
  	"yearcomp": false,
};

 metricInfo["houseprices"] = {
		"additional": "Using near-live property data<br />for 2-bed houses/flats, from Zoopla.<br />Excludes listings over 1 year or<br />last updated more than 6 months ago.<br />Also excludes shared ownership/equity.<br />Aim to refresh data weekly.<br /><br /><a href='http://zoopla.co.uk/' style='border-width: 0;'><img src='images/powered-by-zoopla.png' style='width: 150px; height: 73px; border-width: 0;' title='Property information powered by Zoopla' alt='Property information powered by Zoopla'></a>",
 	"file": "../houseprices/getzoopladata.php",
 	"title": "House Prices (Zoopla)",
 	"subtitle": "Current listing prices for 2-beds, £K",
 	"subinfo": "House prices<br />for properties within<br />a square 1000m box around<br />the centroid of this station,<br />near-live.",
 	"keyexample": "The number indicates the average house prices",
 	"defaultkey": "500000",
 	"defaultDataYear": 2017,
 	"availableDataYears": [2017],
 	"defaultNetworkYear": 2019,
 	"tieNetworkToData": false,
 	"keyValues": [0.025, 0.025],
 	"infolimit": 0.01,
 	"scale": 220,
  	"yearcomp": false,
};

 metricInfo["housepricesdiff"] = {
		"additional": "Using near-live property data<br />for 2-bed houses/flats, from Zoopla.<br />Excludes listings over 1 year or<br />last updated more than 6 months ago.<br />Also excludes shared ownership/equity.<br />Aim to refresh data weekly.<br /><br /><a href='http://zoopla.co.uk/' style='border-width: 0;'><img src='images/powered-by-zoopla.png' style='width: 150px; height: 73px; border-width: 0;' title='Property information powered by Zoopla' alt='Property information powered by Zoopla'></a>",
 	"file": "../houseprices/getzoopladiffdata.php",
 	"title": "House Price Changes (Zoopla)",
 	"subtitle": "Current listing price changes (3 months) for 2-beds, £K",
 	"subinfo": "House prices<br />for properties within<br />a square 1000m box around<br />the centroid of this station,<br />near-live.",
 	"keyexample": "The number indicates the average house prices change between the last week and three months before",
 	"defaultkey": "10000",
 	"defaultDataYear": 2017,
 	"availableDataYears": [2017],
 	"defaultNetworkYear": 2019,
 	"tieNetworkToData": false,
 	"keyValues": [0.025, 0.025],
 	"infolimit": 0.01,
 	"scale": 220,
  	"yearcomp": false,
};

