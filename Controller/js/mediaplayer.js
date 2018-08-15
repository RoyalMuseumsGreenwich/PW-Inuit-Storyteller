$(function() {
	console.log('Media player connected...');

	// document.addEventListener('contextmenu', function(e) {
	// 	e.preventDefault();
	// });

	//	DOM variables
	var $stillThereScreen = $('#stillThereScreen'),
			$attractScreen = $('#attractScreen'),
			$menuScreen = $('#menuScreen'),
			$videoPlayerScreen = $('#videoPlayerScreen'),
			$container = $('#container');

	//	Video players & UI
	var $videoMain = $('#videoMain'),
			$videoBsl = $('#videoBsl'),
			$bslBtn = $('#bslBtn'),
			$captionDisplay = $('#captionDisplay'),
			$captionBtn = $('#captionBtn'),
			$subtitleDisplay = $('#subtitleDisplay'),
			$restartBtn = $('#restartBtn'),
			$menuBtn = $('#menuBtn');

	//	HTML elements
	var videoMain = $('#videoMain').get(0),
			videoBsl = $('#videoBsl').get(0);

	var $playPauseBtn = $('#playPauseBtn'),
			$seekSlider = $('#seekSlider'),
			$curTimeText = $('#curTimeText'),
			$durTimeText = $('#durTimeText');

	var lockedControls = false;

	var idleTime = 0,
			playing = true;

	//	Timers & handlers
	var stillThereTime, stillThereHandler, inactivityHandler, backToMenuHandler;
  var idleInterval = setInterval(timerIncrement, 1000); 					// 1 second
  var seekSliderHandler;

  var config = {};

	//	XML
	var xmlPath_Content = "xml/content.xml";
	var $xmlDoc_Content;
	var xmlPath_Attractor = "xml/attractor.xml";
	var $xmlDoc_Attractor;
	var defaultThumbnailFolder, defaultVideoFolder, defaultBslFolder, defaultSubtitleFolder;
	var clipArray = [];



	//	Called on first load
	function firstLoad() {
		console.log("Loading", "The application is loading...");
		loadXml(xmlPath_Content, $xmlDoc_Content);
		loadXml(xmlPath_Attractor, $xmlDoc_Attractor);
	}



	//	XML & content loading
	//	Read xml file
	function loadXml(xmlPath, xmlDoc){
		// Load the xml file using ajax
		$.ajax({
			type: "GET",
			url: xmlPath,
			dataType: "xml",
			success: function(xml){
				console.log("XML data loaded from \"" + xmlPath + "\"");
				$xml = $(xml);
				switch($xml.find('xmlType').text()) {
					case 'Attractor': {
						processAttractorXml($xml);
						break;
					}
					case 'Content': {
						processContentXml($xml);
						break;
					}
					default: {
						break;
					}
				}
			},
			error: function(jqXHR, textStatus, errorThrown) {
				console.log(textStatus, errorThrown);
			}
		});
	}

	function processAttractorXml($xml){
		console.log("Processing Attractor screen XML...");
		$('.attractorHeadline').text($xml.find('attractorHeadline').text());
		$('.attractorBodyText').text($xml.find('attractorBodyText').text());
		$('.attractorVid source').attr('src', $xml.find('attractorVidPath').text());
		$('.attractorVid').each(function(index, attractorVid) {
			attractorVid.load();
			attractorVid.play();
		});
	}

	function processContentXml($xml){
		console.log("Processing Content XML...");

		config.inactivityTimerMax = parseInt($xml.find('config inactivityTimerMax').text()) * 1000;
		config.stillThereTimeMax = parseInt($xml.find('config stillThereTimeMax').text());
		config.portraitMode = $xml.find('config portraitMode').text() === 'true' ? true : false;
		config.menuTitle = $xml.find('config menuTitle').text();
		config.menuBgImg = $xml.find('config menuBgImg').text();
		config.smallScreen = $xml.find('config smallScreen').text() === 'true' ? true : false;
		config.hideControls = $xml.find('config hideControls').text() === 'true' ? true : false;
		config.subtitlePosition = $xml.find('config subtitlePosition').text() === '' ? 'bottom' : $xml.find('config subtitlePosition').text();
		config.hideBslBtn = $xml.find('config hideBslBtn').text() === 'true' ? true : false;
		config.hideSubsBtn = $xml.find('config hideSubsBtn').text() === 'true' ? true : false;
		config.playBslByDefault = $xml.find('config playBslByDefault').text() === 'true' ? true : false;
		config.playSubsByDefault = $xml.find('config playSubsByDefault').text() === 'true' ? true : false;

		defaultThumbnailFolder = $xml.find('defaultFolders thumbnailImages').text();
		defaultVideoFolder = $xml.find('defaultFolders video').text();
		defaultBslFolder = $xml.find('defaultFolders bsl').text();
		defaultSubtitleFolder = $xml.find('defaultFolders subtitles').text();

		//	Load XML slide data to slidesArray
		$xml.find('clip').each(function(){
			//	Build up slide variable
			var $thisClip = $(this);
			var thisClipObject = {
				title: $thisClip.find('title').text(),
				description: $thisClip.find('description').text(),
				attribution: $thisClip.find('attribution').text()
			}
			//	Set paths to clip content files - use default folders if not specified for individual clip
			thisClipObject.videoPath = $thisClip.find('video folder').text() ? $thisClip.find('video folder').text() : defaultVideoFolder;
			thisClipObject.videoPath += '/' + $thisClip.find('video file').text();
			//	Add BSL and subtitle paths if present for clip
			if($thisClip.find('bsl file').text()) {
				thisClipObject.bslPath = $thisClip.find('bsl folder').text() ? $thisClip.find('bsl folder').text() : defaultBslFolder;
				thisClipObject.bslPath += '/' + $thisClip.find('bsl file').text();
			}
			if($thisClip.find('subtitles file').text()) {
				thisClipObject.subtitlePath = $thisClip.find('subtitles folder').text() ? $thisClip.find('subtitles folder').text() : defaultSubtitleFolder;
				thisClipObject.subtitlePath += '/' + $thisClip.find('subtitles file').text();
			}
			//	Set up clip thumbnail
			thisClipObject.thumbnailImagePath = $thisClip.find('thumbnailImage folder').text() ? $thisClip.find('thumbnailImage folder').text() : defaultThumbnailFolder;
			thisClipObject.thumbnailImagePath += '/' + $thisClip.find('thumbnailImage file').text();

			// console.log(thisClipObject);
			clipArray.push(thisClipObject);
		});
		// console.log(config);
		bufferVid(0);
		resetVideoPlayer();
	}

	function generateThumbnails() {
		if(clipArray.length > 1) {
			if(clipArray.length <= 3) {
				$('.obscurer').remove();
			}
			clipArray.forEach(function(clip, index) {
				var newElement = 
					'<div class="thumbnail"' + 
					'data-clipArrayIndex="' + index + '">' + '<div class="thumbImg">' +
					'<div class="playBtnDiv"><div class="playBtnIconDiv animated pulse infinite">' +
					'<div class="playBtnRing"></div><div class="playBtnTriangle"></div></div></div>' +
					'<span class="thumbDuration">' + clip.duration + '</span></div>' +
					'<div class="thumbInfo"><h2>' + clip.title + '</h2><h4>' + clip.description + '</h4>' +
					'<div class="thumbAttribution">' + clip.attribution + '</div></div></div>';
				$('#thumbnailDiv').append(newElement);

				//	Set thumbnail image
				$('#thumbnailDiv').children().last().children().first().css('background-image', 'url(' + clip.thumbnailImagePath + ')');

				//	Thumbnail click handler
				$('#thumbnailDiv').children().last().on('click', function() {
					if(!lockedControls) {
						$('.thumbnail').each(function(index, thumb){
							$(thumb).addClass('unSelected animated');
						});
						$(this).removeClass('unSelected');
						$(this).addClass('selected');
						console.log('Playing ' + $(this).attr('data-clipArrayIndex'));
						playClip($(this).attr('data-clipArrayIndex'));
					}
				});
			});
			$('#thumbnailDiv').append('<div class="thumbPadDiv">&nbsp;</div>');
		} else {
			loadClip(0);
		}
		configureDisplay();
	}

	function configureDisplay() {
		if(config.portraitMode) {
			$container.addClass('portrait');
		} else {
			$container.addClass('landscape');
		}
		if($('.thumbnail').length === 2) {
			$('#thumbnailDiv').addClass('twoThumb');
		}
		if(config.menuTitle && config.menuTitle !== '') {
			$('#menuTitle').text(config.menuTitle)
		} else {
			$('#menuTitle').remove();
		}
		if(config.menuBgImg && config.menuBgImg !== '') {
			$('.menuOverlay').remove();
			var bgImg = 'url(' + config.menuBgImg + ')';
			$menuScreen.css('background-image', bgImg);
		}
		if(config.smallScreen) {
			$container.addClass('smallScreen');
		}
		if(config.hideBslBtn) {
			$('#bslBtn').remove();
		}
		if(config.hideSubsBtn) {
			$('#captionBtn').remove();
		}
	}

	function bufferVid(index) {
		if(index < clipArray.length) {
			$('#videoMain source').attr('src', clipArray[index].videoPath);
			$videoMain.get(0).load();
			if(clipArray[index].bslPath) {
				$('#videoBsl source').attr('src', clipArray[index].bslPath);
				$videoBsl.get(0).load();
			}
			$videoMain.on('loadedmetadata', function() {
				$videoMain.off('loadedmetadata');
				clipArray[index].duration = formatDurationText(videoMain.duration);
				console.log(videoMain.duration);
				index++;
				console.log("Video " + index + " buffered...");
				bufferVid(index);
			});
		} else {
			generateThumbnails();
		}
	}

	function formatDurationText(duration) {
		duration = Math.floor(duration);
		console.log("Duration: " + duration);
		var formattedDuration;
		if(duration <= 60) {
			formattedDuration = duration + ' seconds';
		} else {
			var mins = Math.floor(duration / 60);
			var secs = Math.floor(duration % 60) < 10 ? '0' + Math.floor(duration % 60) : Math.floor(duration % 60);
			formattedDuration = mins + ':' + secs + ' minutes';
		}
		return formattedDuration;
	}


	//	Video clip control
	function playClip(index) {
		if(!lockedControls) {
			lockedControls = true;
			loadClip(index);
			$videoPlayerScreen.show();
			setTimeout(function() {
				playVids();
				rewindClip();
				$menuScreen.fadeOut('slow', function() {
					$('.thumbnail').removeClass('animated selected unSelected');
					stopAttractorVids();
					lockedControls = false;
				});
			}, 1000);
		}
	}

	function loadClip(index) {
		$('#videoMain source').attr('src', clipArray[index].videoPath);
		$videoMain.get(0).load();
		$('#movieTitle').text(clipArray[index].title);
		if(clipArray[index].bslPath) {
			$videoBsl.get(0).src = clipArray[index].bslPath;
			$bslBtn.show();			
		} else {
			$videoBsl.get(0).src = '';
			$bslBtn.hide();			
		}
		if(clipArray[index].subtitlePath) {
			$('#videoMain track').attr('src', clipArray[index].subtitlePath);
			$captionBtn.show();
		} else {
			$('#videoMain track').removeAttr('src');				//	Need to do better than this!
			$captionBtn.hide();
		}
		$videoBsl.get(0).load();
	}

	function rewindClip() {
		seekTimeTo(0);
	}

	function stopAttractorVids() {
		$('.attractorVid').each(function(index, vid) {
			vid.pause();
		});
	}

	function startAttractorVids() {
		$('.attractorVid').each(function(index, vid) {
			vid.play();
		});
	}


	//	Inactivity timer
	function startInactivityTimer() {
		inactivityHandler = setTimeout(function() {
			showStillThereScreen();
		}, config.inactivityTimerMax);
	}

	function clearInactivityTimer() {
		clearTimeout(inactivityHandler);
		inactivityHandler = 0;
	}

	function restartInactivityTimer() {
		// console.log(restartInactivityTimer.caller);
		clearInactivityTimer();
		startInactivityTimer();
	}


	//	Still There timer
	function startStillThereTimer() {
		stillThereHandler = setInterval(function() {
			stillThereTime--;
			console.log(stillThereTime);
			$('#stillThereSpan').text(stillThereTime);
			if(stillThereTime <= 0) {
				stillThereTimeout();
			}
		}, 1000);
	}

	function clearStillThereTimer() {
		clearInterval(stillThereHandler);
		stillThereHandler = 0;
	}

	function stillThereTimeout() {
		resetPlayer();
		clearStillThereTimer();
		resetVideoPlayer();
		showAttractScreen(hideStillThereScreen);
	}

	function showAttractScreen(callback) {
		console.log("Showing Attract screen");
		startAttractorVids();
		clearInactivityTimer();
		$attractScreen.fadeIn('slow', function() {
			if(clipArray.length > 1) {
				$('#thumbnailDiv').get(0).scrollTo(0,0);
				$menuScreen.show();
			} else {
				rewindClip();
			}
			if(callback && typeof(callback) === 'function') {
				callback();
			}
		});
	}

	function showStillThereScreen() {
		lockedControls = true;
		console.log("Showing Still There screen");
		stillThereTime = config.stillThereTimeMax;
		$('#stillThereSpan').text(stillThereTime);
		$stillThereScreen.fadeIn('fast', function() {
			startStillThereTimer();
			lockedControls = false;
		});
	}

	function hideStillThereScreen() {
		lockedControls = true;
		$stillThereScreen.fadeOut('fast', function() {
			lockedControls = false;
		});
	}


	//	Event handlers
	$attractScreen.click(function() {
		if(!lockedControls) {
			lockedControls = true;
			if(clipArray.length === 1) {
				$menuScreen.hide();
				seekTimeTo(0);
				playVids();
			}
			$attractScreen.fadeOut('slow', function() {
				restartInactivityTimer();
				lockedControls = false;
			});
		}
	});

	$stillThereScreen.click(function() {
		if(!lockedControls) {
			hideStillThereScreen();
			clearStillThereTimer();
			restartInactivityTimer();
		}
	});
	$stillThereScreen.on('touchstart', function() {
		if(!lockedControls) {
			console.log("touch!");
			hideStillThereScreen();
			clearStillThereTimer();
			restartInactivityTimer();
		}
	});

	$menuScreen.click(function() {
		restartInactivityTimer();
	});
	$menuScreen.on('touchstart', function() {
		console.log("touch!");
		restartInactivityTimer();
	});

	$videoPlayerScreen.click(function() {
		restartInactivityTimer();
	});
	$videoPlayerScreen.on('touchstart', function() {
		restartInactivityTimer();
	});



	//	Video Player

	//	UI event listeners
	$playPauseBtn.click(function() {
		if(!lockedControls) {
			playPause();
		}
	});

	$restartBtn.click(function() {
		if(!lockedControls) {
			rewindClip();
		}
	});

	$bslBtn.click(function() {
		if(!lockedControls) {
			console.log("Toggling BSL video...");
			$('#videoBsl').toggleClass('hidden');
			$bslBtn.toggleClass('active');
		}
	});

	$captionBtn.click(function() {
		if(!lockedControls) {
			console.log("Toggling captions...");
			$captionDisplay.toggleClass('hidden');
			$captionBtn.toggleClass('active');
		}
	});

	$menuBtn.click(function() {
		if(!lockedControls) {
			resetPlayer();
		}
	});

	//	Video controls
	function playPause() {
		restartInactivityTimer();
		if(playing){
			stopVids();
		} else {
			playVids();
		}
	}

	function playVids() {
		// console.log("Playing vids");
		playing = true;
		videoMain.play();
		if($videoBsl.attr('src')) {
			videoBsl.play();
		}
		$playPauseBtn.removeClass("play");
		$playPauseBtn.addClass("pause");
		startSeekSlider();
	}

	function stopVids() {
		// console.log("Stopping vids");
		playing = false;
		videoMain.pause();
		videoBsl.pause();
		$playPauseBtn.removeClass("pause");
		$playPauseBtn.addClass("play");
		stopSeekSlider();
	}

	function backToMenu(callback) {
		// resetPlayer();
		clearTimeout(backToMenuHandler);
		backToMenuHandler = 0;
		startAttractorVids();
		if(clipArray.length > 1) {
			$menuScreen.fadeIn('slow', function() {
				stopVids();
			});
		} else {
			showAttractScreen(function() {
				stopVids();
				rewindClip();
				resetVideoPlayer();
				clearInactivityTimer();
				if(callback) {
					callback();
				}
			});
		}
	}

	// $videoMain.on('ended', function() {
	// 	console.log("Video ended");
	// 	stopVids();
	// 	backToMenu();
	// });


	//	Reset BSL & sub display for new user
	function resetVideoPlayer() {
		stopVids();
		if(config.playBslByDefault) {
			$('#bslBtn').addClass('active');
			$videoBsl.removeClass('hidden');
		} else {
			$('#bslBtn').removeClass('active');
			$videoBsl.addClass('hidden');
		}
		if(config.playSubsByDefault) {
			$('#captionBtn').addClass('active');
			$captionDisplay.removeClass('hidden');
		} else {
			$('#captionBtn').removeClass('active');
			$captionDisplay.addClass('hidden');
		}
	}

  //	Caption control
  $('#subtitleTrack').on('cuechange', function() {
    var myTrack = this.track;             // track element is "this"
    var myCues = myTrack.activeCues;      // activeCues is an array of current cues.

		myTrack.mode = "hidden";
	  $("#captionDisplay").empty();
    if (myCues.length > 0) {
    	var html = myCues[0].getCueAsHTML();
			$("#captionDisplay").html(myCues[0].getCueAsHTML());
    }
  });


  //	Idle timer
  $(document).click(function (e) {
  	restartIdleTimer();
  });

  function restartIdleTimer() {
    idleTime = 0;
		$("#vidControls").removeClass("hiddenControls");
		$('#menuBtnDiv').removeClass('hiddenMenuBtn');
		$("#display").removeClass("captionsNoControls");
		$("#backgroundShadow").removeClass("hiddenShadow");
  }

	function timerIncrement() {
    idleTime++;
    if (idleTime > 4 && config.hideControls) { // 5 seconds
			if (playing){
    		$("#vidControls").addClass("hiddenControls");
				$('#menuBtnDiv').addClass('hiddenMenuBtn');
				$("#display").addClass("captionsNoControls");
				$("#backgroundShadow").addClass("hiddenShadow");
			}
    }
	}

	function vidTimeUpdate() {
		var nt = videoMain.currentTime * (1000 / videoMain.duration);

		var pb = nt / 10;

		var curmins = Math.floor(videoMain.currentTime / 60);
		var cursecs = Math.floor(videoMain.currentTime - curmins * 60);
		var durmins = Math.floor(videoMain.duration / 60);
		var dursecs = Math.floor(videoMain.duration - durmins * 60);
		if(cursecs < 10){ cursecs = "0"+cursecs; }
		if(dursecs < 10){ dursecs = "0"+dursecs; }
		if(curmins < 10){ curmins = "0"+curmins; }
		if(durmins < 10){ durmins = "0"+durmins; }
		$curTimeText.text(curmins+":"+cursecs);
		$durTimeText.text(durmins+":"+dursecs);
	}

	function startSeekSlider() {
		stopSeekSlider();
		seekSliderHandler = setInterval(function() {
			var percentComplete = ((videoMain.currentTime / videoMain.duration) * 100) + '%';
			$('#seekComplete').width(percentComplete);
			vidTimeUpdate();
			restartInactivityTimer();
		}, 100);
	}

	function stopSeekSlider() {
		clearInterval(seekSliderHandler);
	}

	function seekSliderTo(position) {
		var percent = (position * 100) + '%';
		$('#seekComplete').width(percent);
		if(backToMenuHandler) {
			clearTimeout(backToMenuHandler);
		}
	}

	function seekTimeTo(position) {
		videoMain.currentTime = position * videoMain.duration;
		videoBsl.currentTime = videoMain.currentTime;
		seekSliderTo(position);
		if(playing && (position * videoMain.duration) < videoBsl.duration) {
			playVids();
		}
	}

	$('#seekSlider').on('click', function(e) {
		if(!lockedControls) {
	  	restartIdleTimer();
	  	var positionX = e.offsetX;
	  	console.log(positionX);
			var clickX = positionX < 0 ? 0 : positionX;
			var width = $(this).width();
			var position = clickX / width > 1 ? 1 : clickX / width;
			seekTimeTo(position);
		}
	});

	$('#seekSlider').on('touchstart', function(e) {
		if(!lockedControls) {
	  	restartIdleTimer();
	  	var positionX = e.touches[0].clientX - $seekSlider.position().left;
			var clickX = positionX < 0 ? 0 : positionX;
			var width = $(this).width();
			var position = clickX / width > 1 ? 1 : clickX / width;
			seekTimeTo(position);
		}
	});

	$('#seekSlider').on('touchmove', function(e) {
		if(!lockedControls) {
			e.preventDefault();
	  	restartIdleTimer();
	  	var positionX = e.touches[0].clientX - $seekSlider.position().left;
			var clickX = positionX < 0 ? 0 : positionX;
			var width = $(this).width();
			var position = clickX / width > 1 ? 1 : clickX / width;
			seekTimeTo(position);
		}
	});





	/************************************************************************/
	// Controller functionality

	var status;
	var endHandler;
	var ended = false;
	var url = 'http://127.0.0.1:4886/status';
	// var url = 'http://172.16.4.33:4886/status';
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
		if(vid.duration - vid.currentTime < 1) {
			console.log("Paused at end of playback");
			lockedControls = true;
			revertPlayer();
		} else {
			console.log("Paused during playback");
			var status = {
				type: 'pause'
			}
			postStatus(status);
		}
	});

	vid.addEventListener('seeked', function() {
		if(ended) {	
			//	Nothing
			ended = false;
		} else {
			clearTimeout(endHandler);
			console.log("Seeked to " + vid.currentTime);
			var status = {
				type: 'seeked',
				to: vid.currentTime
			}
			postStatus(status);
		}
	});

	function resetPlayer() {
		ended = true;
		console.log("Resetting");
		backToMenu(function() {
			lockedControls = false;
		});
		var status = {
			type: 'reset'
		}
		postStatus(status);
		clearTimeout(endHandler);
	};

	function revertPlayer() {
		endHandler = setTimeout(function() {
			resetPlayer();
		}, 5000);
	}

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
			console.log(err.statusText);
		})
	}





	/********************************************************/
	//	Run on first load
	firstLoad();

});