var jc = { prop : { prefs: {} }};
jc.prop.uriPrefixPlain = '/-jscms/';
jc.prop.mainContainerId = 'jcToplevelContainer';
jc.prop.prefs.prefsVersion = 1;
AS.path({jsroot : '/jscms/'});
( ()=>{
	let h = document.documentElement.querySelector('head');
	if ( ! h ) h = document.body;
	let uri = h.querySelector('script[src$="/jc-load.js"]').getAttribute('src').replace(/\/jc-load\.js$/,"/jc.js");
	let s = document.createElement('script');
	s.setAttribute('type','text/javascript');
	s.setAttribute('language','javascript');
	s.setAttribute('charset','utf-8');
	s.setAttribute('src',uri);
	h.appendChild( s );
} )();
