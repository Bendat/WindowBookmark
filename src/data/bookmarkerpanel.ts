/*
MIT License

Copyright (c) Ben Aherne 2016

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
 */
declare var require: any;
var slf = self as any; // Workaround for typescript.
var windows: string[] = new Array();
const emptyList = document.getElementById("empty");
const openList = document.getElementById("windows");
const bookmarkList = document.getElementById("bookmarks");
const options = {autoclose: document.getElementById("closeonsave"), persist: document.getElementById("keepalive")};
const form: HTMLElement = document.getElementById("nameform");
const formInput: HTMLInputElement = document.getElementById("nameinput") as HTMLInputElement;
const formButtons = {ok:document.getElementById("namebutton"), cancel: document.getElementById("cancel")}; 
const openWindows: HTMLElement[] = [];
const bookMarkedWindows: HTMLElement[] = [];
const quickMark: HTMLElement = document.getElementById("quickmark");

slf.port.on("newWindow", (winId, title)=>{
    addListItem(winId, title, openList)
});

slf.port.on("newTab", (winId, title)=>{
    updateListItem(winId, title, openList);
});

slf.port.on("bookmarked", (name)=>{
    if(emptyList){emptyList.remove()}
    addListItem(guid(), name, bookmarkList)
});

slf.port.on("windowClosed", (id)=>{
    openList.removeChild(document.getElementById(id));
});
slf.port.on("initSettings", (settings)=>{
    (options.autoclose as HTMLInputElement).checked = settings.autoclose;
    (options.persist as HTMLInputElement).checked = settings.persist;
    
    if(!(options.autoclose as HTMLInputElement).checked){
        (options.persist.parentNode as HTMLElement).style.display = "none";
    }
});

/**
 * Updates the title of a window in the ui panel dropdown.
 * @param {string} id - the id of the window to update.
 * @param {string} title - the new title of the window.
 * @param {HTMLElement} parent - the parent node of the list to update.
 */
function updateListItem(id:string, title: string, parent: HTMLElement): void{
    const node = document.getElementById(id);
    if(!node){return};
    const nodeP = node.getElementsByTagName("p")[0];
    nodeP.innerText = title; 
}

/**
 * Adds an item to the list of open or bookmarked windows.
 * @param {string} id - the id of the window to update in the list.
 * @param {string} title - the title of the window.
 * @param {HTMLElement} parent - the parent node of the list to update.
 */
function addListItem(id:string, title: string, parent: HTMLElement): void{
    const node = document.createElement("li");
    const nodeP = document.createElement("p");
    if(parent === bookmarkList){
        const nodeI = document.createElement("img") as HTMLImageElement;
        nodeI.src = "./close.png";
        nodeI.className = "exitimg";
        node.appendChild(nodeI);
        nodeI.addEventListener("click",(e)=>{
            e.stopPropagation();
            const title = nodeP.innerText;
            bookmarkList.removeChild(document.getElementById(node.id));
            slf.port.emit("deleteBookmark", title)
        });
    }
    node.id = id;
    nodeP.innerText = title;
    node.addEventListener("click", parent === openList? windowClickHandler: bookmarkClickHandler);
    node.appendChild(nodeP);
    parent.appendChild(node);   
}


function bookmarkClickHandler(e: Event){
    const node = (e.currentTarget as HTMLElement);
    const title = node.getElementsByTagName("p")[0].innerText;
    slf.port.emit("openBookmark", title);
    bookmarkList.removeChild(document.getElementById(node.id));
}

function windowClickHandler(e: Event){
    toggleForm();
    const wndw = (e.currentTarget as HTMLElement).id;
    formInput.value = (e.currentTarget as HTMLElement).getElementsByTagName("p")[0].innerText;
    formInput.setAttribute("data-window", wndw);
}; 

/**
 * Generates a unique id.
 * @returns {string} - the generated id.
 */
function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + s4();
}

function init(){
    formButtons.ok.addEventListener("click", (e)=>{
        let saveName = formInput.value;
        slf.port.emit("bookmark", formInput.getAttribute("data-window"), saveName);
        toggleForm();
    });

    formButtons.cancel.addEventListener("click", ()=>{
        toggleForm();
    });

    options.autoclose.addEventListener("click", ()=>{
        if(!(options.autoclose as HTMLInputElement).checked){
            (options.persist.parentNode as HTMLElement).style.display = "none";
        }else{
            (options.persist.parentNode as HTMLElement).style.display = "inline-block";
        }
        slf.port.emit("updatesetting", "autoclose");
    });
    options.persist.addEventListener("click", ()=>{
        slf.port.emit("updatesetting", "persist");
    });

    quickMark.addEventListener("click",()=>{
        slf.port.emit("quickmark");
    });
}

function toggleForm(){
    if(form.style.display == "block"){
        form.style.display = "none";
    }else{
        form.style.display = "block";
    }
}

init();