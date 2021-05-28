(()=>{
	let defineEdit = () => {
		$(document.body).off('jc_edit_loaded',defineEdit);
		jc.edit.form.navigatebydate = (b,d) => {
			let o = jc.edit.form._base(b,d);
			o.fields.push(["navigatebydate","select",{asLabel:'PageType',options:jc.edit.prop.pageTypes.filter(x=>(x!='navigatedate')).sort()}]);
			return o;
		};
	};
	$(document.body).on('jc_edit_loaded',defineEdit);
	if ( jc.edit ) defineEdit();
	let data = { form : { } };
	jc.template.repo.set('navigatedate',data);
})(window);
