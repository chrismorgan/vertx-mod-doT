/* doT + auto-compilation of doT templates
 *
 * 2012, Laura Doktorova, https://github.com/olado/doT
 * Licensed under the MIT license
 *
 * Compiles .def, .dot, .jst files found under the specified path.
 * It ignores sub-directories.
 * Template files can have multiple extensions at the same time.
 * Files with .def extension can be included in other files via {{#def.name}}
 * Files with .dot extension are compiled into functions with the same name and
 * can be accessed as renderer.filename
 * Files with .jst extension are compiled into .js files. Produced .js file can be
 * loaded as a commonJS, AMD module, or just installed into a global variable
 * (default is set to window.render).
 * All inline defines defined in the .jst file are
 * compiled into separate functions and are available via _render.filename.definename
 *
 * Basic usage:
 * var dots = require("dot").process({path: "./views"});
 * dots.mytemplate({foo:"hello world"});
 *
 * The above snippet will:
 * 1. Compile all templates in views folder (.dot, .def, .jst)
 * 2. Place .js files compiled from .jst templates into the same folder.
 *    These files can be used with require, i.e. require("./views/mytemplate").
 * 3. Return an object with functions compiled from .dot templates as its properties.
 * 4. Render mytemplate template.
 * 
 * 2014, Chris Morgan, https://github/chrismorgan/doT-vertx
 * Integrated into the Vertx framework
*/

var fs = require('vertx/file_system'),
	vertx = require('vertx'),
	console = require('vertx/console'),
	
	doT = module.exports = require("doT"),
	sep  = java.lang.System.getProperty("file.separator");
	

doT.process = function(options) {
	//path, destination, global, rendermodule, templateSettings
	return new InstallDots(options).compileAll();
};

function InstallDots(o) {
	this.__path 		= o.path || ("."+sep);
	if (this.__path[this.__path.length-1] !== sep) this.__path += sep;
	this.__destination	= o.destination || this.__path;
	if (this.__destination[this.__destination.length-1] !== sep) this.__destination += sep;
	this.__global		= o.global || "window.render";
	this.__rendermodule	= o.rendermodule || {};
	this.__settings 	= o.templateSettings ? copy(o.templateSettings, copy(doT.templateSettings)) : undefined;
	this.__includes		= {};
}

InstallDots.prototype.compileToSharedData = function(path, template, def) {
	
	def = def || {};
	var modulename = path.substring(path.lastIndexOf(sep)+1, path.lastIndexOf("."))
		, defs = copy(this.__includes, copy(def))
		, settings = this.__settings || doT.templateSettings
		, compileoptions = copy(settings)
		, defaultcompiled = doT.template(template, settings, defs)
		, exports = []
		, compiled = ""
		, fn;

	for (var property in defs) {
		if (defs[property] !== def[property] && defs[property] !== this.__includes[property]) {
			fn = undefined;
			if (typeof defs[property] === 'string') {
				fn = doT.template(defs[property], settings, defs);
			} else if (typeof defs[property] === 'function') {
				fn = defs[property];
			} else if (defs[property].arg) {
				compileoptions.varname = defs[property].arg;
				fn = doT.template(defs[property].text, compileoptions, defs);
			}
			if (fn) {
				compiled += fn.toString().replace('anonymous', property);
				exports.push(property);
			}
		}
	}
	compiled += defaultcompiled.toString().replace('anonymous', modulename);
	
	var data = "(function(){" + compiled
	+ "var itself=" + modulename + ";"
	+ addexports(exports)
	+ "if(typeof module!=='undefined' && module.exports) module.exports=itself;else if(typeof define==='function')define(function(){return itself;});else {"
	+ this.__global + "=" + this.__global + "||{};" + this.__global + "['" + modulename + "']=itself;}}());";
	
	var map = vertx.getMap('compiled.functions');
	console.log("Compiled "+modulename+" using "+data);
	map.put(modulename,data);
}

function addexports(exports) {
	for (var ret ='', i=0; i< exports.length; i++) {
		ret += "itself." + exports[i]+ "=" + exports[i]+";";
	}
	return ret;
}

function copy(o, to) {
	to = to || {};
	for (var property in o) {
		to[property] = o[property];
	}
	return to;
}

function readdata(path) {
	var data = fs.readFileSync(path);
	if (data) return data.toString();
	console.log("problems with " + path);
}

InstallDots.prototype.compilePath = function(path) {
	var data = readdata(path);
	if (data) {
		return doT.template(data,
					this.__settings || doT.templateSettings,
					copy(this.__includes));
	}else{
		console.log("no data returned from "+path);
	}
};

InstallDots.prototype.compileAll = function() {
	console.log("Extracting all doT templates in sharedData");
	//Pull in definitions from sharedData
	var compiledTemplates = vertx.getMap('compiled.functions'),			
	k, l, name, namePath;
	console.log(compiledTemplates.keySet().size());
	compiledTemplates.keySet().toArray().forEach(function(name){
		console.log(name);
		if (/\.def(\.dot|\.jst)?$/.test(name)) {
			console.log("Loaded shared def " + name);
			this.__includes[name] = compiledTemplates.get(name);
		}
	});
	
	console.log("Compiling all doT templates in "+this.__path);	
	var defFolder = this.__path,
		sources = fs.readDirSync(defFolder,'.*\.dot|.*\.jst|.*\.def$'),			
		k, l, name, namePath;
	//Pull in definitions from file
	for( k = 0, l = sources.length; k < l; k++) {
		name = sources[k];		
		namePath = name.substring(name.lastIndexOf(sep)+1);	
		if (/\.def(\.dot|\.jst)?$/.test(namePath)) {
			console.log("Loaded def " + defFolder + namePath);
			var incName = namePath.substring(0, namePath.indexOf('.'))
			if(this.__includes[incName]===undefined){
				console.log("Added "+incName+" from file");
				this.__includes[incName] = readdata(defFolder + namePath);
			}
		}
	}

	for( k = 0, l = sources.length; k < l; k++) {
		name = sources[k];
		namePath = name.substring(name.lastIndexOf(sep)+1);	
		if (/\.dot(\.def|\.jst)?$/.test(name)) {
			console.log("Compiling " + namePath + " to function");
			this.__rendermodule[namePath.substring(0, namePath.indexOf('.'))] = this.compilePath(defFolder + namePath);
		}
		if (/\.jst(\.dot|\.def)?$/.test(name)) {
			console.log("Compiling " + namePath + " to sharedData");
			this.compileToSharedData(namePath.substring(0,namePath.indexOf('.')) + '.js',
							readdata(defFolder + namePath));
		}		
	}
	
	return this.__rendermodule;
};
