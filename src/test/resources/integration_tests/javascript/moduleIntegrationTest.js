var container = require("vertx/container");
var vertx = require("vertx");
var vertxTests = require("vertx_tests");
var vassert = require("vertx_assert");
var console = require('vertx/console');
var timer = require('vertx/timer');
var fs = require('vertx/file_system');

function testModComplexTemplate() {
	//setup();	
	vertx.eventBus.send("template.apply", {action:'apply',payload:{name:"Jake",age:31},template:'test1'}, function(reply) {
		vassert.assertEquals("OK", reply.status);
		vassert.assertEquals("<div>Hi Jake!</div><div>31</div>", reply.message);   
		vassert.testComplete();
  });
}

function testModSimpleTemplate(){
	//setup();
	vertx.eventBus.send("template.apply", {action:'apply',payload:{foo:'for my test'},template:'test'}, function(reply) {
		vassert.assertEquals("OK", reply.status);
		vassert.assertEquals("<h1>Here is a sample template for my test</h1>", reply.message);	  
		vassert.testComplete();
	}); 
}

function testModMissingTemplate(){
	//setup();
	vertx.eventBus.send("template.apply", {action:'apply',payload:{foo:'for my test'},template:'missing'}, function(reply) {
		vassert.assertEquals("ERROR", reply.status);
		console.log(reply.message);
		vassert.testComplete();
	});
}

function testModOneDef() {
	//setup();
	vertx.eventBus.send("template.apply", {action:'apply',payload:{foo:"Jake"},template:'test2'}, function(reply) {
		vassert.assertEquals("OK", reply.status);
	    vassert.assertEquals("<div>Jake</div>", reply.message);	  
	    vassert.testComplete();
	});  
}

function testModBadAction() {
	//setup();
	vertx.eventBus.send("template.apply", {action:'gerbil',payload:{foo:"Jake"},template:'test2'}, function(reply) {
		vassert.assertEquals("ERROR", reply.status);	    	 
	    vassert.testComplete();
	});  
}

function testModMultiDefJst() {
	//setup();
	vertx.eventBus.send("template.apply", {action:'apply',payload:{foo:"bongo",class:"sausage"},template:'two'}, function(reply) {
		vassert.assertEquals("OK", reply.status);
	    vassert.assertEquals("<div class=\"sausage\"><div>bongo</div><div>hello</div><div class=\"hidden\"></div><div>world</div><div class=\"visible\"></div></div>", reply.message);	  
	    vassert.testComplete();
	});  
}

var script = this;

function setup(){
	console.log("Cleaning compilation folder compiledmodule/");
	fs.deleteSync("compiledmodule/",true);
	console.log("Cleaned");
}

// The script is execute for each test, so this will deploy the module for each one
// Deploy the module - the System property `vertx.modulename` will contain the name of the module so you
// don't have to hardecode it in your tests
container.deployModule(java.lang.System.getProperty("vertx.modulename"),{template_folder:'template_folder',address:'template.apply',can_compile:true,destination:'compiledmodule/'},1,function(err, depID) {
	console.log("Deployed Module " + depID);
	// Deployment is asynchronous and this this handler will be called when it's complete (or failed)
	vassert.assertNull(err);
	// If deployed correctly then start the tests!
	setup();
	vertxTests.startTests(script);
});
