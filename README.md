# jscms
Javascript CMS, JSON-driven and DB-free

The idea is to create a CMS as a SPA (Single-page application) that is entirely javascript-driven.

A first preview is available on https://casadelcuoco.it

## Key factors

Editing occurs in the browser, only at the end of the edit process the page is saved.

JSCMS can run **WITHOUT** any type of serverside language, using simply EcmaScript6 and Apache 2.4 DAV features.

Requires Apache Modules: `auth_basic`, `rewrite`, `include`, `dav`, `dav_fs`

Virtual site configuration will look like:

```
	SetOutputFilter DEFLATE
	AddOutputFilterByType DEFLATE application/javascript
	AddOutputFilterByType DEFLATE application/json
	AddOutputFilterByType DEFLATE text/javascript
	AddOutputFilterByType DEFLATE text/html
	AddOutputFilterByType DEFLATE text/plain
	AddOutputFilterByType DEFLATE text/css
	AddOutputFilterByType DEFLATE text/xml
	AddOutputFilterByType DEFLATE text/xsl
	AddOutputFilterByType DEFLATE application/font-woff
	AddOutputFilterByType DEFLATE image/svg+xml

	<Directory "/path/to/document-root">
		AllowOverride All
		AuthType Basic
		AuthName JSCMS
		AuthUserFile "/path/to/document-root/.htpasswd"
		Require all granted
		Options Indexes FollowSymLinks
	</Directory>
	
	<Directory "/path/to/document-root/jscms/data">
		Dav On
		<LimitExcept GET POST OPTIONS>
			Require valid-user
		</LimitExcept>
	</Directory>
	
	<Directory "/path/to/document-root/jscms/login">
		RewriteCond %{REQUEST_FILENAME}.shtml -f
		RewriteRule .* %{REQUEST_FILENAME}.shtml [L]
		Options +Includes
		Require valid-user
	</Directory>
	
```
