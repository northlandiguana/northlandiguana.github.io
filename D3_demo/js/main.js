/***********************************************
* A JavaScript document by Carl Sack           *
* Demonstration of D3 Principles               *
* Creative Commons 3.0 license, 2014           *
***********************************************/

function initialize(){

	var numberDataArray = [10, 20, 30, 40, 50];
	var coordinateArray = [[0,1], [1,2], [2,1], [3,2], [5,3]];

	createSVG();

	function createSVG(){

		var w = 900, h = 500;

		//always name blocks with a variable, even if it won't be used
		var container = d3.select("body") //gets the <body> element from the DOM
			.append("svg") //put a new svg in the body
			.attr("width", w) //assign the width
			.attr("height", h) //assign the height
			.attr("class", "container") //always assign a class (as the block name) for styling and future selection
			.style("background-color", "rgba(0,0,0,0.2)"); //only put a semicolon at the end of the block!

		//now inspect the HTML using developer tools to see the SVG container in the DOM

		createInnerRect(container); //passing the svg container to the next function
	};

	function createInnerRect(container){

		var innerRect = container.append("rect")
			.datum(numberDataArray[3]) //a single value is a DATUM
			.attr("width", 800)
			.attr("height", function(d){ //here's the fun part--using the data
				console.log(d);
				return d*10;
			})
			.attr("class", "innerRect")
			.attr("x", 50) //because this is an SVG element, we use specialized attributes to style it
			.attr("y", 50)
			.style("fill", "rgb(237, 182, 55");

		makeSomeCircles(container); //next
	};

	function makeSomeCircles(container){

		var circles = container.selectAll(".circles") //but wait--there are no circles yet!
			.data(coordinateArray) //here we feed in an array
			.enter() //one of the great mysteries of the universe
			.append("circle") //inspect the HTML--holy crap, there's some circles there
			.attr("class", "circles")
			.attr("cx", function(d){ 
				return d[0]*100 + 70
			})
			.attr("cy", function(d){
				return 450 - d[1]*100;
			})
			.attr("r", function(d, i){ //i stands for index!
				console.log(d, i);
				return numberDataArray[i];
			});

		colorCircles(circles);
	};

	function colorCircles(circles){
		//create linear color scale generator		
		var color = d3.scale.linear() //designate quantile scale generator
			.range([ //the range is the output, with values in between interpolated
				"#FA5923",
				"#73366F"
			])
			.domain([ //sets the min and max values for data to interpolate by
				d3.min(numberDataArray), //a useful d3 method to find the minimum value of the array
				numberDataArray[4] //the max value we use for the circles
			]);

		//add a fill based on the color scale generator
		circles.attr("fill", function(d, i){
			return color(numberDataArray[i]); //pass the number data to the color scale generator
		})
		.on("mouseover", function(d, i){ //add event listeners to create interaction
			addValue(d, i);
		})
		.on("mouseout", function(d, i){
			removeValue(d, i);
		});
	};

	function addValue(data, index){
		d3.select("#value span")
			.text(numberDataArray[index]);

		d3.select("#coordinates span")
			.text(data[0]+", "+data[1]);
	};

	function removeValue(data, index){
		d3.select("#value span")
			.text("");

		d3.select("#coordinates span")
			.text("");
	};

};

window.onload = initialize();