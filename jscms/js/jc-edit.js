/* jc.dav edit extensions */

$.extend( jc.dav, {
	put : ( url, data, success, fail, progf ) => {
		fail = jc.evalFunc(fail)||jc.evalFunc(success)||jc.getError;
		success = jc.evalFunc(success)||(()=>{});
		if ( ! url.match(jc.prop.absUriMatcher) ) url = AS.path('jsdataroot') + url;
		jc.console('jc.dav.put',url,data);
		let progress = ( (data instanceof DataView) && (data.byteLength > 65536) );
		$.ajax(url,{
			xhr: ()=>{
				let xhr = $.ajaxSettings.xhr();
				if (progress) xhr.upload.onprogress = (e) => {
					if ( ! e.lengthComputable ) return;
					if ( AS.test.func(progf) ) {
						progf.call(window,e.loaded,e.total,(e.loaded/e.total));
					} else {
						jc.progress('Upload: '+(parseInt(100*e.loaded/e.total))+'%' );
					}
				};
				return xhr;
			},
			method: 'PUT',
			dataType: 'text',
			processData: false,  // Important!
			cache: false,
			contentType: 'text/plain; charset=UTF-8',
			data: data,
			error: (...errs) => {
				if ( progress ) {
					if ( AS.test.func(progf) ) {
						progf.call(window,false);
					} else {
						jc.progress();
					}
				}
				fail.call(window,false,errs);
			},
			success : () => {
				if ( progress ) {
					if ( AS.test.func(progf) ) {
						progf.call(window,true);
					} else {
						jc.progress();
					}
				}
				success.call(window,true);
			}
		});
	},
	mkdir : ( url, success, fail ) => {
		fail = jc.evalFunc(fail)||jc.evalFunc(success)||jc.getError;
		success = jc.evalFunc(success)||(()=>{});
		if ( ! url.match(jc.prop.absUriMatcher) ) url = AS.path('jsdataroot') + url;
		jc.console('jc.dav.mkdir',url);
		$.ajax( url, {
			method: 'MKCOL',
			cache: false,
			dataType: 'text',
			error: (...errs) => { fail.call(window,false,errs); },
			success : () => { success.call(window,true); }
		});
	},
	rm : ( url, success, fail ) => {
		fail = fail||success||jc.getError;
		success = success||(()=>{});
		if ( ! url.match(jc.prop.absUriMatcher) ) url = AS.path('jsdataroot') + url;
		jc.console('jc.dav.rm',url);
		$.ajax( url, {
			method: 'DELETE',
			cache: false,
			contentType: 'text/xml; charset=UTF-8',
			dataType: 'text',
			error: (...errs) => { fail.call(window,false,errs); },
			success : (xt) => { success.call(window,xt); }
		});
	},
	purge : ( ...args ) => {
		let success,fail,options={};
		args.forEach( (a) => {
			if ( AS.test.obj(a)) {
				if ( a.dir ) options.dir = a.dir;
				if ( a.ext ) options.ext = a.ext;
				if ( a.match ) options.match = a.match;
				return;
			}
			let f = jc.evalFunc(a);
			if ( AS.test.func(f) ) {
				if ( success ) fail = f;
				else success = f;
			}
			if ( AS.test.str(a) ) {
				options.dir = a;
			}
		} );
		fail = fail||success||jc.getError;
		success = success||(()=>{});
		if (options.dir) options.dir = options.dir.replace(/\/$/,'');
		jc.dav.ls( options, (out)=>{
			let count = 0;
			let proc = ()=>{
				if ( out.list.length ) {
					count++;
					let url = (out.dir ? out.dir + '/' : '') + out.list.shift();
					jc.dav.rm( url, proc );
				} else {
					if ( AS.test.func(success) ) success.call( window, count );
				}
			};
			proc();
		}, fail);
	},
	ls : ( ...args ) => {
		let success,fail,options={};
		args.forEach( (a) => {
			if ( AS.test.obj(a)) {
				if ( a.dir ) options.dir = a.dir;
				if ( a.ext ) options.ext = a.ext;
				if ( a.match ) options.match = a.match;
				return;
			}
			let f = jc.evalFunc(a);
			if ( AS.test.func(f) ) {
				if ( success ) fail = f;
				else success = f;
			}
			if ( AS.test.str(a) ) {
				options.dir = a;
			}
		} );
		fail = fail||success||jc.getError;
		success = success||(()=>{});
		let url = AS.path('jsauth') + 'auth/lsdata';
		jc.console('jc.dav.ls',url);
		$.ajax( url, {
			method: 'GET',
			cache: false,
			dataType: 'json',
			data : options,
			error: (...errs) => { fail.call(window,false,errs); },
			success : (data) => {
				Object.keys( options ).forEach( k => {
					if ( options[k] ) data[k] = options[k];
				} );
				success.call(window,data);
			}
		});
	},
});
$.extend( jc.jdav,{
	put : ( url, data, success, fail ) => {
		fail = jc.evalFunc(fail)||jc.evalFunc(success)||jc.getError;
		success = jc.evalFunc(success)||(()=>{});
		if ( ! url.match(jc.prop.absUriMatcher) ) url = AS.path('jsdataroot') + url;
		jc.console('jc.jdav.put',url,data);
		$.ajax( url, {
			method: 'PUT',
			cache: false,
			dataType: 'json',
			contentType: 'application/json; charset=UTF-8',
			data: AS.test.obj(data) ? JSON.stringify(data) : data,
			error: (...errs) => { fail.call(window,false,errs); },
			success : () => { success.call(window,true); }
		});
	}
});
Object.keys( jc.dav ).forEach( (k) => { if (AS.test.udef(jc.jdav[k])) jc.jdav[k] = jc.dav[k]; } );


/* jc.lists edit extension */

$.extend( true, jc.lists, {
	list: {
		set : ( ...args ) => {
			let commit = args.find(a=>AS.test.bool(a));
			if ( AS.test.udef(commit)) commit=true;
			if ( commit ) {
				jc.lists.list.commit.apply(window,args);
			} else {
				const type = args.find(a=>AS.test.str(a))||'_all';
				const list = JSON.parse(JSON.stringify(args.find(a=>AS.test.obj(a))||{}));
				const callback = args.find(a=>AS.test.func(a));
				if ( AS.test.udef())
				if ( AS.test.func(callback)) callback.call(window);
			}
		},
		commit : ( ...args ) => {
			const type = args.find(a=>AS.test.str(a))||'_all';
			const list = JSON.parse(JSON.stringify(args.find(a=>AS.test.obj(a))||jc.lists.prop.lists[type]||{}));
			const callback = args.find(a=>AS.test.func(a));
			jc.jdav.put( jc.lists.list.uri(type), list, (r)=>{
				jc.lists.prop.lists[type] = list;
				if ( AS.test.func(callback)) callback.call(window,r);
			});
		},
	},
	last: {
		set : ( ...args ) => {
			let commit = args.find(a=>AS.test.bool(a));
			if ( AS.test.udef(commit)) commit=true;
			if ( commit ) {
				jc.lists.last.commit.apply(window, args)
			} else {
				const type = args.find(a=>AS.test.str(a))||'_all';
				const qt = args.find(a=>AS.test.num(a));
				const list = JSON.parse(JSON.stringify(args.find(a=>AS.test.arr(a))||[]));
				const callback = args.find(a=>AS.test.func(a));
				if ( ! jc.lists.prop.lasts[type] ) jc.lists.prop.lasts[type] = {};
				jc.lists.prop.lasts[type][String(qt)] = list;
				if (AS.test.func(callback)) callback.call(window);
			}
		},
		commit : ( ...args ) => {
			const type = args.find(a=>AS.test.str(a))||'_all';
			const qt = args.find(a=>AS.test.num(a));
			let list = JSON.parse(JSON.stringify(args.find(a=>AS.test.arr(a))||jc.lists.prop.lasts[type][String(qt)]||[]));
			const callback = args.find(a=>AS.test.func(a));
			let uri = jc.lists.last.uri(type,qt);
			jc.jdav.put( uri, list, (r)=>{
				if ( ! jc.lists.prop.lasts[type] ) jc.lists.prop.lasts[type] = {};
				jc.lists.prop.lasts[type][String(qt)] = list;
				if ( AS.test.func(callback)) callback.call(window,r);
			});
		},
		dorss : ( ...args ) => {
			const type = args.find(a=>AS.test.str(a))||'_all';
			const qt = args.find(a=>AS.test.num(a));
			let list = args.find(a=>AS.test.arr(a));
			const callback = args.find(a=>AS.test.func(a));
			if ( ! list ) list = jc.lists.prop.lasts[type][String(qt)]||[];
			let uri = jc.lists.last.uri(type,qt).replace(/\.json/,'.rss');
			let feed = '<?xml version="1.0" encoding="UTF-8" ?>\n<rss version="2.0">\n<channel>\n';
			feed += '<title>'+$('head title',document.documentElement).html().escape()+'</title>\n';
			let baseuri = window.location.protocol + '//' + window.location.hostname + '/';
			feed += '<link>'+baseuri+'</link>\n';
			feed += '<generator>jBloud CMS - jscms</generator>\n';
			list.forEach( i => {
				let pt = i.page||type;
				feed += '<item>\n';
				feed += '\t<link>'+baseuri+pt+(i.id||'')+'/</link>\n';
				feed += '\t<pubDate>'+ (new Date(i.upd)).toUTCString() +'</pubDate>\n';
				feed += '\t<title>'+i.title.escape()+'</title>\n';
				if ( i.desc && i.desc.length ) feed += '\t<description><![CDATA['+i.desc+']]></description>\n';
				feed += '</item>\n';
			} );
			feed += '</channel>\n</rss>\n';
			jc.dav.put( uri, feed, (r)=>{
				if ( AS.test.func(callback)) callback.call(window,r);
			});
		},
	},
});


/* jc.page edit extension */

jc.page.create = ( options ) => {
	options = AS.def.obj(options);
	if ( AS.test.udef(options.page) ) {
		let l = jc.edit.prop.pageTypes.clone().sort();
		let opts = {};
		l.forEach( (k) => { opts[k] = k; } );
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
		let blocks = [];
		options.template.content.forEach( c => {
			if ( AS.test.arr(c.content) ) {
				c.content.forEach( (d) => {
					if (AS.test.arr(d.blocks)) d.blocks.forEach( (b) => { if (AS.test.obj(b)) blocks.push(b) } );
				} );
			} else if ( AS.test.obj(c.content) ) {
				if (AS.test.arr(c.content.blocks)) c.content.blocks.forEach( (b) => { if (AS.test.obj(b)) blocks.push(b) } );
			}
		} );
		if ( blocks.length ) {
			if ( options.data.metadata.title ) {
				if ( blocks.find( b =>( b.prop=='title') ) ) options.data.title = options.data.metadata.title;
			}
			if (options.data.metadata.description ) {
				if ( blocks.find( b =>( b.prop=='abstract') ) ) options.data.abstract = options.data.metadata.description;
				else if ( blocks.find( b =>( b.prop=='descriptions') ) ) options.data.descriptions = options.data.metadata.description;
			}
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
		jc.lists.list.get(params.page,(l)=>{ params.typelist = l||{}; jc.page.rm( params ); });
		return;
	}
	if ( AS.test.udef(params.fulllist)) {
		jc.lists.list.get((l)=>{ params.fulllist = l||{}; jc.page.rm( params ); });
		return;
	}
	if ( ! params.removed ) {
		jc.dav.rm( AS.path('jsdatapages') + params.page + ( params.id || '') + '.json', ()=>{
			jc.dav.rm( AS.path('jsdatapagestatics') + params.page + ( params.id || '') + '.html',()=>{
				params.removed = true;
				jc.page.rm( params );
			});
		});
		return;
	}
	if ( ! params.listsPurged ) {
		delete params.fulllist[params.page][String(params.id?params.id:0)];
		delete params.typelist[String(params.id?params.id:0)];
		jc.lists.list.set(params.fulllist,()=>{
			jc.lists.list.set(params.page,params.typelist,()=>{
				params.listsPurged = true;
				jc.page.rm( params );
			});
		});
		return;
	}
	if ( ! params.lastsPurged ) {
		jc.page.makeLasts( params.fulllist, ()=>{
			jc.page.makeTypeLasts( params.page, params.typelist, ()=>{
				jc.page.makeTypeDates(params.page, params.typelist, ()=>{
					params.lastsPurged = true;
					jc.page.rm( params );
				});
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
	if ( ! params.mute ) jc.progress(AS.label('SavingPage'));
	if ( AS.test.udef(params)) params = {};
	else if ( AS.test.func(params)) params = { callback: params };
	if ( AS.test.udef(params.data)) params.data = jc.edit.data() || jc.page.data().pageContent;
	if ( AS.test.udef(params.page)) params.page = jc.page.current();
	if ( AS.test.udef(params.id) ) params.id = params.data.id;
	if ( AS.test.udef(params.typelist)) {
		jc.lists.list.get(params.page,(l)=>{ params.typelist = l||{}; jc.page.save( params ); })
		return;
	}
	if ( AS.test.udef(params.fulllist)) {
		jc.lists.list.get((l)=>{ params.fulllist = l||{}; jc.page.save( params ); })
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
	if ( ! params.metadataChecked ) {
		if ( AS.test.udef(params.data.metadata) ) params.data.metadata = {};
		Object.keys(params.data).forEach( k => {
			if ( AS.test.arr(params.data[k])) params.data[k].forEach( i => {
				if ( AS.test.obj(i) && ! AS.test.arr(i) ) {
					delete i._;
				}
			} );
		} );
		if ( params.id ) params.data.id = params.data.metadata.id = parseInt(params.id);
		if (( ! params.data.metadata.description ) && AS.test.str( params.data.abstract)) params.data.metadata.description = params.data.abstract.dehtml().shorten(256);
		if (( ! params.data.metadata.title ) && AS.test.str( params.data.title)) params.data.metadata.title = params.data.title.dehtml().shorten(48);
		if ( ! params.data.metadata.title ) params.data.metadata.title = params.page + ( params.id ? ' '+params.id : '');
		if ( params.data.blogdate ) params.metadata.date = params.data.blogdate;
		params.data.metadata.upd = (new Date()).getTime();
		params.metadataChecked = true;
	}
	if ( ! params.saved ) {
		jc.jdav.put( AS.path('jsdatapages') + params.page + ( params.id || '') + '.json', params.data, ()=>{
			$(document.body).trigger('jc_saved_page_data',params);
			params.saved = true;
			jc.page.save( params );
		});
		return;
	}
	if ( (! params.noFullList) && (! params.savedFullList) ) {
		if ( AS.test.udef(params.fulllist[params.page]) ) params.fulllist[params.page] = {};
		params.fulllist[params.page][String(params.id?params.id:0)] = Object.assign(params.data.metadata);
		if ( ! params.mute ) jc.progress(AS.label('SavingArticleList'));
		jc.lists.list.set(params.fulllist,()=>{
			$(document.body).trigger('jc_saved_page_fulllist',params);
			params.savedFullList = true;
			jc.page.save( params );
		});
		return;
	}
	if ( (! params.noFullList) && (! params.savedTypeList) ) {
		params.typelist[String(params.id?params.id:0)] = Object.assign(params.data.metadata);
		jc.lists.list.set(params.page,params.typelist,()=>{
			$(document.body).trigger('jc_saved_page_typelist',params);
			params.savedTypeList = true;
			jc.page.save( params );
		});
		return;
	}
	if ( ! ( params.noLasts) && (! params.savedLasts) ) {
		if ( ! params.mute ) jc.progress(AS.label('SavingLasts'));
		jc.page.makeLasts( params.fulllist, ()=>{
			$(document.body).trigger('jc_saved_page_lasts',params);
			jc.page.makeTypeLasts( params.page, params.typelist, ()=>{
				params.savedLasts = true;
				jc.page.save( params );
			});
		});
		return;
	}
	if ( ! ( params.noLasts) && (! params.savedDates) ) {
		jc.page.makeTypeDates( params.page, params.typelist, ()=>{
			$(document.body).trigger('jc_saved_page_dates',params);
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
	let makeStatic = () => {
		jc.page.makeStatic( ( done )=> {
			if ( done ) $(document.body).off('jc_render_end', makeStatic );
			$(document.body).trigger('jc_saved_page_full',params);
		});
	};
	$(document.body).on('jc_render_end', makeStatic );
	$(document.body).trigger('jc_saved_page',params);
	if ( AS.test.func(params.callback) ) {
		params.callback.call(window,params.page,params.id,params.data);
		return;
	}
	if ( jc.edit ) jc.edit.data(false);
	jc.page.current('-');
	jc.page.open( params.page, params.id );
};

jc.page.makeStatic = ( cb ) => {
	if ( $('.jcEditable').length ) {
		if ( AS.test.func(cb) ) cb.call(window,false);
		return;
	}
	//if ( $('.swal2-container').length ) return setTimeout( makeStatic, 200 );
	$(document.body).trigger('jc_saving_static');
	const uri = AS.path('jsdatapagestatics')+jc.page.current()+(jc.page.data().pageContent.id||'')+'.html';
	let cn = document.body.className;
	document.body.className = '';
	let html = $(document.documentElement).html();
	document.body.className = cn;
	html = html
		.replace(/(<script [^>]+\/jscms\/js\/jc-load\.js"[^>]*>[^<]*<\/script>)[\s\S]*?>\s*(<\/head>)/,"$1$2")
		.replace(/[ \t]*<script [^>]+AS-autoload[^>]+>[^<]*<\/script>[\r\n]*/g,'')
		.replace(/[ \t]*<script [^>]+facebook\.(com|net)[^>]+>[^<]*<\/script>[\r\n]*/g,'')
		.replace(/<!--type:part=fbcomments[\s\S]*?<!--\/type:part-->/,'')
		.replace(/\n*<div id="fb-root" [\s\S]+?<\/div>\n+/,'')
		.replace(/\n*<div [^>]+swal2-container[\s\S]+?<div [^>]+swal2-timer-progress-bar[^>]+>([\s\S]*?<\/div>\n*){4}/,'')
		.replace(/\n*<div [^>]*class="[^"]*modal[ "][\s\S]+?<div [^>]*class="[^"]*modal-backdrop[^>]+>[^<]*<\/div>\n*/,'')
		.replace(/\n*<div [^>]*class="[^"]*modal[ "][\s\S]+<\/div>\n*<\/body>/,'</body>')
		.replace(/(<meta[^>]+content="),+([^>]+>)/g,"$1$2")
		.replace(/<nav [\s\S]+?<\/nav>/g,"")
		.replace(/<svg [\s\S]+?<\/svg>/g,"")
		;
	html = '<!DOCTYPE html>\n<html>\n'+html+'\n</html>';
	jc.dav.put( uri, html, ()=>{
		$(document.body).trigger('jc_saved_static');
		if ( AS.test.func(cb) ) cb.call(window,true);
	});
};

jc.page.makeLasts = ( list, callback ) => {
	if ( ! AS.test.obj(list) ) {
		jc.lists.list.get((l)=>{ jc.page.makeLasts( l||{}, callback ); });
		return;
	}
	let lasts = [];
	Object.keys(list).forEach( (t) => {
		let typelist = list[t];
		Object.keys(typelist).forEach( k => {
			if ( typelist[k].hidden ) return;
			lasts.push( Object.assign(typelist[k]) );
		});
	} );
	lasts.sort( (a,b) =>(b.upd - a.upd));
	qts = jc.prop.lastChangedQuantities.clone().map( i => parseInt(i) ).filter( i => ( ! isNaN(i) ) );
	qts.sort( (a,b)=>( b - a ) );
	let makeRss = true;
	let proc = () => {
		if ( qts.length ) {
			const qt = qts.shift();
			lasts.splice(qt -1);
			if ( makeRss) {
				makeRss = false;
				qts.unshift(qt);
				jc.lists.last.dorss('site',qt,lasts,proc);
			} else {
				jc.lists.last.set(qt,lasts,proc);
			}
			return;
		} else {
			if (AS.test.func(callback)) callback.call(window);
		}
	}
	proc();
	return;
};

jc.page.makeTypeLasts = ( pagetype, typelist, callback ) => {
	if ( ! AS.test.obj(typelist) ) {
		jc.lists.list.get(pagetype,(l)=>{
			typelist = l||{};
			jc.page.makeTypeLasts( pagetype, typelist, callback );
		})
		return;
	}
	let lasts = [];
	Object.keys(typelist).forEach( k => {
		if ( typelist[k].hidden ) return;
		lasts.push( Object.assign(typelist[k]) );
	});
	lasts.sort( (a,b) =>(b.upd - a.upd));
	qts = jc.prop.lastChangedQuantities.clone().map( i => parseInt(i) ).filter( i => ( ! isNaN(i) ) );
	qts.sort( (a,b)=>( b - a ) );
	let proc = () => {
		if ( qts.length ) {
			const qt = qts.shift();
			lasts.splice(qt -1);
			jc.lists.last.set(pagetype,qt,lasts,proc);
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
		jc.lists.list.get(pagetype,(l)=>{
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

jc.page.upload = (fld,...args) => {
	let options={},callback;
	args.forEach( (a) => {
		if ( AS.test.func(a) ) callback = a;
		else if ( AS.test.obj(a) ) options = a;
	} );
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
		if ( ! options.mute ) jc.progress( oname );
		let ext = oname.replace(/.*\.([^.]+)$/,"$1").toLowerCase();
		let newname = AS.generateId(prefix)+'.'+ext;
		let url = AS.path('jsdataroot') + 'uploads/' + newname;
		tf.arrayBuffer().then( buffer => {
			let binary = new DataView(buffer);
			jc.dav.put( url, binary, (result)=>{
				if ( result ) {
					let no = { name: oname, ext: ext, uri: url, size: tf.size, type: tf.type, added: (new Date()).getTime() };
					if ( no.type && no.type.length ) {
						if ( no.type.indexOf('audio/')==0) no.fb = no.au = true;
						else if ( no.type.indexOf('video/')==0) no.fb = no.vid = true;
						else if ( no.type.indexOf('image/')==0) no.fb = no.img = true;
						else if ( no.type.match(/\/pdf$/) ) no.fb = true;
					} else {
						no.type = 'application/octet-stream';
					}
					no.caption = options.caption ? options.caption : no.name.replace(/^(.*)\.[^.]+$/,"$1").replace(/[._ -]+/g,' ').trim();
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
					noFullList : true,
					noDialog : true,
					mute : !! options.mute,
					callback : ()=>{
						if ( ! options.mute ) jc.progress();
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

jc.page.uploadBlob = (blob,...args) => {
	let options,callback,info;
	args.forEach( (a) => {
		if ( AS.test.func(a) ) callback = a;
		else if ( AS.test.obj(a) && a.uri ) info = a;
		else if ( AS.test.obj(a) ) options = a;
	} );
	if ( AS.test.udef(info) ) info = {};
	if ( AS.test.udef(options) ) options = {};
	let prevuri = info.uri;
	const page = options.page||jc.page.current();
	let pdata = jc.page.data().pageContent;
	const id = options.id||pdata.id;
	let uploads = AS.def.arr( pdata.uploads );
	if ( options.purged ) uploads = uploads.filter( x => ( x.uri != options.purged ));
	if ( blob.size ) info.size = blob.size;
	if ( info.size > jc.prop.maxUploadSize ) {
		if ( AS.test.func(callback)) callback.call(window,false,uploads);
		return;
	}
	if ( blob.type && blob.type.length ) info.type = blob.type;
	if ( ! info.type ) info.type = options.type||'application/octet-stream';
	if ( (! info.ext) && blob.name ) info.ext = blob.name.replace(/^.*\.([^.]+)$/,"$1").toLowerCase();
	if ( (! info.ext) && info.type ) info.ext = info.type.replace(/^[^\/]+\/([^ ;]+).*$/,"$1").toLowerCase();
	if ( info.type.indexOf('audio/')==0) info.fb =info.au = true;
	else if ( info.type.indexOf('video/')==0) info.fb = info.vid = true;
	else if ( info.type.indexOf('image/')==0) info.fb = info.img = true;
	else if ( info.type.match(/\/pdf$/) ) info.fb = true;
	let news=[];
	if ( info.name ) {
		info.name = info.name.replace(/\.[^.]+$/,'')+'.'+info.ext;
	} else if ( blob.name ) {
		info.name = blob.name;
	} else {
		info.name = info.type.replace(/\/.*/,'') +'_'+((new Date()).tosqldate().replace(/[^0-9]+/g,'-'))+'.'+info.ext;
		if ( ! info.caption ) info.caption = options.caption || ( info.type.replace(/\/.*/,'') +' '+(new Date()).tosql() );
	}
	if ( ! info.caption ) info.caption = options.caption || info.name.replace(/^(.*)\.[^.]+$/,"$1").replace(/[._-]+/g,' ');
	if ( info.uri && (info.uri.indexOf(AS.path('jsdataroot'))==0) ) {
		info.uri = info.uri.replace(/\.[^.]+$/,'.'+info.ext);
	} else {
		info.uri = AS.path('jsdataroot') + 'uploads/' + AS.generateId(page+(id||''))+'.'+info.ext;
	}
	if ( prevuri && ( info.uri != prevuri ) && (! options.purged)) {
		jc.page.rmUpload( { uri: prevuri }, ()=>{
			options.purged = prevuri;
			jc.page.uploadBlob( blob, info, options, callback );
		});
		return;
	}
	uploads = uploads.filter( x => ( x.uri != info.uri) );
	info.added = (new Date()).getTime();
	if ( ! info.caption ) info.caption = options.caption ? options.caption : info.name.replace(/^(.*)\.[^.]+$/,"$1").replace(/[._ -]+/g,' ').trim();
	blob.arrayBuffer().then( buffer => {
		let binary = new DataView(buffer);
		jc.dav.put( info.uri, binary, (result)=>{
			if ( result ) {
				uploads.push( info );
				news.push( info );
			}
			const sortf = (a,b)=>(a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1 );
			uploads.sort(sortf);
			news.sort(sortf);
			pdata.uploads = uploads;
			let params = {
				data : pdata,
				page: page,
				noLasts : true,
				noFullList : true,
				noDialog : true,
				mute : !! options.mute,
				callback : ()=>{
					if ( ! options.mute ) jc.progress();
					if ( AS.test.func(callback)) callback.call(window,news,uploads);
				}
			}
			if (AS.test.def(id)) params.id = id;
			jc.page.save( params );
		});
	});
};

jc.page.rmUpload = ( item, callback ) => {
	let recurse = (n) => {
		if ( AS.test.arr(n) ) {
			if ( n.length ) {
				if ( n[0].uri ) return n.filter( i => ( i.uri != item.uri ) );
				else return n.map( i =>(recurse(i)) );
			}
		} else if ( AS.test.obj(n) ) {
			Object.keys(n).forEach( k => { n[k] = recurse( n[k]) } );
		}
		return n;
	}
	let pdata = recurse(jc.page.data().pageContent);
	jc.page.save( {
		data : pdata,
		page: jc.page.current(),
		id: jc.page.data().pageContent.id,
		noLasts : true,
		noFullList : true,
		mute : true,
		noDialog : true,
		callback : ()=>{ jc.dav.rm( item.uri,()=>{
			jc.progress();
			if ( AS.test.func(callback)) callback.call(window,pdata);
		})},
	});
};

/* jc.edit */

jc.edit = {
	prop : {
		blockTypes : [
			{type:'text',label:'TextOrHtml',menu:true},
			{type:'gallery',label:'Gallery',menu:true},
			{type:'audio',label:'Audio'},
			{type:'video',label:'Video'},
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
		$(document.body).trigger('jc_edit_loaded');
	},
	loadFormPlugins : () => {
		if ( ! (AS.form && AS.form.plugin) ) {
			window.setTimeout( jc.edit.loadFormPlugins, 100 );
			return;
		}
		jc.edit.prop.formPlugins.forEach( p => { AS.form.plugin(p); });
		// Plugins without locales and CSS
		jc.springLoad( AS.path('jscdn')+'libs/as-form-jcplugins'+(jc.prop.isDeveloper?'':'.min')+'.js' );
	},
	getRepository : ( pagetype, callback ) => {
		if ( AS.test.udef(pagetype)) pagetype = jc.page.current();
		jc.template.repo.get( pagetype, callback );
	},
	setRepository : jc.template.repo.set,
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
	maintenance : ( confirmed ) => {
		if ( ! confirmed ) {
			Swal.fire({
				title: AS.label('MaintenanceConfirmTitle'),
				html: AS.label('MaintenanceConfirmBody'),
				icon: "question",
				showDenyButton: false,
				showCancelButton: true,
				cancelButtonText: AS.label('Cancel'),
				confirmButtonText: AS.label('OK'),
			}).then( result => {
				if ( result.isConfirmed ) jc.edit.maintenance( true );
			});
			return;
		}
		if ( ! jc.maint ) {
			jc.springLoad('module:maintenance');
			return window.setTimeout( ()=>{ jc.edit.maintenance( confirmed ) }, 300 );
		}
		jc.maint.start();
	},
	start : () => {
		jc.edit.getRepository();
		document.querySelectorAll('.jcEditable:not(.jcEditableParsed)').forEach( (d) => {
			let $d = $(d);
			let data = $d.data('editable');
			if ( ! data && AS.test.obj(data) ) {
				$d.removeClass('jcEditable');
				return;
			}
			$d.addClass('jcEditableParsed');
			let $em = $(`<div class="jcEditMenu"></div>`);
			if ( jc.page.prop.editMode == 'page' ) {
				if ( AS.test.def(data._) && AS.test.def(data._.idx) ) {
					$d.on('dblclick',jc.edit.edit);
					if ( data._.idx < (data._.qt -1) ) $em.append('<span class="jcEditMoveDown" onclick="jc.edit.movedown(event)">'+AS.icon('moveDown')+'</span>');
					if ( data._.idx ) $em.append('<span class="jcEditMoveUp" onclick="jc.edit.moveup(event)">'+AS.icon('moveUp')+'</span>');
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
			} else if ( jc.page.prop.editMode == 'parts' ) {
				$d.on('dblclick',jc.edit.part);
				$em.append('<span class="jcEditDropdown">'+AS.icon('edit')+'</span>');
				$d.prepend($em);
				$d.on('contextmenu',jc.edit.part);
				$('.jcEditMenu .jcEditDropdown',$d).on('click contextmenu',jc.edit.part);
			}
		});
	},
	data : (d) => {
		if ( d == false ) {
			jc.prefs.purge('onEditData');
		} else if ( AS.test.obj(d) ) {
			jc.prefs.key('onEditData',{ page:jc.page.current(), id:jc.page.data().id, data: d });
			return jc.prefs.key('onEditData').data;
		} else if ( jc.page.prop.editMode == 'page' ) {
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
			let canAdd = ( AS.test.def(data._) && AS.test.def(data._.idx) );
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
		if ( AS.test.arr(p) && AS.test.def(b._.idx)) p = p[b._.idx][b.subtype];
		if ( AS.test.obj(p)) jc.page.open( p.page, p.id );
	},
	moveup : (e) => {
		let b = jc.edit.itemdata(e);
		let d = jc.edit.data();
		if ( Array.isArray( d[b.prop]) ) {
			d[b.prop].splice( b._.idx -1, 2, d[b.prop][b._.idx], d[b.prop][b._.idx -1]);
			jc.edit.fixBlocks(b,d);
			jc.page.reload();
		}
	},
	movedown : (e) => {
		let b = jc.edit.itemdata(e);
		let d = jc.edit.data();
		if ( Array.isArray( d[b.prop]) ) {
			d[b.prop].splice( b._.idx, 2, d[b.prop][b._.idx +1], d[b.prop][b._.idx]);
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
							${ b.prop }${ (AS.test.def(b._) && AS.test.def(b._.qt)) ? ' ['+(AS.test.num(b._.idx) ? String(b._.idx +1)+'/'+b._.qt : b._.idx)+']':'' }
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
						if ( AS.test.def(b._) && AS.test.def(b._.qt) ) {
							// block mixed elem
							d[b.prop][b._.idx] = fd;
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
					if ( b._ && b._.qt ) {
						f.parse( d[b.prop][b._.idx] );
					} else if (AS.test.def(d[b.prop])) {
						f.setValue(t,d[b.prop]);
					}
				},
			};
		},
		lasts : (b,d) => {
			let o = jc.edit.form._base(b,d);
			let ptypes = jc.edit.prop.pageTypes.clone();
			ptypes.unshift({label:AS.label('Choose'),value:''},{label:'* '+AS.label('All'),value:'_all'});
			let vtypes = [{label:AS.label('Numbered list'),value:'ol,li'},{label:AS.label('Bullet list'),value:'ul,li'},{label:AS.label('Plain list'),value:'div,div'}]
			o.fields.push(
				['type','hidden',{value:'lasts'}],
				['ptype','select',{asLabel:'PageType',options:ptypes,skipempty:true,mandatory:true}],
				['title','text',{asLabel:'Title',normalize:true,skipempty:true,depends:'ptype'}],
				['view','select',{asLabel:'blockTextAspect',options:vtypes,depends:'ptype'}],
				['max','slider',{asLabel:'Max',min:1,max:100,report:{value:true},default:10,depends:'ptype'}],
				['showdate','bool',{asLabel:'ShowDate',depends:'ptype'}],
				['showtime','bool',{asLabel:'ShowTime',depends:'showdate'}],
				['showdesc','bool',{asLabel:'ShowDesc',depends:'ptype'}],
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
			if ( b._ && AS.test.def(b._.qt) ) {
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
		let nb = {prop:b.prop,_:{idx:AS.label('New')}};
		if ( (! b._ ) || AS.test.udef(b._.qt) ) {
			nb._.qt = 0;
		} else {
			nb._.qt = b._.qt;
		}
		let $mod = jc.edit.getModal(true);
		let fopt = jc.edit.form[t].call(window,nb,d);
		fopt.options.jsaction = (fd,fo) => {
			fo.destroy();
			jc.edit.noModal();
			if ( b._ && AS.test.def(b._.qt)) {
				d[b.prop].splice( b._.idx, 1, d[b.prop][b._.idx], fd );
			} else {
				if ( ! AS.test.arr(d[b.prop])) d[b.prop] = [];
				d[b.prop].push(fd);
			}
			jc.edit.fixBlocks(b,d);
			jc.page.reload();
		};
		fopt.callback = (f) => {
			if ( AS.test.def(t)) f.setValue('type',t);
			else if ( (b._) || AS.test.udef(b._.qt)) f.setValue('type','html');
			else f.setValue('type',d[b.prop][b._.idx].type);
		};
		$mod.on('shown.bs.modal',()=>{ AS.form.create( fopt ); }).modal('show');
	},
	fixBlocks : (b,d) => {
		let qt = d[b.prop].length;
		d[b.prop].forEach( (x,i) => {
			if ( ! x._ ) x._ = {};
			x._.idx = i;
			x._.qt = qt;
		});
		jc.edit.data(d);
	},
	rm : (e) => {
		let b = jc.edit.itemdata(e);
		let d = jc.edit.data();
		if ( Array.isArray( d[b.prop]) ) {
			d[b.prop].splice( b._.idx, 1 );
			jc.edit.data(d);
			jc.page.reload();
		}
	},
	part: (e) => {
		let b = jc.edit.itemdata(e);
		b.target = e.target;
		b.type = AS.test.obj(b.raw) ? 'object' : 'html';
		jc.edit.partEdit(b);
	},
	partEdit : ( data ) => {
		if ( (data.type == 'object') && AS.test.udef(data.repo)) {
			jc.template.part.get( data.src, { repo:true }, (repo) =>{
				data.repo = repo;
				jc.edit.partEdit(data);
			});
			return;
		}
		let $mod = jc.edit.getModal(true);
		$('.modal-dialog',$mod).append(`<div class="modal-content">
				<div class="modal-header bg-light">
					<p class="modal-title">
						<span class="jcicon">${ AS.icon('edit') }</span> 
						<b> ${ AS.label('Edit') } “${ data.src }” </b>
					</p>
					<button type="button" class="close" onclick="jc.edit.noModal()" aria-label="Close">
						<span aria-hidden="true" class="jcicon modalCloser">${ AS.icon('circleClose') }</span>
					</button>
				</div>
				<div class="modal-body" id="jcPageEditor"></div>
			</div>`);
		let fo;
		if ( data.type == 'object') {
			fo = data.repo.form();
			fo.callback = (f) => { f.parse(data.raw); }
			fo.options.jsaction = (fd,f) => {
				f.destroy();
				jc.edit.noModal();
				jc.template.part.put(data.src,fd,()=>{
					jc.page.reload();
				});
			};
		} else {
			fo = {
				options : {
					theme: 'transparent',
					subforms: [],
					jsaction: (fd,f) => {
						f.destroy();
						jc.edit.noModal();
						jc.template.part.put(data.src,fd.html,()=>{
							jc.page.reload();
						});
					}
				},
				fields : [ ["html","html",{nolabel:true,trim:true,asTitle:'onlyNonEmptyFields',value:""}] ],
				callback : (f) => {
					f.setValue('html',data.raw);
				},
			};
			
		}
		fo.target = 'jcPageEditor';
		fo.options.effectduration = 0;
		fo.fields.push(['hr','hr',{position:'bottom'}],['btns','buttons',{position:'bottom',list:[{label:AS.label('Cancel'),icon:AS.icon('circleClose'),onclick:jc.edit.noModal},{btype:'submit'}]}]),
		$mod.on('shown.bs.modal',()=>{ AS.form.create( fo ); });
		$mod.modal('show');
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
	audio : {
		getModal : ( empty ) => {
			let $mod = jc.edit.getModal(empty);
			if ( empty ) {
				$('.modal-dialog',$mod).append(`<div class="modal-content">
					<div class="modal-header bg-info text-white">
						<p class="modal-title">
							<span class="jcicon">${ AS.icon('audio') }</span> 
							<b>${ AS.label('Audio') }</b>
						</p>
						<button type="button" class="close" onclick="jc.edit.noModal()" aria-label="Close">
							<span aria-hidden="true" class="jcicon modalCloser">${ AS.icon('circleClose') }</span>
						</button>
					</div>
					<div class="modal-body" id="jcPageAudio"></div>
					<div class="modal-footer">
						<button type="button" class="btn btn-secondary" onclick="jc.edit.noModal()">${ AS.label('Cancel') }</button>
						<button type="button" disabled="disabled" class="btn btn-primary jcMediaSaver">${ AS.label('Save') }</button>
					</div>
				</div>`);
			}
			return $mod;
		},
		add : (b,d,prevb) => {
			const canRecord = (!! window.MediaRecorder);
			let prevd, blob,$mod = jc.edit.custom.audio.getModal(true);
			if (prevb) prevd = prevb.uri ? prevb : prevb.audio;
			let pdata = jc.page.data().pageContent;
			if ( pdata.uploads && pdata.uploads.filter( x => (x.au && ((!prevd)||(x.uri!=prevd.uri)) ) ).length ) {
				let $sa = $('<div class="jcMediaSelectArea"></div>');
				let $s = $('<select></select>');
				let preva = prevd ? pdata.uploads.find( x => ( x.uri == prevd.uri) ) : false;
				$s.append('<option value="">'+(preva ? '['+preva.ext+': '+preva.caption+']' : AS.label('Choose')+'…')+'</option>');
				pdata.uploads.filter( x => (x.au && ((!prevd)||(x.uri!=prevd.uri)) ) ).forEach( u => {
					$s.append(`<option value="${ u.uri }">${u.ext}: ${ u.caption }</option>`);
				} );
				$sa.on('change',()=>{
					let issel = $s.val().length;
					$('.jcMediaRecordArea, .jcMediaUploadArea',$mod).toggle(! issel);
					$('.jcMediaSaver',$mod).attr('disabled',!issel);
				});
				const $hflex = $('<hflex class="wrap"></hflex>');
				$hflex.append(`<div>${ AS.label('ChooseAudio')}:</div>`,$s);
				$('.modal-body',$mod).append($sa.append($hflex));
			}
			let $ra = $('<div class="jcMediaRecordArea"></div>');
			if ( $ra ) {
				if ( canRecord ) {
					let chunks=[],mediaRecorder;
					const $audio = $('<audio src="" controls="controls">This browser doesn’t support HTML5 audio</audio>');
					const $bt = $('<button type="button" class="btn btn-primary jcMediaToggler"><span class="jcicon">'+AS.icon('mic')+'</span></button>');
					const $btd = $('<button type="button" class="btn btn-danger jcMediaDeleter" disabled="disabled"><span class="jcicon">'+AS.icon('editRemove')+'</span></button>');
					const $btp = $('<button type="button" class="btn btn-secondary jcMediaPauser ml-2" style="display:none;"><span class="jcicon">'+AS.icon('pause')+'</span></button>');
					const $hflex = $('<hflex class="wrap"></hflex>');
					if ( AS.test.obj(prevd) && prevd.uri ) {
						$audio.attr('src',prevd.uri);
						$btd.attr('disabled',false);
					}
					$hflex.append(`<div>${ AS.label('RecordAudio')}:</div>`,$audio,$('<div class="btn-group"></div>').append($bt,$btd),$btp);
					$ra.append($hflex);
					const doPreview = () => {
						doBlob();
						if ( blob ) {
							$audio.get(0).src = URL.createObjectURL( blob );
							if ( mediaRecorder && mediaRecorder.state && (mediaRecorder.state == 'paused') ) {
								// do nothing
							} else {
								$('.jcMediaSaver, .jcMediaDeleter',$mod).attr('disabled',false);
								mediaRecorder = false;
							}
						} else {
							$audio.get(0).src = '';
							$('.jcMediaSaver, .jcMediaDeleter',$mod).attr('disabled',true);
						}
						$('.jcMediaSelectArea, .jcMediaUploadArea',$mod).toggle(! blob);
					};
					const doBlob = () => {
						if (!chunks.length) return blob = false;
						return blob = new Blob(chunks, { type: mediaRecorder.mimeType });
					};
					const startRecording = async () => {
						let e;
						chunks = [];
						let supported = {};
						let constraints = {};
						try { supported = navigator.mediaDevices.getSupportedConstraints(); } catch(e) {}
						constraints.audio = {};
						constraints.video = false;
						if ( supported.latency ) constraints.latency = constraints.audio.latency = { ideal: 0 };
						if ( supported.channelCount ) constraints.channelCount = constraints.audio.channelCount = { ideal: 1 };
						if ( supported.sampleSize ) constraints.sampleSize = constraints.audio.sampleSize = { ideal: 8, max: 16 };
						if ( supported.noiseSuppression ) constraints.noiseSuppression = constraints.audio.noiseSuppression = { ideal: true };
						if ( supported.echoCancellation ) constraints.echoCancellation = constraints.audio.echoCancellation = { ideal: true };
						if ( supported.sampleRate ) constraints.sampleRate = constraints.audio.sampleRate = { min: 16000, ideal: 32000, max: 48000  };
						if ( ! Object.keys(constraints.audio).length ) constraints.audio = true;
						let stream;
						while ( ! stream ) {
							try {
								stream = await navigator.mediaDevices.getUserMedia(constraints);
							} catch(e) {
								delete constraints[e.constraint];
								if ( AS.test.obj(constraints.audio)) delete constraints.audio[e.constraint];
								if ( ! Object.keys(constraints.audio).length ) constraints.audio = true;
							}
						}
						let options = { mimeType: 'audio/mp4"', audioBitsPerSecond : 9600 };
						try {
							mediaRecorder = new MediaRecorder(stream,options);
						} catch(e) {
							delete options.mimeType;
							try {
								mediaRecorder = new MediaRecorder(stream,options);
							} catch(e) {
								mediaRecorder = new MediaRecorder(stream);
							}
						}
						mediaRecorder.addEventListener("start", e => {
							$bt.removeClass('btn-primary').addClass('btn-danger');
							if ( mediaRecorder.pause ) $btp.removeClass('btn-warning').addClass('btn-secondary').show();
							$('.jcMediaSaver, .jcMediaDeleter',$mod).attr('disabled',true);
							$('span',$bt).html( AS.icon('stop') );
							$ra.addClass('recording');
						});
						mediaRecorder.addEventListener("dataavailable", e => { if ( e.data) chunks.push(e.data); });
						mediaRecorder.addEventListener("stop", e => {
							$bt.removeClass('btn-danger').addClass('btn-primary');
							if ( mediaRecorder.pause ) $btp.removeClass('btn-warning').addClass('btn-secondary').hide();
							$ra.removeClass('recording');
							$('span',$bt).html( AS.icon('mic') );
							stream.getTracks().forEach(track => track.stop());
							doPreview();
						});
						mediaRecorder.addEventListener("pause", e => {
							$ra.removeClass('recording');
							$btp.removeClass('btn-secondary').addClass('btn-warning');
							doPreview();
						});
						mediaRecorder.addEventListener("resume", e => {
							$ra.addClass('recording');
							$btp.removeClass('btn-warning').addClass('btn-secondary');
						});
						mediaRecorder.start(300000);
					};
					$bt.on('click',()=>{ if ( mediaRecorder ) { mediaRecorder.stop(); } else { startRecording(); } });
					$btp.on('click',()=>{ if ( ! mediaRecorder ) return; if ( mediaRecorder.state == 'paused' ) { mediaRecorder.resume(); } else { mediaRecorder.pause(); } });
					$btd.on('click',()=>{ if ( mediaRecorder ) return; chunks=[]; doPreview(); });
				} else {
					$ra.append('<div class="alert alert-warning" role="alert">'+AS.label('BrowserMediaRecorderMissing')+'</div>');
				}
				$('.modal-body',$mod).append($ra);
			}
			let $ua = $(`<div class="jcMediaUploadArea"></div>`);
			if ( $ua ) {
				let $uf = $('<input type="file" class="jcMediaUploadField" accept="audio/*" />');
				const $hflex = $('<hflex class="wrap"></hflex>');
				$hflex.append(`<div>${ AS.label('ChooseAudio')}:</div>`,$uf);
				$uf.on('change',()=>{
					let issel = $uf.val().length;
					$('.jcMediaRecordArea, .jcMediaSelectArea',$mod).toggle(! issel);
					$('.jcMediaSaver',$mod).attr('disabled',!issel);
				});
				$('.modal-body',$mod).append($ua.append($hflex));
			}
			$mod.on('shown.bs.modal',()=>{
				$('button.jcMediaSaver',$mod).on('click',()=>{
					if ( (! blob) && $('.jcMediaUploadField').val().length ) blob = $('.jcMediaUploadField').get(0).files[0];
					if ( blob ) {
						let options = { type: 'audio/webm' };
						jc.page.uploadBlob( blob,(prevd||{}),options,( news, uploads )=>{
							let na = news[0];
							if (! na ) return;
							let nd = { type: 'audio', audio: { uri: na.uri } };
							jc.edit.custom.audio.save(b,d,nd,prevb);
						});
						return;
					}
					if ( $('.jcMediaSelectArea select',$mod).val().length ) {
						let finalize = () => {
							let nd = { type: 'audio', audio: { uri: $('.jcMediaSelectArea select',$mod).val() } };
							jc.edit.custom.audio.save(b,d,nd,prevb);
						};
						if ( prevd && prevd.uri && prevd.uri.length ) {
							jc.page.rmUpload( prevd, finalize );
						} else {
							finalize();
						}
					}
				});
			});
			$mod.modal({show:true,keyboard:false});
		},
		edit : (b,d) => { jc.edit.custom.audio.add(b,d,d[b.prop][b._.idx]); },
		save : (b,d,newd,oldd) => {
			if ( AS.test.obj(oldd) ) {
				d[b.prop].splice( b._.idx, 1, newd );
			} else {
				if ( b._ && AS.test.def(b._.qt)) {
					d[b.prop].splice( b._.idx, 1, d[b.prop][b._.idx], newd );
				} else {
					if ( ! AS.test.arr(d[b.prop])) d[b.prop] = [];
					d[b.prop].push(newd);
				}
			}
			jc.edit.fixBlocks(b,d);
			jc.edit.noModal();
			jc.page.reload();
		},
	},
	video : {
		getModal : ( empty ) => {
			let $mod = jc.edit.getModal(empty);
			if ( empty ) {
				$('.modal-dialog',$mod).append(`<div class="modal-content">
					<div class="modal-header bg-info text-white">
						<p class="modal-title">
							<span class="jcicon">${ AS.icon('video') }</span> 
							<b>${ AS.label('Video') }</b>
						</p>
						<button type="button" class="close" onclick="jc.edit.noModal()" aria-label="Close">
							<span aria-hidden="true" class="jcicon modalCloser">${ AS.icon('circleClose') }</span>
						</button>
					</div>
					<div class="modal-body" id="jcPageVideo"></div>
					<div class="modal-footer">
						<button type="button" class="btn btn-secondary" onclick="jc.edit.noModal()">${ AS.label('Cancel') }</button>
						<button type="button" disabled="disabled" class="btn btn-primary jcMediaSaver">${ AS.label('Save') }</button>
					</div>
				</div>`);
			}
			return $mod;
		},
		add : (b,d,prevb) => {
			const canRecord = (!! window.MediaRecorder);
			let prevd, blob,$mod = jc.edit.custom.video.getModal(true);
			if (prevb) prevd = prevb.uri ? prevb : prevb.video;
			let pdata = jc.page.data().pageContent;
			if ( pdata.uploads && pdata.uploads.filter( x => (x.vid && ((!prevd)||(x.uri!=prevd.uri)) ) ).length ) {
				let $sa = $('<div class="jcMediaSelectArea"></div>');
				let $s = $('<select></select>');
				let preva = prevd ? pdata.uploads.find( x => ( x.uri == prevd.uri) ) : false;
				$s.append('<option value="">'+(preva ? '['+preva.ext+': '+preva.caption+']' : AS.label('Choose')+'…')+'</option>');
				pdata.uploads.filter( x => (x.vid && ((!prevd)||(x.uri!=prevd.uri)) ) ).forEach( u => {
					$s.append(`<option value="${ u.uri }">${u.ext}: ${ u.caption }</option>`);
				} );
				$sa.on('change',()=>{
					let issel = $s.val().length;
					$('.jcMediaRecordArea, .jcMediaUploadArea',$mod).toggle(! issel);
					$('.jcMediaSaver',$mod).attr('disabled',!issel);
				});
				const $hflex = $('<hflex class="wrap"></hflex>');
				$hflex.append(`<div>${ AS.label('ChooseVideo')}:</div>`,$s);
				$('.modal-body',$mod).append($sa.append($hflex));
			}
			let $ra = $('<div class="jcMediaRecordArea"></div>');
			if ( $ra ) {
				if ( canRecord ) {
					let chunks=[],mediaRecorder;
					const $video = $('<video src="" style="max-height:'+parseInt($(window).height() -300)+'px;" controls="controls">This browser doesn’t support HTML5 video</video>');
					const $bt = $('<button type="button" class="btn btn-primary jcMediaToggler"><span class="jcicon">'+AS.icon('video')+'</span></button>');
					const $btd = $('<button type="button" class="btn btn-danger jcMediaDeleter" disabled="disabled"><span class="jcicon">'+AS.icon('editRemove')+'</span></button>');
					const $btp = $('<button type="button" class="btn btn-secondary jcMediaPauser ml-2" style="display:none;"><span class="jcicon">'+AS.icon('pause')+'</span></button>');
					const $hflex = $('<hflex class="wrap"></hflex>');
					if ( AS.test.obj(prevd) && prevd.uri ) {
						$video.attr('src',prevd.uri);
						$btd.attr('disabled',false);
					}
					$hflex.append(`<div>${ AS.label('RecordVideo')}:</div>`,$video,$('<div class="btn-group"></div>').append($bt,$btd),$btp);
					$ra.append($hflex);
					const doPreview = () => {
						doBlob();
						if ( blob ) {
							if ( mediaRecorder && mediaRecorder.state && (mediaRecorder.state == 'paused') ) {
								// do nothing
							} else {
								$('.jcMediaSaver, .jcMediaDeleter',$mod).attr('disabled',false);
								mediaRecorder = false;
							}
						} else {
							$video.get(0).src = null;
							$('.jcMediaSaver, .jcMediaDeleter',$mod).attr('disabled',true);
						}
						$('.jcMediaSelectArea, .jcMediaUploadArea',$mod).toggle(! blob);
					};
					const doBlob = () => {
						if (!chunks.length) return blob = false;
						return blob = new Blob(chunks, { type: mediaRecorder.mimeType });
					};
					const startRecording = async () => {
						chunks = [];
						let e;
						let supported = {};
						let constraints = {};
						try { supported = navigator.mediaDevices.getSupportedConstraints(); } catch(e) {}
						constraints.audio = {};
						constraints.video = {};
						if ( supported.latency ) constraints.latency = constraints.audio.latency = { ideal: 0 };
						if ( supported.channelCount ) constraints.channelCount = constraints.audio.channelCount = { ideal: 1 };
						if ( supported.sampleSize ) constraints.sampleSize = constraints.audio.sampleSize = { ideal: 8, max: 16 };
						if ( supported.noiseSuppression ) constraints.noiseSuppression = constraints.audio.noiseSuppression = { ideal: true };
						if ( supported.echoCancellation ) constraints.echoCancellation = constraints.audio.echoCancellation = { ideal: true };
						if ( supported.sampleRate ) constraints.sampleRate = constraints.audio.sampleRate = { min: 16000, ideal: 32000, max: 48000  };
						if ( supported.width ) constraints.width = constraints.video.width = { min: 480, ideal: 640, max: 1280 };
						if ( supported.height ) constraints.height = constraints.video.height = { min: 270, ideal: 304, max: 720 };
						if ( supported.aspectRatio ) constraints.aspectRatio = constraints.video.aspectRatio = { ideal: (16/9) };
						if ( supported.frameRate) constraints.frameRate = constraints.video.frameRate = { min:10, ideal: 15, max: 30 };
						if ( supported.facingMode) constraints.facingMode = constraints.video.facingMode = { exact: "user" };
						if ( ! Object.keys(constraints.audio).length ) constraints.audio = true;
						if ( ! Object.keys(constraints.video).length ) constraints.video = true;
						let stream;
						while ( ! stream ) {
							try {
								stream = await navigator.mediaDevices.getUserMedia(constraints);
							} catch(e) {
								console.log(e);
								delete constraints[e.constraint];
								if ( AS.test.obj(constraints.video)) delete constraints.video[e.constraint];
								if ( AS.test.obj(constraints.audio)) delete constraints.audio[e.constraint];
								if ( ! Object.keys(constraints.audio).length ) constraints.audio = true;
								if ( ! Object.keys(constraints.video).length ) constraints.video = true;
							}
						}
						let options = { mimeType: 'video/mp4"', audioBitsPerSecond : 9600, videoBitsPerSecond : 640000 };
						try {
							mediaRecorder = new MediaRecorder(stream,options);
						} catch(e) {
							options = { mimeType: 'video/webm;codecs="opus,vp8"' };
							try {
								mediaRecorder = new MediaRecorder(stream,options);
							} catch(e) {
								mediaRecorder = new MediaRecorder(stream);
							}
						}
						mediaRecorder.addEventListener("start", e => {
							$bt.removeClass('btn-primary').addClass('btn-danger');
							if ( mediaRecorder.pause ) $btp.removeClass('btn-warning').addClass('btn-secondary').show();
							$('.jcMediaSaver, .jcMediaDeleter',$mod).attr('disabled',true);
							$('span',$bt).html( AS.icon('stop') );
							$ra.addClass('recording');
						});
						mediaRecorder.addEventListener("dataavailable", e => { if ( e.data) chunks.push(e.data); });
						mediaRecorder.addEventListener("stop", e => {
							$bt.removeClass('btn-danger').addClass('btn-primary');
							if ( mediaRecorder.pause ) $btp.removeClass('btn-warning').addClass('btn-secondary').hide();
							$('span',$bt).html( AS.icon('video') );
							$ra.removeClass('recording');
							stream.getTracks().forEach(track => track.stop());
							doPreview();
						});
						mediaRecorder.addEventListener("pause", e => {
							$btp.removeClass('btn-secondary').addClass('btn-warning');
							$ra.removeClass('recording');
							doPreview();
						});
						mediaRecorder.addEventListener("resume", e => {
							$ra.addClass('recording');
							$btp.removeClass('btn-warning').addClass('btn-secondary');
						});
						mediaRecorder.start(300000);
					};
					$bt.on('click',()=>{ if ( mediaRecorder ) { mediaRecorder.stop(); } else { startRecording(); } });
					$btp.on('click',()=>{ if ( ! mediaRecorder ) return; if ( mediaRecorder.state == 'paused' ) { mediaRecorder.resume(); } else { mediaRecorder.pause(); } });
					$btd.on('click',()=>{ if ( mediaRecorder ) return; chunks=[]; doPreview(); });
				} else {
					$ra.append('<div class="alert alert-warning" role="alert">'+AS.label('BrowserMediaRecorderMissing')+'</div>');
				}
				$('.modal-body',$mod).append($ra);
			}
			let $ua = $(`<div class="jcMediaUploadArea"></div>`);
			if ( $ua ) {
				let $uf = $('<input type="file" class="jcMediaUploadField" accept="video/*" />');
				const $hflex = $('<hflex class="wrap"></hflex>');
				$hflex.append(`<div>${ AS.label('ChooseVideo')}:</div>`,$uf);
				$uf.on('change',()=>{
					let issel = $uf.val().length;
					$('.jcMediaRecordArea, .jcMediaSelectArea',$mod).toggle(! issel);
					$('.jcMediaSaver',$mod).attr('disabled',!issel);
				});
				$('.modal-body',$mod).append($ua.append($hflex));
			}
			$mod.on('shown.bs.modal',()=>{
				$('button.jcMediaSaver',$mod).on('click',()=>{
					if ( (! blob) && $('.jcMediaUploadField').val().length ) blob = $('.jcMediaUploadField').get(0).files[0];
					if ( blob ) {
						let options = { type: 'video/webm' };
						let pd = {};
						if ( prevd ) pd.uri = prevd.uri;
						jc.page.uploadBlob( blob,pd,options,( news, uploads )=>{
							let na = news[0];
							if (! na ) return;
							let nd = { type: 'video', video: { uri: na.uri } };
							jc.edit.custom.video.save(b,d,nd,prevb);
						});
						return;
					}
					if ( $('.jcMediaSelectArea select',$mod).val().length ) {
						let finalize = () => {
							let nd = { type: 'video', video: { uri: $('.jcMediaSelectArea select',$mod).val() } };
							jc.edit.custom.video.save(b,d,nd,prevb);
						};
						if ( prevd && prevd.uri && prevd.uri.length ) {
							jc.page.rmUpload( prevd, finalize );
						} else {
							finalize();
						}
					}
				});
			});
			$mod.modal({show:true,keyboard:false});
		},
		edit : (b,d) => { jc.edit.custom.video.add(b,d,d[b.prop][b._.idx]); },
		save : (b,d,newd,oldd) => {
			if ( AS.test.obj(oldd) ) {
				d[b.prop].splice( b._.idx, 1, newd );
			} else {
				if ( b._ && AS.test.def(b._.qt)) {
					d[b.prop].splice( b._.idx, 1, d[b.prop][b._.idx], newd );
				} else {
					if ( ! AS.test.arr(d[b.prop])) d[b.prop] = [];
					d[b.prop].push(newd);
				}
			}
			jc.edit.fixBlocks(b,d);
			jc.edit.noModal();
			jc.page.reload();
		},
	},
	gallery : {
		getModal : ( empty ) => {
			let $mod = jc.edit.getModal(empty);
			if ( empty ) {
				$('.modal-dialog',$mod).append(`<div class="modal-content">
					<div class="modal-header bg-info text-white">
						<p class="modal-title">
							<span class="jcicon">${ AS.icon('uploads') }</span> 
							<b>${ AS.label('Attachments') }</b>
						</p>
						<button type="button" class="close" onclick="jc.edit.noModal()" aria-label="Close">
							<span aria-hidden="true" class="jcicon modalCloser">${ AS.icon('circleClose') }</span>
						</button>
					</div>
					<div class="modal-body" id="jcPageUploads"></div></div>`);
			}
			return $mod;
		},
		add : (b,d) => {
			let nb = {prop:b.prop,type:'block',subtype:'gallery',_:{idx:AS.label('New')}};
			let nd = { type:'gallery', gallery:[] };
			if ( b._ && AS.test.def(b._.qt)) {
				d[b.prop].splice( b._.idx, 1, d[b.prop][b._.idx], nd );
			} else {
				if ( ! AS.test.arr(d[b.prop])) d[b.prop] = [];
				d[b.prop].push(nd);
			}
			jc.edit.fixBlocks(b,d);
			nb._.idx = nd._.idx;
			jc.edit.custom.gallery.edit(nb,d)
		},
		edit : (b,d) => {
			if ( ! AS.test.arr(d.uploads)) d.uploads = [];
			let bd = d[b.prop][b._.idx];
			if ( ! AS.test.arr(bd.gallery)) bd.gallery = [];
			let $mod = jc.edit.custom.gallery.getModal(true);
			let params = { target: $('#jcPageUploads',$mod), reloader: ()=>{ jc.edit.custom.gallery.edit(b,d) }, select: true, gallery: bd };
			$mod.on('shown.bs.modal',()=>{ jc.edit.uploads.render( params); }).modal({show:true,keyboard:false});
		},
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
					<b>${ AS.label('Attachments') }</b>
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
		if ( AS.test.def(params.gallery) && ! AS.test.obj(params.gallery) ) params.gallery = {};
		if ( params.gallery && ! AS.test.arr( params.gallery.gallery) ) params.gallery.gallery = [];
		let $out = $('<div></div>');
		$out.append($(`<div class="jcUploadsAdders text-center mb-4">
			<input type="file" multiple="multiple" style="display:none" />
			<span class="btn-group">
				<button type="button" class="btn btn-sm btn-primary jcImageUpload">${ AS.icon('upload')} ${AS.label('Upload')}</button>
			</span>
		</div>`));
		let refresh = (e)=> {
			$(document.body).off('jc_page_data_loaded',refresh);
			if ( params.reloader && (! params.thenClose) ) params.reloader.call(window);
		};
		let doupload = () => {
			jc.edit.noModal();
			let options = {};
			jc.page.upload( $('input[type="file"]',$out).get(0), options, ( newitems )=>{
				let finalize = () => {
					$(document.body).on('jc_page_data_loaded',refresh);
					jc.page.reload();
				};
				if ( params.gallery ) {
					newitems.forEach( (i) => { params.gallery.gallery.push({ uri: i.uri }); } );
					jc.page.save({ noDialog: true, noLasts: true, callback: finalize });
				} else {
					finalize();
				}
			});
		};
		let save = () => {
			let capts = {};
			$('tr.jcUpload',$out).each( (_idx,tr) => {
				let data = $(tr).data();
				let $i = $('input[name="caption"]',tr);
				$i.val(capts[ data.uri ] = String($i.val()||'').replace(/[\\"]/g,'').trim() );
			} );
			params.uploads.forEach( u=>{ u.caption = capts[ u.uri ] } );
			jc.page.save({ noDialog: true, noLasts: true, callback: ()=>{ } });
		};
		if ( params.gallery ) {
			let $st = $('<select class="mr-1 mt-1"><option value="T">Thumbnails</option><option value="C">Carousel</option></select>');
			let $sf = $('<select class="mr-1 mt-1"><option value="">Plain</option><option value="c">With captions</option><option value="x">With controls</option><option value="i">With indicators</option><option value="ci">With captions + indicators</option><option value="xi">With controls + indicators</option><option value="cxi">With captions + controls + indicators</option></select>');
			let $ss = $('<select class="mr-1 mt-1"><option>XS</option><option>S</option><option value="">M</option><option>L</option><option>XL</option><option>XXL</option></select>');
			$st.val( params.gallery.aspect||'T' );
			$st.on('change',()=>{
				params.gallery.aspect = $st.val();
				if ( params.gallery.aspect != 'C' ) delete params.gallery.flags;
				$ss.toggle( params.gallery.aspect != 'C' );
				$sf.toggle( params.gallery.aspect == 'C' );
				jc.page.save({ noDialog: true, noLasts: true, callback: ()=>{
					jc.edit.noModal();
					$(document.body).on('jc_page_data_loaded',refresh);
					jc.page.reload();
				}});
			});
			$sf.val( params.gallery.flags||'' ).toggle( params.gallery.aspect == 'C' );
			$sf.on('change',()=>{
				if ( $sf.val().length) params.gallery.flags = $sf.val();
				else delete params.gallery.flags;
				jc.page.save({ noDialog: true, noLasts: true, callback: ()=>{
					jc.edit.noModal();
					$(document.body).on('jc_page_data_loaded',refresh);
					jc.page.reload();
				}});
			});
			$ss.val( params.gallery.size||'' );
			$ss.on('change',()=>{
				if ( $ss.val().length) params.gallery.size = $ss.val();
				else delete params.gallery.size;
				jc.page.save({ noDialog: true, noLasts: true, callback: ()=>{
					jc.edit.noModal();
					$(document.body).on('jc_page_data_loaded',refresh);
					jc.page.reload();
				}});
			});
			$('.jcUploadsAdders .btn-group',$out).append($('<span class="ml-3"></span>').append($st,$ss,$sf));
			$('.jcUploadsAdders .btn-group select',$out).css({'max-width':'100px'});
		}
		$('.jcImageUpload',$out).on('click',()=>{ $('input[type="file"]',$out).trigger('click'); });
		$('input[type="file"]',$out).on('change',(e)=>{ doupload() });
		if ( params.uploads.length ) {
			let $tbl = $('<table class="jcUploads"><thead><tr></tr></thead><tbody></tbody></table>');
			if ( params.gallery ) $('thead tr',$tbl).append('<th></th>');
			$('thead tr',$tbl).append(`<th>${ AS.label('FileName')}</th><th>${ AS.label('Caption')}</th><th>${ AS.label('FileSize')}</th><th></th>`);
			let refresh = (e)=> {
				$(document.body).off('jc_page_data_loaded',refresh);
				if ( params.reloader ) params.reloader.call(window);
			};
			let onchange = ( e )=>{
				e.stopPropagation();
				params.gallery.gallery = [];
				$('tr.jcUpload input[type="checkbox"]:checked',$out).each( (_idx,c) => {
					let u = $(c).closest('tr').data();
					params.gallery.gallery.push({ uri: u.uri });
				} );
				if ( AS.test.func(params.onchange) ) {
					params.onchange.call(params.gallery.gallery.clone());
				} else {
					jc.page.save({ noDialog: true, noLasts: true, callback: ()=>{
						jc.edit.noModal();
						$(document.body).on('jc_page_data_loaded',refresh);
						jc.page.reload();
					}});
				}
			};
			let rm = (item) => {
				if ( (item instanceof Event)||(item.originalEvent) ) item = $(item.target).closest('tr').data();
				jc.page.rmUpload( item, (newpdata)=>{
					jc.edit.noModal();
					$(document.body).on('jc_page_data_loaded',refresh);
					jc.page.reload();
				});
			};
			let makeRow = u => {
				let $tr = $('<tr class="jcUpload"></tr>')
				$tr.data(u);
				if ( params.gallery ) {
					let $i = $('<input type="checkbox" />');
					if ( params.gallery.gallery.find( k=>( k.uri == u.uri) ) ) $i.attr('checked',true);
					$tr.append('<td></td>');
					$('td',$tr).append($i);
				}
				if ( u.au ) {
					$tr.append(`<td class="fn"><a data-type="iframe" data-src="${u.uri}" href="javascript:;" data-fancybox="uploads" data-caption="${u.caption.escape()}">${u.name.escape()}</a></td>`);
				} else if ( u.fb ) {
					$tr.append(`<td class="fn"><a href="${u.uri}" data-fancybox="uploads" data-caption="${u.caption.escape()}">${u.name.escape()}</a></td>`);
				} else {
					$tr.append('<td class="fn">'+u.name.escape()+'</td>');
				}
				let $capt = $('<input type="text" name="caption" />');
				$capt.attr('value',u.caption);
				$tr.append($('<td class="fc"></td>').append($capt));
				$tr.append('<td class="fs">'+parseInt(u.size).smartSize()+'</td>');
				let $acts = $('<td><span class="btn-group"></span></td>') ;
				$('span',$acts).append(`<a class="btn btn-primary btn-icon btn-sm legitRipple" title="${ AS.label('Download') }" href="${u.uri}" download="${ u.name.escape() }"><i>${ AS.icon('download') }</i></a>`);
				let $del = $(`<a class="btn btn-danger btn-icon btn-sm legitRipple" title="${ AS.label('Delete') }">${ AS.icon('editRemove') }</a>`);
				$del.on('click',rm);
				$('span',$acts).append($del);
				$tr.append($acts);
				$('tbody',$tbl).append($tr);
			};
			if ( params.gallery && params.gallery.gallery.length ) {
				params.gallery.gallery.forEach( s => {
					let u =  params.uploads.find( k => (k.uri == s.uri ));
					if ( u ) makeRow(u);
				});
				params.uploads.forEach( u=>{
					if ( params.gallery.gallery.find( k=>( k.uri == u.uri) ) ) return;
					makeRow(u);
				});
			} else {
				params.uploads.forEach( u=>{ makeRow(u); } );
			}
			$out.append( $tbl );
			$out.append(`<div class="text-right"><a class="btn btn-primary saveUploads">${ AS.label('Save')}</a></div>`);
			$('input[type="checkbox"]',$tbl).on("click change",onchange);
			$('input[name="caption"]',$tbl).on("change",save);
			$('.saveUploads',$out).on("click",()=>{ params.thenClose = true; jc.edit.noModal(); });
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
