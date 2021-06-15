/*
	This code © 2021 Marco Balestra - balestra@altersoftware.it
	
	This code is 100% Microsoft-free, Java-free, Angular-free.
	Developed on Mac OS X in a 100% Microsoft-free environment.
	Requires nothing but a modern browser.
	Releasend under Creative Commons Attribution 4.0 International (CC BY 4.0)
	license: https://creativecommons.org/licenses/by/4.0/
	
	Technologies and credits:
	* jQuery, © jQuery Foundation
	* Glyphicons, © 2010-2017 Jan Kovarik, licensed to M. Balestra
	* TinyMCE, Opensource LGPL
	* AS core library by M. Balestra (CC BY 4.0) - https://altersoftware.it/products/jslibs/js-as-core/
	* AS.labels library by M. Balestra (CC BY 4.0) - https://altersoftware.it/products/jslibs/js-as-labels/
	* AS.form library by M. Balestra (CC BY 4.0) - https://altersoftware.it/products/jslibs/js-as-form/
*/

/* jc.prop integrate defaults */
jc.prop.lastHiEntry = '';
jc.prop.absUriMatcher = ( new RegExp("^([a-z]+:/)?/","i") );
if ( AS.test.udef(jc.prop.maxUploadSize)) jc.prop.maxUploadSize = 8388608; // 8MiB
if ( AS.test.udef(jc.prop.uriPrefixPlain)) jc.prop.uriPrefixPlain = '/-jscms/';
if ( AS.test.udef(jc.prop.uriPrefixOfbs)) jc.prop.uriPrefixOfbs = '/_jscms/';
if ( AS.test.udef(jc.prop.useObsUri)) jc.prop.useObsUri = false;
if ( AS.test.udef(jc.prop.mainContainerId)) jc.prop.mainContainerId = 'jcToplevelContainer';
if ( ! AS.test.arr(jc.prop.lastChangedQuantities)) jc.prop.lastChangedQuantities =  [10,25,50,100];
/* jc.prop.prefs integrate defaults */
if ( AS.test.udef(jc.prop.prefs)) jc.prop.prefs = {};
if ( AS.test.udef(jc.prop.prefs.debugURI)) jc.prop.prefs.debugURI = false;
if ( AS.test.udef(jc.prop.prefs.debugLevel)) jc.prop.prefs.debugLevel = 0;
if ( AS.test.udef(jc.prop.prefs.prefsVersion)) jc.prop.prefs.prefsVersion = 1;
/* paths integrate defaults */ 
( ()=>{
	let lp = AS.path('jsroot');
	let bp = AS.path('jscdn')||AS.path('jsroot');
	if ( AS.test.udef(lp) ) {
		lp = '/jscms/';
		AS.path({jsroot:lp});
	}
	if ( AS.test.udef(AS.path('jstemplates'))) AS.path({jstemplates:bp+'templates/'});
	if ( AS.test.udef(AS.path('jsrenderers'))) AS.path({jsrenderers:AS.path('jstemplates')+'renderers/'});
	if ( AS.test.udef(AS.path('jsextensions'))) AS.path({jsextensions:AS.path('jstemplates')+'extensions/'});
	if ( AS.test.udef(AS.path('jsdataroot'))) AS.path({jsdataroot:lp+'data/'});
	if ( AS.test.udef(AS.path('jsdatapages'))) AS.path({jsdatapages:AS.path('jsdataroot')+'pages/'});
	if ( AS.test.udef(AS.path('jsdatasite'))) AS.path({jsdatasite:AS.path('jsdataroot')+'site/'});
	if ( AS.test.udef(AS.path('jsdatastatics'))) AS.path({jsdatastatics:AS.path('jsdataroot')+'static/'});
	if ( AS.test.udef(AS.path('jsauth'))) AS.path({jsauth:lp+'login/'});
	if ( AS.test.udef(AS.path('jsreporoot'))) AS.path({jsreporoot:bp+'repository/'});
})()

jc.prop.loadModules = {
	'basic' : [
		AS.path('jscdn') + 'css/jc.css',
		{ type:'js', src:'https://cdn.jsdelivr.net/npm/sweetalert2@10'},
		{ type:'js', src:'https:///cdn.jsdelivr.net/npm/promise-polyfill@8/dist/polyfill.js'},
		'https://cdn.jsdelivr.net/gh/fancyapps/fancybox@3.5.7/dist/jquery.fancybox.min.css',
		'https://cdn.jsdelivr.net/gh/fancyapps/fancybox@3.5.7/dist/jquery.fancybox.min.js',
		'https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/css/select2.min.css',
		'https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js',
		'wait:()=>( window.Swal && jQuery.fn.select2 )',
	],
	'edit' : [
		AS.path('jscdn') + 'js/jc-edit'+(jc.prop.isDeveloper?'':'.min')+'.js',
		'https://cdn.altersoftware.org/js-as-form/as-form.js',
		'wait:()=>( jc.edit && AS.form )',
	],
	'maintenance' : [
		AS.path('jscdn') + 'js/jc-maintenance'+(jc.prop.isDeveloper?'':'.min')+'.js',
		'wait:()=>( jc.maint )',
	],
	'datatables': [
		'https://cdn.datatables.net/v/dt/dt-1.10.24/date-1.0.3/sp-1.2.2/datatables.min.css',
		'https://cdn.datatables.net/v/dt/dt-1.10.24/date-1.0.3/sp-1.2.2/datatables.min.js',
		'wait:()=>((!! $.fn.dataTable) && (!! $.fn.fancybox) )',
	],
};

/* Extend jQuery */

(($)=>{
	let re = /([^&=]+)=?([^&]*)/g;
	let decodeRE = /\+/g;  // Regex for replacing addition symbol with a space
	let decode = function (str) {return decodeURIComponent( str.replace(decodeRE, " ") );};
	$.parseParams = function(query) {
		let params = {}, e;
		while ( e = re.exec(query) ) {
			let k = decode( e[1] ), v = decode( e[2] );
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
		if ( window.Swal && jQuery.fn.select2 ) {
			window.name='jcmain';
// 			if ( /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream ) {
// 				$(document.body).addClass('iOS');
// 			}
			/* 1st page */
			if ( window.self == window.top) {
				let sp = jc.URI.decode();
				if ( AS.test.str(sp.page) ) jc.page.open(sp.page,sp.id,sp.data);
				else jc.page.open('index');
			}
			jc.autoAdjustFields();
		} else {
			window.setTimeout( foo, 100 );
		}
	};
	foo();
} );

var tp = {};

/* Global changes */

$(window).on('popstate',() => {
	if ( jc.page.prop.editMode ) return;
	let sp = jc.URI.decode();
	if ( AS.test.str(sp.page) ) {
		jc.prop.lastHiEntry = jc.URI.encode( sp );
		jc.page.open(sp.page,sp.id,sp.data);
	}
});
if (!Date.prototype.clone) Date.prototype.clone = function() { let d = new Date(); d.setTime( this.getTime()); return d; };
if (!Date.prototype.tosqldate) Date.prototype.tosqldate = function() {
	let a = this.getFullYear() +'-';
	let x = this.getMonth() +1;
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
	let a = this.tosqldate() +' ';
	let x = this.getHours();
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
		let x = parseInt(s.match(/^([0-9]{4})/)[1]);
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
	let target  = new Date(this.valueOf()); // Create a copy of this date object
	let dayNr   = (this.getDay() + 6) % 7; // ISO week date weeks start on monday, so correct the day number
	target.setDate(target.getDate() - dayNr + 3); // Set the target to the thursday of this week so the target date is in the right year
	let jan4 = new Date(target.getFullYear(), 0, 4); // ISO 8601 states that week 1 is the week with january 4th in it
	let dayDiff = (target - jan4) / 86400000; // Number of days between target date and january 4th
	// Calculate week number: Week 1 (january 4th) plus the number of weeks between target date and january 4th
	// jan 4th is on the next week (so next week is week 1)
	let firstWeekNumber = (new Date(target.getFullYear(), 0, 1).getDay() < 5) ? 1 : 0;
	return firstWeekNumber + Math.ceil(dayDiff / 7);
}; 
Date.prototype.jcparser = function(d) {
	if ( AS.test.date(d) ) {
		this.setTime( d.getTime() );
		return this;
	} else if ( AS.test.str(d) ) {
		if ( d.match(/^2[0-9]{3}/) ) return this.fromsql( d );
		let k = new Date( d );
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
if (!Date.prototype.toblogdate) Date.prototype.toblogdate = function() {
	return this
		.toLocaleDateString(navigator.language,{weekday:'long',year:'numeric',month:'long',day:'numeric'})
		.replace(/^([a-z])/,x=>x.toUpperCase())
		.replace(/([^a-z])([a-z])/gi,(a,x,y)=>(x+y.toUpperCase()))
	;
};

jc.objFind = ( o, p, v )=>{
	if ( AS.test.arr(o) ) return o.find( x => jc.objFind(x,p,v));
	if ( AS.test.obj(o)) {
		if ( o[p] ) return (o[p]==v ? o : undefined);
		let f = Object.keys(o).find( x => jc.objFind(o[x],p,v) );
		if (f) return jc.objFind(o[f],p,v);
	}
	return undefined;
};

jc.objFindAll = ( mo, p, v )=>{
	let out = [];
	const s = o => {
		if ( AS.test.arr(o) ) return o.filter( x => s(x) );
		if ( AS.test.obj(o)) {
			if ( AS.test.def(o[p]) ) {
				if ( o[p]==v || AS.test.udef(v) ) out.push( o );
				return;
			}
			Object.keys(o).forEach( x => s( o[x] ) );
		}
		return undefined;
	}
	s(mo);
	return out;
};

jc.getError = (jqXHR,status,e) => { jc.console(jqXHR,status,e); };

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
		if ( AS.test.str(src) && (src.indexOf('module:')==0)) {
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
		} else if ( AS.test.str(src) && (src.indexOf('wait:')==0)) {
			wait = src.replace(/^wait:/,'');
		} else {
			ns.push(src);
		}
	} );
	ns.forEach( (src) => {
		if ( ! src ) return undefined;
		if ( AS.test.obj(src) && (src.type=='js') && src.src ) return jc.springLoadJs( src.src );
		if ( AS.test.obj(src) && (src.type=='css') && src.src ) return jc.springLoadCss( src.src );
		if ( src.match(/\.css$/i ) ) return jc.springLoadCss( src );
		if ( src.match(/\.js$/i ) ) return jc.springLoadJs( src );
		jc.console( 'jc.springLoad unknown element: '+src);
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

jc.evalFunc = (f) => {
	if ( AS.test.func(f) ) return f;
	if ( AS.test.str(f)) {
		let exc;
		try {
			let ft = eval(f);
			if ( AS.test.func(ft) ) return ft;
		} catch(exc) {}
	}
	return false;
};

jc.login = ( success, fail ) => {
	fail = jc.evalFunc(fail)||jc.evalFunc(success)||jc.getError;
	success = jc.evalFunc(success)||(()=>{});
	jc.jdav.get(
		AS.path('jsauth') + 'auth/username',
		(d,err) => {
			jc.prop.authUser = d ? d.username : undefined;
			if ( d.username ) AS.setCookie('jcAuthUser',d.username,{path:'/',sameSite:true});
			else AS.rmCookie('jcAuthUser');
			if ( d ) success.call(window,d);
			else fail.call(window,d,err);
		}
	);
};

jc.progress = ( msg ) => {
	let mod = $('#jcProgressIndicator');
	let first = false;
	if ( mod.length == 0 ) {
		first = true;
		mod = $(AS.label('modalProgress'));
		$(document.body).append( mod );
		mod = $('#jcProgressIndicator');
	}
	if ( AS.test.str(msg) ) {
		$('.progressMessage',mod).html(msg);
		mod.modal('handleUpdate');
		if ( first || (! mod.hasClass('in')) ) mod.modal({backdrop:'static',keyboard:false,show:true});
	} else {
		mod.modal('hide').remove();
	}
};

jc.progressbar = (options) => {
	let e;
	if ( ! jc.prop.progressbar ) {
		jc.prop.progressbar = Swal.fire({
			toast: true,
			title : '<div class="jcProgressbar"></div>',
			html : ' ',
			position: 'top-end',
			showConfirmButton : false,
		});
		setTimeout( ()=>{ jc.progressbar(options) }, 10 )
		return jc.prop.progressbar;
	}
	if ( options && options.close ) {
		setTimeout( ()=>{
			try { Swal.close(); } catch(e) {};
			try { jc.prop.progressbar._destroy(); } catch(e) {};
			delete jc.prop.progressbar;
		},10);
		return false;
	}
	if ( options ) {
		let newopts = {};
		if ( options.text ) newopts.html = `${ options.text }`;
		if ( options.prog ) newopts.title = `<div class="jcProgressbar"><div style="width:${ 100 * options.prog }%;"></div></div>`;
		if (jc.prop.progressbar && Swal.isVisible() && Object.keys(newopts).length ) try { jc.prop.progressbar.update(newopts); } catch(e){ }
	}
	return jc.prop.progressbar;
};

jc.dav = {
	get : ( url, success, fail ) => {
		fail = jc.evalFunc(fail)||jc.evalFunc(success)||jc.getError;
		success = jc.evalFunc(success)||(()=>{});
		if ( ! url.match(jc.prop.absUriMatcher) ) url = AS.path('jsdataroot') + url;
		jc.console('jc.dav.get',url);
		$.ajax( url, {
			method: 'GET',
			cache: false,
			dataType: 'text',
			error: (...errs) => { fail.call(window,false,errs); },
			success : (data) => { success.call(window,data); }
		});
	},
	info : ( url, success, fail ) => {
		fail = jc.evalFunc(fail)||jc.evalFunc(success)||jc.getError;
		success = jc.evalFunc(success)||(()=>{});
		if ( ! url.match(jc.prop.absUriMatcher) ) url = AS.path('jsdataroot') + url;
		jc.console('jc.dav.info',url);
		$.ajax( url, {
			method: 'PROPFIND',
			cache: false,
			contentType: 'text/xml; charset=UTF-8',
			dataType: 'text',
			error: (...errs) => { fail.call(window,false,errs); },
			success : (xt) => {
				let data = { uri: url };
				xt = xt.replace(/[\r\n]+/g,' ');
				data.href = xt.replace(/^.+:href>([^<]+)<\/[^:]+:href>.+$/,"$1");
				data.size = parseInt(xt.replace(/^.+:getcontentlength>([0-9]+)<\/[^:]+:getcontentlength>.+$/,"$1"));
				success.call(window,data);
			}
		});
	},
};

jc.jdav = {
	get : ( url, success, fail ) => {
		fail = jc.evalFunc(fail)||jc.evalFunc(success)||jc.getError;
		success = jc.evalFunc(success)||(()=>{});
		if ( ! url.match(jc.prop.absUriMatcher) ) url = AS.path('jsdataroot') + url;
		jc.console('jc.jdav.get',url);
		$.ajax( url, {
			method: 'GET',
			cache: false,
			dataType: 'json',
			error: (...errs) => { fail.call(window,false,errs); },
			success : (data) => { success.call(window,data); }
		});
	}
};

Object.keys( jc.dav ).forEach( (k) => { if (AS.test.udef(jc.jdav[k])) jc.jdav[k] = jc.dav[k]; } );

jc.menu = (ev,menu)=>{
	ev.preventDefault();
	ev.stopPropagation();
	let zapMenus = () => {
		document.querySelectorAll('.appContextMenu').forEach( el=>{ $(el).fadeOut(10,()=>{ $(el).remove();} ); } );
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
		let $ul = $('<ul class="dropdown-menu appContextMenuContent" role="menu" aria-labelledby="dropdownMenu" style="max-width:'+$(window.width)+'px;"></ul>');
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
					$a.addClass('clickable');
					$li.append($a);
				} else if ( typeof v.action == 'string' ) {
					let $a = $('<a href="'+v.action+'">'+lab+'</a>');
					if ( v.download ) $a.attr('download',v.download);
					if ( v.target ) $a.attr('target',v.target);
					$a.addClass('clickable');
					$li.append($a);
				} else {
					$li.addClass('disabled').append('<a>'+lab+'</a>');
				}
			} else {
				return '';
			}
			if ( Array.isArray( v.content ) && v.content.length ) {
				let $sul = $('<ul></ul>');
				v.content.forEach( c=>{ $sul.append( parseli(c) ) } );
				$li.addClass('subMenu')
				$li.append($sul);
			}
			return $li;
		}
		menu.content.forEach( v=>{ $ul.append( parseli(v) ) } );
		$cm.append($ul);
	} else {
		$cm.remove();
		jc.console('jc.menu error',e,menu);
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
		left = menu.x || (ev.pageX -20);
		top = menu.y || (ev.pageY -20);
		if ( (top - $(window).scrollTop() + cmh) >= $(window).height() ) {
			top -= (cmh -40);
			$('ul.appContextMenuContent',$cm).append( Array.from($('ul.appContextMenuContent>li',$cm)).reverse() );
		}
		if ( (left - $(window).scrollLeft() + cmw) >= $(window).width() ) {
			left -= (cmw -40);
		}
	}
	if ( left < 0 ) left = 0;
	if ( top < 0 ) top = 0;
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
	$(document.body).on('click contextmenu', zapMenus );
	$cm.css({
		transition: `all ${ menu.duration||100 }ms`,
		transform: `translateY(${parseInt( ev.pageY - top - (cmh/2) )}px) scaleY(0)`,
		left: `${left}px`,
		top: `${top}px`,
		display: 'block'
	});
	let rmtrans = e=>{
		if ( ! menu.sticky ) $cm.on('mouseleave', zapMenus );
		$(e.target).off('transitionend',rmtrans).css({ transition: 'unset', transform: 'unset' });
	};
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
		let l = window.location.href.replace(/#.*/,'');
		if ( l.indexOf(jc.prop.uriPrefixPlain)>=0) {
			parsitems =  l.substr(window.location.href.indexOf(jc.prop.uriPrefixPlain)+jc.prop.uriPrefixPlain.length);
		} else if (l.indexOf(jc.prop.uriPrefixOfbs)>=0) {
			parsitems =  l.substr(window.location.href.indexOf(jc.prop.uriPrefixOfbs)+jc.prop.uriPrefixOfbs.length);
		} else {
			return {};
		}
		if ( parsitems.indexOf('/') > 0 ) {
			fakepath = parsitems.replace(/^.+\/(.*)$/,"$1");
			parsitems = parsitems.replace(/\/[^\/]*$/,'');
		}
		if (l.indexOf(jc.prop.uriPrefixOfbs)>=0) parsitems = window.atob(parsitems);
		parsitems = parsitems.split(',');
		let pars={ page: decodeURIComponent(parsitems.shift()) };
		if ( pars.page == '' ) return {};
		if ( parsitems.length ) {
			pars.data = {};
			parsitems.forEach( p => {
				let kv = p.split(':');
				pars.data[ kv[0] ] = decodeURIComponent(kv[1]).replace(/\+/g,' ');
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
	encode : (o,title,parsdata)=>{
		let uri = '';
		if ( AS.test.obj(o)) {
			if ( ! AS.test.str(o.page) ) return '/';
			uri += encodeURIComponent(o.page||o.type);
			if ( o.id ) {
				uri += o.id;
			}
			if ( AS.test.obj(o.data) ) {
				if ( (! o.id) && o.data && o.data.id ) {
					uri += o.data.id;
				}
				if ( AS.test.obj(parsdata) ) {
					Object.keys(parsdata).sort().forEach( k => {
						uri += ',' + k + ':' + encodeURIComponent(parsdata[k]).replace(/\%20/g,'+');
					} );
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
		if ( AS.test.def(title) )  uri += '/' + title.toLowerCase().replace(/[^a-z0-9._]+/g,' ').trim().replace(/ +/g,'-');
		else if ( o.data && o.data._fakepath ) uri += '/' + o.data._fakepath;
		jc.console('Encoded location:',uri);
		return uri;
	},
	push : title => {
		let uriparams = {};
		if ( jc.page.current() ) {
			uriparams.page = jc.page.current();
			let data = jc.page.data();
			if ( AS.test.obj( jc.page.data() ) ) uriparams.data = data;
			if ( AS.test.udef(title) )  {
				if ( data.pageContent.metadata.url ) title = data.pageContent.metadata.url;
				else if ( data.id && data.pageContent.metadata.title ) title = data.pageContent.metadata.title;
			}
		}
		let up = jc.URI.encode( uriparams, title, jc.page.data().args );
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
	arr : x=>{ let d = AS.test.def(x); return ( d && AS.test.arr(x) ) ? x : ( d ? [x] : [] ); },
	bool: x=>{ return AS.test.bool(x) ? x : false; },
	num : x=>{ let d = AS.test.def(x); return ( d && AS.test.num(x) ) ? x : ( d ? parseFloat(x) : 0 ); },
	obj : x=>{ return AS.test.obj(x) ? x : {}; },
	str : x=>{ return AS.test.def(x) ? String(x) : ''; },
};

jc.vault = {
	commit : ()=>{
		if ( ! AS.test.str(jc.vault.storageKey) ) jc.vault.init();
		if ( AS.test.def(window.Storage) ) {
			let stor = {};
			Object.keys( jc.vault.prop ).forEach( key => {
				if ( key.match(/^global::/) ) {
					localStorage.setItem( key , JSON.stringify( jc.vault.prop[key] ) );
				} else {
					stor[key] = jc.vault.prop[key];
				}
			} );
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
		let ans = [];
		if ( AS.test.str( ctx ) && ( ctx !== '' ) ) {
			if ( AS.test.obj( jc.vault.prop[ctx] ) ) Object.keys(jc.vault.prop[ctx]).forEach( i => { ans.push(i) } );
		} else {
			Object.keys( jc.vault.prop ).forEach( i => { ans.push(i); } );
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
		jc.vault.storageKey = 'jc::vault::user';
		if ( AS.test.def(window.Storage) ) {
			let s = window.localStorage.getItem(jc.vault.storageKey);
			jc.vault.prop = AS.test.str(s) ? JSON.parse( s ) : {};
			Object.keys(window.localStorage).filter( k=>(k.indexOf('global::')==0)).forEach( key => {
				let s = window.localStorage.getItem(key);
				jc.vault.prop[key] = AS.test.str(s) ? JSON.parse( s ) : {};
			} );
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
				if ( (ctx.indexOf('global::')==0) && window.localStorage ) window.localStorage.removeItem(ctx);
			}
		} else {
			Object.keys(jc.vault.prop).filter( k=>(k.indexOf('global::')==0) ).forEach( k => { window.localStorage.removeItem(k) } );
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
		jc.vault.purge('jc::prefs',k);
	},
	commit : () => {
		Object.keys(jc.prop.prefs).forEach( k => {
			jc.vault.key('jc::prefs',k,jc.prop.prefs[k]);
			jc.prop[k] = jc.prop.prefs[k];
		} );
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
	let e;
	let dl = jc.prefs.debugLevel();
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

/* jc.template */

jc.template = {
	prop : {
		info : {},
		html : {},
		part : {},
		repo : {},
	},
	info : {
		get: ( template, callback ) => {
			let v = jc.template.prop.info[template];
			if ( ! v ) {
				let url = AS.path('jstemplates') + 'info/'+ template + (jc.prop.isDeveloper?'':'.min')+ '.js';
				jc.console('jc.template.info.get :',url);
				jc.template.prop.info[template] = '_loading_';
				jc.springLoadJs(url);
				setTimeout( ()=>{ jc.template.info.get(template,callback) }, 100 );
			} else if ( v == '_loading_') {
				setTimeout( ()=>{ jc.template.info.get(template,callback) }, 100 );
			} else if ( AS.test.func(callback) ) {
				callback.call( window, v );
			} else {
				return v;
			}
		},
		set : ( template, obj ) => {
			if ( ! obj.html ) obj.html = 'index';
			jc.template.prop.info[template] = obj;
		},
	},
	html : {
		get : ( key, callback ) => {
			let v = jc.template.prop.html[key];
			if ( ! v ) {
				let url = AS.path('jstemplates') + 'html/'+ key + '.html';
				jc.template.html.set(key,'_loading_');
				jc.dav.get( url, (h)=>{ jc.template.html.set(key,h); jc.template.html.get( key, callback ); }, jc.getError);
				return;
			} else if ( v == '_loading_' ) {
				setTimeout( ()=>{ jc.template.html.get(key,callback) }, 100 );
			} else if ( AS.test.func(callback) ) {
				callback.call( window, v );
			} else {
				return v;
			}
		},
		set : ( key, value ) => { jc.template.prop.html[key] = value; },
		current : ( key ) => {
			if ( AS.test.str(key) ) jc.template.prop.currentInfo = key;
			return jc.template.prop.currentInfo;
		},
	},
	part : {
		get : ( key, ...args ) => {
			let callback,options={};
			args.forEach( (a) => {
				if ( AS.test.func(a)) callback = a;
				else if ( AS.test.obj(a)) options = a;
			} );
			let v = jc.template.prop.part[key];
			if ( ! v ) {
				jc.template.part.set(key,'_loading_');
				if ( key.match(/\.json$/) ) {
					jc.jdav.get( 'parts/'+ key, j =>{
						jc.template.part.set(key,j);
						jc.template.part.get(key,callback,options);
					},()=>{
						jc.template.part.set(key,{ type: key.replace(/\.json$/,'') });
						jc.template.part.get(key,callback,options);
					});
				} else if ( key.match(/\.x?html?$/) ) {
					jc.dav.get( 'parts/'+ key, j =>{
						jc.template.part.set(key,j);
						jc.template.part.get(key,callback,options);
					},jc.getError);
				}
				return;
			} else if ( v == '_loading_' ) {
				setTimeout( ()=>{ jc.template.part.get(key,callback,options) }, 100 );
				return;
			}
			if ( AS.test.obj(v) && v.type && (! options.raw ) ) {
				jc.template.repo.get( 'part-'+v.type, (repo)=>{
					if ( options.repo ) v = repo;
					else v = repo.render(v);
					if ( AS.test.func(callback) ) callback.call( window, v );
				})
				return;
			}
			if ( AS.test.func(callback) ) {
				callback.call( window, v );
			} else {
				return v;
			}
		},
		reload : ( key, ...args ) => {
			let callback,options={};
			args.forEach( (a) => {
				if ( AS.test.func(a)) callback = a;
				else if ( AS.test.obj(a)) options = a;
			} );
			delete jc.template.prop.part[key];
			return jc.template.part.get(key,callback,options);
		},
		put : ( key, data, callback ) => {
			if ( AS.test.obj(data)) {
				jc.jdav.put( 'parts/'+ key, data, () =>{
					jc.template.part.reload( key, {raw:true}, callback );
				},jc.getError);
			} else {
				jc.dav.put( 'parts/'+ key, data, () =>{
					jc.template.part.reload( key, callback );
				},jc.getError);
			}
		},
		set : ( key, value ) => { jc.template.prop.part[key] = value },
	},
	repo : {
		get : ( repo, callback ) => {
			let data = jc.template.prop.repo[repo];
			if ( ! data ) {
				data = '_loading_';
				jc.springLoad( AS.path('jsreporoot')+repo+(jc.prop.isDeveloper?'':'.min')+'.js' );
			}
			if ( data == '_loading_') {
				window.setTimeout( ()=>{ jc.template.repo.get(repo,callback); }, 100 );
				return;
			}
			if (AS.test.func(callback)) callback.call( window, data );
			return data;
		},
		set : ( repo, data ) => { jc.template.prop.repo[repo] = data },
	},
};

/* jc.lists */

jc.lists = {
	prop : { lists:{}, lasts:{}, tags:{} },
	list : {
		uri : ( type ) => ('struct/'+type+'-list.json'),
		get : ( ...args ) => {
			const type = args.find(a=>AS.test.str(a))||'_all';
			const callback = args.find(a=>AS.test.func(a));
			const list = jc.lists.prop.lists[type];
			if ( list == '_loading_') {
				window.setTimeout( ()=>{jc.lists.list.get.apply(window,args);}, 100 );
				return;
			}
			if ( ! AS.test.obj(list) ) {
				jc.lists.prop.lists[type] = '_loading_';
				jc.jdav.get( jc.lists.list.uri(type), (l)=>{
					if ( jc.lists.prop.lists[type] == '_loading_') jc.lists.prop.lists[type] = l||{};
					jc.lists.list.get.apply(window,args);
				});
				return;
			}
			if ( AS.test.func(callback)) callback.call(window,JSON.parse(JSON.stringify(list)));
			else return JSON.parse(JSON.stringify(list));
		},
		fetch : ( ...args ) => {
			const type = args.find(a=>AS.test.str(a))||'_all';
			delete jc.lists.prop.lists[type];
			jc.lists.list.get.apply(window,args);
		},
	},
	last : {
		uri : ( type, qt ) => ('struct/'+type+'-last'+qt+'.json'),
		get : ( ...args ) => {
			const type = args.find(a=>AS.test.str(a))||'_all';
			const qt = args.find(a=>AS.test.num(a));
			const callback = args.find(a=>AS.test.func(a));
			if ( ! jc.lists.prop.lasts[type] ) jc.lists.prop.lasts[type] = {};
			let list = jc.lists.prop.lasts[type][String(qt)];
			if ( list == '_loading_') {
				window.setTimeout( ()=>{jc.lists.last.get.apply(window,args);}, 100 );
				return;
			}
			if ( ! AS.test.arr(list) ) {
				jc.lists.prop.lasts[type][String(qt)] = '_loading_';
				jc.jdav.get( jc.lists.last.uri(type,qt), (l)=>{
					if ( jc.lists.prop.lasts[type][String(qt)] == '_loading_') jc.lists.prop.lasts[type][String(qt)] = l||[];
					jc.lists.last.get.apply(window,args);
				});
				return;
			}
			if ( AS.test.func(callback)) callback.call(window,JSON.parse(JSON.stringify(list)));
			else return JSON.parse(JSON.stringify(list));
		},
		fetch : ( ...args ) => {
			const type = args.find(a=>AS.test.str(a))||'_all';
			const qt = args.find(a=>AS.test.num(a));
			if ( ! jc.lists.prop.lasts[type] ) jc.lists.prop.lasts[type] = {};
			delete jc.lists.prop.lasts[type][String(qt)];
			jc.lists.last.get.apply(window,args);
		},
	},
	tag : {
		uri : ( type ) => ('struct/tag-'+type+'.json'),
		get : ( ...args ) => {
			const type = args.find(a=>AS.test.str(a))||'site';
			const callback = args.find(a=>AS.test.func(a));
			if ( jc.lists.prop.tags[type] == '_loading_') {
				window.setTimeout( ()=>{jc.lists.tag.get.apply(window,args);}, 100 );
				return;
			}
			if ( ! jc.lists.prop.tags[type] ) {
				jc.lists.prop.tags[type] = '_loading_';
				jc.jdav.get( jc.lists.tag.uri(type), (l)=>{
					if ( jc.lists.prop.tags[type] == '_loading_') jc.lists.prop.tags[type] = l||{};
					jc.lists.tag.get.apply(window,args);
				});
				return;
			}
			if ( AS.test.func(callback)) callback.call(window,JSON.parse(JSON.stringify(jc.lists.prop.tags[type])));
			else return JSON.parse(JSON.stringify(jc.lists.prop.tags[type]));
		},
		fetch : ( ...args ) => {
			const type = args.find(a=>AS.test.str(a))||'site';
			delete jc.lists.prop.tags[type];
			jc.lists.tags.get.apply(window,args);
		},
	},
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
				let e;
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
		if ( ! AS && AS.labels && AS.labels.loaded ) return setTimeout( ()=>{ jc.page.open(page, id, data, infokey) }, 100);
		if ( ! page ) page = 'index';
		if ( page == jc.page.current() ) {
			if ( id ) {
				if ( jc.page.data() && jc.page.data().id && ( id == jc.page.data().id )) return;
			} else if (! ( jc.page.data() && jc.page.data().id ) ) {
				return;
			}
		}
		if ( jc.edit && jc.edit.data() ) jc.edit.data(false);
		$(document.body).trigger('jc_page_open_requested',{page:page,id:id,uriparams:data});
		if ( AS.test.udef(data) ) data = {};
		else if ( AS.test.str(data) ) data = $.parseParams( data );
		if ( data && AS.test.str(data.template) ) {
			if (! infokey) infokey = String(data.template);
			delete data.template;
		}
		if ( data ) {
			let args = {};
			Object.keys(AS.def.obj(data)).filter( k => AS.test.str(data[k]) ).filter( k => (k.indexOf('_') != 0)).forEach( k => {
				args[k] = String(data[k]);
				delete data[k];
			} );
			data.args = args;
		}
		if ( (! infokey) && data && AS.test.obj(data.template) ) infokey = data.template.key;
		if ( ! infokey ) infokey = page;
		jc.page.changed( false );
		jc.console('Opening page:'+page, id, data, infokey );
		jc.page.data( data );
		let finalize = ()=>{
			$(document.body).off('jc_render_end',finalize);
			if ( ! jc.page.prop.editMode ) window.scrollTo(0,0);
			setTimeout( ()=>{ $(document.body).trigger('jc_page_open_completed',{page:page,id:id,uriparams:data.args}); }, 100 );
		}
		$(document.body).on('jc_render_end',finalize);
		jc.page.step.info( page, id, data, infokey );
	},
	loadData : ( page, id, callback ) => {
		if ( (jc.page.prop.editMode == 'page') && jc.edit && jc.edit.data() ) {
			if ( AS.test.func(callback) ) callback.call( window, jc.edit.data() );
			return;
		}
		let url = AS.path('jsdatapages') + page + ( id||'') + '.json';
		jc.jdav.get( url, (data) =>{ if ( AS.test.func(callback) ) callback.call( window, data ); });
	},
	reload : () => {
		let cs = $(window).scrollTop();
		let finalize = ()=>{
			$(document.body).off('jc_render_end',finalize);
			setTimeout( ()=>{
				$(window).scrollTop(cs);
				setTimeout( ()=>{ $(document.body).trigger('jc_page_open_completed',{page:jc.page.current(),id:jc.page.data().id,uriparams:jc.page.data().args}); }, 100 );
			}, 100 );
		}
		$(document.body).on('jc_render_end',finalize);
		jc.page.step.data( jc.page.current(), jc.page.data().id );
	},
	step : {
		info : ( page, id, data, infokey ) => {
			jc.template.info.get( infokey, ( tdata )=>{
				$(document.body).trigger('jc_page_template_info_loaded',tdata);
				if ( ! data ) data = {};
				if ( ! data.template ) data.template = tdata;
				jc.page.step.html( page, id, data );
			},()=>{ jc.page.open('index'); });
		},
		html : ( page, id, data ) => {
			jc.page.current( page );
			if ( AS.test.obj(data) ) jc.page.addData( data );
			jc.page.addData( { id: id } );
			jc.template.html.get( data.template.html, ( html )=>{
				if ( data.template.html != jc.template.html.current() ) {
					jc.template.html.current( data.template.html );
					$('#'+jc.prop.mainContainerId).html( html );
				}
				$(document.body).trigger('jc_page_template_html_loaded',html);
				jc.page.step.data( page, id );
			},()=>{ jc.page.open('index'); });
		},
		data : ( page, id ) => {
			jc.page.loadData( page, id, j => {
				let data = jc.page.data();
				if ( ! j ) {
					if ( (! id) && data.template.service ) {
						j = {  metadata : { type: page }};
					} else {
						jc.page.open('index');
						return;
					}
				}
				window.tp = {};
				jc.page.addData( { pageContent: j } );
				jc.URI.push();
				$('#jcHiddenPageIndicator').remove();
				if ( j.metadata ) {
					const h = document.documentElement.querySelector('head');
					const md = j.metadata;
					if ( md.title ) $('title',h).html(md.title);
					let keywords = (md.keywords ? md.keywords : '').split(/, */);
					jc.objFindAll(jc.objFindAll(j,'type','tags'),'show').forEach( tf => {
						if ( tf.tags ) tf.tags.forEach( (t) => {
							let tt = t.tag.toLowerCase();
							if ( ! keywords.find( x => (x == tt))) keywords.push( tt );
						} );
					});
					if ( keywords.length ) {
						$('meta[name="keywords"]',h).attr('content',keywords.join(', '));
					}
					if ( md.description ) $('meta[name="description"]',h).attr('content',md.description);
					if ( md.hidden ) $(document.body).append(`<div id="jcHiddenPageIndicator"><span>${ AS.label('PageHidden')}</span></div>`);
					$(document.body).attr('style','');
				}
				$(document.body).trigger('jc_page_data_loaded',j);
				if (jc.page.prop.editMode == 'page') jc.edit.data( j );
				if ( data.template.content ) jc.render.init(data.template.content);
			});
		},
	},
	checkJcMenu : ( ctx )=>{
		if ( AS.test.udef(ctx)) ctx = document.body;
		let $menu = $('.jcMenu:not(.jcMenuParsed)',ctx);
		if ( ! $menu.length ) return;
		$menu.html('');
		$menu.addClass('jcMenuParsed');
		let user = jc.prop.authUser||AS.getCookie('jcAuthUser');
		if ( user ) {
			jc.springLoad('module:edit');
			$(document.body).addClass('jcUserAuth');
			if ( $menu.hasClass('jcMenuText') ) {
				$menu.append(`<span class="jcicon">${ AS.icon('user') }</span>`);
			} else {
				$menu.append(`<div class="jcicon jcAuth">${ AS.icon('menu') }</div>`);
			}
			$menu.on('click contextmenu',jc.actionsMenu);
			$(document.body).on('contextmenu',jc.actionsMenu);
		} else {
			$(document.body).removeClass('jcUserAuth');
			if ( $menu.hasClass('jcMenuText') ) {
				$menu.append(`<span class="jcicon jcUnauth">${ AS.icon('lock') }</span>`);
			} else {
				$menu.append(`<span class="jcicon jcUnauth">${ AS.icon('lock') }</span>`);
			}
			$menu.off('click contextmenu',jc.actionsMenu);
			$(document.body).off('contextmenu',jc.actionsMenu);
			$('.jcUnauth',$menu).on('click',jc.page.login);
		}
	},
	login : () => {
		let sp = (new Date()).getTime();
		jc.login( (d,err) => {
			if ( err ) return;
			$('.jcMenu').removeClass('jcMenuParsed');
			jc.page.checkJcMenu();
			let ep = (new Date()).getTime();
			jc.springLoad('module:edit');
			if ( (ep - sp) > 2000 ) {
				Swal.fire({ title: AS.label('LoginDoneTitle'), text: AS.label('LoginDoneBody',{user:jc.prop.authUser}), icon: "success" });
			}
		});
	},
	edit : ( status, savePolicy ) => {
		if ( ! jc.edit ) {
			jc.springLoad('module:edit');
			return window.setTimeout( ()=>{ jc.page.edit(status,savePolicy) }, 300 );
		}
		if ( status == 'maintenance' ) {
			jc.edit.maintenance();
			return;
		} else if ( status == 'page' ) {
			jc.page.prop.editMode = status;
			let oe = jc.edit.data()||false;
			if ( oe ) {
				Swal.fire({
					title: AS.label('editYetItTitle'),
					text: AS.label('editYetItBody'),
					icon: "warning",
					showDenyButton: true,
					showCancelButton: true,
					cancelButtonText: AS.label('Cancel'),
					confirmButtonText: AS.label('editYetItOk'),
					denyButtonText: AS.label('editYetItCancel'),
				}).then( result => {
					if (result.isConfirmed) {
						jc.edit.data(oe);
						jc.page.reload();
					} else if (result.isDenied) {
						jc.edit.data( jc.page.data().pageContent );
						jc.page.reload();
					} else {
						jc.page.prop.editMode = false;
					}
				});
				return;
			}
			jc.edit.data( jc.page.data().pageContent );
			jc.page.reload();
			return;
		} else if ( status == 'parts' ) {
			jc.page.prop.editMode = status;
			jc.page.reload();
			return;
		} else if ( AS.test.udef(savePolicy)) {
			Swal.fire({
				title: AS.label('SaveChangesTitle'),
				text: AS.label('SaveChangesBody'),
				icon: "question",
				showCancelButton: true,
				showDenyButton: true,
				denyButtonText : AS.label('menuEditOverDiscard'),
				confirmButtonText : AS.label('menuEditOverSave'),
				cancelButtonText : AS.label('Cancel'),
				hideClass: { popup: '' },
			}).then( result => {
				if (result.isConfirmed) {
					jc.page.edit(status,true)
				} else if (result.isDenied) {
					jc.page.edit(status,false)
				}
			});
			return;
		}
		if (jc.page.prop.editMode == 'page') {
			let oe = (jc.edit && jc.edit.data())||false;
			if (oe && savePolicy) {
				jc.page.save( { data: oe, callback: ()=>{ jc.page.edit(status,false)} });
				return;
			}
			jc.edit.data(false);
		}
		jc.page.prop.editMode = status;
		jc.page.reload();
	},
};

jc.render = {
	prop : {},
	init : ( ...args ) => {
		delete jc.render.prop.pending;
		$(document.body).trigger('jc_render_start');
		jc.console('Rendering is starting');
		jc.render.main.apply( window, args );
	},
	queue : ( delta ) => {
		if ( AS.test.num(delta) ) {
			if (AS.test.udef(jc.render.prop.pending)) jc.render.prop.pending = 0;
			jc.render.prop.pending += delta;
			if ( jc.render.prop.pending == 0 ) {
				if ( jc.render.prop.overtimeout ) window.clearTimeout( jc.render.prop.overtimeout );
				jc.render.prop.overtimeout = setTimeout( ()=>{
					delete jc.render.prop.overtimeout;
					delete jc.render.prop.pending;
					$(document.body).trigger('jc_render_end');
					jc.console('Rendering is over');
				},100);
			}
		}
		return jc.render.prop.pending;
	},
	main : (data,pdata) => {
		if ( ! Array.isArray(data) ) data = [data];
		let pfull = jc.page.data();
		if ( AS.test.udef(pdata)) pdata = AS.test.obj(pfull) ? pfull.pageContent : {};
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
			}
			if ( e.part ) {
				e.content = { type: 'part', content: e.part };
				delete e.part;
			}
			if ( AS.test.def(e.content) && ( ! e.content) ) {
				$tgt.html('');
				e.hidden = true;
				return;
			}
			if ( AS.test.udef(e.editable)) e.editable = true;
			if ( e.content ) {
				if ( ! Array.isArray(e.content) ) e.content = [e.content];
				e.content.forEach( c => {
					jc.render.prepare( c, pdata );
					if ( AS.test.str(c) ) c = { rendered: AS.labels.labelize(c) };
					if ( AS.test.obj(c) ) {
						if ( ! c.id ) {
							c.id = AS.generateId('jc-block-');
							$tgt.append('<hr style="display:none;" id="'+c.id+'" />');
							$('#'+c.id,$tgt).data(c);
							jc.render.queue(1);
						}
						if ( AS.test.udef(c.editable) ) c.editable = e.editable;
						if ( c.rendered ) {
							if ( jc.page.prop.editMode ) jc.render.editable(c);
							$('#'+c.id,$tgt).after( '<!--type:'+c.type+((c.type=='part')?'='+c.content:'')+'-->', c.rendered, '<!--/type:'+c.type+'-->' ).remove();
							delete c.rendered;
							delete c.internalRecursion;
							delete c.id;
							if ( AS.test.func(c.callback)) c.callback.call(window,c);
							delete c.callback;
							jc.render.queue(-1);
						} else if ( c.type ){
							c.internalRecursion = true;
							c.selector = sel;
							if ( jc.render[c.type] ) jc.render[c.type].call( window, c, pdata, pfull );
						}
					}
				} );
			}
			$( ()=>{
				jc.page.checkJcMenu($tgt);
				$tgt.toggle(!e.hidden);
				if ( jc.page.prop.editMode && jc.edit ) jc.edit.start();
				document.body.style.overflow= 'auto';
			});
		} );
	},
	prepare : ( c, pdata, $scope ) => {
		if ( AS.test.str(c) || AS.test.func(c) ) {
			let ev = jc.evalFunc(c);
			c = ev ? { type:'func', func: ev } : { rendered: c };
		}
		if ( AS.test.obj(c) ) {
			if ( ! c.type ) {
				if ( c.blocks ) c.type = 'blocks';
				else if ( c.render ) c.type = 'customJs';
			}
			if ( c.func && (! c.rendered) ) c.rendered =  c.func.call(window,pdata);
		}
	},
	editable : ( c ) => {
		if ( jc.page.prop.editMode && c.rendered && c.editable && AS.test.obj(c.editable) ) {
			let w = true;
			if ( (c.rendered instanceof jQuery)||(c.rendered instanceof NodeList)||(c.rendered instanceof Node) ) w = ! $('.jcEditable',c.rendered).length;
			else if ( AS.test.str(c.rendered) ) w = ( c.rendered.indexOf('<div class="jcEditable">') < 0 );
			if ( w ) {
				c.rendered = $('<div class="jcEditable"></div>').data('editable',c.editable).append( c.rendered );
			}
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
						jc.console('Error evaluating external JS render',url,o,e);
					}
					if ( AS.test.func(t) ) {
						jc.page.prop.renderers[o.render] = t;
						jc.render.customJs( o );
					} else {
						jc.console('External JS render not a function',url,o,t);
					}
				},
			});
			return;
		}
		o.func = jc.page.prop.renderers[o.render];
		jc.render.main(o);
	},
	part : ( o,pdata,pfull,other ) => {
		if ( AS.test.udef(other) ) {
			jc.render.queue(1);
			other = {};
		}
		if ( ! other.content ) {
			jc.template.part.get( o.content, (partcontent) => {
				other.content = o.rendered = partcontent;
				if ( AS.test.str(o.rendered) && AS && AS.labels ) o.rendered = AS.labels.labelize( o.rendered );
				jc.render.part( o,pdata,pfull,other );
			});
			return;
		}
		if ( (jc.page.prop.editMode == 'parts') ) {
			if ( ! other.raw ) {
				jc.template.part.get( o.content, {raw:true},(raw) => {
					other.raw = raw;
					jc.render.part( o,pdata,pfull,other );
				});
				return;
			}
			if ( o.editable ) o.editable = { type: 'part', src: o.content, raw: other.raw };
		} else {
			if (o.editable) o.editable = true;
		}
		jc.render.main(o);
		jc.render.queue(-1);
	},
	blocks : (o,pdata,pfull) => {
		if ( ! Array.isArray(o.blocks)) o.blocks = [o.blocks];
		let canedit = o.editable;
		o.rendered = o.blocks.map( (b,idx) => {
			if (AS.test.udef(b.editable)) b.editable = canedit;
			let blockEditable = canedit && !( AS.test.def(b.editable) && (!b.editable));
			let out = jc.render.block[b.type] ? jc.render.block[b.type].call(window,b,pdata,o) : '';
			if ( canedit && blockEditable && (jc.page.prop.editMode=='page') ) {
				let w = true;
				if ( (out instanceof jQuery)||(out instanceof NodeList)||(out instanceof Node) ) w = ! $('.jcEditable',out).length;
				else if ( AS.test.str(out) ) w = ( out.indexOf('<div class="jcEditable">') < 0 );
				if ( w ) {
					let editable = { prop: b.prop, type: 'block', subtype: b.type };
					if ( AS.test.udef(out) || (AS.test.str(out) && (out.length==0)) ) out = '<span class="jcPlaceHolder">'+b.prop+'</span>';
					out = $('<div class="jcEditable"></div>').data('editable',editable).append( out );
				} else {
					out = $('<div class="jcEditableBlock"></div>').append( out );
				}
			}
			return out;
		});
		jc.render.main(o,pdata);
	},
	block : {
		text : (b,d)=>{
			let ct;
			if ( AS.test.def(d[b.prop]) && AS.test.str(d[b.prop]) && d[b.prop].length ) ct = d[b.prop];
			else if ( b.content && AS.test.str(b.content) && b.content.length ) ct = b.content;
			if ( ! ct ) return undefined;
			return $(b.wrap||d.wrap||'<div></div>').append( ct );
		},
		html : (b,d)=> {
			if ( AS.test.udef(d[b.prop]) || ( AS.test.str(d[b.prop]) && (d[b.prop].length==0)) ) return undefined;
			return '<div class="jcHtml">'+d[b.prop]+'</div>';
		},
		date : (b,d) => {
			if ( AS.test.udef(d[b.prop]) || ( AS.test.str(d[b.prop]) && (d[b.prop].length==0)) ) return undefined;
			let $out = $(b.wrap||'<div></div>');
			$out.addClass('jcDate');
			$out.append('<span class="date">'+jc.sql2date(d[b.prop]).toblogdate()+'</span>');
			if ( (b.prop == 'blogdate') && d.metadata && d.metadata.type ) {
				jc.render.queue(1);
				jc.lists.list.get(d.metadata.type,( ld )=>{
					let sl = [];
					Object.keys(ld).forEach( k => { sl.push(ld[k])} );
					sl.sort( (a,b) => (a.date < b.date ? 1 : -1 ) );
					let prev,next,max=(sl.length -1);
					for ( let i = 0; i <= max; i++ ) {
						if ( sl[i].id == d.metadata.id ) {
							if ( i > 0 ) prev = sl[ i -1];
							if ( i < max ) next = sl[i+1];
							break;
						}
					}
					prev = prev ? `onclick="jc.page.open('${d.metadata.type}',${prev.id})" title="${ jc.sql2date(prev.date).toblogdate() }"` : 'disabled="disabled"';
					next = next ? `onclick="jc.page.open('${d.metadata.type}',${next.id})" title="${ jc.sql2date(next.date).toblogdate() }"` : 'disabled="disabled"';
					let idxpage = $(`<button type="button" class="btn btn-secondary btn-sm">${AS.icon('list')}</button>`);
					$out.append( $('<span class="btn-group ml-2 mb-1"></span>')
						.append(`<button type="button" class="btn btn-secondary btn-sm" ${prev}>${AS.icon('arrow-up')}</button>`)
						.append(idxpage)
						.append(`<button type="button" class="btn btn-secondary btn-sm" ${next}>${AS.icon('arrow-down')}</button>`)
					);
					let finalize = ()=>{
						$(document.body).off('jc_render_end',finalize);
						let pd = $('.jcNavbar .nav-item.active').data();
						if ( pd && pd.page ) $(idxpage).on('click',()=>{ jc.page.open(pd.page,pd.id) });
						else $(idxpage).on('click',()=>{ jc.page.open('browsedates') });
					}
					$(document.body).on('jc_render_end',finalize);
					jc.render.queue(-1);
				});
			}
			return $out;
		},
		mixed : (b,d) => {
			if ( ! d[b.prop] ) return '';
			let out = $(b.wrap || '<div class="jcMixedBlocks"></div>');
			if ( ! Array.isArray(d[b.prop]) ) d[b.prop] = [d[b.prop]];
			let qt = d[b.prop].length;
			d[b.prop].forEach( (sb,idx) => {
				if ( AS.test.str( sb ) ) sb = { content:sb };
				if ( ! AS.test.obj( sb )) return;
				if ( ! sb.type ) sb.type='text';
				if (jc.render.block[sb.type]) {
					let r = jc.render.block[sb.type].call(window,{prop:sb.type, editable:b.editable},sb,d) || '';
					if ( b.editable && (jc.page.prop.editMode=='page') ) {
						let editable = { prop: b.prop, type: 'block', subtype: sb.type, _ : { idx: idx, qt: qt } };
						if ( AS.test.udef(r) || (AS.test.str(r) && (r.length==0)) ) {
							let lab = 'Block: '+sb.type+' '+(sb.label||sb.name||'');
							if ( sb.type == 'tags' ) lab = 'Tags: '+(AS.def.obj(jc.prop.site.tags.find(x=>(x.name==sb.name))).label||'Unknown');
							r = '<span class="jcPlaceHolder">'+lab+'</span>';
						}
						r = $('<div class="jcEditable"></div>').data('editable',editable).append( r );
					}
					out.append( r );
				}
			} );
			return out;
		},
		part : (b,d) => {
			let id = AS.generateId('blockPart');
			let div = $('<div></div>');
			div.attr('id',id);
			let nb = {
				selector: '#'+id,
				type: 'part',
				content: b.content||d[b.prop],
				internalRecursion : true,
				callback : ()=>{ div.removeAttr('id'); }
			};
			window.setTimeout(()=>{jc.render.main(nb,d)},10);
			return div;
		},
		gallery : (b,d,pdata) => {
			if ( ! (AS.test.arr(d[b.prop]) && d[b.prop].length ) ) return '';
			let gid = AS.generateId('jcGallery');
			let $div = $('<div></div>');
			if ( d.size && d.size.length ) $div.addClass( 'size'+d.size);
			if ( d.aspect == 'C' ) {
				$div.addClass('jcCarousel carousel slide');
				$div.attr({'id':gid,'data-interval':20000});
				let imgs = [];
				d[b.prop].forEach( uu => {
					let u = pdata.uploads.find( x => ( x.uri == uu.uri ));
					if ( u && u.img) imgs.push(u);
				});
				if ( d.flags && d.flags.includes('i') ) {
					let $ol = $('<ol class="carousel-indicators"></ol>');
					imgs.forEach( (i,idx) => { $ol.append(`<li data-target="#${gid}" data-slide-to="${idx}" class="${idx?'':'active'}"></li>`) } );
					$div.append($ol);
				}
				let $in = $('<div class="carousel-inner"></div>');
				imgs.forEach( (i,idx) => {
					let $it = $('<div class="carousel-item"></div>');
					if ( ! idx ) $it.addClass('active');
					$it.append(` <img src="${i.uri}" alt="${ i.caption }" oncontextmenu="event.stopPropagation();" />`);
					if ( d.flags && d.flags.includes('c') ) $it.append( $('<div class="carousel-caption d-none d-md-block"></div>').append('<h5></h5>').html( i.caption ) );
					$in.append($it);
				} );
				$div.append($in);
				if ( d.flags && d.flags.includes('x') ) $div.append(
					$(`<a class="carousel-control-prev" href="#${gid}" role="button" data-slide="prev"></a>`).append('<span class="carousel-control-prev-icon" aria-hidden="true"></span>','<span class="sr-only">Previous</span>'),
					$(`<a class="carousel-control-next" href="#${gid}" role="button" data-slide="next"></a>`).append('<span class="carousel-control-next-icon" aria-hidden="true"></span>','<span class="sr-only">Next</span>')
				);
			} else {
				$div.addClass('jcGallery');
				if ( d.aspect == 'I' ) {
					$div.addClass('inline');
					if( d[b.prop].length == 1 ) $div.addClass('jcBoxRight');
				}
				d[b.prop].forEach( uu => {
					let u = pdata.uploads.find( x => ( x.uri == uu.uri ));
					if ( ! u ) return;
					let $a = $(`<a href="${u.uri}"></a>`);
					if ( u.fb ) {
						$a.attr('data-fancybox',gid);
						$a.attr('data-caption',u.caption);
					}
					$a.attr('title',u.caption);
					if ( u.img ) {
						$a.append(`<img src="${ u.uri }" alt="${ u.caption }" />`);
					}  else {
						if (u.fb) {
							if ( u.au || u.vid ) {
								$a.append( AS.icon(u.au ? 'audio' : 'video') );
								$a.attr('data-type','iframe');
								$a.attr('data-src', u.uri );
								$a.attr('data-download', u.name );
								$a.attr('href', 'javascript:;');
							} else {
								$a.append( AS.icon('file') );
							}
						} else {
							$a.attr('download',u.name);
							$a.append( AS.icon('downloadPublic') );
						}
						if (u.ext && u.ext.length) {
							$a.attr('title',u.caption+' ('+u.ext.toUpperCase()+')');
							$a.append('<span>.'+u.ext.shorten(5)+'</span>');
						}
					}
					$div.append($a);
				} );
			}
			return $div;
		},
		lasts : (b,d) => {
			let id = AS.generateId('lasts');
			let nodes = (d.view||'ol,li').split(',');
			let div = $('<div class="jcLasts jcEntriesArea"></div>');
			div.attr('id',id);
			let qt = jc.prop.lastChangedQuantities.clone().sort((a,b)=>(a-b)).find( x=>(d.max <= x ));
			jc.lists.last.get(d.ptype,qt,(list)=>{
				if ( ! (AS.test.arr(list) && list.length ) ) return;
				if ( d.title ) div.append( $('<h5></h5>').append(d.title) );
				let $ol = $('<'+nodes[0]+' class="jcLastsEntries jcEntries"></'+nodes[0]+'>');
				list.splice( d.max );
				let cp = jc.page.current();
				let cid = jc.page.data().id;
				list.forEach( i => {
					let p = i.type||d.ptype;
					let $li = $('<'+nodes[1]+' class="jcLastsEntry jcEntry"></'+nodes[1]+'>');
					let $a;
					if ( (cp==p ) && (i.id == cid ) ) {
						$li.append('➤ ');
						$a = $(`<span class="title"></span>`).html(i.title);
					} else {
						$a = $(`<a class="title" href="${ jc.URI.encode({page:p,id:i.id},i.url) }"></a>`).on('click',(e)=>{
							e.preventDefault();
							jc.page.open(p,i.id);
						}).html(i.title);
					}
					$li.append( $a );
					if ( d.showdate ) {
						let dt = new Date(i.upd);
						$li.append(' ',$('<span class="date"></span>').html( dt.toLocaleDateString() ));
						if ( d.showtime ) $li.append( $('<span class="time"></span>').html( dt.toLocaleTimeString() ) );
					}
					if ( d.showdesc && i.description && i.description.length) $li.append('<br />', $('<small class="desc"></small>').html(i.description));
					$ol.append($li);
				});
				div.append($ol);
			});
			return div;
		},
		relateds : (b,d) => {
			let id = AS.generateId('relateds');
			let nodes = (d.view||'ol,li').split(',');
			let $div = $('<div class="jcRelateds jcEntriesArea"></div>');
			$div.attr('id',id);
			if ( d.position ) $div.addClass( d.position );
			if ( d.title ) $div.append( $('<h5></h5>').append(d.title) );
			jc.render.queue(1);
			jc.lists.list.get( data => {
				let $ol = $('<'+nodes[0]+' class="jcRelatedEntries jcEntries"></'+nodes[0]+'>');
				d.relateds.forEach( i => {
					let rn = data[i.item.page] ? data[i.item.page][String(i.item.id||0)] : false;
					if ( ! rn ) return;
					let $li = $('<'+nodes[1]+' class="jcRelatedEntry jcEntry"></'+nodes[1]+'>');
					let $a = $(`<a class="title" href="${ jc.URI.encode(i.item,rn.url) }"></a>`).on('click',(e)=>{
						e.preventDefault();
						jc.page.open(i.item.page,i.item.id);
					}).html(rn.title);
					$li.append( $a );
					$ol.append($li);
				});
				$div.append($ol);
				jc.render.queue(-1);
			});
			return $div;
		},
		pbytag : (b,d) => {
			let id = AS.generateId('pbytag');
			let $div = $('<div class="jcPbytgag jcEntriesArea"></div>');
			$div.attr('id',id);
			let tobegrabbedtags = d.rules.map( x => x.tf );
			let tf = {};
			const process = () => {
				if ( tobegrabbedtags.length ) {
					let tfn = tobegrabbedtags.shift();
					jc.lists.tag.get( tfn, l => {
						tf[tfn] = l;
						process();
					})
					return;
				}
				let list = false;
				d.rules.forEach( r => {
					let rlists = r.tv.map( tag =>{ return tf[r.tf][tag.tv]});
					let rlist = false;
					rlists.forEach( (l) => {
						if ( ! rlist ) {
							rlist = l;
						} else if ( r.op == 'or' ) {
							l.forEach( (li) => {
								if ( ! rlist.find( x => ( (x.type==li.type)&&( x.id==li.id) )) ) rlist.push(li);
							} );
						} else {
							rlist = rlist.filter( x => l.find( li => ( (x.type==li.type)&&( x.id==li.id) )));
						}
					} );
					if ( ! list ) {
						list = rlist;
					} else if ( d.op == 'or') {
						rlist.forEach( (li) => {
							if ( ! list.find( x => ( (x.type==li.type)&&( x.id==li.id) )) ) list.push(li);
						} );
					} else {
						list = list.filter( x => rlist.find( li => ( (x.type==li.type)&&( x.id==li.id) )));
					}
				} );
				if ( list && list.length ) {
					let pd = jc.page.data();
					list = list.filter( x => ( ! ( (x.type==pd.type)&&(x.id==pd.id) )));
				};
				if ( list && list.length ) {
					if ( d.title ) $div.append( $('<h5></h5>').append(d.title) );
					if ( d.position ) $div.addClass( d.position );
					let nodes = (d.view||'ul,li').split(',');
					let $ol = $('<'+nodes[0]+' class="jcPbytgagEntries jcEntries"></'+nodes[0]+'>');
					list.forEach( i => {
						if ( ! ( i && i.type )) return;
						let $li = $('<'+nodes[1]+' class="jcPbytgagEntry jcEntry"></'+nodes[1]+'>');
						let $a = $(`<a class="title" href="${ jc.URI.encode(i,i.url) }"></a>`).on('click',(e)=>{
							e.preventDefault();
							jc.page.open(i.type,i.id);
						}).html(i.title);
						$li.append( $a );
						$ol.append($li);
					} );
					$div.append($ol);
				}
				jc.render.queue(-1);
			};
			jc.render.queue(1);
			setTimeout( process, 100);
			return $div;
		},
		subpage : (b,d) => {
			let id = AS.generateId('blockSubpage');
			let div = $('<div></div>');
			div.attr('id',id);
			let s = b.content||d[b.prop];
			jc.render.queue(1);
			jc.template.info.get( s.page, (tmpl)=>{
				if ( ! AS.test.arr(tmpl.content) ) tmpl.content = [tmpl.content];
				let blocks =[];
				tmpl.content.forEach( c =>{
					if ( ! c.content ) return false;
					if ( ! AS.test.arr(c.content) ) c.content = [c.content];
					c.content.forEach( cc => {
						if (! AS.test.arr(cc.blocks)) return;
						cc.blocks.filter((x)=>(!(x.type=='subpage'))).forEach( b => {
							let nb = JSON.parse(JSON.stringify(b));
							nb.editable = false;
							blocks.push(nb)
						});
					});
				});
				if ( ! (AS.test.arr(blocks) && blocks.length) ) return jc.render.queue(-1);
				jc.jdav.get(  AS.path('jsdatapages') + s.page + ( s.id||'') + '.json', (pdata)=>{
					if ( (! d.force) && pdata.metadata && pdata.metadata.hidden ) return jc.render.queue(-1);
					if ( AS.test.udef(pdata.blocks)) pdata.blocks = [];
					if ( ! AS.test.arr(pdata.blocks)) pdata.blocks = [pdata.blocks];
					if ( ! pdata.blocks.length ) return jc.render.queue(-1);
					let nb = {
						selector: '#'+id,
						content : {
							type : "blocks",
							blocks: blocks,
						},
						editable : false,
						callback : ()=>{ }
					};
					jc.render.main( nb, pdata );
					jc.render.queue(-1);
				});
			});
			return div;
		},
		audio : (b,d,pdata) => {
			if ( AS.test.udef(d[b.prop]) || ( ! AS.test.obj(d[b.prop]) ) || (! d[b.prop].uri ) ) return undefined;
			let adata = pdata.uploads.find( x => ( x.uri == d[b.prop].uri ));
			if ( ! adata ) return undefined;
			let $a = $(`<audio src="${ adata.uri }" type="${ adata.type }" download="${ adata.name }" controls="controls">This browser doesn’t support HTML5 audio</audio>`);
			let $d = $(`<div class="jcAudio"></div>`);
			$a.on('error',()=>{ $d.html('<div style="max-width:640px;" class="alert alert-warning" role="alert">'+AS.label('UnsupportedMedia',adata)+'</div>') });
			$d.append($a);
			return $d;
		},
		video : (b,d,pdata) => {
			if ( AS.test.udef(d[b.prop]) || ( ! AS.test.obj(d[b.prop]) ) || (! d[b.prop].uri ) ) return undefined;
			let vdata = pdata.uploads.find( x => ( x.uri == d[b.prop].uri ));
			if ( ! vdata ) return undefined;
			let $v = $(`<video src="${ vdata.uri }" type="${ vdata.type }" download="${ vdata.name }" controls="controls">This browser doesn’t support HTML5 video</video>`);
			let $d = $(`<div class="jcVideo"></div>`);
			$v.on('error',()=>{ $d.html('<div style="max-width:640px;" class="alert alert-warning" role="alert">'+AS.label('UnsupportedMedia',vdata)+'</div>') });
			$d.append($v);
			return $d;
		},
		youtube : (b,d) => {
			const makeUri = (url) => {
				let ID;
				if ( url.includes('vimeo') && url.match(/^.*\/([0-9]{8,}).*$/)) {
					ID = url.replace(/^.*\/([0-9]{8,}).*$/,"$1");
					return 'https://player.vimeo.com/video/' + ID;
				}
				url = url.replace(/(>|<)/gi,'').split(/(vi\/|v=|\/v\/|youtu\.be\/|\/embed\/)/);
				if(url[2] !== undefined) {
					ID = url[2].split(/[^0-9a-z_\-]/i);
					ID = ID[0];
				} else {
					ID = url;
				}
				return ID.includes('://') ? ID : `https://www.youtube.com/embed/${ID}?rel=0`;
			};
			let uri = makeUri(d[b.prop]);
			let $d = $('<div class="jcYoutube embed-responsive embed-responsive-16by9"></div>');
			$d.append(`<iframe class="embed-responsive-item" src="${uri}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`);
			return $d;
		},
		tags : (b,d) => {
			if ( !( d.show && AS.test.arr(d.tags) && d.tags.length )) return '';
			let id = AS.generateId('tags');
			let nodes = (d.view||'ul,li').split(',');
			let $div = $('<div class="jcTags jcEntriesArea"></div>');
			$div.attr('id',id);
			if ( d.position ) $div.addClass( d.position );
			jc.render.queue(1);
			const build = () => {
				if ( ! jc.prop.site ) return setTimeout( build, 100 );
				let tag = AS.def.arr(jc.prop.site.tags).find( x => ( AS.test.obj(x) && x.name && ( x.name == d.name )));
				const minimal = (nodes[0] == 'p');
				if (! tag) {
					$div.remove();
					jc.render.queue(-1);
					return;
				};
				let $ol = $('<'+nodes[0]+' class="jcTagEntries jcEntries"></'+nodes[0]+'>');
				if ( d.showtitle ) {
					if ( minimal ) {
						$ol.addClass('compact');
						$ol.append( $('<i></i>').append((d.customtitle||tag.label||tag.name)+': ') );
					} else {
						$div.append( $('<h5></h5>').append(d.customtitle||tag.label||tag.name) );
					}
				}
				const useProps = !! ((! minimal) && tag.props && tag.props.length);
				d.tags.forEach( t => {
					let $li = $('<'+nodes[1]+' class="jcTagEntry jcEntry"></'+nodes[1]+'>');
					let $s = $(`<span class="title">${ t.tag.escape() }</span>`);
					$s.on('click',()=>{jc.page.open('browsetags',undefined,{f:d.name,t:t.tag});});
					$li.append($s);
					if ( useProps ) {
						let props = [];
						tag.props.forEach( p => {
							if ( ! t[p.name] ) return;
							props.push( ((d.verbose && p.label ) ? p.label+': ' : '') + t[p.name] );
						});
						if ( props.length ) $li.append((d.verbose ? '<br />' : ' '),props.join((d.verbose ? '<br />' : ', ')));
					}
					$ol.append($li);
				} );
				$div.append($ol);
				jc.render.queue(-1);
			};
			$( ()=>{ build() } );
			return $div;
		},
	},
};

jc.actionsMenu = (e) => {
	let acts = [];
	if ( jc.page.prop.editMode == 'page' ) {
		acts.push(
			AS.label('ThisPage')+':',
			{icon:'jcicon',iconKey:'metadata',label:AS.label('Metadata'),action:()=>{jc.edit.meta.edit();} },
			{icon:'jcicon',iconKey:'pageEditOff',label:AS.label('menuEditOver')+':',action:()=>{jc.page.edit(false);},content:[
				{icon:'jcicon',iconKey:'done',label:AS.label('menuEditOverSave'),action:()=>{jc.page.edit(false,true);} },
				{icon:'jcicon',iconKey:'editRemove',label:AS.label('menuEditOverDiscard'),action:()=>{jc.page.edit(false,false);} }
			]}
		);
	} else if ( jc.page.prop.editMode == 'parts' ) {
		acts.push(
			AS.label('IncludedParts')+':',
			{icon:'jcicon',iconKey:'done',label:AS.label('menuEditOver'),action:()=>{jc.page.edit(false,false);} }
		);
	} else {
		let tp = {label:AS.label('ThisPage')+':',content:[]};
		let ws = {label:AS.label('WholeSite')+':',content:[]};
		tp.content.push(
			{icon:'jcicon',iconKey:'pageEdit',label:AS.label('menuEditStart'),action:()=>{jc.page.edit('page');} },
			{icon:'jcicon',iconKey:'uploads',label:AS.label('Attachments'),action:()=>{jc.edit.uploads.edit();} }
		);
		if ( AS.test.def(jc.page.data().id)) {
			tp.content.push('-',{icon:'jcicon danger',iconKey:'pageRm',label:AS.label('DeleteThisPage')+'…',action:()=>{jc.page.rm();} });
		}
		ws.content.push(
			{icon:'jcicon',iconKey:'pageAdd',label:AS.label('NewPage')+'…',action:()=>{jc.page.create();} },
			{icon:'jcicon',iconKey:'pageParts',label:AS.label('IncludedParts'),action:()=>{jc.page.edit('parts');} },
			'-',
			{icon:'jcicon',iconKey:'maintenance',label:AS.label('Maintenance'),action:()=>{jc.page.edit('maintenance');} },
		);
		acts.push(AS.label('menuActionsTitle'),tp,'-',ws);
	}
	jc.menu(e, { content: acts, highlight: false });
};
