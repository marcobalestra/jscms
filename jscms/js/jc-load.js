var jc = { prop : { prefs: {} }};
jc.prop.isDeveloper = window.location.host.includes('.lan.');
jc.prop.uriPrefixPlain = '/!';
jc.prop.mainContainerId = 'jcToplevelContainer';
jc.prop.prefs.prefsVersion = 1;
AS.path({
	jsroot : '/jscms/',
	jscndroot : jc.prop.isDeveloper ? '/jscms/' : 'https://cdn.altersoftware.org/js-as-cms/'
});
( ()=>{
	let h = document.documentElement.querySelector('head');
	if ( ! h ) h = document.body;
	let uri = AS.path('jscndroot') + 'js/jc'+(jc.prop.isDeveloper?'':'.min')+'.js';
	let s = document.createElement('script');
	s.setAttribute('type','text/javascript');
	s.setAttribute('language','javascript');
	s.setAttribute('charset','utf-8');
	s.setAttribute('src',uri);
	h.appendChild( s );
} )();
