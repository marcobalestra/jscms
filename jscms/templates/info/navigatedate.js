(()=>{
	let ti = {
		html : "index",
		editable : true,
		repository : "navigatedate",
	};
	ti.content = [
		{ selector: "#aboveTopBar", content: false },
		{ selector: "#topBar", part: "header.html", editable: false },
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
					{ type:"navigatebydate", prop: "navtype" },
					{ type:"mixed",prop:"blocks2" },
				]
			},
			{ type:"part", content: "fbcomments.json" },
			{ type:"part", content: "sharethis.json" },
		]},
	];
	jc.render.block.navigatebydate = (b,d) => {
		const ntype = d[b.prop]||'blog';
		const $div = $('<div class="jcDateNavigator" id="'+AS.generateId('datenavigator')+'"></div>');
		jc.render.queue(1);
		const nocontent = () => {
			$div.html('<div class="alert alert-warning">'+AS.label('NoItemsFound')+' — <i>“'+ntype+'”</i>.</div>' );
			jc.render.queue(-1);
		};
		jc.jdav.get('struct/'+ntype+'-bydate-index.json',(l)=>{
			if ( ! (AS.test.obj(l) && AS.test.arr(l.byyear) && l.byyear.length ) ) return nocontent();
			const $tgt = $('<div class="jcDateNavigate" id="'+AS.generateId('datenavigate')+'"></div>');
			const makelist = ($b,cb) => {
				if ( $tgt.data('selector') == $b.data('selector') ) return;
				$('button[data-ismonth]',$div).each( (idx,b) => { b.className = 'btn btn-secondary' } );
				$b.get(0).className = 'btn btn-danger';
				jc.jdav.get( $b.data('src'),(l)=>{
					$tgt.html('');
					let $ul = $('<ul></ul>');
					(AS.def.arr(l)).filter( e => (AS.test.obj(e)) ).sort( (a,b) => (jc.sql2date(b.date).getTime() - jc.sql2date(a.date).getTime() ) ).forEach( e => {
						let $li = $('<li></li>');
						$li.append(`<a class="" onclick="jc.page.open('${e.page||ntype}'${e.id?','+e.id:''})"><strong>${e.title}</strong></a>`);
						$li.append(`<small class="jcDate date ml-2"> ${ (new Date()).fromsql(e.date).toLocaleDateString(navigator.language,{weekday:'long',day:'numeric'}) } </small>`);
						if ( e.desc && e.desc.length ) $li.append('<br /><span class="jcDesc">'+e.desc+'</span>');
						$ul.append($li);
					} );
					$tgt.append($ul);
					$tgt.data('selector',$b.data('selector'));
					$b.get(0).className = 'btn btn-primary';
					if ( AS.test.func(cb)) cb.call(window,l);
				});
			};
			const $tabs = $('<ul class="nav nav-tabs mt-4" role="tablist"></ul>');
			const $panes = $('<div class="tab-content"></div>');
			let tobelisted = false;
			l.byyear.sort( (a,b)=>(parseInt(b.key)-parseInt(a.key)) ).forEach( (y,yidx) => {
				let yid = AS.generateId('tab'+y.key);
				let $tab = $(`<li class="nav-item${ yidx ? '' : ' ml-4'}"><a class="nav-link${ yidx ? '' : ' active'}" data-toggle="tab" href="#${yid}" role="tab" aria-controls="${yid}" aria-selected="${! yidx }">${y.key}</a></li>`);
				let $yp = $(`<div class="tab-pane${ yidx ? '' : ' show active'}" id="${yid}" role="tabpanel" aria-labelledby="${y.key}"></div>`);
				let $tb = $(`<div class="btn-toolbar" role="toolbar" aria-label="${y.key}"></div>`);
				let $bg = $(`<div class="btn-group m-2" role="group" aria-label="${y.key}"></div>`);
				l.bymonth.filter( m => ( m.key.indexOf(y.key+'-') == 0 ) ).sort((a,b)=>( parseInt(b.key.replace(/-/,'')) - parseInt(a.key.replace(/-/,'')) )).forEach( (m,midx) => {
					let mname = jc.sql2date(m.key+'-01').toLocaleString(navigator.language, { month: 'long' });
					let $b = $(`<button type="button" class="btn btn-secondary" data-ismonth="true" data-selector="${m.key}" data-src="${m.file}" title="${m.qt}">${mname}</button>`);
					$b.on('click',()=>{ makelist($b) });
					if ( ! tobelisted ) tobelisted = $b;
					if ( ! midx ) $tab.on('click',()=>{ makelist($b) });
					$bg.append($b);
				} );
				$tabs.append($tab);
				$panes.append($yp.append($tb.append($bg)));
			} );
			$div.append($tabs,$panes,$tgt);
			if ( tobelisted ) makelist(tobelisted,()=>{ jc.render.queue(-1) })
			else jc.render.queue(-1);
		},()=>{
			nocontent();
		});
		return $div;
	};
	jc.template.info.set('navigatedate',ti);
})();
