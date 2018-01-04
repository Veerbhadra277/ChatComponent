
(function (window, chatApp, $) {
	chatApp.directive('chatSection', ['utilityService', '$timeout', 'xmppConnectionService', '$window', function (utilityService, $timeout, xmppConnectionService, $window) {

		var chatController = ['$scope', function ($scope) {
			var emptyGuid = '00000000-0000-0000-0000-000000000000';
			var defaultDate = Date.now();

			var chatDivSelector = "#divChatSection_" + $scope.to;
			var chatTextareaSelector = "#divChatSectionTextArea_" + $scope.to + " textarea";
			var chatContainerSelector = "#chatContainer_" + $scope.to;
			$scope.isToUserOnline = false;
			$scope.isConnected = false;

			$scope.dateOptions = utilityService.getDateOptions();
			$scope.messageSending = false;
			$scope.messages = [];
			$scope.txtMessage = '';

			$scope.init = function () {
				$scope.messageSending = false;
				angular.element(chatDivSelector).prop("disabled", false);
				utilityService.clerAllMessagesId();
				$scope.message = { text: '', date: '', time: '', to: '' };

				xmppConnectionService.connect($scope.from, $scope.sessionpassword, conn_callback);
			}

			$scope.sendmessage = function (txtMessage) {
				var messageBody = txtMessage;
				if (messageBody.length === 0)
					return;

				var messageId = utilityService.newGuid();

				if (!xmpp_ServerConnection.connected)
					xmppConnectionService.connect($scope.from, $scope.sessionpassword, conn_callback);

				if (xmpp_ServerConnection.connected) {
					var currentDateTime = new Date();
					var msgTime = utilityService.getFormatedTime(currentDateTime);
					var msgDate = utilityService.getFormattedDate(currentDateTime);
					var msg = { text: messageBody, date: msgDate, time: msgTime, to: $scope.to, from: $scope.from, isConsicative: isConsicativeMsgFromUser($scope.from) };

					var message = $msg({
						id: messageId,
						to: $scope.to + '@' + xmpp_Domain,
						type: "chat"
					})
                    .c('body').t(messageBody).up()
                    .c('active', { xmlns: "http://jabber.org/protocol/chatstates" });

					xmpp_ServerConnection.send(message);
					$scope.messages.push(msg);

					utilityService.addMessageId(messageId);
				}

				$scope.message = { text: '', date: '', time: '', to: '' };
				$scope.isscrolled = false;
			}

			$scope.postmessageonenter = function ($event, txtMessage) {
				if ($event.which === 13) {
					$scope.sendmessage(txtMessage);
					$(chatTextareaSelector).val("");
					$(chatContainerSelector).animate({ scrollTop: $(chatContainerSelector).prop("scrollHeight") }, 100);
				}
			}

			var onArchivedMessage = function (message) {
				try {
					var ofrom = $(message).find("forwarded message").attr("from");
					var type = $(message).find("forwarded message").attr("type")

					if (!ofrom || (type && (type == "presence" || type == "presenceAck")))
						return;

					var from = $(message).find("forwarded message").attr("from").split('@')[0];
					var msgDateTime = new Date($(message).find("forwarded delay").attr("stamp"));
					var textMsg = $(message).find("forwarded message body").text();
					var currentDateTime = new Date();
					var msgDate = utilityService.getFormattedDate(msgDateTime);
					var msgTime = getMsgTime(msgDateTime, currentDateTime);
					var isConsicative = $scope.messages
					$scope.messages.push({ text: textMsg, date: msgDate, time: msgTime, from: from, isConsicative: isConsicativeMsgFromUser(from) });
					//console.log("Message from ", $(message).find("forwarded message").attr("from"),
					//	": ", $(message).find("forwarded message body").text(), " Time: ", $(message).find("forwarded delay").attr("stamp"));
					return true;
				} catch (err) {
					console.log(err);
				}
				return true;
			}

			var onMessage = function (msg) {
				try {
					var to = angular.element(msg).attr('to');
					var from = angular.element(msg).attr('from');
					var type = angular.element(msg).attr('type');
					var elems = angular.element(msg).find('body');

					if (type == 'presence' || type == "presenceAck") {
						console.log("yay! its there");
						return;
					}

					if (type == "chat" && elems.length > 0) {
						to = to.split('@')[0];
						from = from.split('@')[0];
						var textMsg = Strophe.getText(elems[0])
						var currentDateTime = new Date();
						var msgDate = utilityService.getFormattedDate(currentDateTime);
						var msgTime = utilityService.getFormatedTime(currentDateTime);
						$scope.messages.push({ text: textMsg, date: msgDate, time: msgTime, from: from, isConsicative: isConsicativeMsgFromUser(from) });
						$scope.$apply(function () { });
						$(chatContainerSelector).animate({ scrollTop: $(chatContainerSelector).prop("scrollHeight") }, 100);
					}
				} catch (err) {
					console.log(err);
				}
				return true;
			}

			var onPresence = function (msg) {
				console.log("in presence handler")
				var to = angular.element(msg).attr('to');
				var from = angular.element(msg).attr('from');
				var type = angular.element(msg).attr('type');
				var elems = angular.element(msg).find('body');

				if (type == "presence" && elems.length > 0) {
					var scope = angular.element($("#divChatSection_" + from.split('@')[0])).scope();
					scope.isToUserOnline = true;
					sendPresenceAck(from, to);
					scope.$apply(function () { });
				}
				return true;
			}

			var onPresenceAck = function (msg) {
				console.log("in presenceAck handler")
				var to = angular.element(msg).attr('to');
				var from = angular.element(msg).attr('from');
				var type = angular.element(msg).attr('type');
				var elems = angular.element(msg).find('body');

				if (type == "presenceAck" && elems.length > 0) {
					var scope = angular.element($("#divChatSection_" + from.split('@')[0])).scope();
					console.log("in presenceAck")
					scope.isToUserOnline = true;
					scope.$apply(function () { });
				}
				return true;
			}

			var onAbsence = function (msg) {
				console.log("in absence handler")
				var to = angular.element(msg).attr('to');
				var from = angular.element(msg).attr('from');
				var type = angular.element(msg).attr('type');
				var elems = angular.element(msg).find('body');

				if (type == "absence" && elems.length > 0) {
					var scope = angular.element($("#divChatSection_" + from.split('@')[0])).scope();

					scope.isToUserOnline = false;
					scope.$apply(function () { });
				}
				return true;
			}

			function getArchivedMessages(to) {
				var toJid = to + '@' + xmpp_ServerConnection.domain;
				var fromJid = xmpp_ServerConnection.authzid;
				var msgs = $scope.messages = [];
				xmpp_ServerConnection.mam.query(fromJid, {
					"with": toJid,
					"max": 500,
					"before": '',
					onMessage: onArchivedMessage,
					onComplete: function (response) {
						var t = $scope.messages;
						$scope.$apply(function () { });
						$(chatContainerSelector).animate({ scrollTop: $(chatContainerSelector).prop("scrollHeight") }, 100);
						console.log("Got all the messages");
					}
				});
			}

			function getCurrentMessage(messageId, messageBody, fileId, isPrivateMessage) {
				var fileExtention = '';

				var currentMessage = messageBody
				return currentMessage;
			}

			function sendPresence(to, from) {
				var msg = $msg({ to: to, from: from, type: 'presence', id: xmpp_ServerConnection.getUniqueId('list') }).c('body').t("");
				xmpp_ServerConnection.receipts.sendMessage(msg);
			}

			function sendPresenceAck(to, from) {
				var msg = $msg({ to: to, from: from, type: 'presenceAck', id: xmpp_ServerConnection.getUniqueId('list') }).c('body').t("");
				xmpp_ServerConnection.receipts.sendMessage(msg);
			}

			function sendAbsence(to, from) {
				var msg = $msg({ to: to, from: from, type: 'absence', id: xmpp_ServerConnection.getUniqueId('list') }).c('body').t("");
				xmpp_ServerConnection.receipts.sendMessage(msg);
			}

			function conn_callback(status) {

				if (status === Strophe.Status.CONNECTED) {
					console.log("Finalizing connection and then triggering connected...");

					try {
						console.log('xmpp connected');
						xmpp_ServerConnection.mode = "";
						getArchivedMessages($scope.to);
						try {
							xmpp_ServerConnection.deleteHandler(onMessage);
							xmpp_ServerConnection.deleteHandler(onPresence);
							xmpp_ServerConnection.deleteHandler(onPresenceAck);
							xmpp_ServerConnection.deleteHandler(onAbsence);
						} catch (err) {
							console.log("onMessage remove error :: " + err);
						}
						xmpp_ServerConnection.addHandler(onMessage, null, "message", 'chat');
						xmpp_ServerConnection.receipts.addReceiptHandler(onPresence, "presence", null, null);
						xmpp_ServerConnection.receipts.addReceiptHandler(onPresenceAck, "presenceAck", null, null);
						xmpp_ServerConnection.receipts.addReceiptHandler(onAbsence, "absence", null, null);
						//xmpp_ServerConnection.addHandler(onPresence, null, "presence", 'chat'); //on_presence
						xmpp_ServerConnection.send($pres());
						sendPresence($scope.to + "@" + xmpp_Domain, $scope.from + "@" + xmpp_Domain);
						$scope.isConnected = true;
						$scope.$apply(function () { });
						
					} catch (err) {
						console.log(err);
					}

				} else if (status === Strophe.Status.AUTHENTICATING) {
					console.log("XMPP/Strophe Authenticating...");
				} else if (status === Strophe.Status.CONNECTING) {
					console.log("XMPP/Strophe Connecting...");
				} else if (status === Strophe.Status.ATTACHED) {
					console.log("Re-Attach of connection successful. Triggering re-attached...");
				} else if (status === Strophe.Status.DISCONNECTED) {
					console.log(Date() + "  XMPP/Strophe Disconnected.");
					$scope.isToUserOnline = false;
					$scope.isConnected = false;
					$scope.$apply(function () { });
					Connect();
				} else if (status === Strophe.Status.DISCONNECTING) {
					$scope.isToUserOnline = false;
					$scope.isConnected = false;
					console.log("XMPP/Strophe is Dis-Connecting...should we try to re-attach here? TODO:RMW");
				} else if (status === Strophe.Status.CONNFAIL) {
					$scope.isToUserOnline = false;
					$scope.isConnected = false;
					console.log("XMPP/Strophe reported connection failure...attempt to re-attach...");
					xmpp_ServerConnection.attach(xmpp_user, xmpp_sid, xmpp_rid);
				} else if (status === Strophe.Status.AUTHFAIL) {
					$scope.isToUserOnline = false;
					$scope.isConnected = false;
					console.log("Authentication failed. Bad password or username.");
					$scope.$apply(function () { });
				} else {
					$scope.isToUserOnline = false;
					$scope.isConnected = false;
					console.log("Strophe connection callback - unhandled status = " + status);
				}
			}

			function getMsgTime(date1, date2) {
				var msgTimeString = utilityService.getFormattedDate(date1) + ', ' + utilityService.getFormatedTime(date1);
				var diffdays = utilityService.getDayDiff(date1, date2);
				switch (diffdays) {
					case 0:
						msgTimeString = utilityService.getFormatedTime(date1)
						break;
					case 1:
						var msgTimeString = 'Yesterday' + ', ' + utilityService.getFormatedTime(date1);
						break;
					default:
				}
				return msgTimeString;
			}

			function isConsicativeMsgFromUser(from) {
				var isConMsg = false;
				if ($scope.messages.length > 0)
				{
					var lastMsg = $scope.messages[$scope.messages.length - 1];
					isConMsg = lastMsg.from == from;
				}
				return isConMsg;
			}

			angular.element(chatDivSelector).on("keypress", "div.chat-window-text-box", function ($event) {
				if ($event.which === 13) {
					if (angular.element(chatDivSelector).html() === '') {
						console.log('empty div');
						return false;
					}
				}
			});

			$scope.onExit = function () {
				var to = $scope.to;
				var from = $scope.from;
				sendAbsence(to + "@" + xmpp_Domain, from + "@" + xmpp_Domain);
				xmppConnectionService.disconnect()
			};

			$window.onbeforeunload = $scope.onExit;
		}];

		return {
			restrict: 'E',
			scope: {
				to: '@',
				toname: '@',
				toavtar: '@',
				from: '@',
				fromname: '@',
				fromavtar:'@',
				sessionpassword: '@'
		},
			templateUrl: 'Templates/chatSection.tmpl.html',
			controller: chatController,
		};
	}]);

})(window, chatApp = window.chatApp || {}, jQuery);