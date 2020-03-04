const RT = chrome.runtime
const captures = {} // 储存截图的图片

// chrome.runtime.onInstalled.addListener(function() {
    
    chrome.browserAction.onClicked.addListener(function(){
        const uuid = new Date().getTime()
        chrome.tabs.captureVisibleTab({
            format: "png"
        }, function(capture) {
            captures[uuid] = capture
            chrome.tabs.create({
                url: chrome.extension.getURL("/scrrenshot-page/index.html?id=" + uuid)
            }
            // , 
            // function(tab){
            //    if(typeof chrome.tabs.setZoom === 'function'){
            //        try {
            //             chrome.tabs.setZoom(tab.id, 1)
            //        }catch(e) {

            //        }
                    
            //    }
            // }
            )
        })
    })

    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {

        /**
         * 截图页面加载时返回截图
         * 截图页面关闭时删除截图
         */
        if (request.name === 'get_scrrenshot_png') {
            sendResponse({
                base64: captures[request.id]
            })
        } else if (request.name === 'del_scrrenshot_png') {
            delete captures[request.id]
        }
    })

// })