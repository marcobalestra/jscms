(()=>{
	let data = {
		form : () => {
			let fo = {
				requires : ['basic','pikaday','tinymce','iro','slider'],
				options : { },
				fields : [
					['type','hidden',{value:"fbcomments"}],
					['active','bool',{asLabel:'Active'}],
					['like','bool',{asLabel:'UseFbLike',depends:'active'}],
					['fbid','text',{asLabel:'FacebookID',trim:true,skipempty:true,asHelp:'FacebookIdHelp'}],
					['comments','bool',{asLabel:'UseFbComments',depends:'active,fbid'}],
					['numposts','slider',{asLabel:'Max',min:1,max:100,report:{value:true},default:10,depends:'comments'}],
					['hide','freehtml',{value:AS.label('Hide')+':',depends:'comments'}]
				],
			};
			jc.edit.prop.pageTypes.sort().forEach( s => { fo.fields.push(['hide-'+s,'bool',{label:s,depends:'comments'}]) } );
			return fo;
		},
		render : ( data ) => {
			$('.jcFbcomments').remove();
			const $out = $('<div class="jcFbcomments"></div>');
			let nocomment = ( (! data.comments) || data['hide-'+jc.page.current()] || (jc.page.data().pageContent.metadata && jc.page.data().pageContent.metadata.hideComments) );
			if ( nocomment && (! data.like) ) {
				$out.data('inactive',true);
				if ( jc.page.prop.editMode == 'parts' ) {
					$out.append(`<span class="jcPlaceHolder">Facebook comments — Inactive</span>`);
				} else {
					$out.css('display','none');
				}
				return $out;
			}
			$out.css({'max-width':'600px','margin':'10px 0 10px auto'});
			if ( ! data.language ) data.language = navigator.language;
			if ( data.language ) {
				let p = data.language.replace(/-/,'_').split('_');
				if ( ! p[1] ) p[1] = p[0];
				data.language = p[0].toLowerCase() + '_' + p[1].toUpperCase();
			}
			if ( ! AS.test.num(data.numposts) ) data.numposts = 10;
			if ( ! (window.FB && window.FB.XFBML)) $out.append(`<div id="fb-root"></div><script async defer crossorigin="anonymous" src="https://connect.facebook.net/${data.language}/sdk.js#xfbml=1&version=v10.0" nonce="tRDE8OwY"></script>`);
			if ( data.like ) {
				$out.append(`<div class="fb-like" data-width="" data-href="${location.href}" data-layout="standard" data-action="like" data-size="small" data-share="true"></div>`);
			}
			if ( ! nocomment ) {
				$out.append(`<div class="fb-comments" data-width="" data-href="${location.href}" data-width="" data-numposts="${data.numposts}"></div>`);
				const head = document.documentElement.querySelector('head');
				$('meta[property="fb:admins"]',head).remove();
				$(head).append(`<meta property="fb:admins" content="${ data.fbid }"/>`);
			}
			if ( ! $(document.body).data('jcFbcommentsEvent') ) {
				$(document.body).on('jc_render_end',()=>{
					if ( ! (window.FB && window.FB.XFBML) ) return;
					if ( $out.data('inactive') ) return;
					$('[data-href]',$out).attr('href',location.href);
					$( ()=> { FB.XFBML.parse(); } );
				}).data('jcFbcommentsEvent',true);
			}
			return $out;
		},
	};
	jc.template.repo.set('part-fbcomments',data);
})();
