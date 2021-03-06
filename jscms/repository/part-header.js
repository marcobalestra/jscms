(()=>{
	const defaults = {
		bgcolor : '#eeeeee',
		covercolor : '#ffffff',
		headercolor : '#000000',
		headerborder : '#ffffff',
		tags : [{name:'site',label:'Topics'}],
	};
	let data = {
		form : ( callback, uploads, raw ) => {
			if ( AS.test.func(callback) && AS.test.udef(uploads) ) {
				jc.jdav.get( AS.path('jsdatapages')+'index.json', pd => { data.form( callback, AS.def.arr( pd.uploads ), raw ); });
				return;
			}
			if ( ! AS.test.arr(uploads)) uploads = [];
			let bannerpos = [
				{value:'nop',label:'<svg class="bannerPreview" version="1.0" xmlns="http://www.w3.org/2000/svg" viewBox="10 10 220 40"><rect x="10" y="10" fill="#DDDDDD" width="220" height="20"/><path fill="#FFFFFF" d="M16.125,22.25L27.75,13l1.625,8.75l13.125-7c0,0-0.875,6.625,0,6.75s15.875-7.25,15.875-7.25l-0.875,8,l20.5-8l2.625,1L57.5,24.875l-3-1.25l1.125-4.75l-16,6.875l-0.375-5.875l-10.5,5.75l-2.625-6.875l-9.375,4.875L16.125,22.25z"/></svg>'},
				{value:'pcircle pbcenter',label:'<svg class="bannerPreview" xmlns="http://www.w3.org/2000/svg" viewBox="10 10 220 40"><rect x="10" y="10" fill="#DDDDDD" width="220" height="40"/><circle fill="#FFFFFF" cx="120" cy="32" r="20"/><circle fill="#CCCCCC" cx="120" cy="32" r="17.5"/><path fill="#FFFFFF" d="M16.75,28.125l11.625-9.25L30,27.625l13.125-7c0,0-0.875,6.625,0,6.75S59,20.125,59,20.125l-0.875,8l20.5-8,l2.625,1L58.125,30.75l-3-1.25l1.125-4.75l-16,6.875l-0.375-5.875l-10.5,5.75l-2.625-6.875L17.375,29.5L16.75,28.125z"/></svg>'},
				{value:'pcircle pbleft',label:'<svg class="bannerPreview" xmlns="http://www.w3.org/2000/svg" viewBox="10 10 220 40"><rect x="10" y="10" fill="#DDDDDD" width="220" height="40"/><circle fill="#FFFFFF" cx="35" cy="30" r="19"/><circle fill="#CCCCCC" cx="35" cy="30" r="17.5"/><path fill="#FFFFFF" d="M62.875,40L74.5,30.75l1.625,8.75l13.125-7c0,0-0.875,6.625,0,6.75S105.125,32,105.125,32l-0.875,8l20.5-8,l2.625,1l-23.125,9.625l-3-1.25l1.125-4.75l-16,6.875L86,37.625l-10.5,5.75L72.875,36.5L63.5,41.375L62.875,40z"/></svg>'},
				{value:'psquare pleft',label:'<svg class="bannerPreview" version="1.0" xmlns="http://www.w3.org/2000/svg" viewBox="10 10 220 40"><rect x="10" y="10" fill="#DDDDDD" width="220" height="40"/><path fill="#FFFFFF" d="M54.375,41.75L66,32.5l1.625,8.75l13.125-7c0,0-0.875,6.625,0,6.75s15.875-7.25,15.875-7.25l-0.875,8l20.5-8,l2.625,1L95.75,44.375l-3-1.25l1.125-4.75l-16,6.875L77.5,39.375L67,45.125l-2.625-6.875L55,43.125L54.375,41.75z"/><rect x="10" y="10" fill="#CCCCCC" width="40" height="40"/></svg>'},
			];
			if ( AS.test.func(callback) ) {
				if ( AS.test.udef(raw) ) {
					jc.template.part.get( 'header.json',{raw:true}, j => { data.form( callback, uploads, j ) });
					return;
				}
				let adjusted = false;
				if ( AS.test.udef(raw.bannerpos) || (! bannerpos.find( x => (x.value == raw.bannerpos) ))) adjusted = raw.bannerpos = bannerpos[0].value;
				Object.keys( defaults ).filter( k => AS.test.udef(raw[k]) ).forEach( k => { raw[k] = defaults[k]; adjusted = true; } );
				if ( adjusted ) jc.template.part.set( 'header.json',raw);
			}
			let coversizes = [
				{value:'cfill',checked:true,label:AS.label('Fill (crop)')},
				{value:'cstretch',checked:true,label:AS.label('Fill (stretch)')},
				{value:'ccenter',label:AS.label('Centered (crop)')},
				{value:'ccontain',label:AS.label('Centered')},
			];
			let covertypes = [{value:'c',label:'['+AS.label('Color')+']'}];
			let profiles = [{value:'',label:'['+AS.label('None')+']'}];
			uploads.filter( x => (x.img)).forEach( u => {
				let l = '???'+(u.caption||u.name)+'???';
				covertypes.push({value:u.uri,label:l});
				profiles.push({value:u.uri,label:l});
			});
			let fo = {
				requires : ['basic','pikaday','tinymce','iro','slider'],
				options : {
					title : AS.label('Site properties'),
					tabs: [AS.label('Main'),AS.label('Banner'),AS.label('Privacy'),AS.label('Tags')],
					effectduration : 0,
					theme: 'light',
					subparts: {
					},
					subforms : [
						{
							name : 'tagvals',
							subtype: 'array',
							preview : ['tag'],
							values : [
								['tag','text',{asLabel:'Value',normalize:true,skipempty:true,mandatory:true}]
							],
						},
						{
							name : 'tagprops',
							subtype: 'array',
							preview : ['name','label'],
							values : [
								['name','text',{asLabel:'Name',normalize:true,skipempty:true,mandatory:true,transform:'x=>String(x).replace(/[^a-z]+/g,"").toLowerCase()',expr:(v,f)=>{
									if ( (v == 'tag')||(v == 'name')||(!v.length) ) return false;
									return true;
								},help:'Javascript name of the property, lowercase characters; must be unique in the tag and different from ???tag??? and ???name???.'}],
								['label','text',{asLabel:'Label',normalize:true,skipempty:true,mandatory:true}]
							],
						},
						{
							name : 'tag',
							subtype: 'array',
							preview : ['name','label'],
							values : [
								['name','text',{asLabel:'Name',normalize:true,skipempty:true,mandatory:true,transform:'x=>String(x).toLowerCase()'}],
								['label','text',{asLabel:'Label',normalize:true,skipempty:true}],
								['hidden','bool',{asLabel:'Hidden'}],
								['props','subform',{asLabel:'More fields',subform:'tagprops',skipempty:true,help:'Additional properties that can be added to the tag.'}],
								['strict','subform',{asLabel:'Restrict',subform:'tagvals',skipempty:true,help:'If the list isn???t empty only the listed values will be accepted.'}],
							],
						}
					],
				},
				fields : [
					['type','hidden',{value:"header",tab:0}],
					['sitename','text',{asLabel:'Site name',normalize:true,skipempty:true,mandatory:true,tab:0}],
					['bgcolor','color',{asLabel:'Background color',value:defaults.bgcolor,skipempty:true,tab:0}],
					['customheaders','textarea',{asLabel:'Headers',tab:0,help:'Custom code (e.g. for Google Ads) to be added at document HEAD.\nLeave it blank to skip it.'}],
					['ads','textarea',{asLabel:'Ads',tab:0,help:'Custom code (e.g. for Google Ads) to be appended to document.\nLeave it blank to skip it.'}],
					['bannerpos','checklist',{asLabel:'Banner',ctype:'r',list:bannerpos,tab:1}],
					['headertag','text',{asLabel:'Header text',normalize:true,skipempty:true,tab:1,help:'A few words on the cover page, defaults to site name'}],
					['headershorttag','text',{asLabel:'Small header text',normalize:true,skipempty:true,tab:1,help:'A few words on the cover page for small screens, defaults to header text'}],
					['headercolor','color',{asLabel:'Header color',value:defaults.headercolor,tab:1,help:'The color of the text of header tag or site name.'}],
					['headerborder','color',{asLabel:'Header border',value:defaults.headerborder,tab:1,help:'The color of the border of the text of header tag or site name.'}],
					['covertype','select',{asLabel:'Cover source',options:covertypes,tab:1,help:'It???s possible to choose among the images uploaded in site index page, see site index attachments.'}],
					['covercolor','color',{asLabel:'Cover color',tab:1,help:'Cover background color, visible when there???s no image or where the image doesn???t cover banner area.'}],
					['coversize','select',{asLabel:'Cover size',options:coversizes,depends:'!covertype=c',tab:1}],
					['profile','select',{asLabel:'Profile picture',options:profiles,depends:'!bannerpos=nop',tab:1,help:'It???s possible to choose among the images uploaded in site index page, see site index attachments.'}],
					['privacynote','freehtml',{tab:2,value:'If you change these values then run ??'+AS.label('Maintenance')+'?? to reflect changes on existing static files.'}],
					['noindex','bool',{asLabel:'Don???t index',tab:2,help:'Tell google and other robots to avoid indexing and following links on site pages.'}],
					['norss','bool',{asLabel:'No Sitemap/RSS',tab:2,help:'Every time a page is saved both a Sitemap.txt and an RSS (with the latest 100 changes on site) are created.\nYou can prevent such files creation.'}],
					['nostatic','bool',{asLabel:'Don???t create static',tab:2,help:'If a static version of the page isn???t created search engines won???t be able to scan page content.\nIncluded for those who prefer a more private blog.'}],
					['tagsnote','freehtml',{tab:3,value:'If you change these values then run ??'+AS.label('Maintenance')+'?? to reflect changes on existing static files.'}],
					['tags','subform',{asLabel:'Tags',subform:'tag',tab:3}],
				],
			};
			if ( jc.prop.site.models && jc.prop.site.models.length ) {
				fo.options.tabs.push( AS.label('Models') );
				let pos = fo.options.tabs.length -1;
				let h = '';
				jc.prop.site.models.forEach( m => {
					h += `<li><a href="javascript:jc.page.edit(false,false);jc.edit.noModal();jc.page.open('${m.type}',${m.id})">${m.title}</a></li>`;
				} );
				fo.fields.push(
					['models','hidden',{tab:pos}],
					['modellist','freehtml',{value:'<ul>'+h+'</ul>',tab:pos}],
				);
			}
			if ( AS.test.func(callback) ) callback.call(window,fo);
			return fo;
		},
		render : ( data ) => {
			jc.prop.site = data;
			let pd = jc.page.data();
			let $out = $(`<div class="jcBannerArea"></div>`);
			if ( data.sitename ) {
				const $t = $('head>title',document.documentElement);
				$t.attr('site',data.sitename);
				if ( $t.html().indexOf(data.sitename)!=0 ) $t.html( data.sitename+': '+$t.html());
			}
			let isHidden = pd.metadata ? pd.metadata.hidden : false;
			if ( data.norss ) $('head>link[type="application/rss+xml"]',document.documentElement).remove();
			let $robNode = $('head>meta[name="robots"]',document.documentElement);
			if ( ! $robNode.length ) {
				$robNode = $('<meta name="robots" content="" />');
				$('head',document.documentElement).append( $robNode );
			}
			if ( data.noindex||isHidden) {
				$robNode.attr('content','noindex,nofollow,noarchive,nosnippet');
			} else {
				$robNode.attr('content','all');
			}
			if ( data.bgcolor ) document.body.style.backgroundColor = data.bgcolor;
			if ( data.coversize ) $out.addClass(data.coversize);
			let $c = $('<div class="jcCover"></div>').css({backgroundColor:(data.covercolor||defaults.covercolor)});
			if ( data.covertype != 'c' ) $c.append(`<img src="${data.covertype}" alt="" />`);
			$out.append($c);
			if ( data.bannerpos && data.bannerpos.length ) {
				$out.addClass(data.bannerpos);
				if ( data.profile && data.profile.length ) {
					let $p = $('<div class="jcProfile"></div>');
					$p.css('background-image','url('+data.profile+')');
					$p.on('click',()=>{ jc.page.open('index'); }).css('cursor','pointer');
					$out.append($p);
				}
			}
			let $h = $('<div class="jcBannerText"></div>')
				.css({
					color: (data.headercolor||defaults.headercolor),
					textShadow : `-1px 0 1px ${data.headerborder||defaults.headerborder},0 -1px 1px ${data.headerborder||defaults.headerborder},0 1px 1px ${data.headerborder||defaults.headerborder},1px 1px 1px ${data.headerborder||defaults.headerborder}`,
				})
				.html( data.headershorttag ? `<span class="d-none d-sm-block">${ data.headertag||data.sitename||data.headershorttag }</span><span class="d-sm-none">${data.headershorttag}</span>` : (data.headertag||data.sitename||''))
				;
			if ( ! (data.profile && data.profile.length)) $h.on('click',()=>{ jc.page.open('index'); }).css('cursor','pointer');
			$out.append( $h );
			$out.append('<div class="jcMenu"></div>');
			if ( data.customheaders && (! jc.prop.customheadersAdded) ) {
				jc.prop.customheadersAdded = true;
				$('head',document.documentElement).append( data.customheaders );
			}
			jc.plugin.call('sitePropDefined',data);
			$(document.body).trigger('jc_site_prop_defined',data);
			return $out;
		},
	};
	jc.template.repo.set('part-header',data);
})(window);
