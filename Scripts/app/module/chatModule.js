//Declare variables which is used Globally
var xmpp_ServerConnection = null;
var xmpp_Domain = "xmpp server";
var xmpp_user = null;
var xmpp_Server = 'http://' + xmpp_Domain + ':5280/http-bind';
var messagesId = [];

(function (angular, window) {
	window.chatApp = angular
			.module('chatApp', [
			]).config(['$locationProvider', function ( $locationProvider) {
				$locationProvider.html5Mode(false);
			}]);

	$(window).bind('beforeunload', function () {
		console.log('disconnecting on page refresh')
		//xmppDisconnect();
	});
	
	function xmppDisconnect() {
		xmpp_ServerConnection.flush();
		xmpp_ServerConnection.options.sync = true;
		xmpp_ServerConnection.disconnect();
		xmpp_ServerConnection = null;
	}
})(angular, window);

