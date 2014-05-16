var vertx = require('vertx');
var console = require('vertx/console');
var container = require('vertx/container');
var doT = require('index');
var fs = require('vertx/file_system');
var	conf = container.config;

//Load in the templates on startup to get maximum speed
var dots = doT.process({path:conf.template_folder,destination:conf.destination});

vertx.eventBus.registerHandler(conf.address, function(message, replier) {
		
	//Add in action handling and status responses
	var tempFn = dots[message.template];
	if(tempFn){
		var response = tempFn(message.payload);			
		replier(response);		    
	}else{
		replier("Undefined");	
	    console.log("Template Not Found for "+message.template);
	}
});

function vertxStop() {
	console.log('Verticle has been undeployed');
} 