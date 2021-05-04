jc.edit = {
	start : ( delayed ) => {
		$('.jcEditable:not(.jcEditableParsed)').each( (idx,d)=>{
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
			}
			$em.append('<span class="jcEditDropdown">'+AS.icon('menu')+'</span>');
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
		e.preventDefault;
		e.stopPropagation;
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
		let fopt = jc.edit.form[t].call(window,b,d);
		let $mod = jc.edit.getModal();
		fopt.callback = (f) => {
			if ( b.qt ) {
				console.log( d[b.prop][b.idx] );
				f.parse( d[b.prop][b.idx] );
			} else {
				let fd = {};
				fd[t] = d[b.prop];
				f.parse(fd);
			}
		};
		$mod.on('shown.bs.modal',()=>{ AS.form.create( fopt ); });
		$mod.modal('show');
	},
	form : {
		_ : (b,d)=>{
			let $mod = jc.edit.getModal(true);
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
				options : { subforms: [] },
				fields : [],
				target: 'jcPageEditor',
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
					["wrap",'select',{asLabel:'blockTextAspect',default:'<h4></h4>',options:[{label:AS.label('H3'),value:'<h3></h3>'},{label:AS.label('H4'),value:'<h4></h4>'},{label:AS.label('Text'),value:'<div></div>'}],depends:'type=text'}],
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
		mod = $('<div id="jcEditModalLg" class="modal"><div class="modal-dialog modal-lg"></div></div>');
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

// jc.edit = () => {
// 	if ( AS.test.udef(repo) ) {
// 		let url = AS.path('jsreporoot') + page;
// 		if ( id ) url += id;
// 		url += '.js';
// 		jc.console('loadRepository:',url);
// 		$.ajax( url, {
// 			method: 'GET',
// 			cache: false,
// 			dataType: 'json',
// 			error: jc.getError,
// 			success: r => {
// 				if (! r) return;
// 				jc.edit( page, id, r, data );
// 			},
// 		});
// 		return;
// 	}
// 	if ( AS.test.udef(data)) {
// 		jc.page.loadData( page, id, d => { if ( d ) jc.edit( page, id, repo, d ); });
// 		return;
// 	}
// 	let $mod = jc._edit.getModal(true);
// 	$('.modal-dialog',$mod).append(`<div class="modal-content">
// 		<div class="modal-header" style="background-color:#eee;padding:16px 20px;">
// 			<p style="margin:0;padding:0;">
// 				<span class="jcicon modalCloser" style="float:right;cursor:pointer;" onclick="jc._edit.noModal()">${ AS.icon('circleClose') }</span>
// 				<span class="jcicon">${ AS.icon('edit') }</span> 
// 				<b>Modifica “${page}” ${ id ? 'ID: '+id : '' }</b>
// 			</p>
// 		</div>
// 		<div class="modal-body" id="jcPageEditor"></div>
// 	</div>`);
// 	let fp = repo.form;
// 	if ( ! fp.options ) fp.options = {};
// 	fp.options.effectduration = 0;
// 	delete fp.options.title;
// 	if ( ! fp.options.subforms ) fp.options.subforms = [];
// 	fp.options.subforms.push(
// 		{
// 			name : "blocks",
// 			subtype: "array",
// 			preview: f=>{ return String(f[f.type]).shorten(); },
// 			values : [
// 				['type','checklist',{asLabel:'blockType', ctype: 'radio', list: [{label:'HTML',value:'html'},{label:'Text',value:'text'},{label:'Images',value:'images'}],onchange:(x,fo)=>{
// 					let f = fo.getForm();
// 					['text','html','images'].forEach( fn => {
// 						f.fieldByName(fn).disable();
// 						f.fieldByName(fn).hide();
// 					} );
// 					let rf = f.fieldByName(x)
// 					rf.setValue( (rf.realField && rf.realField()) ? rf.realField().value : '' );
// 					rf.enable();
// 					rf.show();
// 				}}],
// 				["html","html",{nolabel:true,skipempty:true,trim:true,asTitle:'onlyNonEmptyFields',value:""}],
// 				["wrap",'select',{asLabel:'blockContent',default:'<h4></h4>',options:[{label:'Titolo',value:'<h4></h4>'},{label:'Testo',value:'<div></div>'}],depends:'type=text'}],
// 				["text","textarea",{nolabel:true,skipempty:true,trim:true,asTitle:'onlyNonEmptyFields',value:""}],
// 				["images","text",{nolabel:true,skipempty:true,trim:true,asTitle:'onlyNonEmptyFields',value:""}],
// 			]
// 		}
// 	);
// 	fp.target = 'jcPageEditor';
// 	fp.callback = (f)=>{ f.parse(data); };
// 	$mod.on('shown.bs.modal',()=>{ AS.form.create( fp ); });
// 	$mod.modal('show');
// };
