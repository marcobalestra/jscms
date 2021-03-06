(()=>{
	let ti = {
		html : "index",
		editable : true,
		repository : "index",
		display: "Blog",
	};
	ti.content = [
		{ selector: "#aboveTopBar", content: false },
		{ selector: "#topBar", part: "header.json" },
		{ selector: "#belowTopBar", content: false },
		{ selector: "#topNavbar", part: 'navbar.json' },
		{ selector: "#mainContainer", content : [
			{ type:"ads", editable: false, content:"ads" },
			{
				type:"blocks",
				editable:true,
				blocks:[
					{ type:"date",wrap:"<div></div>",prop:"blogdate" },
					{ type:"text",wrap:"<h3></h3>",prop:"title" },
					{ type:"text",wrap:`<h6 class="jcAbstract"></h6>`,prop:"abstract" },
					{ type:"mixed",prop:"blocks" }
				]
			},
			{ type:"part", content: "fbcomments.json" },
			{ type:"part", content: "sharethis.json" },
		]},
		{ selector: '#topFooter', type:'text', content: '{{label:GlobalFooter}}' },
	];
	jc.template.info.set('blog',ti);
})();
