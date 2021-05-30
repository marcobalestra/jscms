(()=>{
	let data = {
		form : {
			metadata : {
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
		}
	};
	const findBy = ( o, p, v )=>{
		if ( AS.test.arr(o) ) return o.find( x => findBy(x,p,v));
		if ( AS.test.obj(o)) {
			if ( o[p] ) return (o[p]==v ? o : undefined);
			let f = Object.keys(o).find( x => findBy(o[x],p,v) );
			if (f) return findBy(o[f],p,v);
		}
		return undefined;
	}
	jc.template.info.get('index',(i)=>{
		if ( findBy(i,'part','fbcomments.json') ) data.form.metadata.fields.push(['hideComments','bool',{asLabel:'HideComments',tab:0}]);
		jc.template.repo.set('index',data);
	});
})();
