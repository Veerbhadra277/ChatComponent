(function (window, chatApp, $) {
	chatApp.service('xmppMessageHandlerService', ['$http', '$timeout', 'utilityService', function ($http, $timeout, utilityService) {

		function onMessage(msg) {
			var to = angular.element(msg).attr('to');
			var from = angular.element(msg).attr('from');
			var type = angular.element(msg).attr('type');
			var elems = angular.element(msg).find('body');

			if (type == "chat" && elems.length > 0) {
				var message = $.parseJSON($("<div/>").html(Strophe.getText(elems[0])).text());
				console.log("Message received from ejaberred");
				console.log("MesssageId: " + message.Body.Id);
				console.log("Type: " + message.Type);
				console.log("Body: " + message.Body);

				var messageId = message.Body.Id;
				if (!messageId) {
					console.log("MessageId undefined");
					return true;
				}
				else {
					console.log("MessageId " + messageId);
					if (messageId && utilityService.isMessageExist(messageId)) {
						console.log("Message exist MessageId " + messageId);
						return true;
					}
					else {
						if (messageId)
							utilityService.addMessageId(messageId);

						var type = message.Type;
						var entityType = message.Body.Entity;

						$timeout(function () {
							handleMessageChatSectionWindow(entityType, message.Body);
						}, 600);
					}
				}
			}
			return true;
		}

		function getValueFromEventData(key, data) {
			var object = $.grep(data, function (item) {
				return item.Name === key;
			});

			if (object.length > 0)
				return object[0].Value;
			else
				return '';
		}

		function handleMessageChatSectionWindow(entityType, message) {

			var chatElement = null;
			var isSubjectChatSection = false;
			var isGroupChatSection = false;

			if (chatElement !== null && chatElement.length > 0) {

				utilityService.getMessageAuthorThumbnailUrl(message.Author.Id, message.Author.Type, function (authorThumbnailUrl) {
					$timeout(function () {
						if (message.Content.length > 0)
							renderMessageOnChatSection(message, isSubjectChatSection, isGroupChatSection, authorThumbnailUrl);
					});
				});
			}
		}

		function renderMessageOnChatSection(message, isSubjectChatSection, isGroupChatSection, authorThumbnailUrl) {
			var dayString = utilityService.getActualDayFromDate(new Date(message.SentDate));

			var fileExtention = ''
			

			if (message.Appointment)
				var appointmentDate = new Date(Date.parse(message.Appointment.Date));

			var latestMessageBody = getMessageBody(message, "chatWindow");
			latestMessageBody = utilityService.formatEmoticons(message.Id, latestMessageBody);
			var inputMessage = {
				messageBody: latestMessageBody,
				messageSent: utilityService.getFormatedDateFromJsonDate(message.SentDate),
				messageSentTime: utilityService.getFormatedTimeFromDateObject(new Date(message.SentDate)),
				messageStatus: 2,
				messageContentType: message.ContentType,
				isSystemMessage: message.IsSystemMessage,
				attachment: message.Attachment ? {
					mimeType: message.Attachment.MimeType, attachmentId: message.Attachment.AttachmentId, thumbnailId: message.Attachment.ThumbnailId,
					attachmentUrl: ''
				}
                    : { mimeType: '', attachmentId: '', thumbnailId: '', attachmentUrl: '', thumbnailUrl: '' },
				appointment: message.Appointment ? {
					id: message.Appointment.Id, title: message.Appointment.Title, status: message.Appointment.Status, startTime: message.Appointment.StartTime,
					duration: message.Appointment.Duration, employee: { id: message.Appointment.Employee.Id, name: message.Appointment.Employee.Name },
					date: utilityService.getFormattedAppointmentDate(appointmentDate), location: { id: message.Appointment.LocationId, name: message.Appointment.LocationName, address: message.Appointment.LocationAddress }, description: message.Appointment.Description
				}
				: { appointmentId: '', title: '', status: '', startTime: '', duration: '', employee: { id: '', name: '' }, date: '', location: '', description: '' },
				author: { name: message.Author.Name, type: message.Author.Type },
				authorThumbnailUrl: authorThumbnailUrl,
				location: message.ContentType === 'Location' ? {
					latitude: message.Location.Latitude,
					longitude: message.Location.Longitude,
					lastModified: message.Location.LastModified
				} : {},
				group: null,
				isPrivate: message.IsPrivate,
				feedback: message.Feedback ? { templateName: message.Feedback.TemplateName, templateVersion: message.Feedback.Version, feedbackId: message.Feedback.FeedbackId } : { templateName: '', feedbackId: '', templateVersion: '' },
				delivered: true
			};
			console.log("Message " + inputMessage);
			var messages = null;
			var chatSection = angular.element("chat-section");

			if (isSubjectChatSection) {
				messages = chatSection.scope().subject.messages;
				chatSection.scope().subject.latestMessage.message = latestMessageBody;
				chatSection.scope().subject.latestMessage.authorName = inputMessage.author.name;
				chatSection.scope().subject.latestMessage.messageSent = utilityService.getFormatedDateFromDateObject(new Date());
				chatSection.scope().subject.latestMessage.created = new Date();
				if (message.ContentType === 'Location')
					chatSection.scope().subject.locations.push({ latitude: message.Location.Latitude, longitude: message.Location.Longitude });
			}
			else if (isGroupChatSection) {
				messages = chatSection.scope().groupDetails.messages;
				chatSection.scope().groupDetails.latestMessage.message = latestMessageBody;
				chatSection.scope().groupDetails.latestMessage.authorName = inputMessage.author.name;
				chatSection.scope().groupDetails.latestMessage.messageSent = utilityService.getFormatedDateFromDateObject(new Date());
				chatSection.scope().groupDetails.latestMessage.created = new Date();
				if (message.ContentType === 'Location')
					chatSection.scope().groupDetails.locations.push({ latitude: message.Location.Latitude, longitude: message.Location.Longitude });
			}
			else {
				messages = chatSection.scope().topicDetails.messages;
				chatSection.scope().topicDetails.latestMessage.message = latestMessageBody;
				chatSection.scope().topicDetails.latestMessage.messageSent = utilityService.getFormatedDateFromDateObject(new Date());
				chatSection.scope().topicDetails.latestMessage.created = new Date();
			}

			if (messages !== null) {
				if (messages.groupMessages[dayString]) {
					messages.groupMessages[dayString].push(inputMessage);
				}
				else {
					messages.groupHeaders.push(dayString);
					messages.groupMessages[dayString] = [inputMessage];
				}
				chatSection.scope().$apply();
				$timeout(function () {
					var selector = 'span#' + message.Id;
					$(selector).Emoji({
						path: '/staytuned/Content/Emoji/img/apple40/',
						class: 'emoji',
						ext: 'png'
					});
				}, 100);
			}
		}

		function getMessageBody(message, renderOn) {

			var resultMessageBody = message.Content;

			if (message.ContentType === messageContentTypeEnum.Feedback) {
				if (renderOn === "chatWindow") {
					if (!message.Feedback.IsSubmitted) {
						resultMessageBody = resultMessageBody.replace("{0}", utilityService.getFeedbackRequestedMessageLink().replace("{0}", message.Feedback.TemplateName));
					}
					else {
						resultMessageBody = resultMessageBody.replace("{0}", utilityService.getFeedbackSubmitedMessageLink().replace("{0}", message.Feedback.TemplateName));
					}
				}
				else {
					resultMessageBody = resultMessageBody.replace("{0}", message.Feedback.TemplateName);
				}
			}

			return resultMessageBody;
		}

		function logout() {

			var logout_url = $('#logoutUrl').val();

			$.ajax({
				type: "POST",
				url: logout_url,
				success: function () {
					xmpp_ServerConnection.flush();
					xmpp_ServerConnection.options.sync = true;
					xmpp_ServerConnection.disconnect();
					xmpp_ServerConnection = null;

					window.location.reload();
				}
			});
		}

		return {
			onMessage: onMessage
		};
	}]);
})(window, chatApp = window.chatApp || {}, jQuery);