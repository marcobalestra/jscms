# jscms
Javascript CMS, JSON-driven and DB-free

The idea is to create a CMS as a SPA (Single-page application) that is entirely javascript-driven.

A first preview is available on https://casadelcuoco.it

## Key factors

Editing occurs in the browser, only at the end of the edit process the page is saved.

JSCMS can run **WITHOUT** any type of serverside language, using simply EcmaScript6 and Apache 2.4 DAV features.

## About authentication

Jscms uses Apache’s basic authentication.

This authentication _could be_ insecure, in order to secure it it’s reccommended to:

* Enable and force HTTPS on the site, e.g. using `certbot`
* Enable `fail2ban` with an appropriate _jail_ for HTTP auth failures.
Usually the `apache-auth` jail is shipped with `fail2ban` distribution, just activate it.

## Limitations, by design

Given the absence of a framework and a datbase backing-up the CMS, it’s intended for the use
of (personal) ordinary sites with a few users and only one administrator.

## Requirements

Requires Apache 2.x (possibly ≥ 2.4) with the modules: `auth_basic`, `rewrite`, `include`, `dav`, `dav_fs`

Virtual site configuration will look like:

```
	RewriteEngine On
	SetOutputFilter DEFLATE
	AddOutputFilterByType DEFLATE application/javascript
	AddOutputFilterByType DEFLATE application/json
	AddOutputFilterByType DEFLATE text/javascript
	AddOutputFilterByType DEFLATE text/html
	AddOutputFilterByType DEFLATE text/plain
	AddOutputFilterByType DEFLATE text/css
	AddOutputFilterByType DEFLATE text/xml
	AddOutputFilterByType DEFLATE text/xsl
	AddOutputFilterByType DEFLATE image/svg+xml
	
	DavLockDB /tmp/DavLock.jscms
	
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
		Options +Includes -Indexes
	</Directory>
	
```
