(()=>{
	let ti = {
		html : "index",
		editable : true,
		repository : "browsetags",
		display: "Browse by tag",
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
					{ type:"navigatebytag", prop: "navtag" },
					{ type:"mixed",prop:"blocks2" },
				]
			},
// 			{ type:"part", content: "fbcomments.json" },
			{ type:"part", content: "sharethis.json" },
		]},
	];
	jc.render.block.navigatebytag = (b,d) => {
		if ( AS.test.udef(d[b.prop]) ) d[b.prop] = {};
		Object.keys( jc.page.data().args ).forEach( (k) => {
			d[b.prop][k] = String(jc.page.data().args[k]);
		} );
		let def_family = (d[b.prop] && d[b.prop].f) ? d[b.prop].f : false;
		let def_tag = (d[b.prop] && d[b.prop].t) ? d[b.prop].t : false;
		const $div = $('<div class="jcTagsNavigator" id="'+AS.generateId('tagsnavigator')+'"></div>');
		const $tabs = $('<ul class="nav nav-tabs mt-4" role="tablist"></ul>');
		const $panes = $('<div class="tab-content"></div>');
		const $tgt = $('<div class="jcTagsNavigate" id="'+AS.generateId('tagsnavigate')+'"></div>');
		$div.append( $tabs, $panes, $tgt );
// 		const nocontent = () => {
// 			$div.html('<div class="alert alert-warning">'+AS.label('NoItemsFound')+' — <i>“'+ntype+'”</i>.</div>' );
// 			jc.render.queue(-1);
// 		};
		const makelist = (b,cb) => {
			let $b = $(b);
			if ( ($tgt.data('family') == $b.data('family')) && ($tgt.data('tag') == $b.data('tag')) ) {
				if ( AS.test.func(cb)) cb.call(window);
				return;
			}
			$('span.badge',$tabs).removeClass('badge-primary badge-danger').addClass('badge-secondary');
			$b.removeClass('badge-secondary badge-primary').addClass('badge-danger');
			jc.lists.tag.get( $b.data('family'),(l)=>{
				$tgt.html('');
				let $ul = $('<ul></ul>');
				(AS.def.arr(l[$b.data('tag')])).forEach( e => {
					let $li = $('<li></li>');
					$li.append(`<a class="" onclick="jc.page.open('${e.type}'${e.id?','+e.id:''})"><strong>${e.title}</strong></a>`);
					$li.append(`<small class="jcDate date ml-2"> ${ (new Date(e.upd)).toLocaleDateString() } </small>`);
					$ul.append($li);
				} );
				$tgt.append($ul);
				$tgt.removeData().data( $b.data() );
				$b.removeClass('badge-danger').addClass('badge-primary');
				jc.page.data().args.f = $b.data('family');
				jc.page.data().args.t = $b.data('tag');
				jc.URI.push();
				if ( AS.test.func(cb)) cb.call(window);
			});
		};
		const maketags = (family,cb) => {
			let tid = $('a.nav-link[data-family="'+family+'"]',$tabs).attr('aria-controls');
			let $pane = $('#'+tid,$panes);
			let found = false;
			jc.lists.tag.get( family,(l)=>{
				$pane.html('');
				let $ul = $('<p></p>');
				Object.keys(l).forEach( k => {
					let $li = $('<span class="badge click badge-secondary"></span>').html(k).data({'family':family,'tag':k}).on('click',()=>{ makelist($li) });
					$ul.append($li);
					if ( def_family && (def_family == family) && (def_tag == k ) ) {
						delete def_tag;
						delete def_family;
						found = $li;
					}
				} );
				jc.page.data().args.f = family;
				delete jc.page.data().args.t;
				jc.URI.push();
				$pane.append($ul);
				$tgt.html('').removeData();
				if ( found ) {
					makelist(found,cb);
				} else if ( AS.test.func(cb)) {
					cb.call(window)
				}
			});
		};
		const maketabs = ( cb ) => {
			if ( ! jc.prop.site ) return setTimeout( ()=>{maketabs(cb);},100);
			let found = false;
			AS.def.arr( jc.prop.site.tags ).forEach( (to,tidx) => {
				let tid = AS.generateId('tab_'+to.name);
				let selected = def_family ? (def_family == to.name) : (!tidx);
				let $tab = $(`<li class="nav-item${ tidx ? '' : ' ml-4'}"></li>`);
				let $a = $(`<a class="nav-link" data-family="${to.name}" data-toggle="tab" href="#${tid}" role="tab" aria-controls="${tid}" aria-selected="${ selected }">${to.label||to.name}</a>`);
				$a.on('click',()=>{ maketags(to.name) });
				let $pane = $(`<div class="tab-pane" id="${tid}" role="tabpanel" aria-labelledby="${to.label||to.name}"></div>`);
				if ( selected ) {
					found = to.name;
					$a.addClass('active');
					$pane.addClass('show active');
				}
				$tabs.append($tab.append($a));
				$panes.append( $pane );
			} );
			if ( found ) {
				maketags( found, cb );
			} else if ( AS.test.func(cb)) {
				cb.call(window)
			}
		};
		jc.render.queue(1);
		maketabs( ()=>{ jc.render.queue(-1); });
		return $div;
	};
	jc.template.info.set('browsetags',ti);
})();
