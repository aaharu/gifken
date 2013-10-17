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
                    var gifObj = gifken.Gif.parse(this.result),
                        html = document.createElement("div"),
                        img;
                    if (info.menuItemId === "split") {
                        gifObj.split(true).forEach(function(i) {
                            img = new Image();
                            img.src = i.writeToDataUrl();
                            html.appendChild(img);
                        });
                    } else {
                        img = new Image();
                        img.src = gifObj.playback(true).writeToDataUrl();
                        html.appendChild(img);
                    }

                    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                        chrome.tabs.sendMessage(tabs[0].id, {
                            type: info.menuItemId,
                            result: html.innerHTML
                        });
                    });
                };
                fileReader.readAsArrayBuffer(blob);
            }
        };
        xhr.send();
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
