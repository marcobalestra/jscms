(()=>{
	let data = {
		form : () => {
			return {
				requires : ['basic','pikaday','tinymce','iro','slider'],
				options : {
					subparts: {
						label: ['label','text',{asLabel:'Label',normalize:true,mandatory:true,focus:true,depends:'!type=divider,!type=text'}],
						page : ['item','jcpage',{nolabel:true,depends:'type=item',includecurrent:true}],
					},
					subforms : [
							{
								name: 'itemd',
								subtype: 'array',
								preview: ['type','label','text'],
								values: [
									['type','select',{asLabel:'Type',options:[{label:'Page',value:'item'},{label:'Divider',value:'divider'},{label:'Text',value:'text'}]}],
									{subpart:'label'},
									{subpart:'page'},
									['text','text',{asLabel:'Text',normalize:true,mandatory:true,depends:'type=text'}],
								]
							},
							{
								name: 'item',
								subtype: 'array',
								preview: ['type','label'],
								values: [
									['type','select',{asLabel:'Type',options:[{label:'Page',value:'item'},{label:'Menu',value:'menu'}]}],
									{subpart:'label'},
									{subpart:'page'},
									['menu','subform',{asLabel:'Content',subform:'itemd',depends:'type=menu'}]
								]
							},
					],
				},
				fields : [
					['type','hidden',{value:"navbar"}],
					['theme','hidden',{value:"light"}],
					['id','text',{label:'ID',skipempty:true,trim:true}],
					['menu','subform',{asLabel:'Content',subform:'item',mandatory:true}],
				],
			};
		},
		render : ( data ) => {
			let $navbar = $(`<nav class="navbar navbar-expand-lg navbar-${data.theme} bg-${data.theme}"></nav>`);
			let cid = data.id || AS.generateId('jcNavbar');
			$navbar.append(`<button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#${cid}" aria-controls="${cid}" aria-expanded="false" aria-label="Toggle navigation"><span class="navbar-toggler-icon"></span></button>`);
			$navbar.append(`<div class="collapse navbar-collapse" id="${cid}"><ul class="navbar-nav mr-auto"></ul></div>`);
			const render = ( item, $parent ) => {
				let $li = $(`<li class="nav-item"></li>`);
				if ( item.type == "item" ) {
					$li.append(`<a class="nav-link" onclick="jc.page.open('${item.item.page}'${ item.item.id ? ','+item.item.id : ''})">${ item.label.escape() }</a>`)
					if ( (jc.page.current() == item.item.page) && ( item.item.id == jc.page.data().id) ) $li.addClass('active');
				} else if ( item.type == "menu" ) {
					$li.addClass('dropdown');
					let id = AS.generateId('jcMenu');
					$li.append(`<a class="nav-link dropdown-toggle" href="#" id="${id}" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">${item.label.escape()}</a>`);
					let $div = $(`<div class="dropdown-menu text-muted" aria-labelledby="${id}"></div>`);
					item.menu.forEach( (si) => {
						if ( si.type == 'divider') {
							$div.append('<div class="dropdown-divider"></div>');
							return;
						}
						if ( si.type == 'text') {
							$div.append('<div class="p-2" style="max-width: 320px;">'+si.text+'</div>');
							return;
						}
						let $a = $(`<a class="dropdown-item" onclick="jc.page.open('${si.item.page}'${ si.item.id ? ','+si.item.id : ''})">${si.label.escape()}</a>`);
						if ( (jc.page.current() == si.item.page) && ( si.item.id == jc.page.data().id) ) $a.addClass('active');
						$div.append($a);

					});
					$li.append($div);
				}
				$parent.append($li);
			};
			data.menu.forEach( (item) => { render( item, $('div>ul',$navbar) ); } );
			return $navbar;
		},
	};
	jc.template.repo.set('navbar',data);
})(window);