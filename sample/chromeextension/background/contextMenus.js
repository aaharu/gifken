chrome.contextMenus.onClicked.addListener(function(info, tab) {
    if (info.srcUrl && /^.+¥.(png|jpg|jpeg|webp)$/i.test(info.srcUrl) === false) {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", info.srcUrl, true);
        xhr.responseType = "blob";
        xhr.onload = function() {
            var blob = xhr.response;
            if (blob.type === "image/gif") {
                var fileReader = new FileReader();
                fileReader.onload = function() {
                    var gifObj = gifken.Gif.parse(this.result);
                    var html = document.createElement("div");
                    if (info.menuItemId === "split") {
                        gifObj.split(true).forEach(function(i) {
                            var img = new Image();
                            img.src = i.writeToDataUrl();
                            html.appendChild(img);
                        });
                    } else {
                        var img = new Image();
                        img.src = gifObj.playback(true).writeToDataUrl();
                        html.appendChild(img);
                    }
                    var result = html.innerHTML;

                    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                        chrome.tabs.sendMessage(tabs[0].id, {
                            type: info.menuItemId,
                            result: result
                        });
                    });
                };
                fileReader.readAsArrayBuffer(blob);
            }
        };
        xhr.send();
    } else {
        alert("!");
    }
});

chrome.contextMenus.create({
    title: "GIFアニメ分解",
    contexts: ["image"],
    id: "split"
});

chrome.contextMenus.create({
    title: "GIFアニメ逆再生",
    contexts: ["image"],
    id: "playback"
});
