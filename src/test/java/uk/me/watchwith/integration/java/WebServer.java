package uk.me.watchwith.integration.java;

import org.vertx.java.core.Handler;
import org.vertx.java.core.eventbus.Message;
import org.vertx.java.core.http.HttpServerRequest;
import org.vertx.java.core.http.RouteMatcher;
import org.vertx.java.core.json.JsonObject;
import org.vertx.mods.web.WebServerBase;

public class WebServer extends WebServerBase {

	//private final JsonObject templateRequest = new JsonObject("{\"action\":\"apply\",\"template\":\"two\",\"payload\":{\"foo\":\"bongo\",\"class\":\"sausage\"}}");
	private final JsonObject templateRequest = new JsonObject()
										.putString("action", "apply")
										.putString("template", "two")
										.putObject("payload", new JsonObject()
															.putString("foo","bongo")
															.putString("class","sausage"));
	
	@Override
	protected RouteMatcher routeMatcher() {
		
	    RouteMatcher rm = new RouteMatcher();
	   
	  	rm.get("/test", new Handler<HttpServerRequest>(){

			@Override
			public void handle(final HttpServerRequest req) {
				
				container.logger().debug("Requested template");
				
				eb.send("vertx.mod.doT", templateRequest, new Handler<Message<JsonObject>>() {
						
					@Override
					public void handle(Message<JsonObject> message) {
						
						String status = getMandatoryString("status", message);
						if("OK".equals(status)){
							String text = getMandatoryString("message", message);
							req.response().setStatusCode(200).end(text);
						}else{
							req.response().setStatusCode(400).end();
						}
					}
				});
			
			}
		
	  	});
	  		
		rm.noMatch(staticHandler());
		return rm;
	}
}
