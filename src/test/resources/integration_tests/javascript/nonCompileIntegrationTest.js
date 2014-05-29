var container = require("vertx/container");
var vertx = require("vertx");
var vertxTests = require("vertx_tests");
var vassert = require("vertx_assert");
var console = require('vertx/console');
var fs = require('vertx/file_system');


function testDisallowedCompile(){
	setup();	
	vertx.eventBus.send("template.apply", {action:'compile',payload:'<h1>Here is a sample template {{=it.foo}}</h1>',template:'compile1'}, function(reply1) {
		vassert.assertEquals("ERROR", reply1.status);
		vassert.testComplete();	  
	}); 
}

var script = this;

function setup(){
	console.log("Cleaning compilation folder");
	fs.deleteSync("./compiled/",true);
	console.log("Cleaned");
}

container.deployVerticle("doT-vertx.js",{template_folder:'template_folder',address:'template.apply',can_compile:false,destination:'compiled/'},function(err, depID) {

	vassert.assertNull(err);	
	vertxTests.startTests(script);
});
