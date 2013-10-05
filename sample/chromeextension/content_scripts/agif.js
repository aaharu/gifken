chrome.runtime.onMessage.addListener(function(request, sender) {
    window.open().document.write(request.result);
});
