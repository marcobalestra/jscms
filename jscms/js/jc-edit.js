AS.addEvent(document,'as:tinyMceInited',e=>{
	let h = parseInt(window.innerHeight) - 200;
	h = String( h > 600 ? 600 : h )+'px';
	e.detail.getWrap().querySelector('.tox-tinymce').style.height=h;
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
				if ( data.idx ) $em.append('<span class="jcEditMoveUp" onclick="jc.edit.moveup(event)">'+AS.icon('moveUp')+'</span>');
				if ( data.idx < (data.qt -1) ) $em.append('<span class="jcEditMoveDown" onclick="jc.edit.movedown(event)">'+AS.icon('moveDown')+'</span>');
				$em.append('<span class="jcEditDropdown">'+AS.icon('menu')+'</span>');
 			} else if ( data.subtype == 'mixed' )  {
 				$em.append('<span class="jcEditDropdown">'+AS.icon('editAdd')+'</span>');
			} else {
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
			if (canAdd) acts.push({icon:'jcicon',iconKey:'editAdd',label:AS.label('blockAddContent'),action:jc.edit.add});
		}
		if ( ! acts.length ) return;
		else if ( acts.length == 1 ) acts[0].action.call(window,e);
		else jc.menu(e, { content: acts, highlight: hl });
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
			jc.edit.data(d);
			jc.page.reload();
		}
	},
	movedown : (e) => {
		let b = jc.edit.itemdata(e);
		let d = jc.edit.data();
		if ( Array.isArray( d[b.prop]) ) {
			d[b.prop].splice( b.idx, 2, d[b.prop][b.idx +1], d[b.prop][b.idx]);
			jc.edit.data(d);
			jc.page.reload();
		}
	},
	edit : (e) => {
		let b = jc.edit.itemdata(e);
		let d = jc.edit.data();
		let t = b.subtype||b.type;
		if ( ! jc.edit.form[t] ) return;
		jc.edit.getModal().on('shown.bs.modal',()=>{ AS.form.create( jc.edit.form[t].call(window,b,d) ); }).modal('show');
	},
	form : {
		_ : (b,d)=>{
			let $mod = jc.edit.getModal(true);
			let t = b.subtype||b.type;
			$('.modal-dialog',$mod).append(`<div class="modal-content">
				<div class="modal-header" style="background-color:#eee;padding:16px 20px;">
					<p style="margin:0;padding:0;">
						<span class="jcicon modalCloser" style="float:right;cursor:pointer;" onclick="jc.edit.noModal()">${ AS.icon('circleClose') }</span>
						<span class="jcicon">${ AS.icon('edit') }</span> 
						<b>
							${ AS.label('Edit') } “${ jc.page.current() }”${ jc.page.data().id ? ' ID: '+jc.page.data().id : '' },
							${ b.prop }${ b.qt ? ' ['+(b.idx +1)+'/'+b.qt+']':'' }
						</b>
					</p>
				</div>
				<div class="modal-body" id="jcPageEditor"></div>
			</div>`);
			return {
				requires : ['basic','pikaday','tinymce','iro','slider'],
				options : {
					subforms: [],
					jsaction: (fd,fo) => {
						fo.destroy();
						jc.edit.noModal();
						if ( b.qt ) {
							d[b.prop][b.idx] = fd;
						} else {
							d[b.prop] = fd[t];
						}
						jc.edit.data(d);
						jc.page.reload();
					}
				},
				fields : [ ['btns','buttons',{position:'bottom',list:[{label:'Exit',icon:AS.icon('circleClose'),onclick:jc.edit.noModal},{btype:'reset'},{btype:'submit'}]}] ],
				target: 'jcPageEditor',
				callback : (f) => {
					if ( b.qt ) {
						f.parse( d[b.prop][b.idx] );
					} else {
						f.setValue(t,d[b.prop]);
					}
				},
			};
		},
		text : (b,d) => {
			let o = jc.edit.form._(b,d);
			if ( b.qt ) {
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
			let o = jc.edit.form._(b,d);
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
		mod = $('<div id="jcEditModalLg" class="modal" data-backdrop="static"><div class="modal-dialog modal-lg"></div></div>');
		$(document.body).append( mod );
		return mod;
	},
	noModal : () => {
		let mod = jc.edit.getModal();
		mod.removeClass("in");
		$(".modal-backdrop").remove();
		mod.hide();
		mod.remove();
	},
};
