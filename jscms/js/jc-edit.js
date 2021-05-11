
jc.edit = {
	prop : {
		blockTypes : [{type:'text',label:'TextOrHtml',menu:true},{type:'lasts',label:'LastChangedPages'},{type:'part',label:'IncludePagePart'}],
	},
	onload : () => {
		AS.addEvent(document,'as:tinyMceInited',e=>{
			e.detail.getWrap().querySelector('.tox-tinymce').style.height = String(Math.min(Math.max((parseInt(window.innerHeight)-240),300),640))+'px';
		});
		jc.edit.loadPageTypes();
		jc.edit.loadPageParts();
	},
	loadPageTypes : ( force )=>{
		if ( force || (! jc.edit.prop.pageTypes) ) {
			jc.edit.prop.pageTypes = true;
			jc.jdav.get(AS.path('jsauth') + 'auth/lstemplates', r => { jc.edit.prop.pageTypes = r.list; });
		}
	},
	loadPageParts : ( force )=>{
		if ( force || (! jc.edit.prop.pageParts) ) {
			jc.edit.prop.pageParts = true;
			jc.jdav.get(AS.path('jsauth') + 'auth/lsparts', r => { jc.edit.prop.pageParts = r.list; });
		}
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
			if (canAdd) {
				let addItem = {icon:'jcicon',iconKey:'editAdd',ricon:'jcicon',riconKey:'arrow-down',label:AS.label('blockAddContent'),action:jc.edit.add};
				if ( jc.edit.prop.blockTypes.length > 1 ) {
					addItem.label += '…';
					let vt = jc.edit.prop.blockTypes.filter( t =>(t.menu) );
					if ( vt.length ) {
						addItem.content = vt.map( t=>{ return {label:AS.label(t.label),action:e=>{jc.edit.add(e,t.type)}}; } );
					}
				}
				acts.push(addItem);
			}
		}
		if ( ! acts.length ) return;
		else if ( acts.length == 1 ) return acts[0].action.call(window,e);
		acts.unshift('Block: '+(data.subtype||data.type));
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
						if ( AS.test.def(b.qt) ) {
							// block mixed elem
							d[b.prop][b.idx] = fd;
							jc.edit.fixBlocks(b,d);
						} else if ( AS.test.def(fd[t]) ){
							// single block, single property: one field named like the type
							d[b.prop] = fd[t];
							jc.edit.data(d);
						} else {
							// multi properties
							d[b.prop] = fd;
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
		lasts : (b,d) => {
			let o = jc.edit.form._base(b,d);
			o.fields.push(
				['ptype','select',{asLabel:'PageType',options:jc.edit.prop.pageTypes.clone()}],
				['qtitems','select',{asLabel:'Max',options:jc.prop.lastChangedQuantities.clone()}],
			);
			return o;
		},
		date : (b,d) => {
			let o = jc.edit.form._base(b,d);
			o.fields.push( ["date","date",{asLabel:'Date',skypempty:true,asTitle:'onlyNonEmptyFields',format:'YYYY-MM-DD',default:(new Date()).tosqldate()}] );
			return o;
		},
		part : (b,d) => {
			let o = jc.edit.form._base(b,d);
			let opts = jc.edit.prop.pageParts.clone();
			opts.sort();
			opts.unshift({label:AS.label('Choose')+'…',value:''});
			o.fields.push(
				['part','select',{asLabel:'PageType',options:opts,mandatory:true}],
				['type','hidden',{value:'part'}],
			);
			return o;
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
	add : (e,t) => {
		let ob = jc.edit.itemdata(e);
		let d = jc.edit.data();
		if ( jc.edit.prop.blockTypes.length == 1 ) t = jc.edit.prop.blockTypes[0];
		if ( AS.test.str(t) ) {
			jc.edit.addType( ob, d, t );
		} else {
			// choose block type
			let ml = AS.label('Mains')+':';
			let ol = AS.label('Others')+':';
			let opts={};
			opts[ml]={};
			jc.edit.prop.blockTypes.filter(t=>(t.menu)).forEach( t=>{ opts[ml][t.type] = AS.label(t.label) } );
			opts[ol]={};
			jc.edit.prop.blockTypes.filter(t=>(!t.menu)).forEach( t=>{ opts[ol][t.type] = AS.label(t.label) } );
			Swal.fire({
				title: AS.label('SelectBlockType'),
				text: AS.label('SelectBlockTypeDesc'),
				input: 'select',
				icon: 'question',
				inputOptions : opts,
				inputPlaceholder: AS.label('Choose')+'…',
				showCancelButton: true,
				cancelButtonText: AS.label('Cancel'),
				confirmButtonText: AS.label('OK'),
				inputValidator : (v) => {
					return new Promise((resolve) => {
						if (v.length) {
							resolve()
						} else {
							resolve(AS.label('SelectBlockType'));
						}
					})
				},
			}).then( result => {
				if ( ! result.isConfirmed ) return;
				jc.edit.addType( ob, d, result.value );
			});
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
			if ( AS.test.def(t)) f.setValue('type',t);
			else if ( AS.test.udef(b.qt)) f.setValue('type','html');
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
		$(document.body).removeClass( 'modal-open' );
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

jc.edit.uploads = {
	edit : () => {
		let pdata = jc.page.data().pageContent;
		let $mod = jc.edit.getModal(true);
		$('.modal-dialog',$mod).append(`<div class="modal-content">
			<div class="modal-header bg-info text-white">
				<p class="modal-title">
					<span class="jcicon">${ AS.icon('uploads') }</span> 
					<b>${ AS.label('Uploads') }</b>
				</p>
				<button type="button" class="close" onclick="jc.edit.noModal()" aria-label="Close">
					<span aria-hidden="true" class="jcicon modalCloser">${ AS.icon('circleClose') }</span>
				</button>
			</div>
			<div class="modal-body" id="jcPageUploads"></div></div>`);
		let params = { target: $('#jcPageUploads',$mod), context: 'page' };
		$mod.on('shown.bs.modal',()=>{ jc.edit.uploads.render( params); }).modal({show:true,keyboard:false});
	},
	render : ( params ) => {
		if ( AS.test.func(params)) params = { callback: params };
		params = AS.def.obj( params );
		if ( ! params.pageData ) params.pageData = jc.page.data().pageContent;
		if ( ! params.uploads ) params.uploads = params.pageData.uploads;
		params.uploads = AS.def.arr(params.uploads);
		if ( AS.test.udef(params.select) ) params.select = AS.test.arr(params.selected);
		let $out = $('<div></div>');
		$out.append($(`<div class="jcUploadsAdders text-center mb-4">
			<input type="file" multiple="multiple" style="display:none" />
			<span class="btn-group">
				<button type="button" class="btn btn-sm btn-primary jcImageUpload">${ AS.icon('upload')} ${AS.label('Upload')}</button>
			</span>
		</div>`));
		let doupload = () => {
			jc.page.upload( $('input[type="file"]',$out).get(0), ( newitems )=>{
				let refresh = (e)=> {
					$(document.body).off('jc_page_data_loaded',refresh);
					jc.edit.noModal();
					if ( params.context=='page') jc.edit.uploads.edit();
				}
				$(document.body).on('jc_page_data_loaded',refresh);
				jc.page.reload();
			});
		};
		$('.jcImageUpload',$out).on('click',()=>{ $('input[type="file"]',$out).trigger('click'); });
		$('input[type="file"]',$out).on('change',(e)=>{ doupload() });
		if ( params.uploads.length ) {
			let $tbl = $('<table class="jcUploads"><thead><tr></tr></thead><tbody></tbody></table>');
			if ( params.select ) $('thead tr',$tbl).append('<th></th>');
			$('thead tr',$tbl).append(`<th>${ AS.label('FileName')}</th><th>${ AS.label('FileSize')}</th><th></th>`);
			let onchange = ()=>{
			};
			let rm = (item) => {
				if ( (item instanceof Event)||(item.originalEvent) ) item = $(item.target).closest('tr').data();
				jc.page.rmUpload( item, (newpdata)=>{
					let refresh = (e)=> {
						$(document.body).off('jc_page_data_loaded',refresh);
						jc.edit.noModal();
						if ( params.context=='page') jc.edit.uploads.edit();
					}
					$(document.body).on('jc_page_data_loaded',refresh);
					jc.page.reload();
				});
			};
			params.uploads.forEach( u=>{
				let $tr = $('<tr></tr>')
				$tr.data(u);
				if ( params.select ) {
					let $i = $('<input type="ceckbox" />');
					if ( params.selected && params.selected.find( k=>( k.name == u.name) ) ) $i.attr('checked',true);
					$i.on('click change',onchange);
					$tr.append('<td></td>');
					$('td',$tr).append($i);
				}
				if ( u.img ) {
					$tr.append(`<td><a href="${u.uri}" data-fancybox="uploads" onclick="this.blur()" data-caption="${u.name.escape()}">${u.name.escape()}</a></td>`);
				} else {
					$tr.append('<td>'+u.name.escape()+'</td>');
				}
				$tr.append('<td>'+parseInt(u.size).smartSize()+'</td>');
				let $acts = $('<td class="btn-group"></td>') ;
				$acts.append(`<a class="btn btn-primary btn-icon btn-sm legitRipple" title="${ AS.label('Download') }" href="${u.uri}" download="${ u.name.escape() }"><i>${ AS.icon('download') }</i></a>`);
				let $del = $(`<a class="btn btn-danger btn-icon btn-sm legitRipple" title="${ AS.label('Delete') }">${ AS.icon('editRemove') }</a>`);
				$del.on('click',rm);
				$acts.append($del);
				$tr.append($acts);
				$('tbody',$tbl).append($tr);
			} );
			$out.append( $tbl );
		} else {
			$out.append( '<div class="jcPlaceHolder text-center">'+AS.label('NoItemsFound')+'</div>' );
		}
		if ( params.target ) $(params.target).append($out);
		if ( AS.test.func(params.callback) ) params.callback.call( window, $out );
		return $out;
	},
};

jc.edit.loadPageTypes = ( force )=>{
	if ( force || (! jc.edit.prop.pageTypes) ) {
		jc.edit.prop.pageTypes = true;
		jc.jdav.get(AS.path('jsauth') + 'auth/lstemplates', r => { jc.edit.prop.pageTypes = r.list; });
	}
};

jc.edit.loadPageParts = ( force )=>{
	if ( force || (! jc.edit.prop.pageParts) ) {
		jc.edit.prop.pageParts = true;
		jc.jdav.get(AS.path('jsauth') + 'auth/lsparts', r => { jc.edit.prop.pageParts = r.list; });
	}
};

$( ()=>{ jc.edit.onload(); });
