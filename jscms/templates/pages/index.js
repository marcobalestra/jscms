{
	"html" : "index",
	"editable" : true,
	"repository" : "index",
	"content" : [
		{ "selector": "#aboveTopBar", "content": false },
		{ "selector": "#topBar", "part": "header.html" },
		{ "selector": "#belowTopBar", "content": false },
		{ "selector" : "#mainContainer", "content" : {
			"type":"blocks",
			"editable":true,
			"blocks":[
				{ "type":"text","wrap":"<h4></h4>","prop":"title" },
				{ "type":"mixed","prop":"blocks" }
			]
		}}
	]
}
