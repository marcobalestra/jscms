jc._edit = { prop: {} };

jc.edit = (page,id,repo,data) => {
	if ( AS.test.udef(repo) ) {
		let url = AS.path('jsreporoot') + page;
		if ( id ) url += id;
		url += '.js';
		jc.console('loadRepository:',url);
		$.ajax( url, {
			method: 'GET',
			cache: false,
			dataType: 'json',
			error: jc.getError,
			success: r => {
				if (! r) return;
				jc.edit( page, id, r, data );
			},
		});
		return;
	}
	if ( AS.test.udef(data)) {
		jc.page.loadData( page, id, d => { if ( d ) jc.edit( page, id, repo, d ); });
		return;
	}
	let $mod = jc._edit.getModal(true);
	$('.modal-dialog',$mod).append(`<div class="modal-content">
		<div class="modal-header" style="background-color:#eee;padding:16px 20px;">
			<p style="margin:0;padding:0;">
				<span class="jcicon modalCloser" style="float:right;cursor:pointer;" onclick="jc._edit.noModal()">${ AS.icon('circleClose') }</span>
				<span class="jcicon">${ AS.icon('edit') }</span> 
				<b>Modifica “${page}” ${ id ? 'ID: '+id : '' }</b>
			</p>
		</div>
		<div class="modal-body" id="jcPageEditor"></div>
	</div>`);
	let fp = repo.form;
	if ( ! fp.options ) fp.options = {};
	fp.options.effectduration = 0;
	delete fp.options.title;
	if ( ! fp.options.subforms ) fp.options.subforms = [];
	fp.options.subforms.push(
		{
			name : "blocks",
			subtype: "array",
			preview: f=>{ return String(f[f.type]).shorten(); },
			values : [
				['type','checklist',{asLabel:'blockType', ctype: 'radio', list: [{label:'HTML',value:'html'},{label:'Text',value:'text'},{label:'Images',value:'images'}],onchange:(x,fo)=>{
					let f = fo.getForm();
					['text','html','images'].forEach( fn => {
						f.fieldByName(fn).disable();
						f.fieldByName(fn).hide();
					} );
					let rf = f.fieldByName(x)
					rf.setValue( (rf.realField && rf.realField()) ? rf.realField().value : '' );
					rf.enable();
					rf.show();
				}}],
				["html","html",{nolabel:true,skipempty:true,trim:true,asTitle:'onlyNonEmptyFields',value:""}],
				["wrap",'select',{asLabel:'blockContent',default:'<h4></h4>',options:[{label:'Titolo',value:'<h4></h4>'},{label:'Testo',value:'<div></div>'}],depends:'type=text'}],
				["text","textarea",{nolabel:true,skipempty:true,trim:true,asTitle:'onlyNonEmptyFields',value:""}],
				["images","text",{nolabel:true,skipempty:true,trim:true,asTitle:'onlyNonEmptyFields',value:""}],
			]
		}
	);
	fp.target = 'jcPageEditor';
	fp.callback = (f)=>{ f.parse(data); };
	$mod.on('shown.bs.modal',()=>{ AS.form.create( fp ); });
	$mod.modal('show');
};

jc._edit.getModal = ( empty ) => {
	let mod = $('#jcEditModalLg');
	if ( mod.length > 0 ) {
		if (empty) $('.modal-dialog',mod).html('');
		return mod;
	}
	mod = $('<div id="jcEditModalLg" class="modal"><div class="modal-dialog modal-lg"></div></div>');
	$(document.body).append( mod );
	return mod;
};

jc._edit.noModal = () => {
	let mod = jc._edit.getModal();
	mod.removeClass("in");
	$(".modal-backdrop").remove();
	mod.hide();
	mod.remove();
};
