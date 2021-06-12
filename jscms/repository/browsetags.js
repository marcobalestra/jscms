(()=>{
	let defineEdit = () => {
		if ( ! jc.prop.site ) return setTimeout( defineEdit,100);
		$(document.body).off('jc_edit_loaded',defineEdit);
		jc.edit.form.navigatebytag = (b,d) => {
			let o = jc.edit.form._base(b,d);
			let opts = [{value:'',label:'['+AS.label('None')+']'}];
			AS.def.arr(jc.prop.site.tags).forEach( t => {
				opts.push({ value: t.name, label: (t.label||t.name)});
			} );
			o.fields.push( ["f","select",{asLabel:'Tag',options:opts}],['br','freehtml',{value:'<br />'}] );
			return o;
		};
	};
	$(document.body).on('jc_edit_loaded',defineEdit);
	if ( jc.edit ) defineEdit();
	let data = { form : { } };
	jc.template.repo.set('browsetags',data);
})();
