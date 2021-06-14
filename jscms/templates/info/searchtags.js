(()=>{
	let ti = {
		html : "index",
		editable : true,
		repository : "searchtags",
		display: "Search by tag",
		service: true,
	};
	ti.content = [
		{ selector: "#aboveTopBar", content: false },
		{ selector: "#topBar", part: "header.json" },
		{ selector: "#belowTopBar", content: false },
		{ selector: "#topNavbar", part: 'navbar.json' },
		{ selector: "#mainContainer", content : [
			{
				type:"blocks",
				editable:true,
				blocks:[
					{ type:"text",wrap:"<h3></h3>",prop:"title" },
					{ type:"text",wrap:`<h6 class="jcAbstract"></h6>`,prop:"abstract" },
					{ type:"mixed",prop:"blocks" },
					{ type:"searchbytag", prop: "sbytag", editable:false },
					{ type:"mixed",prop:"blocks2" },
				]
			},
// 			{ type:"part", content: "fbcomments.json" },
			{ type:"part", content: "sharethis.json" },
		]},
		{ selector: '#topFooter', type:'text', content: '{{label:GlobalFooter}}' },
	];
	jc.render.block.searchbytag = (b,d) => {
		if ( AS.test.udef(d[b.prop]) ) d[b.prop] = {};
		let swalalert;
		const prog = (options) => {
			if ( ! swalalert ) {
				swalalert = Swal.fire({
					toast: true,
					title : '<div class="jcProgressbar"></div>',
					html : ' ',
					position: 'top-end',
					showConfirmButton : false,
				});
				return setTimeout( ()=>{ prog(options) }, 10 )
			}
			let newopts = {};
			if ( options.close ) {
				setTimeout( ()=>{
					Swal.close();
					swalalert._destroy();
					swalalert = false;
				},100);
				return;
			}
			if ( options.text ) newopts.html = `${ options.text }`;
			if ( options.prog ) newopts.title = `<div class="jcProgressbar"><div style="width:${ 100 * options.prog }%;"></div></div>`;
			swalalert.update(newopts);
		};
		const $div = $('<div class="jcTagsSearch" id="'+AS.generateId('tagssearch')+'"></div>');
		const $panes = $('<div class="jcTagsSearchPars container" id="'+AS.generateId('tagssearchpars')+'"></div>');
		const $tgt = $('<div class="jcTagsFound" id="'+AS.generateId('tagsfound')+'"></div>').css('min-height','200px');
		$div.append( $panes, $tgt );
		let all, ttags, tdata, totsteps; 
		const load = ( cb ) => {
			if ( ! jc.prop.site ) return setTimeout( ()=>{ load(cb) },100);
			if ( ! tdata ) {
				tdata = {};
				ttags = AS.def.arr( jc.prop.site.tags ).map( x => x.name );
				totsteps = 1 + ttags.length;
			}
			if ( ! all ) {
				prog({text:AS.label('Loading')+'…',prog:(0)});
				jc.lists.list.get( (l) => {
					all = [];
					Object.keys(l).forEach( pt => {
						Object.keys( l[pt] ).forEach( id => {
							all.push( l[pt][id] );
						} );
					} );
					load(cb);
				});
				return;
			}
			if ( ttags.length ) {
				let nt = ttags.shift();
				prog({prog:((1+Object.keys(tdata).length)/totsteps)});
				jc.lists.tag.get( nt, tt => {
					tdata[nt] = tt;
					load(cb);
				});
				return;
			}
			if ( totsteps ) {
				prog({prog:((1+Object.keys(tdata).length)/totsteps)});
				makeform( ()=>{
					totsteps=0;
					load(cb);
				});
				return;
			}
			prog({close:true});
			if ( AS.test.func(cb) ) cb.call(window);
		};
		const makeform = (cb) => {
			if ( all ) {
				let tid = AS.generateId('tag');
				let $pc = $('<div class="row"></div>');
				let $sel = $(`<input type="text" name="filter" id="${tid}fld" value="" style="width:100%"/>`);
				let $cb = $(`<input type="checkbox" class="mr-2"/>`).attr('id',tid).on('click',()=>{
					let t = $cb.is(':checked');
					$sel.closest('div').toggle( t );
					$sel.toggleClass('active', t );
					if ( t ) $sel.focus();
				});
				$panes.append( $('<div class="row"></div>').append(
					$('<div class="col-lg-4"></div>').append( $cb, `<label for="${tid}">${ AS.label('Filter') }</label>`),
					$('<div class="col-lg-8" style="display:none;"></div>').append( $sel ),
				));
			}
			AS.def.arr( jc.prop.site.tags ).forEach( to => {
				let keys = Object.keys(tdata[to.name]);
				if ( ! keys.length ) return;
				let tid = AS.generateId('tag');
				let $pc = $('<div class="row"></div>');
				let $sel = $(`<select name="${ to.name }" id="${tid}sel" multiple="multiple"></select>`);
				let $cb = $(`<input type="checkbox" class="mr-2"/>`).attr('id',tid).on('click',()=>{
					let t = $cb.is(':checked');
					$sel.closest('div').toggle( t );
					$sel.toggleClass('active', t );
					if ( t ) $sel.focus();
				});
				keys.forEach( k => { $sel.append(`<option>${k}</option>`) } );
				$panes.append( $('<div class="row"></div>').append(
					$('<div class="col-lg-4"></div>').append( $cb, `<label for="${tid}">${ to.label||to.name }</label>`),
					$('<div class="col-lg-8" style="display:none;"></div>').append( $sel ),
				));
				$sel.select2({ width: '100%', multiple: true });
			} );
			$('input[type="checkbox"]',$panes).on('change',makesearch);
			$('input[name="filter"]',$panes).on('keyup',makesearch);
			$('input[name="filter"],select',$panes).on('change',makesearch);
			if ( AS.test.func(cb) ) cb.call(window);
		};
		const txtsearch = ( p, t ) => {
			if ( p.title && p.title.toLowerCase().indexOf(t) >= 0 ) return true;
			if ( p.description && p.description.toLowerCase().indexOf(t) >= 0 ) return true;
			if ( p.keywords && p.keywords.toLowerCase().indexOf(t) >= 0 ) return true;
			return false;
		};
		const makesearch = ( cb ) => {
			let filter = $('input.active[name="filter"]',$panes).val();
			filter = filter ? filter.toLowerCase() : false;
			if ( ! filter ) {
				let qt = 0;
				$('select.active',$panes).each( (idx,s) => { qt += $(s).select2('data').length } );
				if ( ! qt ) {
					$tgt.html('');
					return;
				}
			}
			let found = all.clone().filter( p => ( filter ? txtsearch(p,filter) : true ));
			$('select.active',$panes).each( (idx,s) => {
				let $s = $(s);
				let keys = $s.select2('data').map( x => x.id );
				if ( ! keys.length ) return;
				let tn = $s.attr('name');
				keys.forEach( k => {
					found = found.filter( p => ( tdata[tn] && tdata[tn][k] && tdata[tn][k].length && tdata[tn][k].find( te => ( (te.type==p.type)&&(te.id==p.id))) ));
				} );
			} );
			let $ul = $('<ul class="jcEntries"></ul>');
			$tgt.html($ul.append('<hr/>'));
			found.sort( (a,b) => (a,b) => ( a.title.toLowerCase() > b.title.toLowerCase() ? 1 : -1 ) ).forEach( (f) => {
				let $li = $('<li class="jcEntry"></li>').append(
					$('<a class="title click"></a>').append(f.title).on('click',()=>{ jc.page.open(f.type,f.id); }),
					$('<span class="date"></span>').html( (new Date(f.upd)).toLocaleDateString() )
				);
				if ( f.description && f.description.length) $li.append('<br />', $('<small class="desc"></small>').html(f.description));
				$ul.append($li);
			} );
			if ( AS.test.func(cb) ) cb.call(window);
		};
		jc.render.queue(1);
		load( ()=>{ jc.render.queue(-1); });
		return $div;
	};
	jc.template.info.set('searchtags',ti);
})();
