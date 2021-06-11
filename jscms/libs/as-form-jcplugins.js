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
		to.field.setAttribute('style', 'width:100%;' );
		to.field.asField = ()=>{ return to; };
		return AS.form.field.prototype.renderField.call( to );
	};
	static postRender( to ) {
		const $d = $( to.field ).closest('div');
		$d.css({'padding':'.5em 1em 1em 1em'});
		const cv = AS.test.obj(to.prop.value) ? (to.prop.value.page + (to.prop.value.id ? to.prop.value.id : '')) : false;
		let args = [];
		if ( AS.test.str(to.prop.pageType) ) args.push( to.prop.pageType );
		args.push( (data)=>{
			let $f = $(to.field);
			$f.append(`<option></option>`);
			let curpage = jc.page.current();
			let curid = String(jc.page.data().id||'');
			Object.keys( data ).forEach( page => {
				let ptype = data[page];
				Object.keys( ptype ).forEach( id => {
					let p = ptype[id];
					id = parseInt(id) ? id : '';
					if ((! to.prop.includecurrent) && (page == curpage) && ( id == curid)) return;
					let v = page + id;
					$f.append(`<option value="${ v }" title="${p.title.escape()}">[${page}${id}] ${p.title.escape()} — ${(p.desc||'').escape()}</option>`);
				} );
			} );
			if ( cv ) $f.val( cv );
			if ( to.prop._s2v ) $f.val( to.prop._s2v );
			$f.select2({
				dropdownParent : $(to.getForm().fakeForm()).closest('.modal'),
				placeholder: AS.label('Select'),
			});
			$f.on('change',(e)=>{
				to.setValue(to.getJsValue());
				AS.form.field.onchange(to);
				if ( AS.test.func(to.prop.jconchange) ) window.setTimeout( ()=>{ to.prop.jconchange.call( window, to, $f ); }, 10 );
			});
			$f.addClass('jcParsed');
		});
		jc.lists.list.get.apply(window,args);
		return AS.form.field.postRender.call(window,to);
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
		if ( av ) {
			let avs = av.page + ( av.id ? av.id : '');
			this.prop._s2v = avs;
			let $s = $( this.fakeField() );
			const sv = () => {
				if ( ! $s.hasClass('jcParsed') ) return setTimeout( sv, 100 );
				this.setValue(av);
				$s.val(avs).trigger('change');
			}
			sv();
		}
		this.hideWarning();
	};
	renderField() { return AS.form.fields.jcpage.renderField.call(window,this); };
	postRender() { return AS.form.fields.jcpage.postRender.call( window, this ); };
};

AS.form.fields.select2 = class extends AS.form.fields.select {
	static postRender( to ) {
		const $f = $( to.field );
		const $d = $f.closest('div');
		$d.css({'padding':'0 1em 1em 1em'});
		$f.addClass('asFormFieldSelect2').css('width','100%');
		if ( to.prop.multiple ) $f.attr('multiple',true);
		let s2 = {
			dropdownParent : $(to.getForm().fakeForm()).closest('.modal'),
			placeholder: AS.label('Select'),
		};
		if ( AS.test.obj(to.prop.select2) ) $.extend( s2, to.prop.select2 );
		$f.select2( s2 );
		$f.on('change',(e)=>{
			to.setValue();
			if ( AS.test.func(to.prop.jconchange) ) window.setTimeout( ()=>{ to.prop.jconchange.call( window, to, $f ); }, 10 );
		});
		$f.addClass('jcParsed');
		return AS.form.field.postRender.call(window,to);
	};
	parse(v) {
		let av = v[this.prop.name];
		if ( AS.test.def(av) ) {
			const $s = $( this.fakeField() );
			const sv = () => {
				if ( ! $s.hasClass('jcParsed') ) return setTimeout( sv, 100 );
				if ( this.prop.select2 && this.prop.select2.tags && (! $('option[value="'+av+'"]').length)) {
					$(this.field).append(`<option value="${av}">${av}</option>`).trigger('change');
				} else {
					this.setValue(av);
					$s.val(av).trigger('change');
				}
			}
			sv();
		}
		this.hideWarning();
	};
	buildValue() { return this.field.value; };
	buildValueString() { return this.field.value; };
	getValue() { return this.field.value; };
	postRender() { return AS.form.fields.select2.postRender.call( window, this ); };
};
