var container = require("vertx/container");
var vertx = require("vertx");
var vertxTests = require("vertx_tests");
var vassert = require("vertx_assert");
var console = require('vertx/console');
var fs = require('vertx/file_system');


function testComplexTemplate() {

	vertx.eventBus.send("template.apply", {action:'apply',payload:{name:"Jake",age:31},template:'test1'}, function(reply) {
		vassert.assertEquals("OK", reply.status);
	    vassert.assertEquals("<div>Hi Jake!</div><div>31</div>", reply.message);   
	    vassert.testComplete();
	});
}

function testSimpleTemplate(){
	vertx.eventBus.send("template.apply", {action:'apply',payload:{foo:'for my test'},template:'test'}, function(reply) {
		vassert.assertEquals("OK", reply.status);
		vassert.assertEquals("<h1>Here is a sample template for my test</h1>", reply.message);	  
		vassert.testComplete();
	}); 
}

function testMissingTemplate(){
	vertx.eventBus.send("template.apply", {action:'apply',payload:{foo:'for my test'},template:'missing'}, function(reply) {
		vassert.assertEquals("ERROR", reply.status);
		console.log(reply.message);
		vassert.testComplete();
	});
}

function testOneDef() {
	vertx.eventBus.send("template.apply", {action:'apply',payload:{foo:"Jake"},template:'test2'}, function(reply) {
		vassert.assertEquals("OK", reply.status);
	    vassert.assertEquals("<div>Jake</div>", reply.message);	  
	    vassert.testComplete();
	});  
}

function testBadAction() {
	vertx.eventBus.send("template.apply", {action:'gerbil',payload:{foo:"Jake"},template:'test2'}, function(reply) {
		vassert.assertEquals("ERROR", reply.status);	    	 
	    vassert.testComplete();
	});  
}

function testMultiDefJst() {
	vertx.eventBus.send("template.apply", {action:'apply',payload:{foo:"bongo",class:"sausage"},template:'two'}, function(reply) {
		vassert.assertEquals("OK", reply.status);
	    vassert.assertEquals("<div class=\"sausage\"><div>bongo</div><div>hello</div><div class=\"hidden\"></div><div>world</div><div class=\"visible\"></div></div>", reply.message);	  
	    vassert.testComplete();
	});  
}

function testSimpleCompile(){
	vertx.eventBus.send("template.apply", {action:'compile',payload:'<h1>Here is a sample template {{=it.foo}}</h1>',template:'compile1'}, function(reply1) {
	  
		vassert.assertEquals("OK", reply1.status);
		vassert.assertEquals("Compiled compile1", reply1.message);
	  
		vertx.eventBus.send("template.apply", {action:'apply',payload:{foo:'for my test'},template:'compile1'}, function(reply2) {
			vassert.assertEquals("OK", reply2.status);
		 
			vassert.assertEquals("<h1>Here is a sample template for my test</h1>", reply2.message);
			vassert.testComplete();
		});
	}); 
}

function testDelete() {
	vertx.eventBus.send("template.apply", {action:'delete',template:'test2'}, function(reply) {
		vassert.assertEquals("OK", reply.status);
		
		vertx.eventBus.send("template.apply", {action:'apply',payload:{foo:"Jake"},template:'test2'}, function(reply) {
			vassert.assertEquals("ERROR", reply.status);	    	 
		    vassert.testComplete();
		}); 
    });  
}

var script = this;

function setup(){
	console.log("Cleaning compilation folder compiledbasic/");
	fs.deleteSync("compiledbasic/",true);
	console.log("Cleaned");
}

container.deployVerticle("doT-vertx.js",{template_folder:'template_folder',address:'template.apply',can_compile:true,destination:'compiledbasic/'},function(err, depID) {
	console.log("Deployed Verticle "+depID);
	setup();
	// Deployment is asynchronous and this this handler will be called when it's complete (or failed)
    vassert.assertNull(err);
	// If deployed correctly then start the tests!
	vertxTests.startTests(script);
});
