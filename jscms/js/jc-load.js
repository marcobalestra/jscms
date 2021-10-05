var jc = { prop : { prefs: {} }};
jc.prop.isDeveloper = (window.location.host.includes('.lan.') || window.location.host.startsWith('192.168.'));
jc.prop.uriPrefixPlain = '/!';
jc.prop.mainContainerId = 'jcToplevelContainer';
jc.prop.prefs.prefsVersion = 1;
AS.path({
	jsroot : '/jscms/',
	jscdn : jc.prop.isDeveloper ? '/jscms/' : 'https://cdn.altersoftware.org/js-as-cms/',
	jsdataroot: '/jscms/data/',
	jstemplates : '/jscms/templates/',
	jsreporoot: '/jscms/repository/',
	jsauth: '/jscms/login/',
});
( ()=>{
	let h = document.documentElement.querySelector('head');
	if ( ! h ) h = document.body;
	let uri = AS.path('jscdn') + 'js/jc'+(jc.prop.isDeveloper?'':'.min')+'.js';
	let s = document.createElement('script');
	s.setAttribute('type','text/javascript');
	s.setAttribute('language','javascript');
	s.setAttribute('charset','utf-8');
	s.setAttribute('src',uri);
	h.appendChild( s );
} )();
