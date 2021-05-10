/* jc.prop integrate defaults */
jc.prop.lastHiEntry = '';
jc.prop.absUriMatcher = ( new RegExp("^([^a-z]+:/)?/","i") );
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
	let bp = AS.path('jsroot');
	if ( AS.test.udef(bp) ) {
		bp = '/jscms/';
		AS.path({jsroot:bp});
	}
	if ( AS.test.udef(AS.path('jstemplates'))) AS.path({jstemplates:bp+'templates/'});
	if ( AS.test.udef(AS.path('jsrenderers'))) AS.path({jsrenderers:AS.path('jstemplates')+'renderers/'});
	if ( AS.test.udef(AS.path('jsextensions'))) AS.path({jsextensions:AS.path('jstemplates')+'extensions/'});
	if ( AS.test.udef(AS.path('jsdataroot'))) AS.path({jsdataroot:bp+'data/'});
	if ( AS.test.udef(AS.path('jsauth'))) AS.path({jsauth:bp+'login/'});
	if ( AS.test.udef(AS.path('jsreporoot'))) AS.path({jsreporoot:bp+'repository/'});
})()

jc.prop.loadModules = {
	'basic' : [
		AS.path('jsroot') + 'css/jc.css',
		{ type:'js', src:'https://cdn.jsdelivr.net/npm/sweetalert2@10'},
		{ type:'js', src:'https:////cdn.jsdelivr.net/npm/promise-polyfill@8/dist/polyfill.js'},
		'https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/css/select2.min.css',
		'https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js',
		'wait:()=>( window.Swal && jQuery.fn.select2 )',
	],
	'edit' : [
		AS.path('jsroot') + '/js/jc-edit.js',
		'https://cdn.altersoftware.org/js-as-form/as-form.js',
		'wait:()=>( jc.edit && AS.form )',
		'https://cdn.altersoftware.org/js-as-form/plugin/as-form-basic.js',
		'https://cdn.altersoftware.org/js-as-form/plugin/as-form-pikaday.js',
		'https://cdn.altersoftware.org/js-as-form/plugin/as-form-tinymce.js',
		'https://cdn.altersoftware.org/js-as-form/plugin/as-form-iro.js',
		'https://cdn.altersoftware.org/js-as-form/plugin/as-form-slider.js',
	],
	'datatables': [
		'https://cdn.jsdelivr.net/gh/fancyapps/fancybox@3.5.7/dist/jquery.fancybox.min.css',
		'https://cdn.jsdelivr.net/gh/fancyapps/fancybox@3.5.7/dist/jquery.fancybox.min.js',
		'https://cdn.datatables.net/v/dt/dt-1.10.24/date-1.0.3/sp-1.2.2/datatables.min.css',
		'https://cdn.datatables.net/v/dt/dt-1.10.24/date-1.0.3/sp-1.2.2/datatables.min.js',
		'wait:()=>((!! $.fn.dataTable) && (!! $.fn.fancybox) )',
	],
	'swal' : [
		{ type:'js', src:'https://cdn.jsdelivr.net/npm/sweetalert2@10'},
		{ type:'js', src:'https:////cdn.jsdelivr.net/npm/promise-polyfill@8/dist/polyfill.js'},
		'wait:window.Swal',
	],
	'webcam' : [
		'https://cdn.jsdelivr.net/gh/fancyapps/fancybox@3.5.7/dist/jquery.fancybox.min.css',
		'https://cdn.jsdelivr.net/gh/fancyapps/fancybox@3.5.7/dist/jquery.fancybox.min.js',
		(AS.path('jsroot') + 'js/webcam_modal.js'),
		'wait:()=>((!! window.wcm) && (!! $.fn.fancybox) )',
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
			if ( /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream ) {
				$(document.body).addClass('iOS');
			}
			/* 1st page */
			let sp = jc.URI.decode();
			if ( AS.test.str(sp.page) ) jc.page.open(sp.page,sp.id,sp.data);
			else jc.page.open('index');
			jc.autoAdjustFields();
		} else {
			window.setTimeout( foo, 100 );
		}
	};
	foo();
} );

var tp = {};

/* Global changes */

window.onpopstate = () => {
	if ( jc.page.prop.editMode ) return;
	let sp = jc.URI.decode();
	if ( AS.test.str(sp.page) ) {
		jc.prop.lastHiEntry = jc.URI.encode( sp );
		jc.page.open(sp.page,sp.id,sp.data);
	}
};

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
		mod = $('<div id="jcProgressIndicator" class="modal" tabindex="-1"><div class="modal-dialog"><div class="modal-content"><div class="modal-body"></div></div></div></div>');
		$(document.body).append( mod );
		mod = $('#jcProgressIndicator',document.body);
	}
	if ( AS.test.str(msg) ) {
		$('.modal-body',mod).html(msg);
		mod.modal('handleUpdate');
		if ( first || (! mod.hasClass('in')) ) mod.modal({backdrop:'static',keyboard:false,show:true});
	} else {
		mod.removeClass("in");
		$(".modal-backdrop").remove();
		mod.hide();
		mod.remove();
	}
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
	put : ( url, data, success, fail ) => {
		fail = jc.evalFunc(fail)||jc.evalFunc(success)||jc.getError;
		success = jc.evalFunc(success)||(()=>{});
		if ( ! url.match(jc.prop.absUriMatcher) ) url = AS.path('jsdataroot') + url;
		if ( ! AS.test.str(data) ) data = String(data);
		jc.console('jc.dav.put',url,data);
		$.ajax( url, {
			method: 'PUT',
			dataType: 'text',
			contentType: 'text/plain; charset=UTF-8',
			data: data,
			error: (...errs) => { fail.call(window,false,errs); },
			success : () => { success.call(window,true); }
		});
	},
	mkdir : ( url, success, fail ) => {
		fail = jc.evalFunc(fail)||jc.evalFunc(success)||jc.getError;
		success = jc.evalFunc(success)||(()=>{});
		if ( ! url.match(jc.prop.absUriMatcher) ) url = AS.path('jsdataroot') + url;
		jc.console('jc.dav.mkdir',url);
		$.ajax( url, {
			method: 'MKCOL',
			cache: false,
			dataType: 'text',
			error: (...errs) => { fail.call(window,false,errs); },
			success : () => { success.call(window,true); }
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
	rm : ( url, success, fail ) => {
		fail = jc.evalFunc(fail)||jc.evalFunc(success)||jc.getError;
		success = jc.evalFunc(success)||(()=>{});
		if ( ! url.match(jc.prop.absUriMatcher) ) url = AS.path('jsdataroot') + url;
		jc.console('jc.dav.rm',url);
		$.ajax( url, {
			method: 'DELETE',
			cache: false,
			contentType: 'text/xml; charset=UTF-8',
			dataType: 'text',
			error: (...errs) => { fail.call(window,false,errs); },
			success : (xt) => { success.call(window,xt); }
		});
	},
	ls : ( ...args ) => {
		let success,fail,options={};
		args.forEach( (a) => {
			if ( AS.test.obj(a)) {
				if ( a.dir ) options.dir = a.dir;
				if ( a.ext ) options.ext = a.ext;
				if ( a.match ) options.match = a.match;
				return;
			}
			let f = jc.evalFunc(a);
			if ( AS.test.func(f) ) {
				if ( success ) fail = f;
				else success = f;
			}
			if ( AS.test.str(a) ) {
				options.dir = a;
			}
		} );
		fail = fail||success||jc.getError;
		success = success||(()=>{});
		let url = AS.path('jsauth') + 'auth/lsdata';
		jc.console('jc.dav.ls',url);
		$.ajax( url, {
			method: 'GET',
			cache: false,
			dataType: 'json',
			data : options,
			error: (...errs) => { fail.call(window,false,errs); },
			success : (data) => {
				Object.keys( options ).forEach( k => {
					if ( options[k] ) data[k] = options[k];
				} );
				success.call(window,data);
			}
		});
	},
};

jc.jdav = {};
Object.keys( jc.dav ).forEach( (k) => { jc.jdav[k] = jc.dav[k]; } );

jc.jdav.get = ( url, success, fail ) => {
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
};
jc.jdav.put = ( url, data, success, fail ) => {
	fail = jc.evalFunc(fail)||jc.evalFunc(success)||jc.getError;
	success = jc.evalFunc(success)||(()=>{});
	if ( ! url.match(jc.prop.absUriMatcher) ) url = AS.path('jsdataroot') + url;
	jc.console('jc.jdav.put',url,data);
	$.ajax( url, {
		method: 'PUT',
		dataType: 'json',
		contentType: 'application/json; charset=UTF-8',
		data: AS.test.obj(data) ? JSON.stringify(data) : data,
		error: (...errs) => { fail.call(window,false,errs); },
		success : () => { success.call(window,true); }
	});
};

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
			parsitems = parsitems.replace(/\/.*$/,'');
		}
		if (l.indexOf(jc.prop.uriPrefixOfbs)>=0) parsitems = window.atob(parsitems);
		parsitems = parsitems.split(',');
		let pars={ page: decodeURIComponent(parsitems.shift()) };
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
	encode : (o,title)=>{
		if ( ! AS.test.str(o.page) ) return '/';
		let uri = '';
		if ( AS.test.obj(o.data) ) {
			uri += encodeURIComponent(o.page);
			if ( o.id ) {
				uri += o.id;
			} else if ( o.data && o.data.id ) {
				uri += o.data.id;
			} else {
				let parts = [];
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
		let up = jc.URI.encode( uriparams, title );
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
		part : {}
	},
	info : {
		get: ( template, callback ) => {
			let v = jc.template.prop.info[template];
			if ( ! v ) {
				let url = AS.path('jstemplates') + 'info/'+ template + '.js';
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
		get : ( key, callback ) => {
			let v = jc.template.prop.part[key];
			if ( ! v ) {
				let ext='.js',dataType='json';
				if ( key.match(/\.x?html?$/) ) {
					ext = '';
					dataType='html';
				}
				jc.template.part.set(key,'_loading_');
				jc.dav.get( 'parts/'+ key + ext, j =>{
					jc.template.part.set(key,j);
					jc.template.part.get(key,callback);
				},jc.getError);
				return;
			} else if ( v == '_loading_' ) {
				setTimeout( ()=>{ jc.template.part.get(key,callback) }, 100 );
			} else if ( AS.test.func(callback) ) {
				callback.call( window, v );
			} else {
				return v;
			}
		},
		set : ( key, value ) => { jc.template.prop.part[key] = value },
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
		let initialargs = JSON.parse(JSON.stringify([page,data]));
		if ( ! page ) page = 'index';
		if ( page == jc.page.current() ) {
			if ( id ) {
				if ( jc.page.data() && ( id == jc.page.data().id )) return;
			} else {
				return;
			}
		}
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
		jc.page.step.info( page, id, data, infokey );
	},
	loadData : ( page, id, callback ) => {
		if ( jc.page.prop.editMode && jc.edit && jc.edit.data() ) {
			if ( AS.test.func(callback) ) callback.call( window, jc.edit.data() );
			return;
		}
		let url = AS.path('jsdataroot') + page + ( id ? id : '') + '.json';
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
	reload : () => { jc.page.step.data( jc.page.current(), jc.page.data().id ); },
	step : {
		info : ( page, id, data, infokey ) => {
			jc.template.info.get( infokey, ( tdata )=>{
				if ( ! data ) data = {};
				if ( ! data.template ) data.template = tdata;
				jc.page.step.html( page, id, data );
			});
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
				jc.page.step.data( page, id );
			});
		},
		data : ( page, id ) => {
			jc.page.loadData( page, id, j => {
				window.tp = {};
				let data = jc.page.data();
				jc.page.addData( { pageContent: j } );
				jc.URI.push();
				if ( j.metadata ) {
					const h = document.documentElement.querySelector('head');
					const md = j.metadata;
					if ( md.title ) $('title',h).html(md.title);
					if ( md.keywords ) $('meta[name="keywords"]',h).attr('content',md.keywords);
					if ( md.description ) $('meta[name="description"]',h).attr('content',md.description);
				}
				if ( data.template.content ) jc.page.render.main(data.template.content);
			});
		},
	},
	render : {
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
						jc.page.render.prepare( c, pdata );
						if ( AS.test.obj(c) ) {
							if ( ! c.id ) {
								c.id = AS.generateId('jc-block-');
								$tgt.append('<hr style="display:none;" id="'+c.id+'" />');
								$('#'+c.id,$tgt).data(c);
							}
							if ( c.rendered ) {
								if ( jc.page.prop.editMode ) jc.page.render.editable(c);
								$('#'+c.id,$tgt).after( c.rendered ).remove();
								delete c.rendered;
								delete c.internalRecursion;
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
				if ( w ) c.rendered = $('<div class="jcEditable"></div>').data('editable',c.editable).append( c.rendered );
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
							jc.page.render.customJs( o );
						} else {
							jc.console('External JS render not a function',url,o,t);
						}
					},
				});
				return;
			}
			o.func = jc.page.prop.renderers[o.render];
			jc.page.render.main(o);
		},
		part : ( o ) => {
			if ( $(o.selector).data('jc_part_label') != o.content ) {
				jc.template.part.get( o.content, (partcontent) => {
					$(o.selector).data('jc_part_label',o.content);
					o.rendered = partcontent;
					if ( AS && AS.labels ) o.rendered = AS.labels.labelize( o.rendered );
					jc.page.render.main(o);
				});
			}
		},
		blocks : (o,pdata,pfull) => {
			if ( ! Array.isArray(o.blocks)) o.blocks = [o.blocks];
			let canedit = o.editable;
			o.rendered = o.blocks.map( (b,idx) => {
				let out = jc.page.blocks[b.type] ? jc.page.blocks[b.type].call(window,b,pdata) : '';
				if ( canedit && jc.page.prop.editMode ) {
					let w = true;
					if ( (out instanceof jQuery)||(out instanceof NodeList)||(out instanceof Node) ) w = ! $('.jcEditable',out).length;
					else if ( AS.test.str(out) ) w = ( out.indexOf('<div class="jcEditable">') < 0 );
					if ( w ) {
						let editable = { prop: b.prop, type: 'block', subtype: b.type };
						out = $('<div class="jcEditable"></div>').data('editable',editable).append( out||'<span class="placeHolder">Empty</span>' );
					}
				}
				return out;
			});
			jc.page.render.main(o,pdata);
		},
	},
	checkJcMenu : ( ctx )=>{
		if ( AS.test.udef(ctx)) ctx = document.body;
		let $menu = $('.jcMenu:not(.jcMenuParsed)',ctx);
		if ( ! $menu.length ) return;
		$menu.html('');
		$menu.addClass('jcMenuParsed');
		if ( jc.prop.authUser ) {
			$(document.body).addClass('jcUserAuth');
			$menu.append(`<div class="jcicon jcAuth">${ AS.icon('user') }</div><div class="jcUser">${ jc.prop.authUser }</div>`);
			$menu.on('click contextmenu',jc.actionsMenu);
		} else {
			$(document.body).removeClass('jcUserAuth');
			$menu.append(`<span class="jcicon jcUnauth">${ AS.icon('lock') }</span>`);
			$menu.off('click contextmenu',jc.actionsMenu);
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
	blocks : {
		text : (b,d)=>{
			let out = $(b.wrap||d.wrap||'<div></div>');
			out.append( d[b.prop] );
			return out;
		},
		html : (b,d)=> {
			return d[b.prop];
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
				if (jc.page.blocks[sb.type]) {
					let r = jc.page.blocks[sb.type].call(window,{prop:sb.type},sb) || '';
					if ( jc.page.prop.editMode ) {
						let editable = { prop: b.prop, type: 'block', subtype: sb.type, idx: idx, qt: qt };
						r = $('<div class="jcEditable"></div>').data('editable',editable).append( r );
					}
					out.append( r );
				}
			} );
			return out;
		},
	},
	edit : ( status, savePolicy ) => {
		if ( status ) {
			jc.springLoad('module:edit');
			if ( ! jc.edit ) return window.setTimeout( ()=>{ jc.page.edit(status,savePolicy) }, 100 );
			jc.page.prop.editMode = status;
			let oe = jc.edit.data()||false;
			if ( oe ) {
				Swal.fire({
					title: AS.label('editYetItTitle'),
					text: AS.label('editYetItBody'),
					icon: "warning",
					showDenyButton: true,
					showCancelButton: true,
					confirmButtonText: AS.label('editYetItOk'),
					denyButtonText: AS.label('editYetItCancel'),
					customClass: {
						cancelButton: 'order-1 right-gap',
						denyButton: 'order-2',
						confirmButton: 'order-3',
					}
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
		} else if ( AS.test.udef(savePolicy)) {
			Swal.fire({
				title: AS.label('SaveChangesTitle'),
				text: AS.label('SaveChangesBody'),
				icon: "warning",
				showCancelButton: true,
				showDenyButton: true,
				denyButtonText : AS.label('menuEditOverDiscard'),
				confirmButtonText : AS.label('menuEditOverSave'),
				hideClass: { popup: '' },
				customClass: {
					cancelButton: 'order-1 right-gap',
					denyButton: 'order-2',
					confirmButton: 'order-3',
				}
			}).then( result => {
				if (result.isConfirmed) {
					jc.page.edit(status,true)
				} else if (result.isDenied) {
					jc.page.edit(status,false)
				}
			});
			return;
		}
		let oe = (jc.edit && jc.edit.data())||false;
		if ( ! oe ) {
			jc.page.reload();
			return;
		}
		if (savePolicy) {
			jc.page.save( { data: oe, callback: ()=>{ jc.page.edit(status,false)} });
			return;
		}
		jc.edit.data(false);
		jc.page.prop.editMode = status;
		jc.page.reload();
	},
	create : ( page, metadata ) => {
		if ( AS.test.udef(page) ) {
			jc.jdav.get(
				AS.path('jsauth') + 'auth/lstemplates',
				(l) => {
					let opts = {};
					l.list.forEach( (k) => {
						opts[k] = k;
					} );
					console.log( opts );
					Swal.fire({
						title: 'Select page type',
						input: 'select',
						inputOptions : opts,
						inputPlaceholder: 'Select',
						inputValidator : (v) => {
							return new Promise((resolve) => {
								if (v.length) {
									resolve()
								} else {
									resolve('Select page type');
								}
							})
						},
					});
				}
			)
			return;
		}
		//jc.page.save( data, page, 'new' );
	},
	save : ( params ) => {
		jc.progress(AS.label('SavingPage'));
		if ( AS.test.udef(params)) params = {};
		else if ( AS.test.func(params)) params = { callback: params };
		if ( AS.test.udef(params.data)) params.data = jc.edit.data();
		if ( AS.test.udef(params.page)) params.page = jc.page.current();
		if ( AS.test.udef(params.id) ) params.id = (jc.page.data()||{}).id;
		if ( AS.test.udef(params.typelist)) {
			jc.jdav.get('struct/'+params.page+'-list.json',(l)=>{ params.typelist = l||{}; jc.page.save( params ); })
			return;
		}
		if ( AS.test.udef(params.fulllist)) {
			jc.jdav.get('struct/_all-list.json',(l)=>{ params.fulllist = l||{}; jc.page.save( params ); })
			return;
		}
		let isNew = (params.id=='new');
		if ( isNew ) {
			if ( Object.keys(params.typelist).length ) {
				let max = 0;
				Object.keys(params.typelist).forEach( k => {
					let n = parseInt(k);
					if ( (!isNaN(n)) && ( n >= max )) max = n+1;
				} );
				if ( max > 0 ) params.id = max;
			} else {
				params.id = 1;
			}
		}
		if ( AS.test.udef(params.data.metadata) ) params.data.metadata = {};
		Object.keys(params.data).forEach( k => {
			if ( AS.test.arr(params.data[k])) params.data[k].forEach( i => {
				if ( AS.test.obj(i) && ! AS.test.arr(i) ) {
					delete i.idx;
					delete i.qt;
				}
			} );
		} );
		if ( params.id ) {
			params.data.id = params.id;
			params.data.metadata.id = params.id;
		}
		let tpd = {
			title: params.data.metadata.title||'',
			desc: params.data.metadata.description || '',
			upd: (new Date()).getTime(),
			user: jc.prop.authUser
		};
		if ( params.data.metadata.hidden ) tpd.hidden = true;
		if ( params.data.blogdate ) tpd.date = params.data.blogdate;
		if ( params.id ) tpd.id = parseInt(params.id);
		if (( ! tpd.title.length) && AS.test.str( params.data.title)) tpd.title = params.data.title.dehtml().shorten(48);
		if ( ! tpd.title.length ) tpd.title = params.page + ( params.id ? ' '+params.id : '');
		if (( ! tpd.desc.length) && AS.test.str( params.data.abstract)) tpd.desc = params.data.abstract.dehtml().shorten(256);
		jc.jdav.put( params.page + ( params.id || '') + '.json', params.data, ()=>{
			if ( AS.test.udef(params.fulllist[params.page]) ) params.fulllist[params.page] = {};
			params.fulllist[params.page][String(params.id?params.id:0)] = tpd;
			jc.progress(AS.label('SavingArticleList'));
			jc.jdav.put('struct/_all-list.json',params.fulllist,()=>{
				params.typelist[String(params.id?params.id:0)] = tpd;
				jc.jdav.put('struct/'+params.page+'-list.json',params.typelist,()=>{
					jc.progress(AS.label('SavingLasts'));
					jc.page.makeLasts( params.page, params.typelist, ()=>{
						jc.progress(false);
						if ( (! isNew) && (! params.noDialog) ) {
							window.setTimeout( ()=>{
								Swal.fire({
									title: AS.label('PageSavedTitle'),
									text: AS.label('PageSavedBody',{page:params.page,id:params.id}),
									icon: "success",
									showCancelButton:false,
									showConfirmButton:false,
									timer: 2000,
								});
							},100);
						}
						if ( AS.test.func(params.callback) ) {
							params.callback.call(window,params.page,params.id,params.data);
							return;
						}
						if ( jc.edit ) jc.edit.data(false);
						jc.page.current('-');
						jc.page.open( page, id );
					});
				});
			});
		});
	},
	makeLasts : ( page, list, callback ) => {
		if ( AS.test.udef(list) ) {
			jc.jdav.get('struct/'+page+'-list.json',(l)=>{
				jc.page.makeLasts( page, (l||{}), callback );
			});
			return;
		}
		let lasts = [];
		Object.keys(list).forEach( k => {
			const pm = list[k];
			if (!pm.hidden) lasts.push( pm );
		});
		lasts.sort( (a,b) =>(b.upd - a.upd));
		qts = jc.prop.lastChangedQuantities.clone().map( i => parseInt(i) ).filter( i => ( ! isNaN(i) ) );
		qts.sort( (a,b)=>( b - a ) );
		let proc = () => {
			if ( qts.length ) {
				const qt = qts.shift();
				lasts.splice(qt -1);
				jc.jdav.put('struct/'+page+'-last'+qt+'.json',lasts,proc);
				return;
			} else {
				jc.page.makeDateEntries(page,list,callback);
			}
		}
		proc();
	},
	makeDateEntries : ( page, list, callback ) => {
		if ( AS.test.udef(list) ) {
			jc.jdav.get('struct/'+page+'-list.json',(l)=>{
				jc.page.makeDateEntries( page, (l||{}), callback );
			});
			return;
		}
		let aggr = {};
		Object.keys(list).forEach( k => {
			const pm = list[k];
			if (pm.hidden) return;
			if ( ! AS.test.str(pm.date) ) return;
			const dp = pm.date.split('-');
			if ( dp.length != 3 ) return;
			aggr[dp[0]] = AS.def.arr(aggr[dp[0]]);
			aggr[dp[0]].push(pm);
			aggr[dp[0]+'-'+dp[1]] = AS.def.arr(aggr[dp[0]+'-'+dp[1]]);
			aggr[dp[0]+'-'+dp[1]].push( pm );
		});
		let flist = Object.keys(aggr).map( sel => {
			let mlist = aggr[sel];
			mlist.sort( (a,b)=>{
				if ( a.date == b.date ) return ( a.upd < b.ud ? -1 : 1);
				return (a.date < b.date ? -1 : 1 );
			});
			return {prefix: sel, list: mlist };
		});
		let proc = () => {
			if ( flist.length ) {
				let f = flist.shift();
				jc.jdav.put('struct/'+page+'-bydate-'+f.prefix+'.json',f.list,proc);
				return;
			} else if (AS.test.func(callback)) {
				callback.call(window);
			}
		}
		proc();
	},
};

jc.actionsMenu = (e) => {
	let acts = [AS.label('menuActionsTitle')];
	if ( jc.page.prop.editMode ) {
		acts.push(
			{icon:'jcicon',iconKey:'metadata',label:AS.label('Properties'),action:()=>{jc.edit.meta.edit();} },
			{icon:'jcicon',iconKey:'pageEditOff',label:AS.label('menuEditOver'),action:()=>{jc.page.edit(false);},content:[
				{icon:'jcicon',iconKey:'done',label:AS.label('menuEditOverSave'),action:()=>{jc.page.edit(false,true);} },
				{icon:'jcicon',iconKey:'editRemove',label:AS.label('menuEditOverDiscard'),action:()=>{jc.page.edit(false,false);} }
			]}
		);
	} else {
		acts.push(
			{icon:'jcicon',iconKey:'pageEdit',label:AS.label('menuEditStart'),action:()=>{jc.page.edit('page');} },
			'-',
			{icon:'jcicon',iconKey:'pageAdd',label:AS.label('NewPage')+'…',action:()=>{jc.page.create();} },
		);
	}
	jc.menu(e, { content: acts, highlight: false });
};
