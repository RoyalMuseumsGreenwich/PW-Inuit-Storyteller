$(function() {
	
	var url = 'http://172.16.4.33:4886/status';
	// var url = 'http://172.16.13.115:4888/status';

	var status = {
		type: 'attract'
	};

	function getControllerStatus(status) {
		console.log("Checking controller status...");
		$.ajax({
			url: url,
			type: 'GET'
		})
		.done(function(controllerStatus) {
			console.log(controllerStatus)
			controllerStatus = JSON.parse(controllerStatus);
			console.log("Success! New status: " + controllerStatus.type);
		})
		.fail(function(err) {
			console.log(err.statusText)
		})
	}


	setInterval(function() {
		getControllerStatus()
	}, 250)

});