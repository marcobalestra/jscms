{
	"form" : {
		"requires" : ["basic","pikaday","tinymce","jscolor","iro","slider"],
		"fields" : [
			["title","text",{"skipempty":true,"trim":true,"title": "Field not included if empty","value":""}],
			["blocks","subform",{"label":"Blocchi","subform":"blocks"}]
		]
	}
}
