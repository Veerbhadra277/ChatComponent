(function (window, chatApp, $) {
	chatApp.service('xmppConnectionService', ['$http', 'utilityService', function ($http, utilityService) {

		function Connect(userId, sessionPassword, conn_callback) {

			xmpp_user = userId + "@" + xmpp_Domain + "/" + getRandomResourceId();
			var xmpp_password = sessionPassword ? sessionPassword : "";

			if (xmpp_ServerConnection === null) {
				xmpp_ServerConnection = new Strophe.Connection(xmpp_Server);
				console.log("xmpp connect " + xmpp_ServerConnection.connected);
			}

			if (!xmpp_ServerConnection.connected && !xmpp_ServerConnection.mode) {
				xmpp_ServerConnection.mode = "Connecting";
				xmpp_ServerConnection.connect(xmpp_user, xmpp_password, conn_callback);
			}
		}

		function getRandomResourceId() {

			var resourceId = utilityService.getCookie("xmppResouceId");
			if (resourceId.indexOf("b_") > 0) {
				console.log("Found existing resourceId : " + resourceId);
			} else {
				var miliSecond = new Date().getTime();
				var randomnumber = Math.floor(Math.random() * (10000 + 1) + 1); // Generates random number
				resourceId = "web_" + randomnumber + "_" + miliSecond;
				utilityService.setCookie("xmppResouceId", resourceId);

				console.log("Created new resourceId : " + resourceId);
			}
			return resourceId;
		}

		function Disconnect() {
			try {
				xmpp_ServerConnection.flush();
				xmpp_ServerConnection.options.sync = true;
				xmpp_ServerConnection.disconnect();
				xmpp_ServerConnection = null;
				console.log("deleted existing connection");
			}
			catch (err) {
				console.log(err);
			}
		}

		return {
			connect: Connect,
			disconnect: Disconnect
		};
	}]);
})(window, chatApp = window.chatApp || {}, jQuery);