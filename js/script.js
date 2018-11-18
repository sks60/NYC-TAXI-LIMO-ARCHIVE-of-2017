var map;
var layer_1;
var list = {};
var IdZoneForwardLookup = {};
var boroughZoneMapping = {};
var where;
var frequency = [];

function heatMap() {

	var styleBuilder = [];
	var x;
	var resultsArray = [];

	var filterHIGH = [];
	var filterMED = [];
	var filterLOWMED = [];
	var filterLOW = [];
	var filterSELECTED = [];
	var zoneName;

	for (var i = 0; i < frequency.length; i++) {

		if ( zoneName = IdZoneForwardLookup[frequency[i].LocationID]) {
			zoneName = zoneName.replace(/'/g, "\\'");
			filterSELECTED.push("'" + zoneName + "'");

			//check what their frequency is
			x = frequency[i].frequency;

			if (x > 0 && x <= 3)
				filterLOW.push("'" + zoneName + "'");
			if (x > 3 && x <= 8)
				filterLOWMED.push("'" + zoneName + "'");
			if (x > 8 && x <= 20)
				filterMED.push("'" + zoneName + "'");
			if (x > 20)
				filterHIGH.push("'" + zoneName + "'");
		}
	}

	if (filterHIGH.length > 0) {
		var high = "'Taxi_zone' IN (" + filterHIGH.join(',') + ')';
		var next = {
			"where" : high,
			"polygonOptions" : {
				"fillColor" : "#e60000",
				"fillOpacity" : 0.7,
				"strokeWeight" : 1,
				"strokeColor" : '#000000'
			}
		}

		styleBuilder.push(next);
	}
	if (filterMED.length > 0) {
		var medium = "'Taxi_zone' IN (" + filterMED.join(',') + ')';
		next = {
			"where" : medium,
			"polygonOptions" : {
				"fillColor" : "#ff6600",
				"fillOpacity" : 0.7,
				"strokeWeight" : 1,
				"strokeColor" : '#000000'
			}
		}

		styleBuilder.push(next);
	}
	if (filterLOWMED.length > 0) {
		var lowmed = "'Taxi_zone' IN (" + filterLOWMED.join(',') + ')';
		next = {
			"where" : lowmed,
			"polygonOptions" : {
				"fillColor" : "#e6e600",
				"fillOpacity" : 0.7,
				"strokeWeight" : 1,
				"strokeColor" : '#000000'
			}
		}

		styleBuilder.push(next);
	}
	if (filterLOW.length > 0) {
		var low = "'Taxi_zone' IN (" + filterLOW.join(',') + ')';
		next = {
			"where" : low,
			"polygonOptions" : {
				"fillColor" : "#00cc44",
				"fillOpacity" : 0.7,
				"strokeWeight" : 1,
				"strokeColor" : '#000000'
			}
		}

		styleBuilder.push(next);
	}

	var picked = document.getElementById('LocationID');
	var locationChosen = picked.options[picked.selectedIndex].text.replace(/'/g, "\\'");
	// so that they are in the selected for colouring black
	filterSELECTED.push("'" + locationChosen + "'");
	//--- need this for getting rid of the non-picked zone shapes on the map
	where = where = "\"'Taxi_zone' IN (" + filterSELECTED.join(',') + ")\"";
	next = {
		"where" : "'Taxi_zone' = '" + locationChosen + "'",
		"polygonOptions" : {
			"fillColor" : "#000000",
			"fillOpacity" : 0.7,
			"strokeWeight" : 2,
			"strokeColor" : '#FFFFFF'
		}
	}
	styleBuilder.push(next);

	return styleBuilder;
}

function initialize() {
	map = new google.maps.Map(document.getElementById('map-canvas'), {
		center : new google.maps.LatLng(40.70016799235727, -74.03101524040545),
		zoom : 10,
		//???????????????????
		//http://geocodezip.com/v3_zoom2stateselectlist.html
		mapTypeId : google.maps.MapTypeId.ROADMAP
	});

	layer_1 = new google.maps.FusionTablesLayer({
		query : {
			select : "col0",
			from : "1kl4pj13KkYOlmSBTIwRax4S7syFABaU6-vc5wnk"
		},
		map : map
	});

}

function changeMap_0() { {
		var whereClause;
		var searchString = document.getElementById('LocationID').value.replace(/'/g, "\\'");

		if (searchString != '--Select--') {
			whereClause = "'Taxi_zone' = '" + searchString + "'";
		}

		/*
		 * first layer
		 * https://developers.google.com/maps/documentation/javascript/styling
		 * https://developers.google.com/fusiontables/docs/samples/in
		 */
		var style = heatMap();
		layer_1.setOptions({
			query : {
				select : "col0",
				from : "1kl4pj13KkYOlmSBTIwRax4S7syFABaU6-vc5wnk",
				where : where
			},
			styles : style

		});
	}
}

google.maps.event.addDomListener(window, 'load', initialize);

//when document is ready
$(document).ready(function() {
	//min max if changed
	$.getJSON("https://68016xdbi0.execute-api.us-east-1.amazonaws.com/taxi/minmax", function(minMax) {
		var minMaxJSON = JSON.parse(minMax);
		var min = parseInt(minMaxJSON["min"], 10);
		var max = parseInt(minMaxJSON["max"], 10);

		$.getJSON("https://68016xdbi0.execute-api.us-east-1.amazonaws.com/taxi/lookup?locationid=" + min + "-" + max, function(json) {
			//below is to populate the drop-down
			var $select = $('.boroughDropdown');
			var borough = [];
			var seen = [];
			var zoneTable = JSON.parse(json);
			for (var i = min; i <= max; i++) {
				var zoneInfo = zoneTable[i.toString()];
				if (zoneInfo.Borough == "Unknown") {
					continue;
				}
				list[zoneInfo.Zone] = [i];
				//(parseInt(zoneInfo.LocationID)+1);
				IdZoneForwardLookup[i] = zoneInfo.Zone;
				if (!(zoneInfo.Borough in boroughZoneMapping)) {
					boroughZoneMapping[zoneInfo.Borough] = [];
				}
				boroughZoneMapping[zoneInfo.Borough].push(zoneInfo.Zone);
			}
			for (var borough in boroughZoneMapping) {
				var $option = $("<option/>").attr("value", borough).text(borough);
				$select.append($option);
			}
		});
	})

	$("#request_button").click(function() {
		
		var picked = document.getElementById('LocationID');
		var selected = picked.options[picked.selectedIndex].text.replace(/'/g, "\\'");
		var fromToRadio = document.getElementById('FromTo');
		var type = fromToRadio.elements["FromTo"].value;
		var newText = "Below is the zone heat map of the chosen location: " + selected + "(seen in black)";
		document.getElementById("changeText").innerHTML = newText;

		// build the search string which will be sent to the lambda
		var dataString = buildString();

		// Make a POST request to the AWS API Gateway for elasticsearch/lambda
		$.ajax({
			type : 'POST',
			url : 'https://qsl6j6tcg3.execute-api.ap-southeast-2.amazonaws.com/live',
			contentType : 'application/json',
			dataType : 'json',
			data : dataString,
			success : function(res) {
				// If we get back a set of data this is handled here

				// Clear the table
				$("#resultsTable").html("");

				// bool for if the table headers have been added
				var addedHeaders = false;

				// for each result in the response data
				$.each(res.data, function(key, value) {

					// if headers haven't been added, add them
					if (!addedHeaders) {
						var tableHeadersHTML = $('<thead>');
						var changedHeader = '';
						$.each(value, function(headerName, ignored) {
							if (headerName === 'DOLocationID')
								changedHeader = 'Dropped-Off Location';
							if (headerName === 'tpep_dropoff_datetime')
								changedHeader = 'Date and Time of Drop-off';
							if (headerName === 'total_amount')
								changedHeader = 'Cost of Trip ($US)';
							if (headerName === 'passenger_count')
								changedHeader = 'Passenger Count';
							if (headerName === 'tpep_pickup_datetime')
								changedHeader = 'Date and Time of Picked-up';
							if (headerName === 'PULocationID')
								changedHeader = 'Picked-Up Location';

							tableHeadersHTML.append($('<th/>').html("<span class=\"text\">" + changedHeader + "</span>"));
						});
						addedHeaders = true;
						tableHeadersHTML.append('</thead>');
						$("#resultsTable").append(tableHeadersHTML);
					}

					value.DOLocationID = IdZoneForwardLookup[value.DOLocationID];
					value.PULocationID = IdZoneForwardLookup[value.PULocationID];

					// prepare table line for each item in the response data
					var tableEntry = $('<tr/>');
					$.each(value, function(ignored, value2) {
						tableEntry.append($('<td/>').html(value2));
					});

					// add the table line
					$("#resultsTable").append(tableEntry);

				});

				//FREQ stuff here
				frequency = res.frequencies;
				changeMap_0();

			},
			error : function() {
				alert("Failed to retrieve data");
			}
		});
		

	});
	//end of click
		
});

function nextDropDown(source) {
	var $select = $('#LocationID');

	var borough = document.getElementById('borough').value.replace(/'/g, "\\'");

	$select.empty();
	for (var i = 0; i < boroughZoneMapping[borough].length; i++) {
		var zone = boroughZoneMapping[borough][i];
		var $option = $("<option/>").attr("value", list[zone]).text(zone);
		$select.append($option);
	}

}

function w3_open() {
	//https://stackoverflow.com/a/28973243
	var e = document.getElementById("sidenav");
	if (e.style.display) {
		e.style.display = ((e.style.display != 'none') ? 'none' : 'block');
	} else {
		e.style.display = 'block'
	}
}

function buildString() {

	// Builds a search string by constructing and object based on the user's input on the sidebar

	var fromToRadio = document.getElementById('FromTo');
	var element;

	var searchObj = {};

	searchObj.requestType = "frequency";
	searchObj.includeFields = ["DOLocationID", "PULocationID", "passenger_count", "total_amount", "tpep_pickup_datetime", "tpep_dropoff_datetime"];
	searchObj.requestSize = "5000";
	searchObj.matchField = fromToRadio.elements["FromTo"].value;
	searchObj.data = [];

	if ( element = document.getElementById('LocationID').value) {
		var locationData = {};
		locationData.requestType = "match";
		locationData.matchField = fromToRadio.elements["FromTo"].value
		locationData.matchValue = element;
		searchObj.data.push(locationData);
	}

	if (document.getElementsByName('start')) {
		var startData = {};
		startData.requestType = "matchrange";
		startData.matchField = "tpep_pickup_datetime"
		startData.gte = document.getElementById('tpep_pickup_datetime').value;
		startData.format = "yyyy-MM-dd";
		searchObj.data.push(startData);
	}

	if (document.getElementsByName('end')) {
		var endData = {};
		endData.requestType = "matchrange";
		endData.matchField = "tpep_dropoff_datetime"
		endData.lte = document.getElementById('tpep_dropoff_datetime').value;
		endData.format = "yyyy-MM-dd";
		searchObj.data.push(endData);
	}

	return JSON.stringify(searchObj);

}

