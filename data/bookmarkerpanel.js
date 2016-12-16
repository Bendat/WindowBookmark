var slf = self; // Workaround for typescript.
var windows = new Array();
const openList = document.getElementById("windows");
const bookmarkList = document.getElementById("bookmarkWindows");
const form = document.getElementById("nameform");
const formInput = document.getElementById("nameinput");
const formButtons = { ok: document.getElementById("namebutton"), cancel: document.getElementById("cancel") };
slf.port.on("open", (winId, title) => {
    windows.push(winId);
    addListEntry(winId, title);
});
slf.port.on("close", (wndw) => {
    let node = document.getElementById(makeId(wndw.title));
    let windows = document.getElementsByTagName("li");
    document.removeChild(node);
    windows = document.getElementsByTagName("li");
});
slf.port.on("closetab", (tabArr, title) => {
    const oldId = makeId(tabArr[0]);
    const newId = makeId(tabArr[1]);
    console.log(newId + " stuff " + title);
    windows[windows.indexOf[oldId]] = newId;
    swapId(oldId, newId, title);
});
slf.port.on("update", (tabArr, title) => {
    console.log(tabArr + title);
    const oldId = makeId(tabArr[0]);
    const newId = makeId(tabArr[1]);
    console.log(newId + " stuff " + title);
    windows[windows.indexOf[oldId]] = newId;
    swapId(oldId, newId, title);
});
slf.port.on("nameExists", (oldname, savename) => {
    alert("A bookmark called" + oldname + "already exists, adding a timestamp: " + savename);
});
slf.port.on("bookmarked", (stored) => {
    var keys = new Array();
    Object.keys(stored).forEach(key => {
        keys.push(stripKeyQuotes(key));
    });
    listBookmarks(Object.keys(stored));
});
slf.port.on("removeItems", removeBookmark);
function removeBookmark(stored) {
    removeChildren(bookmarkList);
    listBookmarks(stored);
}
function removeChildren(node) {
    var last;
    while (last = node.lastChild) {
        node.removeChild(last);
    }
    ;
}
;
function listBookmarks(stored) {
    var bookMark = stored[stored.length - 1];
    var node = document.createElement("li");
    node.innerText = bookMark;
    node.addEventListener("click", bookmarkClickHandler);
    bookmarkList.appendChild(node);
}
function stripKeyQuotes(entry) {
    return entry.substring(0, entry.length);
}
function bookmarkClickHandler(e) {
    const wndw = e.currentTarget.innerText;
    slf.port.emit("openBookmark", wndw);
}
function swapId(oldId, newId, title) {
    const node = document.getElementById(oldId);
    if (node != null) {
        node.id = newId;
        node.innerText = title;
    }
}
function addListEntry(windId, title) {
    const node = document.createElement("li");
    const nodeP = document.createElement("p");
    node.id = makeId(windId);
    nodeP.innerText = title;
    node.addEventListener("click", windowClickHandler);
    node.appendChild(nodeP);
    openList.appendChild(node);
}
;
function init() {
    formButtons.ok.addEventListener("click", (e) => {
        let saveName = formInput.value;
        console.log(formInput.getAttribute("data-window") + saveName);
        slf.port.emit("bookmark", formInput.getAttribute("data-window"), saveName);
        toggleForm();
    });
    formButtons.cancel.addEventListener("click", () => {
        toggleForm();
    });
}
function makeId(windId) {
    return "window" + windId;
}
;
function windowClickHandler(e) {
    toggleForm();
    const wndw = getWindowName(e.currentTarget.id);
    formInput.value = e.currentTarget.getElementsByTagName("p")[0].innerText;
    formInput.setAttribute("data-window", wndw);
}
;
function getWindowName(id) {
    return windows.filter((wndw) => {
        return wndw === id.replace("window", "");
    })[0] || windows[0];
}
function toggleForm() {
    if (form.style.display == "block") {
        form.style.display = "none";
    }
    else {
        form.style.display = "block";
    }
}
init();
