const buttons = require('sdk/ui/button/toggle');
const sdkPanels = require("sdk/panel");
const data = require("sdk/self").data;
const windows = require("sdk/windows").browserWindows;
const loop = require("sdk/timers").setInterval;
const timeout = require("sdk/timers").setTimeout;
const pMod = require('sdk/page-mod').PageMod;
const storage = require("sdk/simple-storage").storage;
const tabs = require("sdk/tabs");
const { viewFor } = require("sdk/view/core");
var globalActiveWindow;
var button = buttons.ToggleButton({
    id: "winbm",
    label: "bookmark tab",
    icon: "resource://windowbookmark/data/bookmark.png",
    onChange: handleChange
});
var myPanel = require("sdk/panel").Panel({
    width: 220,
    height: 175,
    tooltip: "Window Bookmarker",
    contentURL: data.url("panel.html"),
    contentScriptFile: data.url("bookmarkerpanel.js"),
    onHide: handleHide,
});
myPanel.port.emit("open", tabs[0].id, titleFromId(tabs[0].id));
myPanel.port.on("bookmark", bookmark);
myPanel.port.on("openBookmark", (name) => {
    openBookmarkedWindow(name);
});
windows.on("open", (window) => {
    globalActiveWindow = window;
    myPanel.port.emit("open", tabs[0].id, window.title);
});
windows.on("activate", (window) => {
    globalActiveWindow = window;
});
windows.on('close', function (wndw) {
    myPanel.port.emit("close", wndw.title);
});
tabs.on("ready", function (tab) {
    if (tab.window.tabs.activeTab.id == tab.id) {
        myPanel.port.emit("closetab", [tab.id, tab.id], titleFromId(tab.window.tabs.activeTab.id));
    }
});
tabs.on('close', function (tab) {
    if (tabs[0]) {
        myPanel.port.emit("closetab", [tab.id, tab.window.tabs.activeTab.id], titleFromId(tabs[0].id));
    }
});
tabs.on("open", (tab) => {
    if (tab.window.tabs.length == 1 || tab.window.tabs.length == 2) {
        myPanel.port.emit("update", [tab.window.tabs[0].id, tab.id], titleFromId(tab.id));
    }
});
tabs.on("deactivate", (tab) => {
    var id = tab.id;
    tabs.on("activate", (newActiveTab) => {
        myPanel.port.emit("update", [id, newActiveTab.id], titleFromId(newActiveTab.id));
    });
});
function bookmark(id, savename) {
    savename = isEmptyOrWhitespace(savename) ? "nameless window" : savename;
    const winTitle = titleFromId(id);
    console.log(winTitle);
    var bookmarkObject = {};
    var window;
    if (storage.bookmarks && storage.bookmarks[savename]) {
        let oldname = savename;
        savename = new Date().toLocaleString() + savename;
        myPanel.port.emit("namexists", oldname, savename);
    }
    let winCount = 0;
    for (let wndw of windows) {
        if (wndw.title === winTitle) {
            window = wndw;
        }
        winCount++;
    }
    var urls = new Array();
    if (window) {
        for (let tab of window.tabs) {
            urls.push(tab.url);
        }
        bookmarkObject[savename] = urls;
        storeWindow(bookmarkObject);
        if (winCount > 1) {
            window.close();
        }
    }
}
function openBookmarkedWindow(name) {
    var urls = storage.bookmarks[name];
    if (typeof urls !== undefined) {
        windows.open({
            url: urls[0],
            onOpen: function (window) {
                if (urls.length > 1) {
                    for (let url of urls.slice(urls[1])) {
                        tabs.open(url);
                    }
                }
            },
        });
        myPanel.port.emit("removeItems", Object.keys(storage.bookmarks));
        delete storage.bookmarks[name];
    }
    console.log("no urls");
}
function stripKeyQuotes(entry) {
    return entry.substring(0, entry.length);
}
function keyExists(item, key) {
    if (!item) {
        return false;
    }
    ;
    var keys = Object.keys(item);
    return keys.indexOf(key) >= 0 || keys.indexOf("\"" + key + "\"") >= 0;
}
function storeWindow(bookmarkObject) {
    if (!storage.bookmarks || !storage.bookmarks["empty"]) {
        storage.bookmarks = { "empty": "empty" };
    }
    ;
    console.log(JSON.stringify(bookmarkObject));
    Object.assign(storage.bookmarks, bookmarkObject);
    myPanel.port.emit("bookmarked", storage.bookmarks);
}
function handleChange(state) {
    if (state.checked) {
        myPanel.show({
            position: button
        });
    }
}
function handleHide() {
    button.state('window', { checked: false });
}
function isEmptyOrWhitespace(str) {
    return str === null || str.match(/^\s*$/) !== null;
}
function titleFromId(winId) {
    var title;
    for (let window of windows) {
        for (let tb of window.tabs) {
            if (tb.id == winId.replace("window", "")) {
                title = window.title;
            }
        }
    }
    return title;
}
//# sourceMappingURL=index.js.map