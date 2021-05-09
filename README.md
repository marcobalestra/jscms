# jscms
Javascript CMS, JSON-driven and DB-free

The idea is to create a CMS as a SPA (Single-page application) that is entirely javascript-driven.

## Under development

JSCMS is currently under development.

A first preview of the state of the art is available on https://casadelcuoco.it

## Key factors

Editing occurs in the browser, only at the end of the edit process the page is saved.

JSCMS can run **WITHOUT** any type of serverside language, using simply EcmaScript6 and Apache2 DAV features.

* **Doesn’t** require MySQL, Oracle, MariaDB, Postgres nor any other DB
* **Doesn’t** require PHP
* **Doesn’t** require Node.js
* **Doesn’t** require Java
* **Doesn’t** require Perl, Python, Ruby or any other scripting language

## About authentication

JSCMS uses Apache’s basic authentication.

This authentication _could be_ insecure, in order to secure it it’s reccommended to:

* Enable and force HTTPS on the site, e.g. using `certbot`
* Enable `fail2ban` with an appropriate _jail_ for HTTP auth failures.
Usually the `apache-auth` jail is shipped with `fail2ban` distribution, just activate it.

To logout just quit the browser.

## Limitations, by design

Given the absence of a framework and a datbase backing-up the CMS, it’s intended for the use
of (personal) ordinary sites with a few users and only one administrator.

## Requirements

* A server with some operating system (this excludes Windows)
* Apache  2.x web server (possibly ≥ 2.4)
* Apache modules: `auth_basic`, `rewrite`, `include`, `dav`, `dav_fs`, `cgi`
* It’s strongly suggested to use Apache module `deflate`<br />
Given the nature of the traffic (mainly JSON and JS) `deflate` makes site navigation light-speed fast.

### Note

You may have noticed that `cgi` module… It’s required to perform a few (simple and minimal) SSI “exec”:
only authenticated, only minimal (e.g.: list files name in data directory matching some pattern).

It’s done through few script lines (sh or vanilla perl), parameters are accurately “sanitized” and
the scripts can’t act (read or write) outside jscms directory.

The use of such scripts (again: small and only authenticated) could be avoided, too bad there is some
issue in Apache2 WebDAV and PROPFIND method (returning a 403).

### Virtual site configuration

Virtual site configuration file will look like this:

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
		Options -Indexes
		<LimitExcept GET POST OPTIONS>
			Require valid-user
		</LimitExcept>
	</Directory>
	
	<Directory "/path/to/document-root/jscms/login">
		Options Includes FollowSymLinks ExecCGI
	</Directory>
	
```
