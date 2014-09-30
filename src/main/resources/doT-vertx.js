var vertx = require('vertx'), console = require('vertx/console'), doTloader = require('index'), doT =require('doT'), fs = require('vertx/file_system'), container = require('vertx/container'),conf = container.config;

//Load in the templates on startup to get maximum speed
var dots = doTloader.process({path:conf.template_folder,destination:conf.destination});

//Register the handler for messages
vertx.eventBus.registerHandler(conf.address, function(message, replier) {
		
	var action = checkAction(message);
	
	switch(action){
	case("apply"):
		applyTemplate(message.template,message.payload,replier);
		break;
	case("compile"):
		compileTemplate(message.template,message.payload,replier);
		break;
	case("delete"):
		deleteTemplate(message.template,replier);
	default:
		replyErr("Invalid Action Supplied",replier);
		break;
	}
	
});

applyTemplate = function(templateName,templatePayload,replier){
	console.log("Applying template "+templateName);
	
	var templateFn = dots[templateName];	
		
	if(typeof templateFn === 'function'){		
		replyOK(templateFn(templatePayload),replier);		    
	}else{	
		if(conf.can_compile){
			var map = vertx.getMap('compiled.functions');		
			var templateRaw = map.get(templateName);
			if(templateRaw !== null){	
				try {
					templateFn = new Function(doT.templateSettings.varname, templateRaw);
					dots[templateName] = templateFn;						
					replyOK(templateFn(templatePayload),replier);	 
	
				} catch (e) {
					if (typeof console !== 'undefined') console.log("Could not create a template function: " + templateRaw);
					throw e;
				}			
			}
		}
		var err ="Template not found for "+templateName; 
		replyErr(err,replier);		    
	}
}

compileTemplate = function(templateName,templateMarkup,replier){
	if(conf.can_compile){
		console.log("Compiling template "+templateName);
		
		var fn = doT.template(templateMarkup);
		
		var map = vertx.getMap('compiled.functions');
		var fnString = fn.toString();				
		map.put(templateName,fnString.slice(fnString.indexOf('{'),fnString.lastIndexOf('}')+1));
		
		dots[templateName] = fn;
		replyOK("Compiled "+templateName,replier);
	}else{
		replyErr("Compile not allowed",replier);
	}	
}

deleteTemplate = function(templateName,replier){
	console.log("Deleting template "+templateName);
	
	var templateFn = dots[templateName];
	if(typeof templateFn === 'function'){
		delete dots[templateName];
		replyOK("Deleted "+templateName,replier);
	}else{
		replyErr("Template does not exist",replier);
	}
}

checkAction = function(message){	
	if(typeof message.action !== 'string'){
		replyErr("No Action Specified",replier);
	}else{
		return message.action;
	}
}

replyErr = function(msg,replier){
	var response = {status:"ERROR",message:msg};
	replier(response);
}

replyOK = function(content,replier){
	var response = {status:"OK",message:content};
	replier(response);
}

vertxStop = function() {
	console.log('Verticle has been undeployed');
} 