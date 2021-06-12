(()=>{
	let defineEdit = () => {
		$(document.body).off('jc_edit_loaded',defineEdit);
		jc.edit.form.navigatebydate = (b,d) => {
			let o = jc.edit.form._base(b,d);
			let opts = [];
			jc.edit.prop.pageTypes.filter( k => ( jc.edit.prop.pageTypesInfo[k].hasdate )).forEach( k => {
				opts.push({label:jc.edit.prop.pageTypesInfo[k].display,value:k});
			} );
			o.fields.push(
				["pagetype","select",{asLabel:'PageType',options:opts}],
				['year','integer',{asLabel:'Restrict',skipempty:true,min:1990,asPlaceholder:'Every year',help:'Restrict to a specific year.\nLeave blank to browse every year.'}],
			);
			return o;
		};
	};
	$(document.body).on('jc_edit_loaded',defineEdit);
	if ( jc.edit ) defineEdit();
	let data = { form : { } };
	jc.template.repo.set('browsedates',data);
})(window);
