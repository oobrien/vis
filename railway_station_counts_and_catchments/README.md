**NR Stations**
Areal "as-the-crow-flies" catchments to stations (represented as approximate centroids), calculated as Voronoi polygons which are clipped to the Great Britain coastline (super-generalised polygon from ONS). 

List/locations based on the ORR/SDG Station usage estimates report for 2016-7. 

**London Combined Stations**
Areal "as-the-crow-flies" catchments to stations (represented as approximate centroids), calculated as Voronoi polygons which are clipped to the Greater London area. Stations outside of this area are included where they are the nearest station to an area within Greater London. Some spatial aggregation done where stations have the name and are shown as connected on the TfL network map, e.g. the three West Hampstead stations. 

Created in QGIS. Derived from data from OS, OpenStreetMap and TfL. 

See an interactive version at https://www.google.com/maps/d/viewer?mid=1TeTOtvwTFkLZJ0kDrsqrDiVemgQb64ox&ll=51.511522017400246%2C-0.07404383325194885&z=12

The classifications were sequential (first of: LU if any LU, DLR if any DLR, OG if any OG except limited, trams if any trams, remaining NR). This sequential list was defined at http://diamondgeezer.blogspot.co.uk/2018/01/random-station.html

**Station Entry Exit Counts**
Data from Transport for London (TfL) and Office of Rail and Road (ORR). The ORR data was compiled by SDG. This is a merge of several datasets all with different conventions, see the extensive notes below. A version of this file (normalised and in JSON format) is used extensively in the TubeCreature visualisation, and is available at https://github.com/oobrien/vis/blob/master/tube/data/stats.json

Metrics available are:
Transport for London: early_in, early_out, am_in, am_out, mid_in, mid_out, pm_in, pm_out, late_in and late_out. These are tube station in/out counts for particular parts of a typical weekday.

Transport for London: in, out - These are in/out totals for a typical (tube) or average (DLR etc) weekday. They should therefore sum to the above for tube stations. They are also available for other modes, e.g. DLR.

Transport for London: sat_in, sat_out, sun_in, sun_out - These are in/out totals for a typical (tube) or average (DLR etc) Saturday and Sunday.

National Rail: s_yr, r_yr and f_yr - In/out yearly totals for season tickets, reduced fare (e.g. off peak, railcard) and full fare tickets.

Both: tot_yr - Total in/out flows for the year. In some cases (DLR) these are calculated by appropriately summing the daily flows.

Station IDs used are:

Transport for London: Truncated NLCs - 4 digit padded numbers. These are used by TfL for their tube station data from 2014 onwards, which is RODS. They are also entered manually for the DLR, rail and tram network stations. We generally use the code with "00" at the end, and truncate the "00".

Transport for London: Old TfL IDs - 3 digit unpadded numbers. These are old internal station IDs used by TfL for their annual performance report datasets, up to 2012, only for tube stations.

Transport for London: Truncated NAPTAN codes - 4 letter alpha-codes. The fifth last and last three letters of the NAPTAN codes used now by TfL. Using these for the Emirates Air Line figures.*

National Rail: CRS - 3 letter alpha-codes. These used by the ORR statistics, for National Rail stations. There is some overlap with TfL, because some TfL rail services call at stations managed by National Rail.

Two files that map these to station names and locations are available at: https://github.com/oobrien/vis/blob/master/tube/data/tfl_stations.json (for the first 3 - stations with TfL services) and https://github.com/oobrien/vis/blob/master/tube/data/nr_stations.json (for the last one - NR stations).

See https://github.com/oobrien/vis for further details about these files.

Modes available are:
* Tube - from TfL, from 2003-2016.
* DLR - from TfL (via FOIs) from 2012-2016. 2012 doesn't include weekday/weekend stats.
* London Tram (aka Tramlink) - from TfL, for 2010-2014.
* Emirates Air Line - from TfL, for 2012-2016.
* Rail - Overground and TfL Rail (which is part of National Rail) - from TfL, for 2013(/4)-2014(/5). Also ELL section has data from TfL, for 2003-2007. Also all National Rail - from ORR, for 2015(/6)-2016(7).

Notes:
1. Metrics ending in _yr are annual counts, all other numbers are average single day counts.
2. Original sources may have more detail. For example, the DLR reports actual daily counts, which are summed/averaged for this dataset.
3. The data is combined from a number of sources and so several sets of station IDs are used, with some duplicated numbers present for the same stations referred to by different IDs - generally for National Rail stations in London to which TfL provides train (not just tube, DLR or tram) services.
4. Due to a methodology change between 2014-5 and 2015-6, only data from 2015-6 is included. ORR 2015-6 data is recorded in this dataset as year 2015, and 2016-7 data is recorded in this dataset as year 2016. TfL data uses calendar years.
5. A station with multiple modes is considered multiple separate stations, for entry/exit counts, even where passengers are just interchanging between modes and possibly remaining within the same physical building. However, in stations with shared gatelines, some of the datasets may be reporting gateline counts rather than individual mode counts. e.g. possible at Richmond.
6. Intra-day counts (for tube stations) are missing for 2013.

* "A" for Airline plus a truncated form of the station name. e.g. NAPTAN 940GZZALGWP -> AGWP. 940GZZ indicates a TfL non-NR station, AL is TfL's mode indicator, and GWP is the truncated station name. Ideally, we would use these for all non-National Rail stations, and CRS for everything else. This would result in compact, human-readable and unique station IDs.
