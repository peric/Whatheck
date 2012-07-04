google.load('visualization', '1', {
	'packages' : ['geochart']
});
google.load("visualization", "1", {
	packages : ['corechart']
});

$(function () {
	var lastfmapi = "554989a934ba588ea147854c56eb19a3";
	var geoworldchart;
	var geoworlddata;
	var treechart;
	var tagsdata;
	var georegionchart;
	var georegiondata;
	var all_countries = [];
	
	$.when(
		$.getJSON("http://api.geonames.org/countryInfoJSON?username=dperic", function(data) {
			for(var i = 0; i < data.geonames.length; i++) {
				if(parseInt(data.geonames[i].population) > 100000)
					all_countries.push([data.geonames[i].countryName.toString(), parseInt(data.geonames[i].population)]);
			}
		})
	).then(function() {
		drawWorldMap();
	});
	
	$('#close_button').click(function (e) {
		e.preventDefault();
		$('#tags_container').hide();
		$('#worldchart_canvas').css('z-index', '99');
		$('#tags_canvas').removeClass('tags_canvas_back');
		$('#tags_canvas').html('');
	});
	
	function drawWorldMap() {
		geoworlddata = new google.visualization.DataTable();
		geoworlddata.addColumn('string', 'Country');
		geoworlddata.addColumn('number', 'Population');
		geoworlddata.addRows(all_countries);

		var options = {
			width : '100%',
			height : '100%',
			legend : {
				textStyle : {
					color : '#000000',
					fontName : 'Arial',
					fontSize : 12,
					backgroundColor : '#FF0000'
				}
			},
			backgroundColor : '#A5BFDD',
			colorAxis : {
				colors : ['#E3EBA0', '#6DC000']
			},
			datalessRegionColor : '#F5F5F5'
		};
		geoworldchart = new google.visualization.GeoChart(document.getElementById('worldchart_canvas'));
		google.visualization.events.addListener(geoworldchart, 'select', getSelectedCountry);
		geoworldchart.draw(geoworlddata, options);
	}
	
	function getSelectedCountry() {
		var selectedItem = geoworldchart.getSelection()[0];
		var selectedCountry = geoworlddata.getValue(selectedItem.row, 0);
		
		$('#tags_canvas').addClass('tags_canvas_back');
		$(".tags_canvas_back").css({ "background" : "url('images/spinner.gif') no-repeat center center" });
		$(".tags_canvas_back").attr("title", "");
		$('#worldchart_canvas').css('z-index', '-1');
		$('#tags_container').show();
		
		getTagsData(selectedCountry);
	}

	function getTagsData(country) {
		var top10artists = [];
		var listenerstotal = 0;
		var toptags = {};
			
		//$.getJSON("http://ws.audioscrobbler.com/2.0/?method=geo.gettopartists&country="+ country +"&api_key="+ lastfmapi +"&limit=500&format=json", function(artists) {
		var url = "http://ws.audioscrobbler.com/2.0/?method=geo.gettopartists&country="+ country.toLowerCase() +"&api_key="+ lastfmapi +"&limit=500&format=json";
		$.ajax({
			url: url,
			dataType: 'json',
			success: function (artists) {
				for (var i=0; i<10; i++) {
					if (!artists.topartists) {
						drawTagsChart();
						return;
					}
					top10artists.push(artists.topartists.artist[i].name);
				}
				
				tagsnumber = 50;
				for (var i=0; i<tagsnumber; i++) {
					var currentartist = artists.topartists.artist[i].name;
					var currentlisteners = parseInt(artists.topartists.artist[i].listeners);
					var url = "http://ws.audioscrobbler.com/2.0/?method=artist.gettoptags&artist="+ currentartist +"&autocorrect=1&api_key="+ lastfmapi +"&format=json";
					listenerstotal = listenerstotal + currentlisteners;
					(function (i)
						{
							$.ajax({
								url: url,
								dataType: 'json',
								success: function (tags) {
									var tagname = tags.toptags.tag[0].name;
									if (toptags[tagname]) {
										toptags[tagname].listenerstotal = toptags[tagname].listenerstotal + currentlisteners;
										toptags[tagname].artists.push({'name':artists.topartists.artist[i].name, 'listeners':artists.topartists.artist[i].listeners});
									} else {
										toptags[tagname] = {'listenerstotal':currentlisteners, 'artists':[{'name':artists.topartists.artist[i].name, 'listeners':currentlisteners}]};
									}

									if (i == (tagsnumber-1))
										drawTagsChart(toptags, listenerstotal, country);
								}
							});
						}
					)(i);
				}
			}
		})
	}

	function drawTagsChart(toptags, listenerstotal, country) {
		if (!toptags) {
			$(".tags_canvas_back").css({ "background" : "url('images/exclamation.png') no-repeat center center" });
			$(".tags_canvas_back").attr("title", "no data");
			return;
		}

		var toptagsfiltered = [];
		$.each(toptags, function (key, value) {
			toptagsfiltered.push([key, parseInt((value.listenerstotal/listenerstotal)*100)]);
		});

		var data = new google.visualization.DataTable();
		data.addColumn('string', 'Genre');
		data.addColumn('number', 'Percentage');
		data.addRows(toptagsfiltered);
		data.sort({column: 1, desc: true});

		var options = {
			width : '100%',
			height : '100%',
			backgroundColor : 'transparent',
			title : country,
			is3D : 'true'
		};

		var chart = new google.visualization.PieChart(document.getElementById("tags_canvas"));
		chart.draw(data, options);
	}
});