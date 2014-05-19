var vertx = require('vertx'), console = require('vertx/console'), doTloader = require('index'), doT =require('dot'), fs = require('vertx/file_system'), container = require('vertx/container'),conf = container.config;

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
	default:
		replyErr("Invalid Action Supplied",replier);
		break;
	}
	
});

applyTemplate = function(templateName,templatePayload,replier){
	console.log("Applying template");
	var templateFn = dots[templateName];
	
	if(templateFn){		
		replyOK(templateFn(templatePayload),replier);		    
	}else{
		var err ="Template not found for "+templateName; 
		replyErr(err,replier);	
	    console.log(err);
	}
}

compileTemplate = function(templateName,templateMarkup,replier){
	console.log("Compiling template "+templateName);
	var fn = doT.template(templateMarkup);
	
	dots[templateName] = fn;
	replyOK("Compiled "+templateName,replier);
}

checkAction = function(message){
	if(!message.action){
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