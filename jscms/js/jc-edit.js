AS.addEvent(document,'as:tinyMceInited',e=>{
	e.detail.getWrap().querySelector('.tox-tinymce').style.height = String(Math.min(Math.max((parseInt(window.innerHeight)-240),300),640))+'px';
});

jc.edit = {
	prop : {
		blockTypes : ['text'],
	},
	start : () => {
		document.querySelectorAll('.jcEditable:not(.jcEditableParsed)').forEach( (d) => {
			let $d = $(d);
			let data = $d.data('editable');
			if ( ! data && AS.test.obj(data) ) {
				$d.removeClass('jcEditable');
				return;
			}
			$d.addClass('jcEditableParsed');
			let $em = $(`<div class="jcEditMenu"></div>`);
			if ( AS.test.def(data.idx) ) {
				$d.on('dblclick',jc.edit.edit);
				if ( data.idx < (data.qt -1) ) $em.append('<span class="jcEditMoveDown" onclick="jc.edit.movedown(event)">'+AS.icon('moveDown')+'</span>');
				if ( data.idx ) $em.append('<span class="jcEditMoveUp" onclick="jc.edit.moveup(event)">'+AS.icon('moveUp')+'</span>');
				$em.append('<span class="jcEditDropdown">'+AS.icon('menu')+'</span>');
			} else if ( data.subtype == 'mixed' )  {
				$em.append('<span class="jcEditDropdown">'+AS.icon('editAdd')+'</span>');
			} else {
				$d.on('dblclick',jc.edit.edit);
				$em.append('<span class="jcEditDropdown">'+AS.icon('edit')+'</span>');
			}
			$d.prepend($em);
			$d.on('contextmenu',jc.edit.menu);
			$('.jcEditMenu .jcEditDropdown',$d).on('click contextmenu',jc.edit.menu);
		});
	},
	data : (d) => {
		if ( d == false ) {
			jc.prefs.purge('onEditData');
		} else if ( AS.test.obj(d) ) {
			jc.prefs.key('onEditData',{ page:jc.page.current(), id:jc.page.data().id, data: d });
			return jc.prefs.key('onEditData').data;
		} else if ( jc.page.prop.editMode ) {
			d = jc.prefs.key('onEditData');
			let theSame = d && ( d.page == jc.page.current() );
			if ( theSame && d.id ) theSame = ( d.id == jc.page.data().id );
			if ( theSame ) return d.data;
			jc.prefs.purge('onEditData');
		}
		return undefined;
	},
	menu : (e) => {
		let data = jc.edit.itemdata(e);
		let hl = '.jcEditable';
		let acts = [{icon:'jcicon',iconKey:'edit',label:AS.label('blockEditContent'),action:jc.edit.edit}];
		if ( data.subtype ) {
			let canAdd = AS.test.def(data.idx);
			if ( data.subtype == 'mixed' ) {
				hl = false;
				canAdd = true;
				acts.shift();
			} else if (canAdd) {
				acts.push('-',{icon:'jcicon danger',iconKey:'editRemove',label:AS.label('blockDeleteContent'),action:jc.edit.rm},'-');
			}
			if (canAdd) acts.push({icon:'jcicon',iconKey:'editAdd',ricon:'jcicon',riconKey:'arrow-down',label:AS.label('blockAddContent'),action:jc.edit.add});
		}
		if ( ! acts.length ) return;
		else if ( acts.length == 1 ) return acts[0].action.call(window,e);
		acts.unshift(data.subtype||data.type);
		jc.menu(e, { content: acts, highlight: hl });
	},
	itemdata : (e) => {
		e.preventDefault();
		e.stopPropagation();
		return $(e.target).closest('.jcEditable').data('editable');
	},
	moveup : (e) => {
		let b = jc.edit.itemdata(e);
		let d = jc.edit.data();
		if ( Array.isArray( d[b.prop]) ) {
			d[b.prop].splice( b.idx -1, 2, d[b.prop][b.idx], d[b.prop][b.idx -1]);
			jc.edit.fixBlocks(b,d);
			jc.page.reload();
		}
	},
	movedown : (e) => {
		let b = jc.edit.itemdata(e);
		let d = jc.edit.data();
		if ( Array.isArray( d[b.prop]) ) {
			d[b.prop].splice( b.idx, 2, d[b.prop][b.idx +1], d[b.prop][b.idx]);
			jc.edit.fixBlocks(b,d);
			jc.page.reload();
		}
	},
	edit : (e) => {
		let b = jc.edit.itemdata(e);
		let d = jc.edit.data();
		let t = b.subtype||b.type;
		if ( ! jc.edit.form[t] ) return;
		let $mod = jc.edit.getModal();
		$mod.on('shown.bs.modal',()=>{ AS.form.create( jc.edit.form[t].call(window,b,d) ); });
		$mod.modal('show');
	},
	form : {
		_base : (b,d)=>{
			let $mod = jc.edit.getModal(true);
			let t = b.subtype||b.type;
			$('.modal-dialog',$mod).append(`<div class="modal-content">
				<div class="modal-header bg-light">
					<p class="modal-title">
						<span class="jcicon">${ AS.icon('edit') }</span> 
						<b>
							${ AS.label('Edit') } “${ jc.page.current() }”${ jc.page.data().id ? ' ID: '+jc.page.data().id : '' },
							${ b.prop }${ AS.test.def(b.qt) ? ' ['+(AS.test.num(b.idx) ? String(b.idx +1)+'/'+b.qt : b.idx)+']':'' }
						</b>
					</p>
					<button type="button" class="close" onclick="jc.edit.noModal()" aria-label="Close">
						<span aria-hidden="true" class="jcicon modalCloser">${ AS.icon('circleClose') }</span>
					</button>
				</div>
				<div class="modal-body" id="jcPageEditor"></div>
			</div>`);
			return {
				requires : ['basic','pikaday','tinymce','iro','slider'],
				options : {
					effectduration : 0,
					theme: 'transparent',
					subforms: [],
					jsaction: (fd,fo) => {
						fo.destroy();
						jc.edit.noModal();
						if ( b.qt ) {
							d[b.prop][b.idx] = fd;
							jc.edit.fixBlocks(b,d);
						} else {
							d[b.prop] = fd[t];
							jc.edit.data(d);
						}
						jc.page.reload();
					}
				},
				fields : [ ['btns','buttons',{position:'bottom',list:[{label:AS.label('Cancel'),icon:AS.icon('circleClose'),onclick:jc.edit.noModal},{btype:'reset'},{btype:'submit'}]}] ],
				target: 'jcPageEditor',
				callback : (f) => {
					if ( b.qt ) {
						f.parse( d[b.prop][b.idx] );
					} else if (AS.test.def(d[b.prop])) {
						f.setValue(t,d[b.prop]);
					}
				},
			};
		},
		text : (b,d) => {
			let o = jc.edit.form._base(b,d);
			if ( AS.test.def(b.qt) ) {
				o.fields.push(
					["type",'select',{asLabel:'blockType',default:'text',options:[{label:AS.label('HTML'),value:'html'},{label:AS.label('Text'),value:'text'}],onchange:(x,fo)=>{
						let f = fo.getForm();
						['text','html'].forEach( fn => {
							f.fieldByName(fn).disable();
							f.fieldByName(fn).hide();
						} );
						let rf = f.fieldByName(x)
						rf.setValue( (rf.realField && rf.realField()) ? rf.realField().value : '' );
						rf.enable();
						rf.show();
					}}],
					["html","html",{nolabel:true,trim:true,asTitle:'onlyNonEmptyFields',value:""}],
					["wrap",'select',{asLabel:'blockTextAspect',default:'<h4></h4>',options:[
							{label:AS.label('H3'),value:'<h3></h3>'},
							{label:AS.label('H4'),value:'<h4></h4>'},
							{label:AS.label('Text'),value:'<div></div>'},
							{label:AS.label('Note (warning)'),value:'<div class="alert alert-warning" role="alert" style="width:66%;margin-left:auto;"></div>'},
						],depends:'type=text'}],
					["text","textarea",{nolabel:true,trim:true,asTitle:'onlyNonEmptyFields',value:""}],
				);
			} else {
				o.fields.push( ["text","textarea",{nolabel:true,trim:true,asTitle:'onlyNonEmptyFields',value:""}] );
			}
			return o;
		},
		html : (b,d) => {
			let o = jc.edit.form._base(b,d);
			o.fields.push(
				["type",'select',{asLabel:'blockType',default:'html',options:[{label:AS.label('HTML'),value:'html'},{label:AS.label('Text'),value:'text'}],onchange:(x,fo)=>{
					let f = fo.getForm();
					['text','html'].forEach( fn => {
						f.fieldByName(fn).disable();
						f.fieldByName(fn).hide();
					} );
					let rf = f.fieldByName(x)
					rf.setValue( (rf.realField && rf.realField()) ? rf.realField().value : '' );
					rf.enable();
					rf.show();
				}}],
				["html","html",{nolabel:true,trim:true,asTitle:'onlyNonEmptyFields',value:""}],
				["wrap",'select',{asLabel:'blockTextAspect',default:'<h4></h4>',options:[{label:AS.label('H3'),value:'<h3></h3>'},{label:AS.label('H4'),value:'<h4></h4>'},{label:AS.label('Text'),value:'<div></div>'}],depends:'type=text'}],
				["text","textarea",{nolabel:true,trim:true,asTitle:'onlyNonEmptyFields',value:""}],
			);
			return o;
		},
	},
	add : (e) => {
		let ob = jc.edit.itemdata(e);
		let d = jc.edit.data();
		if ( jc.edit.prop.blockTypes.length == 1 ) {
			jc.edit.addType( ob, d, jc.edit.prop.blockTypes[0] );
		} else {
			// choose block type
		}
	},
	addType : (b,d,t) => {
		let nb = {prop:b.prop,idx:AS.label('New')};
		if ( AS.test.udef(b.qt) ) {
			nb.qt = 0;
		} else {
			nb.qt = b.qt;
		}
		let fopt = jc.edit.form[t].call(window,nb,d);
		fopt.options.jsaction = (fd,fo) => {
			fo.destroy();
			jc.edit.noModal();
			if ( AS.test.def(b.qt)) {
				d[b.prop].splice( b.idx, 1, d[b.prop][b.idx], fd );
			} else {
				if ( ! AS.test.arr(d[b.prop])) d[b.prop] = [];
				d[b.prop].push(fd);
			}
			jc.edit.fixBlocks(b,d);
			jc.page.reload();
		};
		fopt.callback = (f) => {
			if ( AS.test.udef(b.qt)) f.setValue('type','html');
			else f.setValue('type',d[b.prop][b.idx].type);
		};
		jc.edit.getModal().on('shown.bs.modal',()=>{ AS.form.create( fopt ); }).modal('show');
	},
	fixBlocks : (b,d) => {
		let qt = d[b.prop].length;
		d[b.prop].forEach( (x,i) => { x.idx = i; x.qt = qt } );
		jc.edit.data(d);
	},
	rm : (e) => {
		let b = jc.edit.itemdata(e);
		let d = jc.edit.data();
		if ( Array.isArray( d[b.prop]) ) {
			d[b.prop].splice( b.idx, 1 );
			jc.edit.data(d);
			jc.page.reload();
		}
	},
	getModal : ( empty ) => {
		let mod = $('#jcEditModalLg');
		if ( mod.length > 0 ) {
			if (empty) $('.modal-dialog',mod).html('');
			return mod;
		}
		mod = $('<div id="jcEditModalLg" class="modal" tabindex="-1"><div class="modal-dialog modal-lg"></div></div>');
		$(document.body).append( mod );
		return $('#jcEditModalLg',document.body);
	},
	noModal : () => {
		let mod = jc.edit.getModal();
		mod.removeClass("in");
		$(".modal-backdrop").remove();
		mod.hide();
		mod.remove();
	},
};

jc.edit.meta = {
	edit: ( options ) => {
		options = AS.def.obj(options);
		let pd = options.pageData||jc.page.data();
		let ed = options.editData||jc.edit.data();
		if ( AS.test.udef(ed.metadata) ) ed.metadata = { type: jc.page.current(), id: pd.id };
		let $mod = jc.edit.getModal(true);
		$('.modal-dialog',$mod).append(`<div class="modal-content">
			<div class="modal-header bg-info text-white">
				<p class="modal-title">
					<span class="jcicon">${ AS.icon('metadata') }</span> 
					<b>${ AS.label('Properties') }</b>
				</p>
				<button type="button" class="close" onclick="jc.edit.noModal()" aria-label="Close">
					<span aria-hidden="true" class="jcicon modalCloser">${ AS.icon('circleClose') }</span>
				</button>
			</div>
			<div class="modal-body" id="jcPageEditor"></div></div>`);
		fp = JSON.parse(JSON.stringify(options.form||pd.template.metadata.form));
		fp.callback = f=> { if ( ed.metadata) f.parse(ed.metadata) };
		fp.target = 'jcPageEditor';
		fp.options.effectduration = 0;
		fp.options.theme = 'light';
		fp.options.title = `“${ ed.metadata.type }”${ ed.metadata.id ? ' ID: '+ed.metadata.id : '' }`;
		fp.fields.push(['btns','buttons',{position:'bottom',list:[{label:AS.label('Cancel'),icon:AS.icon('circleClose'),onclick:'()=>{jc.edit.noModal();}'},{btype:'reset'},{btype:'submit',asLabel:'Done'}]}]);
		fp.options.jsaction = (fd,f) => {
			f.destroy();
			jc.edit.noModal();
			ed.metadata = fd;
			if ( options.callback ) options.callback.call(window,ed);
			else jc.edit.data(ed);
		};
		$mod.on('shown.bs.modal',()=>{ AS.form.create(fp); }).modal('show');
	}
};