(()=>{
	let data = {
		form : ( callback ) => {
			let fo = {
				requires : ['basic','pikaday','tinymce','iro','slider'],
				options : { },
				fields : [
					['type','hidden',{value:"fbcomments"}],
					['active','bool',{asLabel:'Active'}],
					['like','bool',{asLabel:'UseFbLike',depends:'active'}],
					['mod','select',{asLabel:'Moderator',options:[{value:'',label:AS.label('None')},{value:'U',label:'FB user'},{value:'A',label:'FB app/page/group'}]}],
					['fbid','text',{asLabel:'FacebookID',trim:true,skipempty:true,mandatory:true,asHelp:'FacebookIdHelp',depends:'mod'}],
					['comments','bool',{asLabel:'UseFbComments',depends:'active,mod'}],
					['numposts','slider',{asLabel:'Max',min:1,max:100,report:{value:true},default:10,depends:'comments'}],
					['hide','freehtml',{value:AS.label('Hide')+':',depends:'comments'}]
				],
			};
			jc.edit.prop.pageTypes.sort().forEach( s => {
				let i = jc.edit.prop.pageTypesInfo[s];
				if ( i.service ) return;
				fo.fields.push(['hide-'+s,'bool',{label:(i.display||s),depends:'comments'}]) }
			);
			if ( AS.test.func(callback) ) callback.call(window,fo);
			return fo;
		},
		render : ( data ) => {
			$('.jcFbcomments').remove();
			const $out = $('<div class="jcFbcomments"></div>');
			const servicepage = (jc.page.data().template && jc.page.data().template.service);
			let nocomment = ( servicepage || (! data.comments) || data['hide-'+jc.page.current()] || (jc.page.data().pageContent.metadata && jc.page.data().pageContent.metadata.hideComments) );
			const head = document.documentElement.querySelector('head');
			if ( servicepage || (nocomment && (! data.like)) ) {
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
			if ( ! (window.FB && window.FB.XFBML)) {
// 				if ( ! $('#fb-root') ) $(document.body).prepend('<div id="fb-root"></div>');
				$out.append('<div id="fb-root"></div>');
				$out.append(`<script async defer crossorigin="anonymous" src="https://connect.facebook.net/${data.language}/sdk.js#xfbml=1&version=v11.0" id="facebook-jssdk"></script>`);
			}
			if ( data.like ) {
				$out.append(`<div class="fb-like" data-href="${location.href.replace(/^[^:]+:../,'')}" data-width="550" data-layout="standard" data-action="like" data-size="small" data-share="true"></div>`);
			}
			if ( ! nocomment ) {
				$out.append(`<div class="fb-comments" data-href="${location.href.replace(/^[^:]+:../,'')}" data-width="550" data-numposts="${data.numposts}"></div>`);
				$('meta[property="fb:admins"],meta[property="fb:app_id"]',head).remove();
				if ( data.fbid ) {
					let ids = String(data.fbid).replace(/[^0-9]+/g,' ').split(' ');
					if ( data.mod == 'A') {
						$(head).append(`<meta property="fb:app_id" content="${ ids[0] }"/>`);
						window.fbAsyncInit = function() {
							FB.init({
								appId      : ids[0],
								xfbml      : true,
								version    : 'v11.0'
							});
							FB.AppEvents.logPageView();
						};
					} else {
						ids.forEach( i => { $(head).append(`<meta property="fb:admins" content="${ i }"/>`); } );
					}
				}
			}
			if ( ! $(document.body).data('jcFbcommentsEvent') ) {
				$(document.body).on('jc_render_end',()=>{
					if ( $out.data('inactive') ) return;
					$('meta[property^="og:"]',head).remove();
					$(head).append(
						`<meta property="og:url" content="${location.href.replace(/^[^:]+:../,'')}" />`,
						`<meta property="og:type" content="website" />`,
						`<meta property="og:title" content="${ $('title',head).html() }" />`,
						`<meta property="og:description" content="${ $('meta[name="description"]',head).attr("content") }" />`
					);
					$('[class*="fb-"][data-href]',$out).attr('data-href',location.href.replace(/^[^:]+:../,''));
					$('[data-width][href]',$out).attr('href',location.href.replace(/^[^:]+:../,''));
					if ( ! (window.FB && window.FB.XFBML) ) return;
					$( ()=> { FB.XFBML.parse(); } );
				}).data('jcFbcommentsEvent',true);
			}
			return $out;
		},
	};
	jc.template.repo.set('part-fbcomments',data);
})();
