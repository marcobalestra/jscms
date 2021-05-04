var jc = { prop : {
	lastHiEntry : '',
	uriPrefixPlain: '/-jscms/',
	uriPrefixOfbs: '/_jscms/',
	useObsUri: false,
	mainContainerId : 'jcToplevelContainer',
	prefs: {
		debugURI : false,
		debugLevel : 0,
		prefsVersion : 1,
	}
}};
AS.path({
	jsroot : '/jscms/',
	jstemplates : '/jscms/templates/',
	jsrenderers : '/jscms/templates/renderers/',
	jsextensions : '/jscms/templates/extensions/',
	jsdataroot : '/jscms/data/',
	jsreporoot : '/jscms/repository/',
});

jc.prop.loadModules = {
	'basic' : [
		AS.path('jsroot') + '/css/jc.css',
		'https://cdnjs.cloudflare.com/ajax/libs/bootstrap-sweetalert/1.0.1/sweetalert.css',
		'https://cdnjs.cloudflare.com/ajax/libs/bootstrap-sweetalert/1.0.1/sweetalert.min.js',
		'https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/css/select2.min.css',
		'https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js',
		'wait:()=>( window.swal && jQuery.fn.select2 )',
	],
	'edit' : [
		AS.path('jsroot') + '/js/jc-edit.js',
		'wait:()=>( !! jc._edit )',
	],
	'datatables': [
		'https://cdn.jsdelivr.net/gh/fancyapps/fancybox@3.5.7/dist/jquery.fancybox.min.css',
		'https://cdn.jsdelivr.net/gh/fancyapps/fancybox@3.5.7/dist/jquery.fancybox.min.js',
		'https://cdn.datatables.net/v/dt/dt-1.10.24/date-1.0.3/sp-1.2.2/datatables.min.css',
		'https://cdn.datatables.net/v/dt/dt-1.10.24/date-1.0.3/sp-1.2.2/datatables.min.js',
		'wait:()=>((!! $.fn.dataTable) && (!! $.fn.fancybox) )',
	],
	'swal' : [
		'https://cdnjs.cloudflare.com/ajax/libs/bootstrap-sweetalert/1.0.1/sweetalert.css',
		'https://cdnjs.cloudflare.com/ajax/libs/bootstrap-sweetalert/1.0.1/sweetalert.min.js',
		'wait:swal',
	],
	'webcam' : [
		'https://cdn.jsdelivr.net/gh/fancyapps/fancybox@3.5.7/dist/jquery.fancybox.min.css',
		'https://cdn.jsdelivr.net/gh/fancyapps/fancybox@3.5.7/dist/jquery.fancybox.min.js',
		(AS.path('jsroot') + 'js/webcam_modal.js'),
		'wait:()=>((!! window.wcm) && (!! $.fn.fancybox) )',
	],
};

var tp = {};
var pp = {};

/* Extend jQuery */

(($)=>{
	var re = /([^&=]+)=?([^&]*)/g;
	var decodeRE = /\+/g;  // Regex for replacing addition symbol with a space
	var decode = function (str) {return decodeURIComponent( str.replace(decodeRE, " ") );};
	$.parseParams = function(query) {
		var params = {}, e;
		while ( e = re.exec(query) ) {
			var k = decode( e[1] ), v = decode( e[2] );
			if (k.substring(k.length - 2) === '[]') {
				k = k.substring(0, k.length - 2);
				(params[k] || (params[k] = [])).push(v);
			} else params[k] = v;
		}
		return params;
	};
})(jQuery);

/* Startup operations */

$(() => {
	/* init prefs, restore+check debug level */
	jc.prefs.init();
	/* turns on caching for AJAX */
	$.ajaxSetup({ cache: true });
	jc.springLoad('module:basic');
	let foo = () => {
		if ( window.swal && jQuery.fn.select2 ) {
			window.name='jcmain';
			if ( /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream ) {
				$(document.body).addClass('iOS');
			}
			/* 1st page */
			var sp = jc.URI.decode();
			if ( AS.test.str(sp.page) ) jc.page.open(sp.page,sp.id,sp.data);
			else jc.page.open('index');
			jc.autoAdjustFields();
		} else {
			window.setTimeout( foo, 100 );
		}
	};
	foo();
} );

/* Global changes */

window.onpopstate = () => {
	var sp = jc.URI.decode();
	if ( AS.test.str(sp.page) ) {
		jc.prop.lastHiEntry = jc.URI.encode( sp );
		jc.page.open(sp.page,sp.data);
	}
};

if (!Date.prototype.clone) Date.prototype.clone = function() { var d = new Date(); d.setTime( this.getTime()); return d; };
if (!Date.prototype.tosqldate) Date.prototype.tosqldate = function() {
	var a = this.getFullYear() +'-';
	var x = this.getMonth() +1;
	a += (( x < 10 ) ? '0'+x : x)+'-';
	x = this.getDate();
	a += (( x < 10 ) ? '0'+x : x);
	return a;
};
if (!Date.prototype.toitadate) Date.prototype.toitadate = function() {
	let x = this.getDate();
	let a = String(( x < 10 ) ? '0'+x : x)+'.';
	x = this.getMonth() +1;
	a += (( x < 10 ) ? '0'+x : x)+'.'+this.getFullYear();
	return a;
};
if (!Date.prototype.tosql) Date.prototype.tosql = function() {
	var a = this.tosqldate() +' ';
	var x = this.getHours();
	a += (( x < 10 ) ? '0'+x : x)+':';
	x = this.getMinutes();
	a += (( x < 10 ) ? '0'+x : x)+':';
	x = this.getSeconds();
	a += (( x < 10 ) ? '0'+x : x);
	return a;
};
if (!Date.prototype.fromsql) Date.prototype.fromsql = function(s) {
	if ( AS.test.str(s) && s.match(/^([0-9]{4})/ ) ) {
		this.setMonth(0); 
		this.setDate(10);
		var x = parseInt(s.match(/^([0-9]{4})/)[1]);
		if ( ! isNaN(x) ) {
			this.setFullYear( x );
			x = parseInt( s.match(/^[0-9]{4}[^0-9]?([0-9]{2})/)[1] );
			if ( ! isNaN(x) ) {
				this.setMonth( x -1 );
				x = parseInt( s.match(/^[0-9]{4}[^0-9]?[0-9]{2}[^0-9]?([0-9]{2})/)[1] );
				if ( ! isNaN(x) ) this.setDate( x );
			}
		}
		this.setHours( 12, 0, 0, 0 );
		if ( s.indexOf(' ') > 0 ) {
			x = parseInt( s.match(/ ([0-9]{2})/)[1] );
			if (! isNaN(x) ) {
				this.setHours( x );
				x = parseInt( s.match(/ [0-9]{2}[^0-9]?([0-9]{2})/)[1] );
				if (! isNaN(x) ) {
					this.setMinutes( x );
					x = parseInt( s.match(/([0-9]{2})$/)[1] );
					if (! isNaN(x) ) this.setSeconds( x );
				}
			}
		}
	} else if ( AS.test.date(s) ) {
		this.setTime( s.getTime() );
	}
	return this;
};
if (!Date.prototype.getWeek) Date.prototype.getWeek = function() {
	var target  = new Date(this.valueOf()); // Create a copy of this date object
	var dayNr   = (this.getDay() + 6) % 7; // ISO week date weeks start on monday, so correct the day number
	target.setDate(target.getDate() - dayNr + 3); // Set the target to the thursday of this week so the target date is in the right year
	var jan4 = new Date(target.getFullYear(), 0, 4); // ISO 8601 states that week 1 is the week with january 4th in it
	var dayDiff = (target - jan4) / 86400000; // Number of days between target date and january 4th
	// Calculate week number: Week 1 (january 4th) plus the number of weeks between target date and january 4th
	// jan 4th is on the next week (so next week is week 1)
	var firstWeekNumber = (new Date(target.getFullYear(), 0, 1).getDay() < 5) ? 1 : 0;
	return firstWeekNumber + Math.ceil(dayDiff / 7);
}; 
Date.prototype.jcparser = function(d) {
	if ( AS.test.date(d) ) {
		this.setTime( d.getTime() );
		return this;
	} else if ( AS.test.str(d) ) {
		if ( d.match(/^2[0-9]{3}/) ) return this.fromsql( d );
		var k = new Date( d );
		if ( AS.test.date(k) ) {
			this.setTime( k.getTime() );
			return this;
		}
	} else if ( AS.test.num(d) ) {
		this.setTime( d );
		return this;
	}
	return this;
};
if (!Date.prototype.fromita) Date.prototype.fromita = function(s) {
	return this.fromsql( jc.date2sql(s) );
};

jc.getError = (jqXHR,status,e) => { console.log(jqXHR,status,e); };

jc.sql2date = d => ( AS.test.date(d) ? d : (new Date()).fromsql(d) );

jc.date2ita = d => {
	if ( typeof d == 'string' ) {
		if ( d.match(/^[0-9]{4}[^0-9]/) ) return d.replace(/^([0-9]{4})[^0-9]([0-9]{2})[^0-9]([0-9]{2})$/,"$3.$2.$1");
		if ( d.match(/[^0-9][0-9]{4}$/) ) return d;
	}
	if ( d && (typeof d == 'object') && (typeof d.toitadate == 'function') ) return d.toitadate();
	if ( typeof d == 'number' ) return (new Date()).setTime(d).toitadate();
	return undefined;
};

jc.date2sql = (d) => {
	if ( typeof d == 'string' ) {
		if ( d.match(/[^0-9][0-9]{4}$/) ) return d.replace(/^([0-9]{2})[^0-9]([0-9]{2})[^0-9]([0-9]{4})$/,"$3-$2-$1");
		if ( d.match(/^[0-9]{4}[^0-9]/) ) return d;
	}
	if ( (typeof d == 'object') && (typeof d.tosqldate == 'function') ) return d.tosqldate();
	if ( typeof d == 'number' ) return (new Date()).setTime(d).tosqldate();
	return undefined;
};

jc.springLoad = ( ...sources ) => {
	let cs=[];
	sources.forEach( (src) => {
		if ( src.indexOf('module:')==0) {
			let ms = jc.prop.loadModules[ src.replace(/^module:/,'') ];
			if ( ! ms ) return;
			if ( typeof ms == 'string') ms = [ms];
			ms.forEach( (m) => { cs.push(m); } );
		} else {
			cs.push(src);
		}
	} );
	let ns=[];
	let ps = [];
	let wait = false;
	cs.forEach( (src) => {
		if ( wait ) {
			ps.push(src);
		} else if ( src.indexOf('wait:')==0) {
			wait = src.replace(/^wait:/,'');
		} else {
			ns.push(src);
		}
	} );
	ns.forEach( (src) => {
		if ( ! src ) return undefined;
		if ( src.match(/\.css$/i ) ) return jc.springLoadCss( src );
		if ( src.match(/\.js$/i ) ) return jc.springLoadJs( src );
		console.log( 'jc.springLoad unknown element: '+src);
	} );
	if ( wait && (ps.length > 0) ) {
		let waiter = () => {
			let e,flag;
			try {
				flag = eval(wait);
			} catch(e) {
				flag = String(wait);
			}
			let pause = 10;
			if ( typeof flag == 'function' ) {
				flag = flag.call(window);
				if ( flag ) pause = 0;
			} else if ( typeof flag == 'number' ) {
				pause = parseInt(flag)
				flag = true
			} else if ( typeof flag == 'string' ) {
				flag = (typeof window[flag] != 'undefined');
				if ( flag ) pause = 0;
			}
			if ( flag ) {
				window.setTimeout( ()=>{jc.springLoad.apply(window,ps);}, pause);
			} else {
				window.setTimeout( waiter, pause );
			}
		}
		waiter();
	}
};

jc.springLoadCss = (...sources) => {
	let h = document.documentElement.querySelector('head');
	sources.forEach( (src) => {
		if ( ! src ) return undefined;
		if ( ! document.documentElement.querySelector(`link[href="${src}"]`) ) {
			jc.console('Loading CSS:',src);
			let s = document.createElement('link');
			s.setAttribute('type','text/css');
			s.setAttribute('rel','stylesheet');
			s.setAttribute('spring-load','true');
			s.setAttribute('href',src);
			h.appendChild(s);
		}
	} );
};

jc.springLoadJs = (...sources) => {
	let h = document.documentElement.querySelector('head');
	sources.forEach( (src) => {
		if ( ! src ) return undefined;
		if ( ! document.documentElement.querySelector(`script[src="${src}"]`) ) {
			jc.console('Loading JS:',src);
			let s = document.createElement('script');
			s.setAttribute('type','text/javascript');
			s.setAttribute('spring-load','true');
			s.setAttribute('src',src);
			h.appendChild(s);
		}
	} );
};

jc.fileSize = (n) => {
	if ( n > 1048576 ) return String(Math.round( 10 * n / 1048576) / 10)+' MiB';
	if ( n > 1024 ) return String(Math.round( n / 1024))+' KiB';
	return String(n)+'B';
};

jc.menu = (ev,menu)=>{
	ev.preventDefault();
	ev.stopPropagation();
	let zapMenus = () => {
		$('.appContextMenu').each( (idx,el)=>{ $(el).fadeOut(10,()=>{ $(el).remove();} ); } );
		$('.appContextHighlight').removeClass('appContextHighlight');
		$('.appContextHighlightTent').remove();
		$('.appContextActive').removeClass('appContextActive');
		$(document.body).off('click contextmenu', zapMenus );
	};
	zapMenus();
	let testNode = n=>(typeof n == 'string' || typeof n == 'html' || n instanceof Node || n instanceof NodeList || n instanceof jQuery);
	if ( Array.isArray(menu) || testNode(menu) ) menu = { content : menu };
	if ( typeof menu != 'object' ) return undefined;
	if ( ! menu.type ) menu.type = 'context';
	let $cm = $('<div class="dropdown clearfix appContextMenu"></div>');
	$cm.appendTo(document.body);
	if ( testNode( menu.content ) ) {
		$cm.append( menu.content );
	} else if ( Array.isArray(menu.content) ) {
		let $ul = $('<ul class="dropdown-menu appContextMenuContent" role="menu" aria-labelledby="dropdownMenu"></ul>');
		let parseli = v => {
			let $li = $('<li></li>');
			if ( typeof v == 'string' ) {
				if ( v == '-') {
					$li.html('<hr />');
				} else {
					$li.addClass('title').html( v );
				}
			} else if ( typeof v == 'object') {
				let e,lab = '';
				let ricon = v.ricon || '';
				let riconKey = v.riconKey || '';
				if ( (typeof v.ricon == 'undefined') && (typeof v.action == 'string') ) {
					ricon = (v.download && 'icon-download4')||( v.target && 'icon-square-up-right')||'icon-arrow-right16';
					riconKey = (v.download && 'download')||( v.target && 'newwin')||'arrow-right';
				}
				if ( ricon && riconKey ) lab += '<i class="rIcon '+ricon+'">'+AS.icon(riconKey)+'</i>';
				else if ( ricon ) lab += '<i class="rIcon '+ricon+'"></i>';
				if ( v.icon && v.iconKey) lab += '<i class="'+v.icon+'">'+AS.icon(v.iconKey)+'</i>';
				else if ( v.icon ) lab += '<i class="'+v.icon+'"></i>';
				if ( v.label ) lab += v.label;
				if ( typeof v.title == 'string' ) $li.attr('title',v.title);
				if ( Array.isArray( v.content ) && v.content.length ) {
					let $sul = $('<ul></ul>');
					v.content.forEach( c=>{ $sul.append( parseli(c) ) } );
					$li.addClass('subMenu')
					if ( lab && lab.length ) $li.html('<a>'+lab+'</a>');
					$li.append($sul);
					return $li;
				}
				try {
					let eva = eval(v.action);
					if ( typeof eva == 'function' ) v.action = eva;
				} catch(e) {}
				if ( typeof v.action == 'function' ) {
					let $a = $('<a>'+lab+'</a>');
					$a.on('contextmenu click',lev=>{
						lev.preventDefault();
						lev.stopPropagation();
						v.action.call(window,ev,lev);
						zapMenus();
					});
					$li.append($a);
				} else if ( typeof v.action == 'string' ) {
					let $a = $('<a href="'+v.action+'">'+lab+'</a>');
					if ( v.download ) $a.attr('download',v.download);
					if ( v.target ) $a.attr('target',v.target);
					$li.append($a);
				} else {
					$li.addClass('disabled').append('<a>'+lab+'</a>');
				}
			} else {
				return '';
			}
			return $li;
		}
		menu.content.forEach( v=>{ $ul.append( parseli(v) ) } );
		$cm.append($ul);
	} else {
		$cm.remove();
		console.log('jc.menu error',e,menu);
		return undefined;
	}
	let left, top;
	let cmw = $cm.width();
	let cmh = $cm.height();
	if ( menu.type == 'button' ) {
		if ( ! menu.parent ) menu.parent = menu.highlight||'button';
		let $parent = $(ev.target).closest(menu.parent);
		let pos = $parent.offset();
		left = menu.x || Math.floor( pos.left - 2 );
		top = menu.y || Math.floor( pos.top - 2 );
		if ( (top - $(window).scrollTop() + cmh) >= $(window).height() ) {
			top = Math.ceil( pos.top + $parent.outerHeight() - cmh );
			$('ul.appContextMenuContent',$cm).append( Array.from($('ul.appContextMenuContent>li',$cm)).reverse() );
		}
		if ( (left - $(window).scrollLeft() + cmw) >= $(window).width() ) {
			left = Math.ceil( pos.left + $parent.outerWidth() - $cm.width() +1);
		}
	} else if ( menu.type == 'menu' ) {
		menu.sticky = true;
		if ( ! menu.parent ) menu.parent = menu.highlight||'a';
		let $parent = $(ev.target).closest(menu.parent);
		let pos = $parent.offset();
		left = menu.x || Math.floor( pos.left );
		top = menu.y || Math.floor( pos.top + $parent.outerHeight() - 2 );
		if ( (top - $(window).scrollTop() + cmh) >= $(window).height() ) {
			top = Math.ceil( pos.top - cmh +2 );
			$('ul.appContextMenuContent',$cm).append( Array.from($('ul.appContextMenuContent>li',$cm)).reverse() );
		}
		if ( (left - $(window).scrollLeft() + cmw) >= $(window).width() ) {
			left = Math.ceil( pos.left + $parent.outerWidth() - cmw +1);
		}
		$parent.addClass('appContextActive');
	} else {  /* menu.type == 'context' */
		left = menu.x || (ev.pageX -10);
		top = menu.y || (ev.pageY -10);
		if ( (top - $(window).scrollTop() + cmh) >= $(window).height() ) {
			top -= (cmh -30);
			$('ul.appContextMenuContent',$cm).append( Array.from($('ul.appContextMenuContent>li',$cm)).reverse() );
		}
		if ( (left - $(window).scrollLeft() + cmw) >= $(window).width() ) {
			left -= (cmw -20);
		}
	}
	let hl = false;
	if ( menu.highlight ) {
		hl = $(ev.target).closest(menu.highlight);
	} else if ( typeof menu.highlight == 'undefined' ) {
		hl = $(ev.target);
	}
	if ( hl ) {
		let os = hl.offset();
		let w = hl.width();
		let h = hl.height();
		$(`<div class="appContextHighlightTent" style="top:${os.top}px;left:${os.left}px;width:${w}px;height:${h}px;"> </div>`).appendTo(document.body);
		hl.addClass('appContextHighlight');
	}
	if ( ! menu.sticky ) $cm.on('mouseleave', zapMenus );
	$(document.body).on('click contextmenu', zapMenus );
	$cm.css({
		transition: `all ${ menu.duration||100 }ms`,
		transform: `translateY(${parseInt( ev.pageY - top - (cmh/2) )}px) scaleY(0)`,
		left: `${left}px`,
		top: `${top}px`,
		display: 'block'
	});
	let rmtrans = e=>{ $(e.target).off('transitionend',rmtrans).css({ transition: 'unset', transform: 'unset' }); };
	$cm.on('transitionend',rmtrans);
	window.setTimeout( ()=>{ $cm.css({ transform: 'translateY(0) scaleY(1)' }); }, 0);
};

jc.makeInputDate = ( input_fields ) => {
	let fs = $(input_fields);
	if ( fs.length == 0 ) return undefined;
	if ( typeof jc.prop.browserCanHandleDatePicker == 'undefined') {
		let input = document.createElement('input');
		input.setAttribute('type', 'date');
		input.value = '2018-01-01';
		jc.prop.browserCanHandleDatePicker = !!input.valueAsDate;
		input.remove();
	}
	fs.each( (idx,el) => {
		let f = $(el);
		if ( f.data('jc._fieldParsed') ) return undefined;
		f.data('jc._fieldParsed',true);
		if ( f.attr('disabled') || f.attr('readonly') ) {
			if ( f.val() ) f.val( jc.date2ita(f.val()) );
			return undefined;
		}
		let dtype = 'date';
		if ( (f.attr('type')=='time')||(f.data('type')=='time') ) dtype='time';
		if ( jc.prop.browserCanHandleDatePicker ) {
			f.attr('type',dtype);
			f.on('change',()=>{ f.val( jc.date2sql(f.val())||''); });
		} else if ( dtype=='date' ){
			// f.get(0).setValue = v=>{ f.datepicker('setValue', v); return f; };
			if ( f.val() ) f.val( jc.date2ita(f.val()) );
			f.on('change',()=>{
				let idate = jc.date2ita(f.val()||'');
				f.datepicker('setValue', idate);
				f.val(idate);
			});
			f.attr('type','text').datepicker({
				format: 'dd.mm.yyyy',
				emptytext: 'Data',
				language: 'it',
				todayBtn: true,
				todayHighlight: true,
			}).on('show',(e)=>{
				$(e.target).data('datepicker').picker.css('z-index','999999');
			});
		} else if ( dtype=='time' ){
			if ( ! f.attr('placeholder') ) f.attr('placeholder','hh:mm');
			f.attr('type','text').on('change', jc.adjustTimeFieldValue );
		}
	});
};

jc.autoSelect2 = ( input_fields ) => {
	let fs = $(input_fields);
	fs.each( (idx,el) => {
		let f = $(el);
		if ( f.attr('disabled') || f.attr('readonly') || f.data('jc._fieldParsed') ) return undefined;
		f.data('jc._fieldParsed',true);
		if ( f.data('ajax')) {
			f.select2({
				allowClear: true,
				ajax: {
					url: f.data("ajax"),
					dataType: 'json',
					delay: 250,
					data: (params)=>{
						let p = f.data('ajax_params') || {};
						p.q = params.term;
						return p;
					},
					processResults: (data, params)=>{
						return { results: data.items, };
					},
					cache: ! f.data('ajax_nocache')
				}
			});
		} else {
			f.select2({ tags: f.data('tags') });
		}
	});
};

jc.autoAdjustFields = ( d ) => {
	if ( typeof d == 'undefined' ) d = document.body;
	jc.makeInputDate($('input[type="date"],input[type="time"]',d));
	jc.autoSelect2( $('select.autoSelect2',d) );
};


/* jc.URI */

jc.URI = {
	decode : ()=>{
		let parsitems,fakepath='';
		if ( window.location.href.indexOf(jc.prop.uriPrefixPlain)>=0) {
			parsitems =  window.location.href.substr(window.location.href.indexOf(jc.prop.uriPrefixPlain)+jc.prop.uriPrefixPlain.length);
		} else if (window.location.href.indexOf(jc.prop.uriPrefixOfbs)>=0) {
			parsitems =  window.location.href.substr(window.location.href.indexOf(jc.prop.uriPrefixOfbs)+jc.prop.uriPrefixOfbs.length);
		} else {
			return {};
		}
		if ( parsitems.indexOf('/') > 0 ) {
			fakepath = parsitems.replace(/^.+\/(.*)$/,"$1");
			parsitems = parsitems.replace(/\/.*$/,'');
		}
		if (window.location.href.indexOf(jc.prop.uriPrefixOfbs)>=0) parsitems = window.atob(parsitems);
		parsitems = parsitems.split(',');
		var pars={ page: decodeURIComponent(parsitems.shift()) };
		if ( pars.page == '' ) return {};
		if ( parsitems.length ) {
			pars.data = {};
			parsitems.forEach( p => {
				let kv = p.split(':');
				pars.data[ kv[0] ] = parseInt(kv[1]);
			} );
		}
		if ( pars.page.match(/[0-9]+$/) ) {
			pars.id = parseInt( pars.page.replace(/^.*[^0-9]([0-9]+)$/,"$1") );
			pars.page = pars.page.replace(/[0-9]+$/,"");
		}
		if ( fakepath.length ) {
			if ( AS.test.udef(pars.data) ) pars.data={};
			pars.data._fakepath = fakepath;
		}
		jc.console('Decoded location:',pars);
		return pars;
	},
	encode : o=>{
		if ( ! AS.test.str(o.page) ) return '/';
		var uri = '';
		if ( AS.test.obj(o.data) ) {
			uri += encodeURIComponent(o.page);
			if ( o.id ) {
				uri += o.id;
			} else if ( o.data && o.data.id ) {
				uri += o.data.id;
			} else {
				var parts = [];
				for (const [key, value] of Object.entries(o.data)) {
					let v = false;
					if ( AS.test.str(value) && (! isNaN(parseInt(value))) ) {
						o.data[key] = parseInt(value);
						parts.push(key);
					} else if ( AS.test.num(value) && (parseInt(value)==value) ) {
						parts.push(key);
					}
				}
				if ( parts.length ) {
					uri += ',' + parts.sort().map( p => ( p + ':' + o.data[p]) ).join(',');
				}
			}
		} else if ( AS.test.str(o) ) {
			uri = encodeURIComponent(o);
		}
		if ( jc.prop.useObsUri )  {
			uri = jc.prop.uriPrefixOfbs + window.btoa(uri);
		} else {
			uri = jc.prop.uriPrefixPlain + uri;
		}
		if ( o.data && o.data._fakepath ) uri += '/' + o.data._fakepath;
		jc.console('Encoded location:',uri);
		return uri;
	},
	push : title => {
		var uriparams = {};
		if ( jc.page.current() ) {
			uriparams.page = jc.page.current();
			if ( AS.test.obj( jc.page.data() ) ) uriparams.data = jc.page.data();
		}
		var up = jc.URI.encode( uriparams );
		if ( AS.test.udef(title)) title = $('#appAction').html() || document.title;
		if ( up != jc.prop.lastHiEntry ) {
			jc.prop.lastHiEntry = up;
			history.pushState({},title, up );
		}
	},
	current : title => {
		if ( AS.test.str(title)) document.title = title;
		else if ( AS.test.udef(title)) title = $('#appAction').html() || document.title;
		history.replaceState({},title, jc.URI.encode( jc.URI.decode() ) );
	}
};

jc.def = {
	arr : x=>{ var d = AS.test.def(x); return ( d && AS.test.arr(x) ) ? x : ( d ? [x] : [] ); },
	bool: x=>{ return AS.test.bool(x) ? x : false; },
	num : x=>{ var d = AS.test.def(x); return ( d && AS.test.num(x) ) ? x : ( d ? parseFloat(x) : 0 ); },
	obj : x=>{ return AS.test.obj(x) ? x : {}; },
	str : x=>{ return AS.test.def(x) ? String(x) : ''; },
};

jc.vault = {
	commit : ()=>{
		if ( ! AS.test.str(jc.vault.storageKey) ) jc.vault.init();
		if ( AS.test.def(window.Storage) ) {
			var stor = {};
			for ( var key in  jc.vault.prop ) {
				if ( key.match(/^global::/) ) {
					localStorage.setItem( key , JSON.stringify( jc.vault.prop[key] ) );
				} else {
					stor[key] = jc.vault.prop[key];
				}
			}
			if ( AS.test.str(jc.vault.storageKey) ) localStorage.setItem( jc.vault.storageKey , JSON.stringify(stor) );
		}
	},
	key : ( ctx, k, v )=>{
		if ( ! AS.test.str(jc.vault.storageKey) ) jc.vault.init();
		if ( AS.test.str( ctx ) && ( ctx !== '' ) ) {
			jc.vault.prop[ctx] = AS.def.obj( jc.vault.prop[ctx] );
			if ( AS.test.str( k ) && ( k !== '' ) ) {
				if ( AS.test.def( v ) ) {
					if ( AS.test.date(v) ) v = v.tosql();
					jc.vault.prop[ctx][k]=v;
					jc.vault.commit();
				}
				if ( typeof jc.vault.prop[ctx][k] === 'object ') return JSON.parse( JSON.stringify( jc.vault.prop[ctx][k] ) );
				return jc.vault.prop[ctx][k];
			}
			return JSON.parse( JSON.stringify( jc.vault.prop[ctx] ) );
		}
		return false;
	},
	list : ctx => {
		if ( ! AS.test.str(jc.vault.storageKey) ) jc.vault.init();
		var ans = [];
		if ( AS.test.str( ctx ) && ( ctx !== '' ) ) {
			if ( AS.test.obj( jc.vault.prop[ctx] ) ) for ( var i in jc.vault.prop[ctx] ) ans.push(i);
		} else {
			for ( var i in jc.vault.prop ) ans.push(i);
		}
		return ans;
	},
	load : ( ctx, hash ) => {
		if ( ! AS.test.str(jc.vault.storageKey) ) jc.vault.init();
		if ( AS.test.str( ctx ) && ( ctx !== '' ) && AS.test.obj( hash ) ) {
			jc.vault.prop[ctx] = hash;
			jc.vault.commit();
		}
	},
	init : ()=>{
		var id = 'user';//jc.user.getId();
		if ( AS.test.udef( id ) ) {
			jc.vault.prop = {};
			return;
		}
		jc.vault.storageKey = 'jc::vault::' + id;
		if ( AS.test.def(window.Storage) ) {
			var s = window.localStorage.getItem(jc.vault.storageKey);
			jc.vault.prop = AS.test.str(s) ? JSON.parse( s ) : {};
			var len = window.localStorage.length;
			for( var i=0; i < len; i++ ) {
				var key = window.localStorage.key(i);
				if ( key.match(/^global::/) ) {
					var s = window.localStorage.getItem(key);
					jc.vault.prop[key] = AS.test.str(s) ? JSON.parse( s ) : {};
				}
			}
		} else {
			jc.vault.prop = {};
		}
	},
	purge : ( ctx, k )=>{
		if ( AS.test.str( ctx ) && ( ctx !== '' ) ) {
			if ( AS.test.str( k ) && ( k !== '' ) ) {
				jc.vault.prop[ctx][k] = undefined;
			} else {
				jc.vault.prop[ctx] = undefined;
				if ( ctx.match(/^global::/) && window.localStorage ) window.localStorage.removeItem(ctx);
			}
		} else {
			for ( var i in jc.vault.prop ) if ( i.match(/^global::/) && window.localStorage ) window.localStorage.removeItem(i);
			jc.vault.prop = {};
		}
		jc.vault.commit();
	}
};

jc.prefs = {
	init : ()=>{
		if ( jc.vault.key('jc::prefs','prefsVersion') ) {
			if ( jc.prop.prefs.prefsVersion > parseInt(jc.vault.key('jc::prefs','prefsVersion')) ) {
				jc.vault.purge('jc::prefs');
				jc.prefs.commit();
			} else {
				jc.prefs.load( jc.vault.key('jc::prefs') );
			}
		} else {
			jc.prefs.commit();
		}
		return jc.prefs;
	},
	serialize : ()=>{ return JSON.stringify( jc.prop.prefs ); },
	dump : ()=>(JSON.parse( jc.prefs.serialize() )),
	load : o => {
		if ( jc.prop.prefs.prefsVersion > parseInt(o.prefsVersion) ) return false;
		jc.prop.prefs = JSON.parse( JSON.stringify( o ));
		jc.prefs.commit();
		if ( jc.prefs.debugLevel()>2 ) jc.prefs.debugLevel(2);
		return true;
	},
	key  : (k,v) => {
		if ( AS.test.def(v) ) {
			if ( AS.test.date(v) ) v = v.tosql();
			jc.prop.prefs[k] = v;
			jc.prefs.commit();
		}
		return jc.prop.prefs[k];
	},
	purge  : k => {
		delete jc.prop.prefs[k];
		jc.prefs.commit();
	},
	commit : () => {
		for ( k in jc.prop.prefs ) {
			jc.vault.key('jc::prefs',k,jc.prop.prefs[k]);
			jc.prop[k] = jc.prop.prefs[k];
		}
	},
	debugLevel : x => {
		if ( AS.test.def(x)) {
			if ( AS.test.str(x) ) x = parseInt(x);
			if ( AS.test.num(x) ) {
				jc.prefs.key('debugLevel',x);
				if ( x > 0 ) {
					jc.console('Debug Level: '+x);
				} else try {
					console.log.call( this, 'Debug is OFF' );
				} catch(x) {}
			}
		}
		return jc.prefs.key('debugLevel');
	},
};

jc.console = ( ...args ) => {
	var e;
	var dl = jc.prefs.debugLevel();
	if ( dl > 2 ) {
		jc.debug.apply( window, args );
	} else if ( dl > 0 ) try {
		console.log.apply( window, args );
	} catch(e) {}
};

jc.args2array = args=>(Array.prototype.slice.call(args));

jc.debug = (...args) => {
	if ( AS.test.udef(jc.prop._debug) ) jc.prop._debug={timeout:false,queue:[],todate:false};
	if ( args.length > 0 ) jc.prop._debug.queue = jc.prop._debug.queue.concat(args);
	if ( jc.prop._debug.todate ) {
		if ( ( (new Date()) - jc.prop._debug.todate ) > 5000 ) {
			if ( jc.prop._debug.queue.length > 0 ) {
// 				$.post(
// 					jc.path('webroot') + 'js:debug',
// 					{ jdebug : JSON.stringify(jc.prop._debug.queue) },
// 					(d)=>{ console.log('DEBUGged: ',d); }
// 				);
				console.log('Debugging: ',args);
				delete jc.prop._debug;
			}
		}
	} else if ( jc.prop._debug.queue.length > 0 ) {
		jc.prop._debug.timeout = window.setTimeout( jc.debug, 5500 );
		jc.prop._debug.todate = new Date();
	} else if ( jc.prop._debug.timeout ) {
		window.clearTimeout( jc.prop._debug.timeout );
		delete jc.prop._debug;
	}
};

jc.debugLevel = x => {
	if ( AS.test.def(x)) {
		if ( AS.test.str(x) ) x = parseInt(x);
		if ( AS.test.num(x) ) {
			jc.prop.prefs.debugLevel = x;
			jc.vault.load('jc::prefs',jc.prop.prefs);
			if ( x > 0 ) {
				jc.console('Debug Level: '+x);
			} else try {
				console.log.call( window, 'Debug is OFF' );
			} catch(x) {}
		}
	}
	return jc.prop.prefs.debugLevel;
};

jc.debugURI = x => {
	if ( AS.test.def(x)) {
		if ( AS.test.str(x) ) x = parseInt(x);
		if ( AS.test.num(x) ) x = ( x != 0 );
		if ( AS.test.bool(x) ) {
			jc.prop.prefs.debugURI = x;
			jc.vault.load('jc::prefs',jc.prop.prefs);
		}
	}
	return jc.prop.prefs.debugURI;
};

/* jc page */

jc.page = {
	prop : {
		renderers : {},
		templateInfo : {},
		templateHtml : {},
		parts : {},
		currentTemplateHtml : '',
		current : false,
		changed : false
	},
	changed : s => {
		if ( AS.test.def( s ) ) {
			jc.page.prop.changed = !! s;
			if ( AS.test.obj(tp) && AS.test.func(tp.formChanged)) {
				var e;
				try {
					tp.formChanged.call(window,jc.page.prop.changed);
				} catch(e) {};
			}
		}
		return jc.page.prop.changed;
	},
	current : s => {
		if ( AS.test.def( s ) ) jc.page.prop.current = s;
		return jc.page.prop.current;
	},
	addData : d => {
		let od = jc.def.obj( jc.page.data() );
		if ( AS.test.obj( d ) ) Object.keys(d).forEach( k => { od[k] = d[k]; } );
		return jc.page.data(od);
	},
	data : d => {
		if ( AS.test.obj( d ) ) jc.page.prop.data = d;
		return jc.page.prop.data;
	},
	open : ( page, id, data, infokey ) => {
		var initialargs = JSON.parse(JSON.stringify([page,data]));
		if ( ! page ) page = 'index';
		if ( AS.test.str(data) ) data = $.parseParams( data );
		if ( data && AS.test.str(data.template) ) {
			if (! infokey) infokey = String(data.template);
			delete data.template;
		}
		if ( (! infokey) && data && AS.test.obj(data.template) ) infokey = data.template.key;
		if ( ! infokey ) infokey = page;
		jc.page.changed( false );
		jc.console('Opening page:'+page, id, data, infokey );
		jc.page.data( data );
		jc.page.getTemplateInfo( page, id, data, infokey );
	},
	getTemplateInfo : ( page, id, data, infokey ) => {
		if ( ! jc.page.prop.templateInfo[infokey] ) {
			let url = AS.path('jstemplates') + 'pages/'+ infokey + '.js';
			jc.console('getTemplateInfo:',url);
			$.ajax( url, {
				cache: true,
				method: 'GET',
				dataType: 'json',
				error: jc.getError,
				success: d => {
					d.key = infokey;
					if ( ! d.html ) d.html = 'index';
					jc.page.prop.templateInfo[infokey] = d;
					jc.page.getTemplateInfo( page, id, data, infokey );
				},
			});
			return;
		}
		if ( ! data ) data = {};
		if ( ! data.template ) data.template = jc.page.prop.templateInfo[infokey];
		jc.page.getTemplateHtml( page, id, data );
	},
	getTemplateHtml : ( page, id, data ) => {
		if ( ! jc.page.prop.templateHtml[data.template.html] ) {
			let url = AS.path('jstemplates') + 'pages/'+ data.template.html + '.html';
			jc.console('getTemplateHtml:',url);
			$.ajax( url, {
				cache: true,
				method: 'GET',
				dataType: 'html',
				error: jc.getError,
				success: h => {
					jc.page.prop.templateHtml[data.template.html] = h;
					jc.page.getTemplateHtml( page, id, data );
				},
			});
			return;
		}
		jc.page.current( page );
		if ( AS.test.obj(data) ) jc.page.addData( data );
		jc.page.addData( { id: id } );
		if ( data.template.html != jc.page.prop.currentTemplateHtml ) {
			jc.page.prop.currentTemplateHtml = data.template.html;
			$('#'+jc.prop.mainContainerId).html( jc.page.prop.templateHtml[data.template.html] );
		}
		jc.page.getPageData( page, id );
	},
	loadData : ( page, id, callback ) => {
		let url = AS.path('jsdataroot') + page;
		if ( id ) url += id;
		url += '.js';
		jc.console('loadData',url);
		$.ajax( url, {
			method: 'POST',
			dataType: 'json',
			cache: false,
			data : { _ : (new Date()).getTime() },
			error: jc.getError,
			success: j => { if ( AS.test.func(callback) ) callback.call( window, j ); },
		});
	},
	reload : () => { jc.page.getPageData( jc.page.current(), jc.page.data().id ); },
	getPageData : ( page, id ) => {
		jc.page.loadData( page, id, j => {
			window.tp = {};
			let data = jc.page.data();
			jc.page.addData( { pageContent: j } );
			if ( data.template.content ) jc.page.render.main(data.template.content);
		});
		jc.URI.push();
	},
	render : {
		main : data => {
			if ( ! Array.isArray(data) ) data = [data];
			let pfull = jc.page.data();
			let pdata = AS.test.obj(pfull) ? pfull.pageContent : {};
			data.forEach( e => {
				if ( e.internalRecursion ) {
					e = {
						dontEmpty: true,
						selector: e.selector,
						content: Array.isArray(e) ? e : [ e ]
					};
				}
				let sel = e.selector || '#'+jc.prop.mainContainerId;
				let $tgt = $(sel);
				if ( ! e.dontEmpty ) {
					$tgt.html('');
					$tgt.removeData('jc_part_label');
				}
				if ( e.part ) {
					e.content = { type: 'part', content: e.part };
					delete e.part;
				}
				if ( AS.test.def(e.content) && ( ! e.content) ) {
					$tgt.html('');
					e.hidden = true;
				} else if ( e.content ) {
					if ( ! Array.isArray(e.content) ) e.content = [e.content];
					e.content.forEach( c => {
						jc.page.render.prepare( c );
						if ( AS.test.obj(c) ) {
							if ( ! c.id ) {
								c.id = AS.generateId('jc-block-');
								$tgt.append('<hr style="display:none;" id="'+c.id+'" />');
								$('#'+c.id,$tgt).data(c);
							}
							if ( c.rendered ) {
								if ( jc.page.prop.editMode ) jc.page.render.editable(c);
								$('#'+c.id,$tgt).after( c.rendered ).remove();
								delete c.id;
							} else if ( c.type ){
								c.internalRecursion = true;
								c.selector = sel;
								if ( jc.page.render[c.type] ) jc.page.render[c.type].call( window, c, pdata, pfull );
							}
						}
					} );
				}
				$( ()=>{
					if ( AS && AS.labels ) $tgt.html( AS.labels.labelize( $tgt.html() ) );
					$('.jcMenu',$tgt).each( (idx,m) => {
						let $m = $(m);
						if ( ! $m.attr('onclick') ) $m.attr('onclick','jc.actionsMenu(event)');
						if ( ! $m.attr('oncontextmenu') ) $m.attr('oncontextmenu','jc.actionsMenu(event)');
					});
					$tgt.toggle(!e.hidden);
				});
			} );
		},
		prepare : ( c, $scope ) => {
			if ( AS.test.str(c) ) {
				let exc;
				try {
					let f = eval(c);
					if ( AS.test.func(f)) c = { type:'func', func: f };
				} catch(exc) {
					c = { rendered: c };
				}
			} else if ( AS.test.func(c) ) {
				c = { type:'func', func: c };
			}
			if ( AS.test.obj(c) ) {
				if ( ! c.type ) {
					if ( c.blocks ) c.type = 'blocks';
					else if ( c.render ) c.type = 'customJs';
				}
				if ( c.func && (! c.rendered) ) c.rendered =  c.func.call(window,pdata, pfull);
			}
		},
		editable : ( c ) => {
			if ( jc.page.prop.editMode && c.rendered && c.editable ) {
				c.rendered = $('<div class="jcEditable"></div>').data('editable',c.editable).append( c.rendered );
			}
			return c;
		},
		customJs : ( o ) => {
			if ( ! jc.page.prop.renderers[o.render] ) {
				let url = AS.path('jsrenderers') + o.render + '.js';
				jc.console('Loading external renderer:',url);
				$.ajax( url, {
					method: 'GET',
					dataType: 'text',
					error: jc.getError,
					success: t => {
						let e;
						try {
							let f = eval(t);
							t = f;
						} catch(e) {
							console.log('Error evaluating external JS render',url,o,e);
						}
						if ( AS.test.func(t) ) {
							jc.page.prop.renderers[o.render] = t;
							jc.page.render.customJs( o );
						} else {
							console.log('External JS render not a function',url,o,t);
						}
					},
				});
				return;
			}
			o.func = jc.page.prop.renderers[o.render];
			jc.page.render.main(o);
		},
		part : ( o ) => {
			if ( ! jc.page.prop.parts[o.content] ) {
				let ext='.js',dataType='json';
				if ( o.content.match(/\.x?html?$/) ) {
					ext = '';
					dataType='html';
				}
				let url = AS.path('jstemplates') + 'parts/'+ o.content + ext;
				jc.console('Loading part:',url);
				$.ajax( url, {
					method: 'GET',
					dataType: dataType,
					error: jc.getError,
					success: j => {
						jc.page.prop.parts[o.content] = j;
						jc.page.render.part( o );
					},
				});
				return;
			}
			if ( $(o.selector).data('jc_part_label') != o.content ) {
				$(o.selector).data('jc_part_label',o.content);
				o.rendered = jc.page.prop.parts[o.content];
				jc.page.render.main(o);
			}
		},
		blocks : (o,pdata,pfull) => {
			if ( ! Array.isArray(o.blocks)) o.blocks = [o.blocks];
			o.rendered = o.blocks.map( b => ( jc.page.blocks[b.type] ? jc.page.blocks[b.type].call(window,b,pdata) : '' ) );
			jc.page.render.main(o);
		},
	},
	blocks : {
		text : (b,d)=>{
			let out = $(b.wrap || '<div></div>');
			out.append( d[b.prop] );
			return out;
		},
		html : (b,d)=> {
			return d[b.prop];
		},
		mixed : (b,d) => {
			if ( ! d[b.prop] ) return '';
			let out = $(b.wrap || '<div></div>');
			if ( ! Array.isArray(d[b.prop]) ) d[b.prop] = [d[b.prop]];
			d[b.prop].forEach( sb => {
				if ( AS.test.str( sb ) ) sb = { content:sb };
				if ( ! AS.test.obj( sb )) return;
				if ( ! sb.type ) sb.type='text';
				if (jc.blocks[sb.type]) {
					let r = jc.page.blocks[sb.type].call(window,{prop:sb.type},sb);
					out.append( r );
				}
			} );
			return out;
		},
	},
	editor : ( status ) => {
		if ( jc.page.prop.editMode = !! status ) {
			jc.springLoad('module:edit');
			let foo = () => {
				if ( jc._edit ) return jc.page.reload();
				window.setTimeout( foo, 100 );
			}
			foo.call(window);
		} else {
			jc.page.reload();
		}
	},
	edit : () => {
		if ( ! jc._edit ) {
			jc.springLoad('module:edit');
			setTimeout( ()=> { jc.page.edit() }, 100 );
			return;
		}
		let p = jc.page.current();
		let d = jc.page.data();
		jc.edit( p, d.id );
	},
};

jc.actionsMenu = (e) => {
	let acts = [AS.label('menuActionsTitle')];
	if ( jc.page.prop.editMode ) {
		acts.push({icon:'jcicon',iconKey:'done',label:AS.label('menuEditOver'),action:()=>{jc.page.editor(false);} });
	} else {
		acts.push({icon:'jcicon',iconKey:'edit',label:AS.label('menuEditStart'),action:()=>{jc.page.editor(true);} });
	}
	jc.menu(e, { content: acts, highlight: false });
};
