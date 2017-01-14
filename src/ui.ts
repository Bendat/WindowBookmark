declare var require, XPCOMUtils: any;
const buttons    = require('sdk/ui/button/toggle');
const sdkPanels  = require("sdk/panel");
const data       = require("sdk/self").data;
const windows    = require("sdk/windows").browserWindows;
const loop       = require("sdk/timers").setInterval;
const timeout    = require("sdk/timers").setTimeout;
const pMod       = require('sdk/page-mod').PageMod;
const storage    = require("sdk/simple-storage").storage;
const tabs       = require("sdk/tabs");
const {viewFor}  = require("sdk/view/core");
const windowIds: string[] = [];
var globalActiveWindow;

var button = buttons.ToggleButton({
  id: "winbm",
  label: "bookmark tab",
  icon: "resource://windowbookmark/data/logonew.png",
  onChange: handleChange,
});

var myPanel = require("sdk/panel").Panel({
    width: 220,
    height: 175,
    tooltip: "Window Bookmarker",
    contentURL: data.url("panel.html"),
    contentScriptFile: data.url("bookmarkerpanel.js"),
    onHide: handleHide,
});

init();

windows.on("open", (window)=>{
    myPanel.port.emit("newWindow", winIdFromTabId(window.tabs[0].id), window.title);
    windowIds.push(winIdFromTabId(window.tabs[0].id));
});

windows.on("close", (window)=>{
    const openWindows = [];
    for(var window of windows){
        if(window.tabs && window.tabs[0]){
            openWindows.push(winIdFromTabId(window.tabs[0].id));
        }
    }
    const id = listDiff(windowIds, openWindows)[0];
    windowIds.splice(windowIds.indexOf(id), 1);
    if(id){
        myPanel.port.emit("windowClosed", id);
    }
});

tabs.on("activate", (tab)=>{
    myPanel.port.emit("newTab", winIdFromTabId(tab.id), tab.title);
});

tabs.on("ready", (tab)=>{
    if(tab.window.tabs.activeTab.id === tab.id){
        myPanel.port.emit("newTab", winIdFromTabId(tab.id), tab.title);
    }
});
myPanel.port.on("updatesetting", (setting)=>{
    storage.settings[setting] = !storage.settings[setting];
});
myPanel.port.on("bookmark", bookmark);

myPanel.port.on("openBookmark", openBookmarkedWindow);

myPanel.port.on("quickmark", ()=>{
    var winId = winIdFromTabId(windows.activeWindow.tabs[0].id);
    var saveName = windows.activeWindow.tabs.activeTab.title;
    bookmark(winId, saveName);
    myPanel.hide();
});

myPanel.port.on("deleteBookmark", (title)=>{
    delete storage.bookmarks[title]
});

function init(){
    myPanel.port.emit("newWindow", winIdFromTabId(tabs[0].id), tabs[0].window.title);
    windowIds.push(winIdFromTabId(tabs[0].id));
    if(storage.bookmarks){
        for(let bookmark of Object.keys(storage.bookmarks)){
            myPanel.port.emit("bookmarked", bookmark);
        }
    }
    if(!storage.settings){
        storage.settings = {autoclose: false, persist: false};
    }
    myPanel.port.emit("initSettings", storage.settings);    
}

function listDiff(first: any[], second: any[]):any[] {
    return first.filter(function(i) {return second.indexOf(i) < 0;});
}

function bookmark(winId: string, savename: string): void{
    savename = isEmptyOrWhitespace(savename) ? "nameless window" : savename;
    const window = getWindowFromId(winIdFromTabId(winId));
    var bookmarkObject = {};
    if(storage.bookmarks && storage.bookmarks[savename]){
        let oldname = savename;
        savename = new Date().toLocaleString() + savename;
        myPanel.port.emit("namexists", oldname, savename)
    }
    var urls: string[] = new Array();
    if(window){  
 
        for(let tab of window.tabs){
            urls.push(tab.url);
        }
        bookmarkObject[savename] = urls;
        storeWindow(bookmarkObject);
        if(storage.settings.autoclose){
            if(storage.settings.persist){
                if(windows.length !== 1){
                    window.close();
                }
            }else{
                window.close();
            }
        }

        myPanel.port.emit("bookmarked", savename);
    }
}

function storeWindow(bookmarkObject: Object){
    if(!storage.bookmarks){storage.bookmarks = {}};
    Object.assign(storage.bookmarks, bookmarkObject);
}

function getWindowFromId(id: string): any{
    for(let window of windows){
        if(window.tabs[0].id.includes(id)){
            return window;
        }
    }
}

function openBookmarkedWindow(name: string){
    var urls = storage.bookmarks[name];
    if(typeof urls !== undefined){
        windows.open({
            url: urls[0],
            onOpen: function(window) {
                if(urls.length > 1){
                    for(let url of urls.slice(urls[1])){
                        tabs.open(url);
                    }
                }
            },
        });
        myPanel.port.emit("removeItems", Object.keys(storage.bookmarks))
        delete storage.bookmarks[name]
    }
    console.log("no urls");
}

function handleChange(state) {
    if (state.checked) {
        myPanel.show({
            position: button
        });
    }else{
        myPanel.hide();
    }
}

function handleHide() {
    button.state('window', {checked: false});
}

function winIdFromTabId(id: string):string{
    return id.substring(id.indexOf("-"), id.lastIndexOf("-")+1);
}

function isEmptyOrWhitespace(str:string):boolean{
    return str === null || str.match(/^\s*$/) !== null;
}

function titleFromId(winId): string{
    for(let window of windows){
        if(window.tabs[0].id.includes(winId)){
            return window.title;
        }
    }
    return null;
}

