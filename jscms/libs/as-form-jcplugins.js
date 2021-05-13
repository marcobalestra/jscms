AS.form.fields.jcpage = class extends AS.form.field {
	static buildValue( to, v ) {
		to.prop.chosenValue = String(to.field.options[to.field.selectedIndex].value);
		return AS.form.field.prototype.buildValue.call( to, to.prop.chosenValue );
	};
	static renderField( to ) {
		const cv = AS.test.obj(to.prop.value) ? (to.prop.value.page + (to.prop.value.id ? to.prop.value.id : '')) : false;
		to.field = document.createElement('select');
		to.field.className = 'asFormField asFormFieldJcpage';
		to.field.setAttribute('id', to.prop.id );
		to.field.setAttribute('name', to.prop.name );
		to.field.setAttribute('placeholder', to.prop.placeholder );
		to.field.setAttribute('style', 'max-width:100%;' );
		to.field.asField = ()=>{ return to; };
		jc.jdav.get('struct/_all-list.json',(data)=>{
			let $f = $(to.field);
			$f.append(`<option></option>`);
			let curpage = jc.page.current();
			let curid = String(jc.page.data().id||'');
			Object.keys( data ).forEach( page => {
				let ptype = data[page];
				Object.keys( ptype ).forEach( id => {
					let p = ptype[id];
					id = parseInt(id) ? id : '';
					if ( (page == curpage) && ( id == curid)) return;
					let v = page + id;
					$f.append(`<option value="${ v }">[${page}${id}] ${p.title.escape()} — ${(p.desc||'').escape()}</option>`);
				} );
			} );
			if ( cv ) $f.val( cv );
			$f.select2({
				dropdownParent : $(to.getForm().fakeForm()).closest('.modal'),
				placeholder: AS.label('Select'),
			});
			$f.on('change',()=>{ to.setValue(to.getJsValue()); AS.form.field.onchange(to); });
			//AS.addEvent(to.field,'change',()=>{ to.setValue( to.field.value ); AS.form.field.onchange(to); },'asForm');
			AS.addEvent(to.field,'change',()=>{ console.log(to); },'asForm');
		});
		return AS.form.field.prototype.renderField.call( to );
	};
	getJsValue() {
		let v = this.field.options[this.field.selectedIndex].value;
		if ( AS.test.obj(v) ) return v;
		if ( ! AS.test.str(v) ) return undefined;
		if ( v == '' ) return undefined;
		let o = { page: v.replace(/[0-9]+$/,'') };
		if ( v.match(/[0-9]+$/) ) o.id = parseInt(v.replace(/^.*[^0-9]([0-9]+)$/,"$1"));
		return o;
	};
	parse(v) {
		let av = v[this.prop.name];
		let avs = av.page + ( av.id ? av.id : '');
		this.setValue(av);
		$( this.fakeField() ).val(avs).trigger('change');
		this.hideWarning();
	};
	renderField() { return AS.form.fields.jcpage.renderField.call(window,this); };
};
