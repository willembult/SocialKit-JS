/*
 * Browser platform interface
 */

Musubi.Browser = {};

Musubi.Browser.Environment = function(transport) {
	var thisEnv = this;
	this._instances = {};
	this._transport = transport;
	
	this._transport.onMessage(function(msg) {
		for (var frame in thisEnv._instances) {
			var instance = thisEnv._instances[frame];
			instance._newMessage(msg);
		}
	});
	
	this._loadAppInFrame = function(appId, frame, callback) {
		var frm = window.frames[frame];
		
		frm.location = '../apps/' + appId + '/index.html';
		$('[name=' + frame + ']').load(function() {
			callback(frm.Musubi);
		});
	};
	
	this.startInstance = function(frame, user, feed, appId) {
		var context = {appId: appId, feed: feed, user: user, message: null};
		
		this._loadAppInFrame(appId, frame, function(instance) {
			thisEnv._instances[frame] = instance;
			instance.platform = Musubi.Browser.IFramePlatformFactory(thisEnv._transport, context);	
			instance._launch(user, feed, appId, null);
		});
	};
}

Musubi.Browser.IFramePlatformFactory = function(transport, context) {
	return {
		_messagesForFeed: function(feedName, callback) {},
	    _postObjToFeed: function(obj, feedName) {
	    	transport.postObj(obj, context.feed.session, context.user, context.appId);
	    },
	
		// these are not important in our context
	    _setConfig: function(config) {},
	    _log: function(msg) {}
	}
};

Musubi.Browser.InterFrameTransport = function(feedName) {
	this._messageListener;
	
	this.postObj = function(obj, feedName, sender, appId) {
		var msg = new SocialKit.SignedMessage();
		msg.timestamp = new Date().getTime();
    	msg.feedName = feedName;
    	msg.appId = appId;
    	msg.obj = obj;
    	msg.sender = sender;
    	msg.recipients = [];
    	
    	this._messageListener(msg);
	};
	
	this.onMessage = function(callback) {
		this._messageListener = callback;
	}
};