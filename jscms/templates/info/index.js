(()=>{
	let ti = {
		html : "index",
		editable : true,
		repository : "index",
	};
	ti.content = [
		{ selector: "#aboveTopBar", content: false },
		{ selector: "#topBar", part: "header.html" },
		{ selector: "#belowTopBar", content: false },
		{ selector: "#topNavbar", part: 'navbar.html' },
		{ selector: "#mainContainer", content : {
			type:"blocks",
			editable:true,
			blocks:[
				{ type:"text",wrap:"<h3></h3>",prop:"title" },
				{ type:"mixed",prop:"blocks" },
			]
		}},
	];
	jc.template.info.set('index',ti);
})(window);
