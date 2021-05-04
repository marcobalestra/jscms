jc.edit = {
	start : () => {
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
		let oe = jc.edit.data();
		if ( ! oe ) oe = jc.edit.data( jc.page.data().pageContent );
	},
	data : (d) => {
		if ( AS.test.obj(d) ) {
			jc.prefs.key('onEdit',JSON.stringify({ page:jc.page.current(), id:jc.page.data().id, data: d }));
			return jc.prefs.key('onEdit').data;
		}
		d = JSON.parse(jc.prefs.key('onEdit')||'{}');
		let theSame = d && ( d.page == jc.page.current() );
		if ( theSame && d.id ) theSame = ( d.id == jc.page.data().id );
		if ( theSame ) return d.data;
		jc.prefs.purge('onEdit');
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
		jc.menu(e, { content: acts, highlight: hl });
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
			let foo = d[b.prop][b.idx];
			d[b.prop][b.idx] = d[b.prop][b.idx -1];
			d[b.prop][b.idx -1] = foo;
			jc.edit.data(d);
			jc.page.reload();
		}
	},
	movedown : (e) => {
		let b = jc.edit.itemdata(e);
		let d = jc.edit.data();
		if ( Array.isArray( d[b.prop]) ) {
			let foo = d[b.prop][b.idx];
			d[b.prop][b.idx] = d[b.prop][b.idx +1];
			d[b.prop][b.idx +1] = foo;
			jc.edit.data(d);
			jc.page.reload();
		}
	},
	edit : (e) => {
		
	},
	add : (e) => {
		
	},
	rm : (e) => {
		
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
		let mod = jc._edit.getModal();
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
