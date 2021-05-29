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
					['hideComments','bool',{asLabel:'HideComments',tab:0}],
					['keywords','text',{asLabel:'Keywords',asPlaceholder:'PageKewordsPlaceholder',asHelp:'PageKewordsHelp',skipempty:true,transform:'x=>x.toLowerCase().replace(/"/g," ").trim().split(/[;, ]+/).join(", ")',tab:1}],
					['description','textarea',{asLabel:'PageDescription',asPlaceholder:'PageDescriptionPlaceholder',asHelp:'PageDescriptionHelp',skipempty:true,normalize:true,tab:1}],
				],
			},
		}
	};
	jc.template.repo.set('index',data);
})(window);
