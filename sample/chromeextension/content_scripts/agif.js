chrome.runtime.onMessage.addListener(function(request, sender) {
    window.open(null, request.type).document.write(request.result);
});
