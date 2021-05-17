(()=>{
	let data = {
		form : {
			requires : ['basic','pikaday','tinymce','iro','slider'],
			options : {
				subparts: {
					label: ['label','text',{asLabel:'Label',normalize:true,mandatory:true,focus:true}],
					page : ['item','jcpage',{asLabel:'Page',depends:'type=item'}],
				},
				subforms : [
						{
							name: 'itemd',
							subtype: 'array',
							preview: ['label'],
							values: [
								{subpart:'label'},
								['type','select',{asLabel:'Type',options:[{label:'Page',value:'item'},{label:'Divider',value:'divider'}]}],
								{subpart:'page'},
							]
						},
						{
							name: 'item',
							subtype: 'array',
							preview: ['label'],
							values: [
								{subpart:'label'},
								['type','select',{asLabel:'Type',options:[{label:'Page',value:'item'},{label:'Menu',value:'menu'}]}],
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
				['menu','subform',{asLabel:'Content',subform:'item'}],
			],
		},
		render : ( data ) => {
			let $navbar = $(`<nav class="navbar navbar-expand-lg navbar-${data.theme} bg-${data.theme}"></nav>`);
			let cid = data.id || AS.generateId('jcNavbar');
			$navbar.append(`<button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#${cid}" aria-controls="${cid}" aria-expanded="false" aria-label="Toggle navigation"><span class="navbar-toggler-icon"></span></button>`);
			$navbar.append(`<div class="collapse navbar-collapse" id="${cid}"><ul class="navbar-nav mr-auto"></ul></div>`);
			const render = ( item, $parent ) => {
				let $li = $(`<li class="nav-item"></li>`);
				if ( item.type == "item" ) {
					$li.append(`<a onclick="jc.page.open('${item.item.page}'${ item.item.id ? ','+item.item.id : ''})">${ item.label.escape() }</a>`);
				} else if ( item.type == "menu" ) {
					$li.addClass('dropdown');
					let id = AS.generateId('jcMenu');
					$li.append(`<a class="nav-link dropdown-toggle" href="#" id="${id}" role="button" data-toggle="${id}" aria-haspopup="true" aria-expanded="false">${item.label.escape()}</a>`);
					let $div = $(`<div class="dropdown-menu" aria-labelledby="${id}"></div>`);
					item.menu.forEach( (si) => {
						$div.append(`<a class="dropdown-item" onclick="jc.page.open('${si.item.page}'${ si.item.id ? ','+si.item.id : ''})">${si.item.label.escape()}</a>`);
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
