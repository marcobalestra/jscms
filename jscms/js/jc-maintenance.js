jc.maint = {
	prop : { full: {} },
	start : () => { jc.maint.proc({}); },
	proc : ( params ) => {
		if ( ! jc.maint.prop.uploads ) {
			jc.progressbar({ text:'Listing uploads…'});
			jc.jdav.ls({dir:'uploads'},(x) => {
				jc.maint.prop.uploads = {};
				jc.maint.prop.uploadsOrphans = {};
				x.list.forEach( (k) => {
					jc.maint.prop.uploads[k] = true;
					jc.maint.prop.uploadsOrphans[k] = true;
				} );;
				setTimeout( ()=> { jc.maint.proc( params ) }, 10 );
			});
			return;
		}
		if ( ! jc.maint.prop.tags ) {
			jc.maint.prop.tagnames = [];
			jc.maint.prop.tags = {};
			AS.def.arr(jc.prop.site && jc.prop.site.tags).forEach( x => {
				jc.maint.prop.tagnames.push( x.name );
				jc.maint.prop.tags[x.name] = {};
			});
		}
		if ( ! (params.scanlist||params.tobescanned) ) {
			params.initial = { page: jc.page.current(), id : jc.page.data().id };
			jc.progressbar({ text:'Listing pages…'});
			jc.jdav.ls({dir:'pages'},(x) => {
				params.tobescanned = x.list;
				params.totpages = x.list.length;
				setTimeout( ()=> { jc.maint.proc( params ) }, 10 );
			});
			return;
		}
		if ( params.tobescanned ) {
			let isfirst = false;
			if ( ! params.scanlist ) {
				params.scanlist = [];
				isfirst = true;
			}
			let nxt = params.tobescanned.shift();
			jc.progressbar({ text:'Loading page…', prog: ((params.totpages - params.tobescanned.length)/params.totpages) });
			params.scanlist.push(nxt);
			if ( ! params.tobescanned.length ) delete params.tobescanned;
			let page = nxt.replace(/^([^0-9.]+).*/,"$1");
			let id = nxt.match(/^[^0-9]+[0-9]+\..*$/) ? parseInt( nxt.replace(/^[^0-9]+([0-9]+)\..*$/,"$1")) : undefined;
			console.log('Scanning:',page,id);
			if ( isfirst && (page == params.initial.page) && ( id == params.initial.id )) {
				params.tobescanned.push( params.scanlist.pop() );
				setTimeout( ()=> { jc.maint.proc( params ) }, 10 );
			} else {
				jc.maint.scan( page, id, ()=>{ jc.maint.proc( params ); } );
			}
			return;
		}
		if ( ! params.listsPurged ) {
			jc.progressbar({ text:'Deleting old lists…', prog: 0 });
			if ( ! params.tbdLists ) {
				jc.jdav.ls({dir:'struct',ext:'rss'},(x) => {
					x.list.forEach( (k) => { jc.dav.rm('struct/'+k,()=>{ }); } );
				});
				jc.jdav.ls({dir:'struct',ext:'txt'},(x) => {
					x.list.forEach( (k) => { jc.dav.rm('struct/'+k,()=>{ }); } );
				});
				jc.jdav.ls({dir:'struct'},(x) => {
					params.tbdLists = x.list;
					params.tbdCount = params.tbdLists.length;
					setTimeout( ()=> { jc.maint.proc( params ) }, 10 );
				});
				return;
			}
			if ( params.tbdLists.length ) {
				jc.progressbar({ prog: ((params.tbdCount - params.tbdLists.length)/params.tbdCount) });
				jc.dav.rm('struct/'+params.tbdLists.shift(),()=>{
					setTimeout( ()=> { jc.maint.proc( params ) }, 10 );
				});
			} else {
				params.listsPurged = true;
				delete params.tbdLists;
				delete params.tbdCount;
				setTimeout( ()=> { jc.maint.proc( params ) }, 10 );
			}
			return;
		}
		if ( ! params.savedFullList ) {
			jc.progressbar({ text:'Saving full list…', prog: 0 });
			jc.lists.list.set(jc.maint.prop.full,()=>{
				jc.progressbar({ prog: .3 });
				jc.page.makeLasts( jc.maint.prop.full, ()=>{
					params.savedFullList = true;
					if (jc.prop.site && jc.prop.site.norss ) {
						setTimeout( ()=> { jc.maint.proc( params ) }, 10 );
						return;
					}
					jc.lists.list.dositemap( jc.maint.prop.full, ()=>{
						setTimeout( ()=> { jc.maint.proc( params ) }, 10 );
					});
				});
			});
			return;
		}
		if ( ! params.savedTypeLists ) {
			if ( ! params.ptypes ) {
				params.ptypes = Object.keys(jc.maint.prop.full);
				params.ptypesCount = params.ptypes.length;
			}
			if ( params.ptypes.length ) {
				let k = params.ptypes.shift();
				jc.progressbar({ text: 'Saving type: '+k, prog: ((params.ptypesCount - params.ptypes.length)/params.ptypesCount) });
				jc.lists.list.set(k,jc.maint.prop.full[k],()=>{
					jc.page.makeTypeLasts( k, jc.maint.prop.full[k], ()=>{
						jc.page.makeTypeDates( k, jc.maint.prop.full[k], ()=>{
							setTimeout( ()=> { jc.maint.proc( params ) }, 10 );
						});
					});
				});
			} else {
				params.savedTypeLists = true;
				delete params.ptypes;
				delete params.ptypesCount;
				setTimeout( ()=> { jc.maint.proc( params ) }, 10 );
			}
			return;
		}
		if ( ! params.savedTagsLists ) {
			if ( ! params.tagnames ) {
				params.tagnames = jc.maint.prop.tagnames.clone();
				params.tagnamesCount = params.tagnames.length;
			}
			if ( params.tagnames.length ) {
				let k = params.tagnames.shift();
				jc.progressbar({ text: 'Saving tags: '+k, prog: ((params.tagnamesCount - params.tagnames.length)/params.tagnamesCount) });
				jc.lists.tag.set(k,jc.maint.prop.tags[k],()=>{
					setTimeout( ()=> { jc.maint.proc( params ) }, 10 );
				});
			} else {
				params.savedTagsLists = true;
				delete params.tagnames;
				delete params.tagnamesCount;
				setTimeout( ()=> { jc.maint.proc( params ) }, 10 );
			}
			return;
		}
		jc.progressbar({close:true});
		setTimeout( ()=>{
			jc.maint.prop = { full: {} };
			jc.page.open( params.initial.page, params.initial.id );
		},10);
	},
	scan : ( page, id, cb ) => {
		jc.maint.prop.afterscancb = cb;
		$(document.body).on('jc_page_open_completed', jc.maint.doscan );
		setTimeout( ()=>{ jc.page.open( page, id ); }, 10 );
	},
	doscan : ( event, edata ) => {
		$(document.body).off('jc_page_open_completed', jc.maint.doscan );
		let page = edata.page;
		let id = edata.id;
		let pd = jc.page.data().pageContent;
		let cb = jc.maint.prop.afterscancb;
		delete jc.maint.prop.afterscancb;
		if ( pd && pd.metadata ) {
			jc.progressbar({ text:'Scan: '+pd.metadata.title });
			let nm = JSON.parse(JSON.stringify(pd.metadata||{}));
			if ( pd.blogdate ) nm.date = pd.blogdate;
			if ( ! jc.maint.prop.full[page] ) jc.maint.prop.full[page] = {};
			jc.maint.prop.full[page][String((pd.id||0))] = nm;
			let pdtags = jc.objFindAll( pd, 'type', 'tags' ).clone();
			jc.maint.prop.tagnames.forEach( tagname => {
				jc.maint.prop.tags[tagname] = jc.page.parseTagsOne( pd, tagname, jc.maint.prop.tags[tagname], pdtags );
			} );
			jc.dav.rm(AS.path('jsdatastatics')+page+(pd.id||'')+'.html',()=>{ jc.page.makeStatic( cb ) });
		} else {
			let id = ( pd && AS.test.def(pd.id) ) ? String(pd.id) : '';
			console.log( 'Unknown metadata:',page,id,pd);
			jc.dav.rm(AS.path('jsdatastatics')+page+id+'.html', cb );
		}
	},
};
