jc.maint = {
	prop : { full: {} },
	prog : (options) => {
		if ( ! Swal.getContainer() ) {
			Swal.fire({
				toast: true,
				title : '<div class="jcProgressbar"></div>',
				html : ' ',
				position: 'top-end',
				showConfirmButton : false,
			});
		}
		if ( ! Swal.isVisible() ) return setTimeout( ()=>{ jc.maint.prog(options) }, 10 );
		let newopts = {};
		if ( options.text ) newopts.html = `${ options.text }`;
		if ( options.prog ) newopts.title = `<div class="jcProgressbar"><div style="width:${ 100 * options.prog }%;"></div></div>`;
		Swal.update(newopts);
	},
	start : () => { jc.maint.proc({}); },
	proc : ( params ) => {
		if ( ! jc.maint.prop.uploads ) {
			jc.maint.prog({ text:'Listing uploads…'});
			jc.jdav.ls({dir:'uploads'},(x) => {
				jc.maint.prop.uploads = {};
				jc.maint.prop.uploadsOrphans = {};
				x.list.forEach( (k) => {
					jc.maint.prop.uploads[k] = true;
					jc.maint.prop.uploadsOrphans[k] = true;
				} );;
				jc.maint.proc( params );
			});
			return;
		}
		if ( ! (params.scanlist||params.tobescanned) ) {
			params.initial = { page: jc.page.current(), id : jc.page.data().id };
			if ( ! params.afterscan ) params.afterscan = ()=>{ jc.maint.scan( ()=>{ jc.maint.proc( params ) }) };
			jc.maint.prog({ text:'Listing pages…'});
			jc.jdav.ls({dir:'pages'},(x) => {
				params.tobescanned = x.list;
				params.totpages = x.list.length;
				jc.maint.proc( params );
			});
			return;
		}
		if ( params.tobescanned ) {
			let isfirst = false;
			if ( ! params.scanlist ) {
				$(document.body).on('jc_page_open_completed',params.afterscan);
				params.scanlist = [];
				isfirst = true;
			}
			let nxt = params.tobescanned.shift();
			jc.maint.prog({ text:'Loading page…', prog: (parseInt(10*(params.totpages - params.tobescanned.length)/params.totpages)/10) });
			params.scanlist.push(nxt);
			if ( ! params.tobescanned.length ) delete params.tobescanned;
			let page = nxt.replace(/^([^0-9.]+).*/,"$1");
			let id = nxt.match(/^[^0-9]+[0-9]+\..*$/) ? parseInt( nxt.replace(/^[^0-9]+([0-9]+)\..*$/,"$1")) : undefined;
			if ( isfirst && (page == params.initial.page) && ( id == params.initial.id )) {
				params.afterscan()
			} else {
				jc.page.open( page, id );
			}
			return;
		}
		if ( params.afterscan ) {
			$(document.body).off('jc_page_open_completed',params.afterscan);
			delete params.afterscan;
		}
		if ( ! params.listsPurged ) {
			jc.maint.prog({ text:'Deleting old lists…', prog: 0 });
			if ( ! params.tbdLists ) {
				jc.jdav.ls({dir:'struct',ext:'rss'},(x) => {
					x.list.forEach( (k) => { jc.dav.rm('struct/'+k,()=>{ }); } );
				});
				jc.jdav.ls({dir:'struct'},(x) => {
					params.tbdLists = x.list;
					params.tbdCount = params.tbdLists.length;
					jc.maint.proc( params );
				});
				return;
			}
			if ( params.tbdLists.length ) {
				jc.maint.prog({ prog: (parseInt(10*(params.tbdCount - params.tbdLists.length)/params.tbdCount)/10) });
				jc.dav.rm('struct/'+params.tbdLists.shift(),()=>{
					jc.maint.proc( params );
				});
			} else {
				params.listsPurged = true;
				delete params.tbdLists;
				delete params.tbdCount;
				jc.maint.proc( params );
			}
			return;
		}
		if ( ! params.savedFullList ) {
			jc.maint.prog({ text:'Saving full list…', prog: 0 });
			jc.lists.list.set(jc.maint.prop.full,()=>{
				jc.maint.prog({ prog: .3 });
				jc.page.makeLasts( jc.maint.prop.full, ()=>{
					params.savedFullList = true;
					jc.maint.proc( params );
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
				jc.maint.prog({ text: 'Saving type: '+k, prog: (parseInt(10*(params.ptypesCount - params.ptypes.length)/params.ptypesCount)/10) });
				jc.lists.list.set(k,jc.maint.prop.full[k],()=>{
					jc.page.makeTypeLasts( k, jc.maint.prop.full[k], ()=>{
						jc.page.makeTypeDates( k, jc.maint.prop.full[k], ()=>{
							jc.maint.proc( params );
						});
					});
				});
			} else {
				params.savedTypeLists = true;
				delete params.ptypes;
				delete params.ptypesCount;
				jc.maint.proc( params );
			}
			return;
		}
		Swal.close();
		jc.page.open( params.initial.page, params.initial.id );
	},
	scan : ( cb ) => {
		let pd = jc.page.data().pageContent;
		let page = jc.page.current();
		jc.maint.prog({ text:'Scan: '+pd.metadata.title });
		let nm = Object.assign(pd.metadata);
		if ( pd.blogdate ) nm.date = pd.blogdate;
		if ( ! jc.maint.prop.full[page] ) jc.maint.prop.full[page] = {};
		jc.maint.prop.full[page][String((pd.id||0))] = nm;
		jc.dav.rm(AS.path('jsdatastatics')+page+(pd.id||'')+'.html',()=>{ jc.page.makeStatic( cb ) });
	},
};
