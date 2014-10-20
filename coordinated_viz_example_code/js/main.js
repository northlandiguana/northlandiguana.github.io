/*********************************************************
G575 D3 Lab Code v1.2
Copyright (c) October 2014, Carl Sack and the University of Wisconsin-Madison Cartography Program
MIT License
**********************************************************/

//global variables
var keyArray = ["varA","varB","varC","varD","varE"];
var expressed = keyArray[0];
var colorize;
var mapWidth = 550, mapHeight = 530; //map frame dimensions
var chartWidth = 550, chartHeight = 450; //chart frame dimensions

window.onload = initialize(); //start script once HTML is loaded

function initialize(){ //the first function called once the html is loaded
	setMap();
};

function setMap(){ //set choropleth map parameters	

	//create a title for the page
	var title = d3.select("body")
		.append("h1")
		.text("France Provinces Choropleth");
	
	//create a new svg element with the above dimensions
	var map = d3.select("body")
		.append("svg")
		.attr("width", mapWidth)
		.attr("height", mapHeight)
		.attr("class", "map");
	
	//create Europe albers equal area conic projection, centered on France
	var projection = d3.geo.albers()
		.center([-8, 46.2])
		.rotate([-10, 0])
		.parallels([43, 62])
		.scale(2900)
		.translate([mapWidth / 2, mapHeight / 2]);
	
	//create svg path generator using the projection
	var path = d3.geo.path()
		.projection(projection);

	var graticule = d3.geo.graticule()
		.step([10, 10]); //place graticule lines every 10 degrees of longitude and latitude
	
	//create graticule background
	var gratBackground = map.append("path")
		.datum(graticule.outline) //bind graticule background
		.attr("class", "gratBackground") //assign class for styling
		.attr("d", path) //project graticule
	
	//create graticule lines	
	var gratLines = map.selectAll(".gratLines") //select graticule elements that will be created
		.data(graticule.lines) //bind graticule lines to each element to be created
	  	.enter() //create an element for each datum
		.append("path") //append each element to the svg as a path element
		.attr("class", "gratLines") //assign class for styling
		.attr("d", path); //project graticule lines
		
	queue() //use queue.js to parallelize asynchronous data loading for cpu efficiency
		.defer(d3.csv, "data/unitsData.csv") //load attributes data from csv
		.defer(d3.json, "data/europe.topojson") //load geometry from countries topojson
		.await(callback);

	function callback(error, csvData, europe){
		colorize = colorScale(csvData); //retrieve color scale generator

		//variables for csv to json data transfer
		var jsonProvs = europe.objects.FranceProvinces.geometries;
			
		//loop through csv data to assign each csv province's values to json province properties
		for (var i=0; i<csvData.length; i++) {		
			var csvProvince = csvData[i]; //the current province's attributes
			var csvAdm1 = csvProvince.adm1_code; //adm1 code
			
			//loop through json provinces to assign csv data to the right province
			for (var a=0; a<jsonProvs.length; a++){
				
				//where adm1 codes match, attach csv data to json object
				if (jsonProvs[a].properties.adm1_code == csvAdm1){
					
					//one more for loop to assign all key/value pairs to json object
					for (var key in keyArray){
						var attr = keyArray[key];
						var val = parseFloat(csvProvince[attr]);
						jsonProvs[a].properties[attr] = val;
					};
					
					jsonProvs[a].properties.name = csvProvince.name; //set prop
					break; //stop looking through the json provinces
				};
			};
		};
		
		//add Europe countries geometry to map			
		var countries = map.append("path") //create SVG path element
			.datum(topojson.feature(europe, europe.objects.EuropeCountries)) //bind countries data to path element
			.attr("class", "countries") //assign class for styling countries
			.attr("d", path); //project data as geometry in svg

		//add provinces to map as enumeration units colored by data
		var provinces = map.selectAll(".provinces")
			.data(topojson.feature(europe, europe.objects.FranceProvinces).features) //bind provinces data to path element
			.enter() //create elements
			.append("g") //give each province its own g element
			.attr("class", "provinces") //assign class for additional styling
			.append("path")
			.attr("class", function(d) { return d.properties.adm1_code })
			.attr("d", path) //project data as geometry in svg
			.style("fill", function(d) { //color enumeration units
				return choropleth(d, colorize);
			})
			.on("mouseover", highlight)
			.on("mouseout", dehighlight)
			.on("mousemove", moveLabel)
			.append("desc") //append the current color
				.text(function(d) {
					return choropleth(d, colorize);
				});
				
		createDropdown(csvData); //create the dropdown menu
		setChart(csvData, colorize); //create the bar chart
	};
};

function createDropdown(csvData){
	//add a select element for the dropdown menu
	var dropdown = d3.select("body")
		.append("div")
		.attr("class","dropdown") //for positioning menu with css
		.html("<h3>Select Variable:</h3>")
		.append("select")
		.on("change", function(){ changeAttribute(this.value, csvData) }); //changes expressed attribute
	
	//create each option element within the dropdown
	dropdown.selectAll("options")
		.data(keyArray)
		.enter()
		.append("option")
		.attr("value", function(d){ return d })
		.text(function(d) {
			d = d[0].toUpperCase() + d.substring(1,3) + " " + d.substring(3);
			return d
		});
};

function setChart(csvData, colorize){

	//create a second svg element to hold the bar chart
	var chart = d3.select("body")
		.append("svg")
		.attr("width", chartWidth)
		.attr("height", chartHeight)
		.attr("class", "chart");

	//create a text element for the chart title
	var title = chart.append("text")
		.attr("x", 20)
		.attr("y", 40)
		.attr("class", "charttext");

	//set bars for each province
	var bars = chart.selectAll(".bar")
		.data(csvData)
		.enter()
		.append("rect")
		.sort(function(a, b){return a[expressed]-b[expressed]})
		.attr("class", function(d){
			return "bar " + d.adm1_code;
		})
		.attr("width", chartWidth / csvData.length - 1)
		.on("mouseover", highlight)
		.on("mouseout", dehighlight)
		.on("mousemove", moveLabel);

	//adjust bars according to current attribute
	updateChart(bars, csvData.length);
};

function colorScale(csvData){

	//create quantile classes with color scale		
	var color = d3.scale.quantile() //designate quantile scale generator
		.range([
			"#D4B9DA",
			"#C994C7",
			"#DF65B0",
			"#DD1C77",
			"#980043"
		]);
	
	//set min and max data values as domain
	color.domain([
		d3.min(csvData, function(d) { return Number(d[expressed]); }),
		d3.max(csvData, function(d) { return Number(d[expressed]); })
	]);
	
	return color; //return the color scale generator
};

function choropleth(d, colorize){
	
	//get data value
	var value = d.properties ? d.properties[expressed] : d[expressed];
	//if value exists, assign it a color; otherwise assign gray
	if (value) {
		return colorize(value); //colorize holds the colorScale generator
	} else {
		return "#ccc";
	};
};

function changeAttribute(attribute, csvData){

	//change the expressed attribute
	expressed = attribute;
	
	//recolor the map
	d3.selectAll(".provinces") //select every province
		.select("path")
		.style("fill", function(d) { //color enumeration units
			return choropleth(d, colorize); //->
		})
		.select("desc") //replace the color text in each province's desc element
			.text(function(d) {
				return choropleth(d, colorize); //->
			});

	//re-sort the bar chart
	var bars = d3.selectAll(".bar")
		.sort(function(a, b){
			return a[expressed]-b[expressed];
		})
		.transition() //this adds the super cool animation
		.delay(function(d, i){
			return i * 10 
		});

	//update bars according to current attribute
	updateChart(bars, csvData.length);
};

function updateChart(bars, numbars){
	//style the bars according to currently expressed attribute
	bars.attr("height", function(d, i){
			return Number(d[expressed])*3;
		})
		.attr("y", function(d, i){
			return chartHeight - Number(d[expressed])*3;
		})
		.attr("x", function(d, i){
			return i * (chartWidth / numbars);
		})
		.style("fill", function(d){
			return choropleth(d, colorize);
		});

	//update chart title
	d3.select(".charttext")
		.text("Number of "+ 
			expressed[0].toUpperCase() + 
			expressed.substring(1,3) + " " + 
			expressed.substring(3) +
			" In Each Province");
}

function format(value){
	
	//format the value's display according to the attribute
	if (expressed != "Population"){
		value = "$"+roundRight(value);
	} else {
		value = roundRight(value);
	};
	
	return value;
};

function roundRight(number){
	
	if (number>=100){
		var num = Math.round(number);
		return num.toLocaleString();
	} else if (number<100 && number>=10){
		return number.toPrecision(4);
	} else if (number<10 && number>=1){
		return number.toPrecision(3);
	} else if (number<1){
		return number.toPrecision(2);
	};
};

function highlight(data){

	//json or csv properties
	var props = data.properties ? data.properties : data;

	d3.selectAll("."+props.adm1_code) //select the current province in the DOM
		.style("fill", "#000"); //set the enumeration unit fill to black

	var labelAttribute = "<h1>"+props[expressed]+
		"</h1><br><b>"+expressed+"</b>"; //label content
	var labelName = props.name //html string for name to go in child div
	
	//create info label div
	var infolabel = d3.select("body")
		.append("div") //create the label div
		.attr("class", "infolabel")
		.attr("id", props.adm1_code+"label") //for styling label
		.html(labelAttribute) //add text
		.append("div") //add child div for feature name
		.attr("class", "labelname") //for styling name
		.html(labelName); //add feature name to label
};

function dehighlight(data){
	
	//json or csv properties
	var props = data.properties ? data.properties : data;
	var prov = d3.selectAll("."+props.adm1_code); //designate selector variable for brevity
	var fillcolor = prov.select("desc").text(); //access original color from desc
	prov.style("fill", fillcolor); //reset enumeration unit to orginal color
	
	d3.select("#"+props.adm1_code+"label").remove(); //remove info label
};

function moveLabel() {

	if (d3.event.clientX < window.innerWidth - 245){
		var x = d3.event.clientX+10; //horizontal label coordinate based mouse position stored in d3.event
	} else {
		var x = d3.event.clientX-210; //horizontal label coordinate based mouse position stored in d3.event
	};
	if (d3.event.clientY < window.innerHeight - 100){
		var y = d3.event.clientY-75; //vertical label coordinate
	} else {
		var y = d3.event.clientY-175; //vertical label coordinate
	};
	d3.select(".infolabel") //select the label div for moving
		.style("margin-left", x+"px") //reposition label horizontal
		.style("margin-top", y+"px"); //reposition label vertical
};