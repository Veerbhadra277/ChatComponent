
(function (window, chatApp, $) {

	chatApp.service('utilityService', ['$q', '$window', '$http', '$timeout', function ($q, $window, $http, $timeout) {

		var get_employee_thumbnail_url = $('#getEmployeeThumbnailUrl').val();
		var get_customer_thumbnail_url = $('#getCustomerThumbnailUrl').val();
		var getGeoCoordinatesUrl = $('#getGeoCoordinatesUrl').val();

		var dateFormat = 'dd/mm/yy';
		var maxFileSizeLimit = 25;//in MB

		function getDayDiff(date1, date2) {
			var one_day = 1000 * 60 * 60 * 24;

			var date1_ms = date1.getTime();
			var date2_ms = date2.getTime();

			var difference_ms = date2_ms - date1_ms;

			return Math.round(difference_ms / one_day);
		}

		function getDateFormat(plugin) {
			var format = dateFormat;
			if (plugin === "hot")
				format = "DD/MM/YYYY";
			return format;
		}

		function getFormattedDate(date) {
			var year = date.getFullYear();
			var month = (1 + date.getMonth()).toString();
			var day = date.getDate().toString();
			return month + '/' + day + '/' + year;
		}

		function getFormattedAppointmentDate(date) {
			var weekday = ["Sun", "Mon", "Tues", "Wed", "Thu", "Fri", "Sat"];
			var year = date.getFullYear();
			var month = (1 + date.getMonth()).toString();
			month = month.length == 1 ? "0" + month : month;
			var day = date.getDate().toString();
			day = day.length == 1 ? "0" + day : day;

			var wday = weekday[date.getDay()];
			return wday + ' ' + month + '/' + day + '/' + year;
		}

		function getFormatedDateFromJsonDate(jsonDateStr) {
			if (jsonDateStr !== undefined) {
				var milli = jsonDateStr.replace(/\/Date\((-?\d+)\)\//, '$1');
				var date = new Date(parseInt(milli));
				return getFormatedDateFromDateObject(date);
			}
		}

		function getFormatedShortDateFromJsonDate(jsonDateStr) {
			if (jsonDateStr !== undefined) {
				var milli = jsonDateStr.replace(/\/Date\((-?\d+)\)\//, '$1');
				var date = new Date(parseInt(milli));
				return getFormatedShortDateFromDateObject(date);
			}
		}

		function getFormatedTimeFromJsonDate(jsonDateStr) {
			if (jsonDateStr !== undefined) {
				var milli = jsonDateStr.replace(/\/Date\((-?\d+)\)\//, '$1');
				var date = new Date(parseInt(milli));
				var formatedTime = getFormatedTime(date);
				return formatedTime;
			}
		}

		function getFormatedDateFromDateObject(date) {
			var formatedTime = getFormatedTime(date);
			return $.datepicker.formatDate(dateFormat, date) + " " + formatedTime;
		}

		function getFormatedShortDateFromDateObject(date) {
			return $.datepicker.formatDate(dateFormat, date);
		}

		function getFormatedTimeFromDateObject(date) {
			var formatedTime = getFormatedTime(date);
			return formatedTime;
		}

		function getFormatedTime(date) {
			var hours = date.getHours();
			var minutes = date.getMinutes();
			var ampm = hours >= 12 ? 'PM' : 'AM';
			hours = hours % 12;
			hours = hours ? hours : 12; // the hour '0' should be '12'
			minutes = minutes < 10 ? '0' + minutes : minutes;
			var strTime = hours + ':' + minutes + ' ' + ampm;

			return strTime;
		}

		function convertTimeFormat(time) {
				var hrs = Number(time.match(/^(\d+)/)[1]);
				var mnts = Number(time.match(/:(\d+)/)[1]);
				var format = time.match(/\s(.*)$/)[1];

				if (format == "PM" && hrs < 12)
					hrs = hrs + 12;
				if (format == "AM" && hrs == 12)
					hrs = hrs - 12;

				var hours = hrs.toString();
				var minutes = mnts.toString();
				if (hrs < 10)
					hours = "0" + hours;
				if (mnts < 10)
					minutes = "0" + minutes;
				return hours + ":" + minutes;
		}

		function getActualDayFromDate(dateObj) {

			var resultDateStr = $.datepicker.formatDate(dateFormat, dateObj);

			var inputDate = $.datepicker.parseDate(dateFormat, resultDateStr);
			var todaysDate = $.datepicker.parseDate(dateFormat, $.datepicker.formatDate(dateFormat, new Date(new Date().toISOString())));

			diffDays = (todaysDate - inputDate) / 86400000;
			if (diffDays == 0) {
				resultDateStr = "Today";
			} else if (diffDays == 1) {
				resultDateStr = "Yesterday";
			}
			return resultDateStr;
		}

		function getRandomNumber() {
			var minNumber = 0; // The minimum number you want
			var maxNumber = 100000; // The maximum number you want
			var randomnumber = Math.floor(Math.random() * (maxNumber + 1) + minNumber); // Generates random number
			return randomnumber;
		}

		function getFileExtention(filename) {
			return filename.substring(filename.indexOf(".") + 1);
		}

		function getFileName(fileName) {
			var fileExtension = "." + fileName.split('.').pop();
			return fileName.replace(fileExtension, "");
		}

		function getMessageAuthorThumbnailUrl(id, authorType, successCallback) {
			if (authorType === "Customer") {
				$http({
					method: 'GET',
					url: get_customer_thumbnail_url + '?customerId=' + id
				}).then(function (data) {
					successCallback(data.data);
				});
			}
			else {
				$http({
					method: 'GET',
					url: get_employee_thumbnail_url + '?employeeId=' + id
				}).then(function (data) {
					successCallback(data.data);
				});
			}
		}

		function calculateWidgetHeight() {

			var windowHeight = getWindowHeight();
			var navigationHeaderHeight = angular.element('#divNavigation').length > 0 ? angular.element('#divNavigation').height() : 0;

			var widgetHeight = windowHeight - navigationHeaderHeight - 75;
			return widgetHeight;
		}

		function getWindowHeight() {

			return angular.element(window).height();
		}

		function setWidgetHeight(element) {

			if (element.length > 0) {
				var widgetHeight = calculateWidgetHeight();

				if (element.attr('id') === "divMessageBody") {
					widgetHeight = widgetHeight - 66; // minus message chat section footer height                   
				}

				element.height(widgetHeight);
			}
		}

		function setFixHeaderWidth(element) {
			if (element.length > 0) {
				var width = element.next().outerWidth();
				element.width(width);
			}
		}

		function getFilterModel(pageNum, data) {
			return { Page: pageNum, Rows: data.pageSize, SortBy: data.sortBy, Descending: data.descending, SearchString: data.searchString };
		}

		function setCookie(cname, cvalue) {
			var d = new Date();
			d.setTime(d.getTime() + (2 * 365 * 24 * 60 * 60 * 1000));
			var expires = "expires=" + d.toUTCString();
			document.cookie = cname + "=" + cvalue + "; " + expires;
		}

		function getCookie(cname) {
			var name = cname + "=";
			var ca = document.cookie.split(';');
			for (var i = 0; i < ca.length; i++) {
				var c = ca[i];
				while (c.charAt(0) == ' ') {
					c = c.substring(1);
				}
				if (c.indexOf(name) == 0) {
					return c.substring(name.length, c.length);
				}
			}
			return "";
		}

		function s4() {
			return Math.floor((1 + Math.random()) * 0x10000)
			  .toString(16)
			  .substring(1);
		}

		function newGuid() {
			return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
			   s4() + '-' + s4() + s4() + s4();
		}

		function getDateOptions() {
			return {
				changeYear: true,
				changeMonth: true,
				yearRange: '1600:+20',
				dateFormat: getDateFormat()
			};
		}

		function addMessageId(id) {
			messagesId.push(id);
		}

		function clerAllMessagesId() {
			messagesId = [];
		}

		function isMessageExist(id) {
			return $.inArray(id, messagesId) !== -1;
		}

		function getChatWindow(id) {
			return angular.element("#chatSection_" + id);
		}

		function formatEmoticons(messageId, message) {
			console.log("Unicode message " + message + "Unicode decoded message " + message.toUnicode());
			var message = '<span data-emoji="true" id="' + messageId + '">' + message + '</span>';
			return message;
		}

		function isFileSizeExceed(fileSize) {
			var sizeInMB = (fileSize / (1024 * 1024)).toFixed(2);
			if (sizeInMB > maxFileSizeLimit)
				return true;
			else
				return false;
		}

		function formatNumber(number, isThousandSeperator, decimalPlaces) {
			var formatedNumber = parseFloat(number).toFixed(decimalPlaces);;
			if (isThousandSeperator)
				formatedNumber = ReplaceNumberWithCommas(formatedNumber);

			return formatedNumber;
		}

		function formatCurrency(number, decimalPlaces) {
			var formatedNumber = parseFloat(number).toFixed(decimalPlaces);
			formatedNumber = ReplaceNumberWithCommas(formatedNumber);
			return formatedNumber;
		}
		return {
			getDateFormat: getDateFormat,
			getFormatedDateFromJsonDate: getFormatedDateFromJsonDate,
			getFormatedShortDateFromJsonDate: getFormatedShortDateFromJsonDate,
			getFormatedTimeFromJsonDate: getFormatedTimeFromJsonDate,
			getFormatedDateFromDateObject: getFormatedDateFromDateObject,
			getFormatedTimeFromDateObject: getFormatedTimeFromDateObject,
			getFormatedShortDateFromDateObject: getFormatedShortDateFromDateObject,
			getActualDayFromDate: getActualDayFromDate,
			getFormatedTime: getFormatedTime,
			convertTimeFormat:convertTimeFormat,
			getRandomNumber: getRandomNumber,
			getFileExtention: getFileExtention,
			getMessageAuthorThumbnailUrl: getMessageAuthorThumbnailUrl,
			getFileName: getFileName,
			getWindowHeight: getWindowHeight,
			setWidgetHeight: setWidgetHeight,
			setFixHeaderWidth: setFixHeaderWidth,
			getFilterModel: getFilterModel,
			newGuid: newGuid,
			getCookie: getCookie,
			setCookie: setCookie,
			getDateOptions: getDateOptions,
			addMessageId: addMessageId,
			clerAllMessagesId: clerAllMessagesId,
			isMessageExist: isMessageExist,
			getChatWindow: getChatWindow,
			formatEmoticons: formatEmoticons,
			isFileSizeExceed: isFileSizeExceed,
			formatNumber: formatNumber,
			formatCurrency: formatCurrency,
			getFormattedDate: getFormattedDate,
			getFormattedAppointmentDate: getFormattedAppointmentDate,
			getDayDiff: getDayDiff
		};

	}]);

})(window, chatApp = window.chatApp || {}, jQuery);