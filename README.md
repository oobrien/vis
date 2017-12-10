# vis
Mapped-based data visualisations, often of London and/or transport/transit.

* vis/tube - see it live at http://tubecreature.com/ with more information at http://oobrien.com/2014/01/london-tube-stats/ and http://oobrien.com/2014/10/tube-tongues/
* vis/panopticon - see it live at http://vis.oobrien.com/panopticon/ with more information at http://oobrien.com/2016/04/london-panopticon/

Probably of most interest is https://github.com/oobrien/vis/blob/master/tube/data/tfl_lines.json and https://github.com/oobrien/vis/blob/master/tube/data/tfl_stations.json - these data are from OpenStreetMap, with some minor editing by myself. They include the Crossrail alignment. They are simplified to only show one line for each running tunnel pair, and stations represented by a node on the line.

Everything under https://github.com/oobrien/vis/blob/master/tube/data should be considered to be CC-By-NC except where noted below. Please contact me if you wish to use this data in commercial projects. 

Under vis/tube/data:

* rods_od.json - This is from the TfL Open Data portal and based on an amended version of the OGL which is compatible with CC-By.
* 2247.json - This is from MySociety MapIt and OS Open Data (OGL)
* london_wards_2011_centroids - from the ONS (OGL)
* osis - This is collated from http://content.tfl.gov.uk/out-of-station-interchanges.pdf
* qs* - This is from the ONS Census outputs (OGL)
* river_thames_simp - from OS Open Data (OGL)
* stats.json - this is collated from various old reports from TfL, some of which are no longer on its website, from its RODS data files (for 2016+) and from National Rail/ORR station usage information. 
* tfl_stations and tfl_lines - this is derived from OpenStreetMap. The original data is under the ODbL. I have made edits to the data and so it is CC-By-NC.
* nr_stations.json - this is from ORR station usage reports, with a small number of manual corrections to obvious errors. They do not supply it with a licence.
* nr_lines.json - this is from OS Open Data Strategi (Jan 2016), brought up to date with OS Open Data Vector Map District (with manual adjustments) and manual drawing on in a GIS. I have made edits to the data and so it is CC-By-NC.

The London Panopticon is CC-By-NC.
