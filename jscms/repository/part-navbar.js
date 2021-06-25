(()=>{
	let data = {
		form : ( callback ) => {
			let ptypes = [{value:'',label:'['+AS.label('None')+']'}];
			let stypes = [];
			jc.edit.prop.pageTypes.forEach( k => {
				let lab = jc.edit.prop.pageTypesInfo[k].display;
				if ( lab != k ) lab += ' ['+k+']';
				if ( jc.edit.prop.pageTypesInfo[k].service ) {
					stypes.push({label:lab,value:k});
				} else {
					ptypes.push({label:lab,value:k});
				}
			} );
			ptypes.push({label:AS.label('Special'),options:stypes});
			let fo = {
				requires : ['basic','pikaday','tinymce','iro','slider'],
				options : {
					subparts: {
						label: ['label','text',{asLabel:'Label',normalize:true,mandatory:true,focus:true,depends:'!type=divider,!type=text'}],
						page : ['item','jcpage',{nolabel:true,depends:'type=item',includecurrent:true}],
						pparams : ['pparams','subform',{asLabel:'Page params',subform:'pparams',skipempty:true,depends:'type=item'}],
					},
					subforms : [
							{
								name : 'pparams',
								subtype: 'array',
								preview: ['k','v'],
								values : [
									['k','text',{asLabel:'Key',normalize:true,skipempty:true,mandatory:true}],
									['v','text',{asLabel:'Value',normalize:true,skipempty:true,mandatory:true}],
								]
							},
							{
								name: 'itemd',
								subtype: 'array',
								preview: ['type','label','text'],
								values: [
									['type','select',{asLabel:'Type',options:[{label:'Page',value:'item'},{label:'Divider',value:'divider'},{label:'Text',value:'text'}]}],
									{subpart:'label'},
									{subpart:'page'},
									{subpart:'pparams'},
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
									{subpart:'pparams'},
									['menu','subform',{asLabel:'Content',subform:'itemd',depends:'type=menu'}],
									["hitype","select",{asLabel:'HighlightForType',options:ptypes}],
								]
							},
					],
				},
				fields : [
					['type','hidden',{value:"navbar"}],
					['theme','select',{asLabel:'Theme',options:[{label:'Light',value:"navbar-light bg-light"},{label:'Dark',value:"navbar-dark bg-dark"},{label:'Blue',value:"navbar-dark bg-primary"}]}],
					['id','text',{label:'ID',skipempty:true,trim:true}],
					['login','bool',{asLabel:'Login'}],
					['menu','subform',{asLabel:'Content',subform:'item',mandatory:true}],
				],
			};
			if ( AS.test.func(callback) ) callback.call(window,fo);
			return fo;
		},
		render : ( data ) => {
			let $navbar = $(`<nav class="jcNavbar navbar navbar-expand-lg ${data.theme}"></nav>`);
			let cid = data.id || AS.generateId('jcNavbar');
			$navbar.append(`<button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#${cid}" aria-controls="${cid}" aria-expanded="false" aria-label="Toggle navigation"><span class="navbar-toggler-icon"></span></button>`);
			$navbar.append(`<div class="collapse navbar-collapse" id="${cid}"><ul class="navbar-nav mr-auto jcNavBarLeft"></ul><ul class="navbar-nav ml-auto jcNavBarRight"></ul></div>`);
			const makepp = (o) => {
				if ( ! (o.pparams && o.pparams.length ) ) return '{}';
				let pp = {};
				o.pparams.forEach( (i) => { pp[i.k]=i.v; } );
				return JSON.stringify(pp).escape();
			};
			const render = ( item, $parent ) => {
				let $li = $(`<li class="nav-item"></li>`);
				if ( item.type == "item" ) {
					let pp = false;
					if ( item.pparams ) {
						pp = {};
						item.pparams.forEach( (i) => { pp[i.k]=i.v; } );
						pp = JSON.stringify(pp);
					};
					$li.append(`<a class="nav-link" onclick="jc.page.open('${item.item.page}',${ item.item.id ? item.item.id : 'undefined'}${ item.pparams ? ','+makepp(item) : ''})">${ item.label.escape() }</a>`)
					if ( (jc.page.current() == item.item.page) && ( item.item.id == jc.page.data().id) ) $li.addClass('active');
					else if ( item.hitype && item.hitype.length && (item.hitype == jc.page.current())) $li.addClass('active');
					$li.data(item.item);
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
							$div.append($('<div class="p-2" style="max-width: 320px;"></div>').html(si.text));
							return;
						}
						let $a = $(`<a class="dropdown-item" onclick="jc.page.open('${si.item.page}',${ si.item.id ? si.item.id : 'undefined'}${ si.pparams ? ','+makepp(si) : ''})">${si.label.escape()}</a>`);
						if ( (jc.page.current() == si.item.page) && ( si.item.id == jc.page.data().id) ) {
							$a.addClass('active');
							$li.addClass('active');
						}
						$div.append($a);
					});
					$li.append($div);
				}
				$parent.append($li);
			};
			if ( data.login ) {
				$('div>ul.jcNavBarRight',$navbar).append('<li class="nav-item"><a class="nav-link jcMenu jcMenuText">Login</a></li>');
			}
			data.menu.forEach( (item) => { render( item, $('div>ul.jcNavBarLeft',$navbar) ); } );
			$navbar.append( $('<script type="text/javascript">$( ()=>{ $(document.body).trigger("jc_navbar_prepared");} )</script>'))
			return $navbar;
		},
	};
	jc.template.repo.set('part-navbar',data);
})(window);
