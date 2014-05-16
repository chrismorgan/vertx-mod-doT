/*
 * Example JavaScript integration test that deploys the module that this project builds.
 *
 * Quite often in integration tests you want to deploy the same module for all tests and you don't want tests
 * to start before the module has been deployed.
 *
 * This test demonstrates how to do that.
 */

var container = require("vertx/container");
var vertx = require("vertx");
var vertxTests = require("vertx_tests");
var vassert = require("vertx_assert");
var console = require('vertx/console');
var fs = require('vertx/file_system');
// The test methods must begin with "test"

function testComplexTemplate() {

	//Test one application
  vertx.eventBus.send("template.apply", {payload:{name:"Jake",age:31},template:'test1'}, function(reply) {
    vassert.assertEquals("<div>Hi Jake!</div><div>31</div>", reply);   
    vassert.testComplete();
  });
}

function testSimpleTemplate(){
  //Test another
  vertx.eventBus.send("template.apply", {payload:{foo:'for my test'},template:'test'}, function(reply) {
	    vassert.assertEquals("<h1>Here is a sample template for my test</h1>", reply);	  
	    vassert.testComplete();
  });
 
}

function testOneDef() {
	vertx.eventBus.send("template.apply", {payload:{foo:"Jake"},template:'test2'}, function(reply) {
	    vassert.assertEquals("<div>Jake</div>", reply);	  
	    vassert.testComplete();
  });  
}

function testMultiDefJst() {
	vertx.eventBus.send("template.apply", {payload:{foo:"bongo",class:"todger"},template:'two'}, function(reply) {
	    vassert.assertEquals("<div class=\"todger\"><div>bongo</div><div>hello</div><div class=\"hidden\"></div><div>world</div><div class=\"visible\"></div></div>", reply);	  
	    vassert.testComplete();
  });  
}

var script = this;
// The script is execute for each test, so this will deploy the module for each one
// Deploy the module - the System property `vertx.modulename` will contain the name of the module so you
// don't have to hardecode it in your tests

//Find absolute path for tests to simulate module deployment
var files = fs.readDirSync('.','.*.*');
if(files.length>0){
	for(var k = 0, l = files.length; k < l; k++){
		console.log(files[k]);
	}
}
container.deployModule('uk.me.watchwith~doT-vertx~1.0-SNAPSHOT',{template_folder:'template_folder',address:'template.apply'/*,destination:'./compiled/'*/},function(err, depID) {
	// Deployment is asynchronous and this this handler will be called when it's complete (or failed)
	  vassert.assertNull(err);
	  // If deployed correctly then start the tests!
	  vertxTests.startTests(script);
});
/*
container.deployVerticle('doT-vertx.js', {template_folder:'template_folder',address:'template.apply',destination:'/compiled/'},function(err, depID) {
  // Deployment is asynchronous and this this handler will be called when it's complete (or failed)
  vassert.assertNull(err);
  // If deployed correctly then start the tests!
  vertxTests.startTests(script);
});
*/

