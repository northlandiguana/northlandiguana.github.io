/***********************************************
* A JavaScript document by Carl Sack           *
* Demonstration of D3 Principles               *
* Creative Commons 3.0 license, 2014           *
***********************************************/

function initialize(){

	var myNumberData = [100, 200, 300, 400, 500, 600, 700, 800, 900];
	var myStringData = ["this", "that", "theotherthing", "foo", "bar", "bat"];
	var myColors = ["#D4B9DA", "#C994C7", "#DF65B0", "#DD1C77",	"#980043"];

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
	};

	//function 

};

window.onload = initialize();