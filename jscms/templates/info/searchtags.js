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
		const $filter = $('<div class="jcTagsSearchFilter container"></div>');
		const $panes = $('<div class="jcTagsSearchPars container" style="display:none;"></div>');
		const $tgt = $('<div class="jcTagsFound mt-1" id="'+AS.generateId('tagsfound')+'"></div>').css('min-height','200px');
		$div.append( $filter, $panes, $tgt );
		let all, ttags, tdata, totsteps; 
		const load = ( cb ) => {
			if ( ! jc.prop.site ) return setTimeout( ()=>{ load(cb) },100);
			if ( ! tdata ) {
				tdata = {};
				ttags = AS.def.arr( jc.prop.site.tags ).map( x => x.name );
				totsteps = 2 + ttags.length;
			}
			if ( ! all ) {
				prog({text:AS.label('Loading')+'…',prog:(0)});
				jc.lists.list.get( (l) => {
					all = l;
					setTimeout( ()=>{ load(cb) }, 1);
				});
				return;
			}
			if ( ttags.length ) {
				let nt = ttags.shift();
				prog({prog:((1+Object.keys(tdata).length)/totsteps)});
				jc.lists.tag.get( nt, tt => {
					tdata[nt] = tt;
					setTimeout( ()=>{ load(cb) }, 1);
				});
				return;
			}
			if ( ! AS.test.arr(all) ) {
				prog({prog:((1+Object.keys(tdata).length)/totsteps)});
				Object.keys(tdata).forEach( tf => {
					Object.keys( tdata[tf] ).forEach( k => {
						tdata[tf][k].forEach( pt => {
							let tp = all[pt.type][String(pt.id||0)];
							if ( ! tp.tags ) tp.tags = [];
							if ( ! tp.tags.find( x => ( x == k.toLowerCase()))) tp.tags.push(k.toLowerCase());
						} );
					} );
				} );
				let newall = [];
				Object.keys(all).forEach( pt => {
					Object.keys( all[pt] ).forEach( id => {
						if ( all[pt][id].tags ) all[pt][id].tags = all[pt][id].tags.join(', ');
						newall.push( all[pt][id] );
					} );
				} );
				all = newall;
				setTimeout( ()=>{ load(cb) }, 1);
				return;
			}
			if ( totsteps ) {
				prog({prog:1});
				makeform( ()=>{
					totsteps=0;
					setTimeout( ()=>{ load(cb) }, 1);
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
				let $sel = $(`<input type="search" name="filter" class="form-control" placeholder="${ AS.label('FilterTextHelp') }" value="" style="width:100%"/>`);
				$filter.append( $('<div class="row"></div>').append( $('<div class="col-lg-8"></div>').append( $sel ) ));
				if ( jc.prop.site.tags && jc.prop.site.tags.length ) {
					let $cb = $(`<input type="checkbox" class="mr-2"/>`).attr('id',tid).on('click',()=>{
						let t = $cb.is(':checked');
						$panes.toggle( t );
						$panes.toggleClass('active', t );
						$('input[name="filter"]',$filter).focus();
					});
					$('div.row',$filter).append( $('<div class="col-lg-4"></div>').append( $cb, `<label for="${tid}">${ AS.label('Advanced') }</label>`) );
					$panes.append( '<hr />' );
				}
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
				keys.sort().forEach( k => { $sel.append(`<option>${k}</option>`) } );
				$panes.append( $('<div class="row"></div>').append(
					$('<div class="col-lg-4"></div>').append( $cb, `<label for="${tid}">${ to.label||to.name }</label>`),
					$('<div class="col-lg-8" style="display:none;"></div>').append( $sel ),
				));
				$sel.select2({ width: '100%', multiple: true });
			} );
			$('input[type="checkbox"]',$div).on('change',makesearch);
			$('input[name="filter"]',$filter).on('keyup change',makesearch);
			$('select',$panes).on('change',makesearch);
			if ( AS.test.func(cb) ) cb.call(window);
		};
		const asearch = ( txt, fs ) => ( ! fs.find( f => ( txt.toLowerCase().indexOf(f) < 0) ) );
		const dosearch = ( p, t ) => {
			if ( p.title && asearch(p.title,t)) return true;
			if ( p.description && asearch(p.description,t)) return true;
			if ( p.keywords && asearch(p.keywords,t)) return true;
			if ( p.tags && asearch(p.tags,t)) return true;
			return false;
		};
		const makesearch = ( cb ) => {
			let filter = $('input[name="filter"]',$filter).val();
			filter = filter ? filter.toLowerCase().split(/\W+/).filter( x => (x && (x.length > 2))) : false;
			let found, sels = $panes.hasClass('active') ? $('select.active',$panes) : false;
			if ( filter && filter.length) {
				found = all.clone().filter( p => ( dosearch(p,filter) ) );
			} else {
				let qt = 0;
				if ( sels ) sels.each( (idx,s) => { qt += $(s).select2('data').length } );
				if ( ! qt ) {
					$tgt.html('');
					return;
				}
				found = all.clone();
			}
			if ( sels ) sels.each( (idx,s) => {
				let $s = $(s);
				let keys = $s.select2('data').map( x => x.id );
				if ( ! keys.length ) return;
				let tn = $s.attr('name');
				keys.forEach( k => {
					found = found.filter( p => ( tdata[tn] && tdata[tn][k] && tdata[tn][k].length && tdata[tn][k].find( te => ( (te.type==p.type)&&(te.id==p.id))) ));
				} );
			} );
			let $ul = $('<ul class="jcEntries"></ul>');
			$tgt.html('<div><span class="jcPlaceHolder">'+AS.label('Results')+': '+found.length+'</span></div>').append($ul);
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
		load( ()=>{
			$('input[name="filter"]',$filter).focus();
			jc.render.queue(-1);
		});
		return $div;
	};
	jc.template.info.set('searchtags',ti);
})();
