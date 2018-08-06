$(function() {

	var status;
	var url = 'http://172.16.4.33:4886/status';
	// var url = 'http://172.16.13.115:4888/status';

	var vid = $('#videoMain')[0];

	vid.addEventListener('play', function() {
		console.log("Playing!");
		var status = {
			type: 'play'
		}
		postStatus(status);
	});

	vid.addEventListener('pause', function() {
		console.log("Pause!");
		var status = {
			type: 'pause'
		}
		postStatus(status);
	});

	vid.addEventListener('seeked', function() {
		console.log("Seeked to " + vid.currentTime);
		var status = {
			type: 'seeked',
			to: vid.currentTime
		}
		postStatus(status);
	});

	vid.addEventListener('ended', function() {
		console.log("Ended!");
		var status = {
			type: 'ended'
		}
		postStatus(status);
	});

	//	Custom event defined in mediaplayer.js
	$('#attractScreen').on('attractScreenShow', function() {
		console.log("Returning to attract screen");
		var status = {
			type: 'attract'
		}
		postStatus(status);
	})

	function postStatus(status) {
		console.log("Posting status...");
		$.ajax({
			url: url,
			type: 'POST',
			data: status
		})
		.done(function(newStatus) {
			newStatus = JSON.parse(newStatus);
			console.log("Success! New status: " + newStatus.type);
		})
		.fail(function(err) {
			console.log(err.statusText)
		})
	}


	
});
