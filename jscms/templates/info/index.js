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
				{ type:"mixed",prop:"blocks" }
			]
		}},
	];
	ti.metadata = {
		form : {
			requires : ['basic','pikaday','tinymce','iro','slider'],
			options : { tabs: [AS.label('Main'),AS.label('Metadata')] },
			fields : [
				['type','text',{asLabel:'Type',readonly:true,tab:0,default:'index'}],
				['id','text',{asLabel:'ID',readonly:true,skipempty:true,tab:0,depends:'id'}],
				['title','text',{asLabel:'Title',normalize:true,skipempty:true,asHelp:'PageTitleHelp',tab:0}],
				['url','text',{asLabel:'URI',normalize:true,skipempty:true,asHelp:'PageUriHelp',transform:'x=>x.toLowerCase().replace(/[^a-z0-9._]+/g," ").trim().replace(/ +/g,"-")',tab:0}],
				['hidden','bool',{asLabel:'PageHidden',tab:0,asHelp:'PageHiddenHelp',depends:'id'}],
				['keywords','text',{asLabel:'Keywords',asPlaceholder:'PageKewordsPlaceholder',asHelp:'PageKewordsHelp',skipempty:true,transform:'x=>x.toLowerCase().replace(/"/g," ").trim().split(/[;, ]+/).join(", ")',tab:1}],
				['description','textarea',{asLabel:'PageDescription',asPlaceholder:'PageDescriptionPlaceholder',asHelp:'PageDescriptionHelp',skipempty:true,normalize:true,tab:1}],
			],
		},
		
	};
	jc.template.info.set('index',ti);
})(window);
