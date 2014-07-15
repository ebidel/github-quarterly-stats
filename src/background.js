var selectedTabId = 0;

var GH_CONTRIBS_REGX = "https://github.com/(.*)";

function showPageAction(tab) {
  if (tab.url.match(GH_CONTRIBS_REGX)) {
    chrome.pageAction.show(selectedTabId);
  }
}

chrome.tabs.onActivated.addListener(function(activeInfo) {
  selectedTabId = activeInfo.tabId;
  chrome.tabs.get(selectedTabId, showPageAction);
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  showPageAction(tab);
});

// On page load, make sure the pageAction is showing.
chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
  selectedTabId = tabs[0].id;
  showPageAction(tabs[0])
});

// Called when the user clicks on the page action.
chrome.pageAction.onClicked.addListener(function(tab) {
  chrome.tabs.get(tab.id, function(tab) {
    var match = tab.url.match(GH_CONTRIBS_REGX);
    if (!match) {
      alert('Must be on a user contributions page: https://github.com/<username>?tab=contributions');
      return;
    }

    chrome.tabs.sendMessage(selectedTabId, {action: 'fetchQuarterMetrics'}, function(response) {
      console.log(response)
    });
  });
});

