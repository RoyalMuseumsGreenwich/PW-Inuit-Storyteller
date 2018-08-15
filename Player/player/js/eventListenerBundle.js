(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
var on = require('sendevent');

on('/eventstream', function(ev) {


  /////////////////////////////////////////////////////////////////////
  //  Code goes here!
  console.log("Event received: " + ev);
  var status = JSON.parse(ev);
  console.log(status.type);


  var videoMain = $('#videoMain').get(0);

  switch(status.type) {
    case 'play':
      playVids();
      break;
    case 'pause':
      stopVids();
      break;
    case 'seeked':
      seekTimeTo(status.to);
      break;
    case 'reset':
      seekTimeTo(0);
      stopVids();
      attract();
      break;
    default:
      console.log("Invalid status: " + status.type);
      break;
  }

  //  Video controls
  function playVids() {
    console.log("Playvids");
    if($('#attractScreen').is(':visible')) {
      $('#attractScreen').fadeOut('fast');
    };
    videoMain.play();
  }
  function stopVids() {
    videoMain.pause();
  }
  function seekTimeTo(position) {
    videoMain.currentTime = videoMain.duration * (position / videoMain.duration);
  }
  function attract() {
    console.log("Showing attract...");
    $('#attractScreen').fadeIn('fast');
  }

  /////////////////////////////////////////////////////////////////////

});
},{"sendevent":2}],2:[function(require,module,exports){
module.exports = function(url, handle) {

  if (typeof url == 'function') {
    handle = url
    url = '/eventstream'
  }

  /**
   * Iframe-fallback for browsers that don't support EventSource.
   */
  function createIframe() {
    var doc = document

    // On IE use an ActiveXObject to prevent the "throbber of doom"
    // see: http://stackoverflow.com/a/1066729
    if (window.ActiveXObject) {
      doc = new ActiveXObject("htmlfile")
      doc.write('<html><body></body></html>')

      // set a global variable to prevent the document from being garbage
      // collected which would close the connection:
      window.eventStreamDocument = doc

      // Expose a global function that can be invoked from within the iframe:
      doc.parentWindow.handleSentEvent = handle

      appendIframe(doc, url)
    }
    else {
      // Most likely an old Android device. The trick here is not to send
      // the 4KB padding, but to immediately reload the iframe afer a message
      // was received.
      window.handleSentEvent = handle
      setTimeout(function() { appendIframe(document, url+'?close') }, 1000)
    }
  }

  function appendIframe(doc, url) {
    var i = doc.createElement('iframe')
    i.style.display = 'none'
    i.src = url
    doc.body.appendChild(i)
  }

  var init = function() {
    var source = new EventSource(url)
    source.onmessage = function(ev) {
      handle(JSON.parse(ev.data))
    }
  }

  if (!window.EventSource) init = createIframe
  if (window.attachEvent) attachEvent('onload', init)
  else addEventListener('load', init)
}

},{}]},{},[1]);
