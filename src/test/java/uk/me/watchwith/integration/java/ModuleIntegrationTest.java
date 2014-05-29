package uk.me.watchwith.integration.java;

import org.junit.Test;
import org.vertx.java.core.AsyncResult;
import org.vertx.java.core.AsyncResultHandler;
import org.vertx.java.core.Future;
import org.vertx.java.core.Handler;
import org.vertx.java.core.buffer.Buffer;
import org.vertx.java.core.eventbus.Message;
import org.vertx.java.core.http.HttpClientResponse;
import org.vertx.java.core.http.HttpServerRequest;
import org.vertx.java.core.json.JsonObject;
import org.vertx.testtools.TestVerticle;
import org.vertx.testtools.VertxAssert;

import static org.vertx.testtools.VertxAssert.*;

/**
 * Example Java integration test that deploys the module that this project builds.
 *
 * Quite often in integration tests you want to deploy the same module for all tests and you don't want tests
 * to start before the module has been deployed.
 *
 * This test demonstrates how to do that.
 */
public class ModuleIntegrationTest extends TestVerticle {

  @Test
  public void testRender() {
	  
    vertx.createHttpClient().setSSL(false)
    	.setHost("127.0.0.1")
    	.setPort(9999)
    	.setConnectTimeout(1000)
		.setKeepAlive(true)
		.setTrustAll(true)
    	.get("/test",new Handler<HttpClientResponse>() {
		
		@Override
		public void handle(HttpClientResponse resp) {
			
			resp.pause();
			resp.bodyHandler(new Handler<Buffer>(){

				@Override
				public void handle(Buffer arg0) {
						
					assertEquals("Result does not match", "<div class=\"sausage\"><div>bongo</div><div>hello</div><div class=\"hidden\"></div><div>world</div><div class=\"visible\"></div></div>", arg0.toString("UTF-8"));
					testComplete();		
					
				}});
			resp.resume();
			
		}
	}).end();

  }
  
  @Override
  public void start(){}
  
  @Override
  public void start(final Future<Void> result) {
    // Make sure we call initialize() - this sets up the assert stuff so assert functionality works correctly
    initialize();
    
    container.logger().info("Deploying vertx-mod-doT");
	
    //Deploy the template engine
    JsonObject config = new JsonObject();
	config.putString("template_folder", "template_folder");
	config.putString("address", "vertx.mod.doT");
	config.putBoolean("can_compile", true);
	config.putString("destination", "./compiled/");
	
	// Deploy the module - the System property `vertx.modulename` will contain the name of the module so you	   
	container.deployModule(System.getProperty("vertx.modulename"),config, new Handler<AsyncResult<String>>() {
		
		@Override
		public void handle(AsyncResult<String> event) {
			
			if(event.succeeded()){
				
				container.logger().debug("Deployed vertx-mod-doT");
				
				 // don't have to hardecode it in your tests
			    JsonObject config = new JsonObject()
			    	.putString("web_root", ".")
					.putString("index_page", "index.html")
					.putString("host", "127.0.0.1")
					.putNumber("port", 9999)
					.putBoolean("static_files",false)
					.putBoolean("route_matcher", true)
					.putBoolean("gzip_files", false)
					.putBoolean("bridge", false);
			    
				container.deployVerticle(WebServer.class.getName(), config, new Handler<AsyncResult<String>>() {
				
					@Override
				    public void handle(AsyncResult<String> asyncResult) {
						  
				    	  container.logger().info("Started");
				    	  
				    	  result.setResult(null);
					      // Deployment is asynchronous and this this handler will be called when it's complete (or failed)
					      assertTrue(asyncResult.succeeded());
					      
					      assertNotNull("deploymentID should not be null", asyncResult.result());
					      // If deployed correctly then start the tests!
					      startTests();
					 }
				});			
				
			}else{
				container.logger().error("Failed deploying vertx-mod-doT");	
				result.setFailure(event.cause());
			}
		}
	});
    
  }

}
