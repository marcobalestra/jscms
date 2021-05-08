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
			options : {
				effectduration : 0,
				theme: 'light',
				subforms: [],
				tabs: [AS.label('Main'),AS.label('Metadata')],
			},
			fields : [
				['type','text',{asLabel:'Type',readonly:true,tab:0}],
				['id','text',{asLabel:'ID',readonly:true,skipempty:true,tab:0,depends:'id'}],
				['title','text',{asLabel:'Title',normalize:true,skipempty:true,tab:0}],
				['keywords','text',{asLabel:'Keywords',placeholder:'keyword1, keyword2, …',skipempty:true,transform:'x=>x.toLowerCase().replace(/"/g," ").trim().split(/[;, ]+/).join(", ")',tab:1}],
				['description','textarea',{asLabel:'Description',placeholder:'A few words about this page',skipempty:true,normalize:true,tab:1}],
				['btns','buttons',{position:'bottom',list:[{label:AS.label('Cancel'),icon:AS.icon('circleClose'),onclick:'()=>{jc.edit.noModal();}'},{btype:'reset'},{btype:'submit'}]}],
			],
			target: 'jcPageEditor',
		},
		
	};
	jc.template.info.set('index',ti);
})(window);
