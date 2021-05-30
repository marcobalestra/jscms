(()=>{
	const shares = [
		{key:'facebook',href:'https://facebook.com/sharer.php?display=page&u={{uri}}',label:'Facebook'},
		{key:'twitter',href:'https://twitter.com/intent/tweet/?text={{title}}&url={{uri}}',label:'Twitter'},
		{key:'telegram',href:'https://telegram.me/share/url?text={{title}}&url={{uri}}',label:'Telegram'},
		{key:'whatsapp',href:'https://wa.me/?text={{title}}+{{uri}}',label:'WhatsApp'},
		{key:'email',href:'mailto:?subject={{title}}&body={{uri}}',label:'Email',target:'_self'},
		{key:'tumblr',href:'https://www.tumblr.com/widgets/share/tool?posttype=link&title={{title}}&url={{uri}}&shareSource=tumblr_share_button',label:'Tumblr'},
		{key:'pinterest',href:'https://pinterest.com/pin/create/button/?url={{uri}}&media={{uri}}&description={{title}}',label:'Pinterest'},
		{key:'linkedin',href:'https://www.linkedin.com/shareArticle?mini=true&url={{uri}}&title={{title}}&summary={{desc}}&source={{uri}}',label:'LinkedIn'},
		{key:'reddit',href:'https://reddit.com/submit/?url={{uri}}&resubmit=true&title={{title}}',label:'Reddit'},
		{key:'vk',href:'http://vk.com/share.php?title={{title}}&url={{uri}}',label:'VK'},
	];
	let data = {
		shares : shares,
		form : () => {
			let fo = {
				requires : ['basic','pikaday','tinymce','iro','slider'],
				options : {},
				fields : [
					['type','hidden',{value:"sharethis"}],
					['show','select',{asLabel:'Position',options:[{value:'m',label:'Menu bar'},{value:'b',label:'Body'},{value:'mb',label:'Both Menu bar and Body',selected:true}]}],
					['hide','freehtml',{value:AS.label('Hide')+':'}]
				],
			};
			shares.forEach( s => { fo.fields.push(['hide-'+s.key,'bool',{label:s.label}]) } );
			return fo;
		},
		render : ( blockdata ) => {
			let div=$('<div></div>'),slang={};
			if ( ! blockdata.show ) blockdata.show = 'mb';
			shares.forEach( s => {
				if ( blockdata['hide-'+s.key] ) return;
				slang[s.key] = s.href;
			} );
			AS.labels.load('sharethis',slang);
			if ( blockdata.show.includes('b') ) {
				div.attr('id','jcSharingPanel');
				shares.forEach( s => {
					if ( blockdata['hide-'+s.key] ) return;
					div.append( $('<div></div>').append($(`<a class="jcSharing-${s.key}" href="#" target="${s.target||'_blank'}" rel="noopener" aria-label="" title="Share on ${s.label}">${ AS.icon('social-'+s.key) }</a>`)) );
				} );
			}
			const fix = ()=>{
				const pd = jc.page.data().pageContent;
				let fo = {};
				fo.uri = encodeURIComponent(window.location.href);
				fo.title = encodeURIComponent(((pd.metadata && pd.metadata.title && pd.metadata.title.length) ? pd.metadata.title : 'Look at this page')+': ');
				fo.desc = ((pd.metadata && pd.metadata.desc && pd.metadata.desc.length) ? encodeURIComponent(pd.metadata.desc) : fo.title);
				shares.forEach( s => {
					if ( blockdata['hide-'+s.key] ) return;
					$('a.jcSharing-'+s.key).attr('href',AS.label(s.key,fo,'sharethis'));
				} );
			};
			const nfix = () => {
				const haveit = blockdata.show.includes('m');
				let $ul = $('nav.jcNavbar div>ul.jcNavBarLeft');
				if ( $ul.length ) {
					$('.jcNavSharing',$ul).remove();
					if ( haveit ) {
						let $li = $(`<li class="nav-item dropdown jcNavSharing"></li>`);
						let id = AS.generateId('jcMenu');
						$li.append(`<a class="nav-link dropdown-toggle" href="#" id="${id}" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">${AS.icon('social-share')}</a>`);
						let $div = $(`<div class="dropdown-menu" aria-labelledby="${id}"></div>`);
						shares.forEach( s => {
							if ( blockdata['hide-'+s.key] ) return;
							$div.append( $(`<a class="dropdown-item jcSharing-${ s.key }" target="${s.target||'_blank'}" href="#"><span class="jcicon">${ AS.icon('social-'+s.key) }</span> Share on ${s.label}</a>`) );
						} );
						$li.append($div)
						$ul.append($li);
					}
				}
				fix();
			};
			const usenavbar = () => {
				$(document.body)
					.off('jc_navbar_prepared',usenavbar )
					.off('jc_render_end',fix )
					.on('jc_navbar_prepared', nfix )
					.data('jcSharingEvent','nfix')
				;
				$( ()=>{ setTimeout( nfix, 1 ); });
			};
			if (! $(document.body).data('jcSharingEvent')) $(document.body)
				.on('jc_navbar_prepared', usenavbar )
				.on('jc_render_end', fix )
				.data('jcSharingEvent','usenavbar fix')
			;
			if ( blockdata.show.includes('m') ) $( ()=>{ setTimeout( nfix, 1 ); });
			return div;
		},
	};
	jc.template.repo.set('part-sharethis',data);
})(window);
