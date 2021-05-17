/* jc.page edit extension */

jc.page.create = ( options ) => {
	options = AS.def.obj(options);
	if ( AS.test.udef(options.page) ) {
		jc.jdav.get(
			AS.path('jsauth') + 'auth/lstemplates',
			(l) => {
				let opts = {};
				l.list.sort();
				l.list.forEach( (k) => { opts[k] = k; } );
				Swal.fire({
					title: AS.label('SelectPageType'),
					text: AS.label('SelectPageTypeDesc'),
					input: 'select',
					icon: 'question',
					inputOptions : opts,
					inputPlaceholder: 'Select',
					showCancelButton: true,
					cancelButtonText: AS.label('Cancel'),
					confirmButtonText: AS.label('OK'),
					inputValidator : (v) => {
						return new Promise((resolve) => {
							if (v.length) {
								resolve()
							} else {
								resolve(AS.label('SelectPageType'));
							}
						})
					},
				}).then( result => {
					if ( ! result.isConfirmed ) return;
					options.page = result.value;
					jc.page.create( options );
				});
			}
		)
		return;
	}
	if ( AS.test.udef(options.template) ) {
		jc.template.info.get( options.page, ( tdata )=>{
			options.template = tdata;
			jc.page.create( options );
		});
		return;
	}
	if ( AS.test.udef( options.data) ) {
		options.id = 'new';
		jc.edit.meta.edit({
			pageData : {},
			editData : { metadata: { type: options.page, id:'new' }},
			form : options.template.metadata.form,
			callback : pd => {
				options.data = pd;
				jc.page.create( options );
			}
		});
		return;
	}
	options.noDialog = true;
	options.noLasts = true;
	if ( AS.test.obj(options.template.content) ) {
		let blocks = options.template.content.find( c => (AS.test.obj(c.content) && AS.test.arr(c.content.blocks)));
		if ( blocks ) {
			blocks = blocks.content.blocks;
			if ( options.data.metadata.title && blocks.find( b =>( AS.test.obj(b) && ( b.prop=='title') )) ) options.data.title = options.data.metadata.title;
			if ( options.data.metadata.description && blocks.find( b =>( AS.test.obj(b) && ( b.prop=='abstract') )) ) options.data.abstract = options.data.metadata.description;
		}
	}
	options.callback = (page,id,data) => {
		jc.page.prop.editMode = 'page';
		jc.page.open( page, id );
	};
	jc.page.save( options );
};

jc.page.rm = ( params ) => {
	if ( AS.test.udef(params)) params = {};
	else if ( AS.test.func(params)) params = { callback: params };
	if ( AS.test.udef(params.page)) params.page = jc.page.current();
	if ( AS.test.udef(params.id) ) params.id = (jc.page.data()||{}).id;
	if ( (params.page == 'index') && (! params.id)) {
		Swal.fire({ title: AS.label('Warning'), text: AS.label('CantDeleteIndex'), icon: "error" });
		return;
	}
	if ( ! params.confirmed ) {
		Swal.fire({
			title: AS.label('DeleteThisPage'),
			html: '<div style="white-space:pre;">'+AS.label('PageEraseBody',{page:params.page,id:params.id})+'</div>',
			icon: "warning",
			showDenyButton: false,
			showCancelButton: true,
			cancelButtonText: AS.label('Cancel'),
			confirmButtonText: AS.label('OK'),
		}).then( result => {
			if ( result.isConfirmed ) {
				params.confirmed = true;
				jc.page.rm( params );
			}
		});
		return;
	}
	if ( ! params.pdataParsed ) {
		if ( ! params.mute ) jc.progress(AS.label('DeletingPage'));
		params.pdataParsed = true;
		if ( ! params.pdata ) {
			if ( jc.page.data() && jc.page.data().pageContent ) {
				params.pdata = jc.page.data().pageContent;
			} else {
				jc.page.loadData( params.page, params.id, (pdata)=>{
					params.pdata = pdata;
					jc.page.rm( params );
				});
				return;
			}
		}
	}
	if ( (! params.uploadsDeleted ) && AS.test.arr(params.pdata.uploads) && params.pdata.uploads.length) {
		let uploads = params.pdata.uploads.clone();
		let process = ()=>{
			let url = uploads.shift().uri;
			jc.dav.rm( url, ()=>{
				if ( uploads.length ) {
					process();
				} else {
					params.uploadsDeleted = true;
					jc.page.rm( params );
				}
			});
		};
		process();
		return;
	}
	if ( AS.test.udef(params.typelist)) {
		jc.jdav.get('struct/'+params.page+'-list.json',(l)=>{ params.typelist = l||{}; jc.page.rm( params ); })
		return;
	}
	if ( AS.test.udef(params.fulllist)) {
		jc.jdav.get('struct/_all-list.json',(l)=>{ params.fulllist = l||{}; jc.page.rm( params ); })
		return;
	}
	if ( ! params.removed ) {
		jc.dav.rm( params.page + ( params.id || '') + '.json', ()=>{
			params.removed = true;
			jc.page.rm( params );
		});
		return;
	}
	if ( ! params.listsPurged ) {
		delete params.fulllist[params.page][String(params.id?params.id:0)];
		delete params.typelist[String(params.id?params.id:0)];
		jc.jdav.put('struct/_all-list.json',params.fulllist,()=>{
			jc.jdav.put('struct/'+params.page+'-list.json',params.typelist,()=>{
				params.listsPurged = true;
				jc.page.rm( params );
			});
		});
		return;
	}
	if ( ! params.lastsPurged ) {
		jc.page.makeTypeLasts( params.page, params.typelist, ()=>{
			jc.page.makeTypeDates(params.page, params.typelist, ()=>{
				params.lastsPurged = true;
				jc.page.rm( params );
			});
		});
		return;
	}
	if ( ! params.mute ) {
		jc.progress(false);
		if (! params.noDialog) {
			window.setTimeout( ()=>{
				Swal.fire({
					title: AS.label('PageErasedTitle'),
					text: AS.label('PageErasedBody',{page:params.page,id:params.id}),
					icon: "success",
					showCancelButton:false,
					showConfirmButton:false,
					timer: 2000,
					timerProgressBar: true,
				});
			},100);
		}
	}
	if ( AS.test.func(params.callback) ) {
		params.callback.call(window,params.page,params.id,params.data);
		return;
	}
	if ( jc.edit ) jc.edit.data(false);
	jc.page.current('-');
	jc.page.open( 'index' );
};

jc.page.save = ( params ) => {
	console.log( params );
	if ( ! params.mute ) jc.progress(AS.label('SavingPage'));
	if ( AS.test.udef(params)) params = {};
	else if ( AS.test.func(params)) params = { callback: params };
	if ( AS.test.udef(params.data)) params.data = jc.edit.data();
	if ( AS.test.udef(params.page)) params.page = jc.page.current();
	if ( AS.test.udef(params.id) ) params.id = params.data.id;
	if ( AS.test.udef(params.typelist)) {
		jc.jdav.get('struct/'+params.page+'-list.json',(l)=>{ params.typelist = l||{}; jc.page.save( params ); })
		return;
	}
	if ( AS.test.udef(params.fulllist)) {
		jc.jdav.get('struct/_all-list.json',(l)=>{ params.fulllist = l||{}; jc.page.save( params ); })
		return;
	}
	if (params.id=='new') {
		params.isNew = true;
		if ( Object.keys(params.typelist).length ) {
			let max = 0;
			Object.keys(params.typelist).forEach( k => {
				let n = parseInt(k);
				if ( (!isNaN(n)) && ( n >= max )) max = n+1;
			} );
			if ( max > 0 ) params.id = max;
		} else {
			params.id = 1;
		}
	}
	if ( ! params.tpd ) {
		if ( AS.test.udef(params.data.metadata) ) params.data.metadata = {};
		Object.keys(params.data).forEach( k => {
			if ( AS.test.arr(params.data[k])) params.data[k].forEach( i => {
				if ( AS.test.obj(i) && ! AS.test.arr(i) ) {
					delete i.idx;
					delete i.qt;
				}
			} );
		} );
		if ( params.id ) {
			params.data.id = params.id;
			params.data.metadata.id = params.id;
		}
		if (( ! params.data.metadata.description ) && AS.test.str( params.data.abstract)) params.data.metadata.description = params.data.abstract.dehtml().shorten(256);
		if (( ! params.data.metadata.title ) && AS.test.str( params.data.title)) params.data.metadata.title = params.data.title.dehtml().shorten(48);
		params.tpd = {
			title: params.data.metadata.title||'',
			desc: params.data.metadata.description || '',
			upd: (new Date()).getTime(),
			user: jc.prop.authUser
		};
		if ( params.data.metadata.hidden ) params.tpd.hidden = true;
		if ( params.data.blogdate ) params.tpd.date = params.data.blogdate;
		if ( params.id ) params.tpd.id = parseInt(params.id);
		if (( ! params.tpd.title.length) && AS.test.str( params.data.title)) params.tpd.title = params.data.title.dehtml().shorten(48);
		if ( ! params.tpd.title.length ) params.tpd.title = params.page + ( params.id ? ' '+params.id : '');
	}
	if ( ! params.saved ) {
		jc.jdav.put( params.page + ( params.id || '') + '.json', params.data, ()=>{
			params.saved = true;
			jc.page.save( params );
		});
		return;
	}
	if ( (! params.noFullList) && (! params.savedFullList) ) {
		if ( AS.test.udef(params.fulllist[params.page]) ) params.fulllist[params.page] = {};
		params.fulllist[params.page][String(params.id?params.id:0)] = params.tpd;
		if ( ! params.mute ) jc.progress(AS.label('SavingArticleList'));
		jc.jdav.put('struct/_all-list.json',params.fulllist,()=>{
			params.savedFullList = true;
			jc.page.save( params );
		});
		return;
	}
	if ( (! params.noFullList) && (! params.savedTypeList) ) {
		params.typelist[String(params.id?params.id:0)] = params.tpd;
		jc.jdav.put('struct/'+params.page+'-list.json',params.typelist,()=>{
			params.savedTypeList = true;
			jc.page.save( params );
		});
		return;
	}
	if ( ! ( params.noLasts) && (! params.savedLasts) ) {
		if ( ! params.mute ) jc.progress(AS.label('SavingLasts'));
		jc.page.makeTypeLasts( params.page, params.typelist, ()=>{
			params.savedLasts = true;
			jc.page.save( params );
		});
		return;
	}
	if ( ! ( params.noLasts) && (! params.savedDates) ) {
		jc.page.makeTypeDates( params.page, params.typelist, ()=>{
			params.savedDates = true;
			jc.page.save( params );
		});
		return;
	}
	if ( ! params.mute ) jc.progress(false);
	if ( (! params.isNew) && (! params.noDialog) && (! params.mute) ) {
		window.setTimeout( ()=>{
			Swal.fire({
				title: AS.label('PageSavedTitle'),
				text: AS.label('PageSavedBody',{page:params.page,id:params.id}),
				icon: "success",
				showCancelButton:false,
				showConfirmButton:false,
				timer: 1500,
				timerProgressBar: true,
			});
		},100);
	}
	if ( AS.test.func(params.callback) ) {
		params.callback.call(window,params.page,params.id,params.data);
		return;
	}
	if ( jc.edit ) jc.edit.data(false);
	jc.page.current('-');
	jc.page.open( page, id );
};

jc.page.makeTypeLasts = ( pagetype, typelist, callback ) => {
	if ( ! AS.test.obj(typelist) ) {
		jc.jdav.get('struct/'+pagetype+'-list.json',(l)=>{
			typelist = l||{};
			jc.page.makeTypeLasts( pagetype, typelist, callback );
		})
		return;
	}
	let lasts = [];
	Object.keys(typelist).forEach( k => {
		const pm = typelist[k];
		if (!pm.hidden) lasts.push( pm );
	});
	lasts.sort( (a,b) =>(b.upd - a.upd));
	qts = jc.prop.lastChangedQuantities.clone().map( i => parseInt(i) ).filter( i => ( ! isNaN(i) ) );
	qts.sort( (a,b)=>( b - a ) );
	let proc = () => {
		if ( qts.length ) {
			const qt = qts.shift();
			lasts.splice(qt -1);
			jc.jdav.put('struct/'+pagetype+'-last'+qt+'.json',lasts,proc);
			return;
		} else {
			if (AS.test.func(callback)) callback.call(window);
		}
	}
	proc();
	return;
};

jc.page.makeTypeDates = ( pagetype, typelist, callback ) => {
	if ( ! AS.test.obj(typelist) ) {
		jc.jdav.get('struct/'+pagetype+'-list.json',(l)=>{
			typelist = l||{};
			jc.page.makeTypeDates( pagetype, typelist, callback );
		})
		return;
	}
	let aggr = {};
	Object.keys(typelist).forEach( k => {
		const pm = typelist[k];
		if (pm.hidden) return;
		if ( ! AS.test.str(pm.date) ) return;
		const dp = pm.date.split('-');
		if ( dp.length != 3 ) return;
		aggr[dp[0]] = AS.def.arr(aggr[dp[0]]);
		aggr[dp[0]].push(pm);
		aggr[dp[0]+'-'+dp[1]] = AS.def.arr(aggr[dp[0]+'-'+dp[1]]);
		aggr[dp[0]+'-'+dp[1]].push( pm );
	});
	let flist = Object.keys(aggr).map( sel => {
		let mlist = aggr[sel];
		mlist.sort( (a,b)=>{
			if ( a.date == b.date ) return ( a.upd < b.ud ? -1 : 1);
			return (a.date < b.date ? -1 : 1 );
		});
		return {prefix: sel, list: mlist };
	});
	let purged = false;
	let indexes = { byyear : {}, bymonth : {} };
	let proc = () => {
		if ( ! purged ) {
			jc.dav.purge({ dir:'struct',match:pagetype+'-bydate-',ext:'json'},()=>{
				purged=true;
				proc();
			});
			return;
		}
		if ( flist.length ) {
			let f = flist.shift();
			if ( f.prefix.length == 4 ) {
				if ( AS.test.udef(indexes.byyear[f.prefix])) indexes.byyear[f.prefix] = 0;
				indexes.byyear[f.prefix] += f.list.length;
			} else {
				if ( AS.test.udef(indexes.bymonth[f.prefix])) indexes.bymonth[f.prefix] = 0;
				indexes.bymonth[f.prefix] += f.list.length;
			}
			jc.jdav.put('struct/'+pagetype+'-bydate-'+f.prefix+'.json',f.list,proc);
			return;
		} else {
			let ylist = [];
			Object.keys(indexes.byyear).forEach( k => { ylist.push(k); } );
			ylist.sort().reverse();
			indexes.byyear = ylist.map( k => { return { key: k, file: 'struct/'+pagetype+'-bydate-'+k+'.json', qt: indexes.byyear[k] }; });
			let mlist = [];
			Object.keys(indexes.bymonth).forEach( k => { mlist.push(k); } );
			mlist.sort().reverse();
			indexes.bymonth = mlist.map( k => { return { key: k, file: 'struct/'+pagetype+'-bydate-'+k+'.json', qt: indexes.bymonth[k] }; });
			jc.jdav.put('struct/'+pagetype+'-bydate-index.json',indexes,()=>{
				if (AS.test.func(callback)) callback.call( window );
			});
		}
	}
	proc();
	return;
};

jc.page.upload = (fld,callback) => {
	const page = jc.page.current();
	let pdata = jc.page.data().pageContent;
	const id = pdata.id;
	const prefix = page + ( id||'');
	let uploads = AS.def.arr( pdata.uploads );
	let news = [];
	let indexes = [];
	for ( let i = 0; i < fld.files.length; i++ ) {
		if (fld.files[i].size && ( fld.files[i].size < jc.prop.maxUploadSize ) ) indexes.push(i);
	}
	if ( indexes.length == 0 ) {
		fld.value = '';
		if ( AS.test.func(callback)) callback.call(window,[],uploads);
		return;
	}
	const process = () => {
		let tf = fld.files[ indexes.shift() ];
		let oname = tf.name;
		jc.progress( oname );
		let ext = oname.replace(/.*\.([^.]+)$/,"$1").toLowerCase();
		let newname = AS.generateId(prefix)+'.'+ext;
		let url = AS.path('jsdataroot') + 'uploads/' + newname;
		tf.arrayBuffer().then( buffer => {
			let binary = new DataView(buffer);
			jc.dav.put( url, binary, (result)=>{
				if ( result ) {
					let no = { name: oname, ext: ext, uri: url, size: tf.size, type: tf.type, added: (new Date()).getTime() };
					if ( no.type && no.type.length ) {
						if (no.type.match(/^image\//) ) no.img = true;
						if (no.img||no.type.match(/\/pdf$/)  ) no.fb = true;
					} else {
						no.type = 'application/octet-stream';
					}
					no.caption = no.name.replace(/^(.*)\.[^.]+$/,"$1").replace(/[._ -]+/g,' ').trim();
					uploads.push( no );
					news.push( no );
				}
				if ( indexes.length ) {
					process();
					return;
				}
				const sortf = (a,b)=>(a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1 );
				uploads.sort(sortf);
				news.sort(sortf);
				fld.value = '';
				pdata.uploads = uploads;
				let params = {
					data : pdata,
					page: page,
					noLasts : true,
					noDialog : true,
					callback : ()=>{
						jc.progress();
						if ( AS.test.func(callback)) callback.call(window,news,uploads);
					}
				}
				if (AS.test.def(id)) params.id = id;
				jc.page.save( params );
			});
		});
	};
	process();
};

jc.page.rmUpload = ( item, callback ) => {
	let recurse = (n) => {
		if ( AS.test.arr(n) ) {
			if ( n.length ) {
				if ( n[0].size && n[0].name && n[0].uri ) return n.filter( i => ( i.uri != item.uri ) );
				else return n.map( i =>(recurse(i)) );
			}
		} else if ( AS.test.obj(n) ) {
			Object.keys(n).forEach( k => { n[k] = recurse( n[k]) } );
		}
		return n;
	}
	let pdata = recurse(jc.page.data().pageContent);
	let params = {
		data : pdata,
		page: jc.page.current(),
		id: jc.page.data().pageContent.id,
		noLasts : true,
		noDialog : true,
		callback : ()=>{ jc.dav.rm( item.uri,()=>{
			jc.progress();
			if ( AS.test.func(callback)) callback.call(window,pdata);
		})},
	}
	jc.page.save( params );
};

/* jc.edit */

jc.edit = {
	prop : {
		blockTypes : [
			{type:'text',label:'TextOrHtml',menu:true},
			{type:'gallery',label:'Gallery',menu:true},
			{type:'lasts',label:'LastChangedPages'},
			{type:'subpage',label:'IncludePage'},
			{type:'part',label:'IncludePagePart'},
		],
		formPlugins :  ['basic','pikaday','tinymce','iro','slider'],
		repo : {},
	},
	onload : () => {
		AS.addEvent(document,'as:tinyMceInited',e=>{
			e.detail.getWrap().querySelector('.tox-tinymce').style.height = String(Math.min(Math.max((parseInt(window.innerHeight)-240),300),640))+'px';
		});
		jc.edit.loadFormPlugins();
		jc.edit.getRepository();
		jc.edit.loadPageTypes();
		jc.edit.loadPageParts();
	},
	loadFormPlugins : () => {
		if ( ! (AS.form && AS.form.plugin) ) {
			window.setTimeout( jc.edit.loadFormPlugins, 100 );
			return;
		}
		jc.edit.prop.formPlugins.forEach( p => { AS.form.plugin(p); });
		// Plugins without locales and CSS
		jc.springLoad( AS.path('jsroot')+'libs/as-form-jcplugins.js' );
	},
	getRepository : ( pagetype, callback ) => {
		if ( AS.test.udef(pagetype)) pagetype = jc.page.current();
		if ( ! jc.edit.prop.repo[pagetype]) {
			jc.springLoad( AS.path('jsreporoot')+'/'+pagetype+'.js' );
			jc.edit.prop.repo[pagetype] = '_loading_';
		}
		if ( jc.edit.prop.repo[pagetype] == '_loading_' ) {
			setTimeout( ()=>{jc.edit.getRepository(pagetype,callback);},100);
			return;
		}
		if ( AS.test.func(callback) ) callback.call( window,jc.edit.prop.repo[pagetype]);
		else return jc.edit.prop.repo[pagetype];
	},
	setRepository : (pagetype,data) => { return jc.edit.prop.repo[pagetype] = data; },
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
				if ( data.subtype == 'subpage' ) {
					acts.push('-',{icon:'jcicon',iconKey:'editGo',label:AS.label('GotoPage'),action:jc.edit.gotoSubpage});
				}
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
	gotoSubpage : (e) => {
		let b = jc.edit.itemdata(e);
		let d = jc.edit.data();
		let p = d[b.prop];
		if ( AS.test.arr(p) && AS.test.def(b.idx)) p = p[b.idx][b.subtype];
		if ( AS.test.obj(p)) jc.page.open( p.page, p.id );
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
		if ( jc.edit.custom[t] ) {
			jc.edit.custom[t].edit(b,d);
		} else {
			if ( ! jc.edit.form[t] ) return;
			let $mod = jc.edit.getModal(true);
			$mod.on('shown.bs.modal',()=>{ AS.form.create( jc.edit.form[t].call(window,b,d) ); });
			$mod.modal('show');
		}
	},
	form : {
		_base : (b,d)=>{
			let $mod = jc.edit.getModal();
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
			o.fields.push(
				["date","date",{asLabel:'Date',skypempty:true,asTitle:'onlyNonEmptyFields',format:'YYYY-MM-DD',default:(new Date()).tosqldate()}],
				['footer','freehtml',{value:'<br />'}],
				);
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
				['footer','freehtml',{value:'<br />'}],
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
		subpage : (b,d) => {
			let o = jc.edit.form._base(b,d);
			o.fields.push(
				['title','freehtml',{value:'<h5>'+AS.label('BlocksFromPage')+'</h5>'}],
				['type','hidden',{value:'subpage'}],
				["subpage","jcpage",{nolabel:true,skypempty:true,mandatory:true}],
				["force",'bool',{asLabel:'ForceAlsoHidden',depends:'subpage'}],
				['footer','freehtml',{value:'<br />'}],
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
		if ( jc.edit.custom[t] ) {
			jc.edit.custom[t].add(b,d);
		} else {
			jc.edit.addByForm( b, d, t );
		}
	},
	addByForm : (b,d,t) => {
		let nb = {prop:b.prop,idx:AS.label('New')};
		if ( AS.test.udef(b.qt) ) {
			nb.qt = 0;
		} else {
			nb.qt = b.qt;
		}
		let $mod = jc.edit.getModal(true);
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
		$mod.on('shown.bs.modal',()=>{ AS.form.create( fopt ); }).modal('show');
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
	getModal : ( buildNew ) => {
		if (buildNew) {
			let f;
			while ( f = AS.form.getForm() ) { f.destroy(); }
			$('#jcEditModalLg').remove();
		}
		let mod = $('#jcEditModalLg');
		if ( mod.length == 0 ) {
			mod = $('<div id="jcEditModalLg" class="modal" tabindex="-1"><div class="modal-dialog modal-lg"></div></div>');
			$(document.body).append( mod );
		}
		return mod;
	},
	noModal : () => {
		jc.edit.getModal().modal('hide').remove();
	},
};

jc.edit.meta = {
	edit: ( options ) => {
		options = AS.def.obj(options);
		let pagetype= options.pagetype||jc.page.current();
		let pd = options.pageData||jc.page.data();
		let ed = options.editData||jc.edit.data();
		if ( ! options.form ) {
			jc.edit.getRepository( pagetype, (repo) => {
				if ( repo && repo.form && repo.form.metadata) {
					options.form = JSON.parse(JSON.stringify(repo.form.metadata));
					jc.edit.meta.edit( options );
				} else {
					jc.edit.getRepository( 'index', (repo) => {
						options.form = JSON.parse(JSON.stringify(repo.form.metadata));
						jc.edit.meta.edit( options );
					});
				}
			});
			return;
		}
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
		options.form.callback = f=> { if ( ed.metadata) f.parse(ed.metadata) };
		options.form.target = 'jcPageEditor';
		options.form.options.effectduration = 0;
		options.form.options.theme = 'light';
		options.form.options.title = `“${ ed.metadata.type }”${ ed.metadata.id ? ' ID: '+ed.metadata.id : '' }`;
		options.form.fields.push(['btns','buttons',{position:'bottom',list:[{label:AS.label('Cancel'),icon:AS.icon('circleClose'),onclick:'()=>{jc.edit.noModal();}'},{btype:'reset'},{btype:'submit',asLabel:'Done'}]}]);
		options.form.options.jsaction = (fd,f) => {
			f.destroy();
			jc.edit.noModal();
			ed.metadata = fd;
			if ( options.callback ) options.callback.call(window,ed);
			else jc.edit.data(ed);
		};
		$mod.on('shown.bs.modal',()=>{ AS.form.create(options.form); }).modal('show');
	}
};

jc.edit.custom = {
	gallery : {
		add : (b,d) => {
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
			let params = { target: $('#jcPageUploads',$mod), reloader: ()=>{ jc.edit.uploads.edit() } };
			$mod.on('shown.bs.modal',()=>{ jc.edit.uploads.render( params); }).modal({show:true,keyboard:false});
		},
		edit : (b,d) => { },
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
		let params = { target: $('#jcPageUploads',$mod), reloader: ()=>{ jc.edit.uploads.edit() } };
		$mod.on('shown.bs.modal',()=>{ jc.edit.uploads.render( params); }).modal({show:true,keyboard:false});
	},
	render : ( params ) => {
		if ( AS.test.func(params)) params = { callback: params };
		params = AS.def.obj( params );
		if ( ! params.pageData ) params.pageData = jc.page.data().pageContent;
		if ( ! params.uploads ) params.uploads = params.pageData.uploads;
		params.uploads = AS.def.arr(params.uploads);
		if ( AS.test.udef(params.select) ) params.select = AS.test.arr(params.selected);
		if ( params.select && AS.test.udef( params.selected) ) params.selected = [];
		let $out = $('<div></div>');
		$out.append($(`<div class="jcUploadsAdders text-center mb-4">
			<input type="file" multiple="multiple" style="display:none" />
			<span class="btn-group">
				<button type="button" class="btn btn-sm btn-primary jcImageUpload">${ AS.icon('upload')} ${AS.label('Upload')}</button>
			</span>
		</div>`));
		let doupload = () => {
			jc.edit.noModal();
			jc.page.upload( $('input[type="file"]',$out).get(0), ( newitems )=>{
				let refresh = (e)=> {
					$(document.body).off('jc_page_data_loaded',refresh);
					if ( params.reloader ) params.reloader.call(window);
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
			$('thead tr',$tbl).append(`<th>${ AS.label('FileName')}</th><th>${ AS.label('Caption')}</th><th>${ AS.label('FileSize')}</th><th></th>`);
			let onchange = ( e )=>{
				if ( ! AS.test.func(params.onchange)) return;
				let $tr = $(e.target).closest('tr');
				let $c = $('input[type="checkbox"]',$tr);
				let isChecked = $c.is(':checked');
				let u = $tr.data();
				if ( isChecked ) {
					params.selected.push(u);
				} else {
					params.selected = params.selected.filter( i => ( i.uri != u.uri ) );
				}
				params.onchange.call(params.selected.clone());
			};
			let rm = (item) => {
				if ( (item instanceof Event)||(item.originalEvent) ) item = $(item.target).closest('tr').data();
				jc.page.rmUpload( item, (newpdata)=>{
					jc.edit.noModal();
					let refresh = (e)=> {
						$(document.body).off('jc_page_data_loaded',refresh);
						if ( params.reloader ) params.reloader.call(window);
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
					if ( params.selected && params.selected.find( k=>( k.uri == u.uri) ) ) $i.attr('checked',true);
					$i.on('click change',onchange);
					$tr.append('<td></td>');
					$('td',$tr).append($i);
				}
				if ( u.fb ) {
					$tr.append(`<td class="fn"><a href="${u.uri}" data-fancybox="uploads" data-caption="${u.caption.escape()}">${u.name.escape()}</a></td>`);
				} else {
					$tr.append('<td class="fn">'+u.name.escape()+'</td>');
				}
				$tr.append('<td class="fc">'+u.caption.escape()+'</td>');
				$tr.append('<td class="fs">'+parseInt(u.size).smartSize()+'</td>');
				let $acts = $('<td><span class="btn-group"></span></td>') ;
				$('span',$acts).append(`<a class="btn btn-primary btn-icon btn-sm legitRipple" title="${ AS.label('Download') }" href="${u.uri}" download="${ u.name.escape() }"><i>${ AS.icon('download') }</i></a>`);
				let $del = $(`<a class="btn btn-danger btn-icon btn-sm legitRipple" title="${ AS.label('Delete') }">${ AS.icon('editRemove') }</a>`);
				$del.on('click',rm);
				$('span',$acts).append($del);
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
