Vertx doT templating
=============

Vert.x module implementation of the doT javascript template engine.

This module allows the use of the [doT](https://github.com/olado/doT/) javascript templating function on the vertx platform.

## Dependencies

This module is built against Vert.x 2.1, and includes doT 1.0.1

## Name

The module name is `uk.me.watchwith~vertx-mod-doT~1.0`.

## Configuration

The Vertx doT module takes the following configuration:

	{
		"template_folder":<template folder>,
		"address":<address>,
		"can_compile":<can compile>,
		"destination":<compile folder>
	}
	
For example:

	{
		"template_folder":"template_folder",
		"address":"template.apply",
		"can_compile":true,
		"destination":"compiledmultimodule/"
	}
	
A short description about each field:
* `template_folder` The path to look for template .dot, .jst, and .def files
* `address` The address the module listens on the event bus
* `can_compile` A flag to indicate if the deployed module is allowed to compile new templates on-the-fly
* `destination` The path to store compiled .js files from the compile stage of the module deploy
	
## Startup

The module will check the `template_folder` directory and try to compile each of the template files it finds into .js files and then into memory. The .js files are then used by each deployed verticle instance to use in each application of a template. This allows for partials and much faster rendering due to the use of pre-compilation. See [http://olado.github.io/doT/](http://olado.github.io/doT/) for more details. 

## Operations

The module supports a few operations. If you want to let clients use the module directly, be careful which commands you let them use.

Operations are sent by specifying an `action` String and required and optional parameters. If a required parameter is missing, you sent an incorrect action or something similar, the server will reply with an error message in this format:

    {
        "status" : "ERROR",        
        "message" : "A message telling you what you did wrong"
    }
    
### apply

Applies a template to a json object and returns a buffer containing the applied template.

For example:
	{
		"action":"apply",
		"payload": {
			"foo":"for my test"
			},
		"template":"template1"
	}     

Contents of "template1.dot":

	<h1>Here is a sample template {{=it.foo}}</h1>

End result:

	<h1>Here is a sample template for my test</h1>

### compile

Takes a new template contents and compiles it into memory, ready to be used with `apply`. When multiple modules are applied this should be used with a `publish` rather than a `send` so that all verticles compile it.

### delete

Removes a named template from memory, removing it from use

## Features of [doT](https://github/olado/doT/)

A few features:

* Template files can have multiple extensions at the same time.
* Files with .def extension can be included in other files via {{#def.name}}
* Files with .dot extension are compiled into functions with the same name and can be accessed as renderer.filename
* Files with .jst extension are compiled into .js files. Produced .js file can be loaded as a commonJS, AMD module, or just installed into a global variable (default is set to window.render)

    	
[![Build Status](https://travis-ci.org/chrismorgan/vertx-mod-doT.svg?branch=master)](https://travis-ci.org/chrismorgan/vertx-mod-doT)