var container = require("vertx/container");
var vertx = require("vertx");
var vertxTests = require("vertx_tests");
var vassert = require("vertx_assert");
var console = require('vertx/console');
var timer = require('vertx/timer');
var fs = require('vertx/file_system');


function testModSimpleCompile(){
	//Use send to compile one verticle but force others to compile on fly.	
	vertx.eventBus.send("template.apply", {action:'compile',payload:'<h1>Here is a sample template {{=it.foo}}</h1>',template:'compile1'});
  	  
	vertx.eventBus.send("template.apply", {action:'apply',payload:{foo:'for my test'},template:'compile1'}, function(reply2) {
		vassert.assertEquals("OK", reply2.status);
		 
		vassert.assertEquals("<h1>Here is a sample template for my test</h1>", reply2.message);
	
		vertx.eventBus.send("template.apply", {action:'apply',payload:{foo:'for my test'},template:'compile1'}, function(reply2) {
			vassert.assertEquals("OK", reply2.status);
			 
			vassert.assertEquals("<h1>Here is a sample template for my test</h1>", reply2.message);
			
			vertx.eventBus.send("template.apply", {action:'apply',payload:{foo:'for my test'},template:'compile1'}, function(reply2) {
				vassert.assertEquals("OK", reply2.status);
				 
				vassert.assertEquals("<h1>Here is a sample template for my test</h1>", reply2.message);
				vassert.testComplete();
			});		
		});
	}); 
	
}

function testModComplexCompile(){
	//Use publish to compile all verticles at once
	vertx.eventBus.publish("template.apply", {action:'compile',payload:'<h1>Here is a sample template {{=it.foo}}</h1>',template:'compile1'});
  	  
	vertx.eventBus.send("template.apply", {action:'apply',payload:{foo:'for my test'},template:'compile1'}, function(reply2) {
		vassert.assertEquals("OK", reply2.status);
		 
		vassert.assertEquals("<h1>Here is a sample template for my test</h1>", reply2.message);
	
		vertx.eventBus.send("template.apply", {action:'apply',payload:{foo:'for my test'},template:'compile1'}, function(reply2) {
			vassert.assertEquals("OK", reply2.status);
			 
			vassert.assertEquals("<h1>Here is a sample template for my test</h1>", reply2.message);
			
			vertx.eventBus.send("template.apply", {action:'apply',payload:{foo:'for my test'},template:'compile1'}, function(reply2) {
				vassert.assertEquals("OK", reply2.status);
				 
				vassert.assertEquals("<h1>Here is a sample template for my test</h1>", reply2.message);
				vassert.testComplete();
			});		
		});
	}); 
	
}

var script = this;

function setup(){
	console.log("Cleaning compilation folder compiledmultimodule/");
	var result = fs.existsSync("compiledmultimodule/");
	if(result){
		fs.deleteSync("compiledmultimodule/",true);
	}
	console.log("Cleaned");
}

// The script is execute for each test, so this will deploy the module for each one
// Deploy the module - the System property `vertx.modulename` will contain the name of the module so you
// don't have to hardecode it in your tests
container.deployModule(java.lang.System.getProperty("vertx.modulename"),{template_folder:'template_folder',address:'template.apply',can_compile:true,destination:'compiledmultimodule/'},3,function(err, depID) {
	console.log("Deployed Module " + depID);
	// Deployment is asynchronous and this this handler will be called when it's complete (or failed)
	vassert.assertNull(err);
	// If deployed correctly then start the tests!
	setup();
	vertxTests.startTests(script);
});
