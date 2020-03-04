// alert(1)

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      console.log(sender.tab ?
                  "来自内容脚本：" + sender.tab.url :
                  "来自扩展程序");
      if (request.greeting == "您好")
        sendResponse({farewell: "再见"});
    });