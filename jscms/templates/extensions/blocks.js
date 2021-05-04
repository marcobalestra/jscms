jc.blocks = {};

jc.page.render.blocks = (o,pdata,pfull) => {
	if ( ! Array.isArray(o.blocks)) o.blocks = [o.blocks];
	o.rendered = o.blocks.map( b => ( jc.blocks[b.type] ? jc.blocks[b.type].call(window,b,pdata) : '' ) );
	jc.page.render.main(o);
};

jc.blocks.text = (b,d)=>{
	let out = $(b.wrap || '<div></div>');
	out.append( d[b.prop] );
	return out;
};

jc.blocks.html = (b,d)=> (d[b.prop]);

jc.blocks.mixed = (b,d) => {
	if ( ! d[b.prop] ) return '';
	let out = $(b.wrap || '<div></div>');
	if ( ! Array.isArray(d[b.prop]) ) d[b.prop] = [d[b.prop]];
	d[b.prop].forEach( sb => {
		if ( AS.test.str( sb ) ) sb = { content:sb };
		if ( ! AS.test.obj( sb )) return;
		if ( ! sb.type ) sb.type='text';
		if (jc.blocks[sb.type]) out.append( jc.blocks[sb.type].call(window,{prop:sb.type},sb));
	} );
	return out;
};
