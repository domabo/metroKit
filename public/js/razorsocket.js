/*! xWSD Razor WebSocket Helper | xwsd.org/license */
$(document).ready(function () { $(document).trigger("xwsd_documentready"); });
$(window).unload(function () {
    $(document).trigger("xwsd_windowunload");
});

if (window.location.protocol == "razor:") 
 {     
       window.api = {};
       if (window.ActiveXObject) 
             window.api._xhr =  window.ActiveXObject("Microsoft.XMLHTTP");
        else 
            window.api._xhr =  XMLHttpRequest;
     
       window.api.sendmessage = function (message, sessionId) {
            var url = window.location.origin + "/api/browser/1.0/" + encodeURIComponent(sessionId) + "/message?" + encodeURIComponent(message);
            var xhr = new api._xhr();
            xhr.open('GET', url, false);
            xhr.send(); 
        };    
        
            window.api.log = function (message) {
            var url = window.location.origin + "/api/browser/1.0/0/log?" + encodeURIComponent(message);
            var xhr = new api._xhr();
            xhr.open('GET', url, false);
            xhr.send(); 
        };    

             window.api.print = function () {
            var url = window.location.origin + "/api/browser/1.0/0/print";
            var xhr = new api._xhr();
            xhr.open('GET', url, false);
            xhr.send(); 
        };    

       window.api.disconnect = function (sessionId) {
            var url = window.location.origin + "/api/browser/1.0/" + encodeURIComponent(sessionId) + "/disconnect";
            var xhr = new api._xhr();
            xhr.open('GET', url, false);
            xhr.send(); 
        };                                            
 } 
 else
 {
    window.api = {};
       if (window.ActiveXObject) 
             window.api._xhr =  window.ActiveXObject("Microsoft.XMLHTTP");
        else 
            window.api._xhr =  XMLHttpRequest;
    
     
       window.api.log = function (message) {
          console.log(message);
        };    

       window.api.sendmessage = function (message, sessionId) {
              console.log(message);
        };    
        
                 window.api.print = function () {
          console.log("Print not enabled from remote browser");
        };    

        
       window.api.disconnect = function (sessionId) {
                   console.log(message);
        };              
 
 }
 
 var OpenRazorMessageSocketsByTag = new Object;
 
var RazorMessageSocket = new function () {
    var wsUri;
    var element_statusBar = new Object;
    var element_progressBar = new Object;
   
    var that = this;
  
    this.init = function (url, pageId) {
        wsUri = url;
        $(document).one("pagebeforeshow", pageId, pageId, that.opening);
         $(document).one("pagebeforehide", pageId, pageId, that.closing);
         $(document).one("xwsd_documentready", null, pageId, that.opening);
         $(document).one("xwsd_windowunload", null, pageId, that.closing);
         }
    
    this.opening = function (event) {
         var pageId = event.data;
         element_statusBar[pageId] = document.getElementById("StatusMsg" + pageId);
         element_progressBar[pageId] = document.getElementById("ProgressBar" + pageId);
        openWebSocket(pageId);
    }

    this.closing = function (event) {
        closeWebSocket(event.data);
    }

    function openWebSocket(pageId) {
       window.api.log("Open " + pageId);
        var rs = new RazorSocket(wsUri, pageId);
        rs.onopen = function (evt, evtPageId) { onOpen(evt, evtPageId) };
        rs.onclose = function (evt, evtPageId) { onClose(evt, evtPageId) };
        rs.onmessage = function (evt, evtPageId) { onMessage(evt, evtPageId) };
        rs.onerror = function (evt, evtPageId) { onError(evt, evtPageId) };
        OpenRazorMessageSocketsByTag[pageId] = rs;
         window.api.log("Opened " + pageId);
    
    }

    function closeWebSocket(pageId) {
        if (OpenRazorMessageSocketsByTag[pageId] != null) {
            OpenRazorMessageSocketsByTag[pageId].close();
           }
    }

    function onOpen(evtPageId) {
        writeToScreen("CONNECTED " + evtPageId, evtPageId);
        doSend("xWSD WebSocket Connect Message", evtPageId);
    }

    function onClose(evt, evtPageId) {
        window.api.log('onClose');
        writeToScreen("DISCONNECTED", evtPageId);
        OpenRazorMessageSocketsByTag[evtPageId].onopen = null;
        OpenRazorMessageSocketsByTag[evtPageId].onclose = null;
        OpenRazorMessageSocketsByTag[evtPageId].onmessage = null;
        OpenRazorMessageSocketsByTag[evtPageId].onerror = null;
        OpenRazorMessageSocketsByTag[evtPageId] = null;
    }

    function NavigateTo(url) {
        location.href = url;
    }
    
    function onMessage(evt, evtPageId) {
        var cmd = evt.data.substring(0, 1);
        if (cmd == '!') {
            writeToScreen("Navigating to " + evt.data, evtPageId);
            if ($.mobile)
                setTimeout($.mobile.changePage,0,evt.data.substring(1))
            else
                setTimeout(NavigateTo,0,evt.data.substring(1));
         }
        else if (cmd == '/') {
              writeToScreen("Navigating to " + evt.data, evtPageId);
              setTimeout(NavigateTo, 0, evt.data.substring(0));
          }
        else if (cmd == '%') {
            element_progressBar[evtPageId].style.width = evt.data.substring(1) + "%"
        }
        else
            writeToScreen(evt.data + evtPageId, evtPageId);
    }

    function onError(evt, evtPageId) {
          writeToScreen('<span style="color: red;">ERROR on page:</span> ' + evtPageId, evtPageId);
    }

    function doSend(message, evtPageId) {
        OpenRazorMessageSocketsByTag[evtPageId].send(message);
    }

    function doSendCancel(evtPageId) {
        writeToScreen('CANCELLED', evtPageId);
        var msg = '>CANCEL';
        OpenRazorMessageSocketsByTag[evtPageId].send(msg);
     }

    this.doCancel = function (evtPageId) {
         doSendCancel(evtPageId); 
        }

    function writeToScreen(message, evtPageId) {
       element_statusBar[evtPageId].innerHTML = message;
    }
}

var OpenRazorSockets = new Object;

function RazorSocket(uri, pageid) {
     if (window.location.protocol == "razor:") {
      window.api.log("RAZOR SOCKET DETECTED ");
  
        if (window.ActiveXObject) {
            jQuery.ajaxSettings.xhr = function () { return new window.ActiveXObject("Microsoft.XMLHTTP"); };
                     
            var that = this;
            this.uri = uri;
            this.pageId = pageid;
            this.send = function (evt) { window.external.receivemessage(evt, that.pageId);  };
            this.close = function () { window.external.disconnect(that.pageId); };

            this.msg = function (evt, xPageId) {
                if (evt.data == "!DISCONNECT") {
                   window.api.log("!DISCONNECT RECEIVED");
                    that.onclose(evt, xPageId);
                }
                else that.onmessage(evt, xPageId);
            }
            $.ajax({
                url: uri,
                datatype: "html",
                cache: false,
                headers: { "xWSD-WebSocket": "true", "xWSD-WebSocket-Name": that.pageId },
                success: function (e) { that.onopen(that.pageId); },
                error: function (e1, e2, e3) { alert("XHR ERROR"); alert(uri); }
            });
        }
        else {
           window.api.log("WEBKIT RAZOR DETECTED ");
  
            var that = this;
            this.uri = uri;
            this.pageId = pageid;
         
            this.msg = function (evt) {
                if (evt.data == "!DISCONNECT") {
                  window.api.log("!DISCONNECT RECEIVED");
                     that.onclose(evt, that.pageId);  
                    OpenRazorSockets[sessionid]=null;
                                    }
                else {
                that.onmessage(evt, that.pageId);}
            }
            
             window.api.log("CALLING " + uri + " " + this.pageId);
  
            $.ajax({
                url: uri,
                cache: false,
                datatype: "json",
                headers: { "xWSD-WebSocket": "true", "xWSD-WebSocket-Name": that.pageId },
                success: function (data) { var sessionid=data.id;  window.api.log("CONNECTED SESSION ID=" + data.id);
                     OpenRazorSockets[sessionid]=that;
                     that.sessionId = sessionid;
                     that.send = function (evt) { window.api.sendmessage(evt, sessionid); };
                     that.close = function () { window.api.disconnect( sessionid);  };
                     that.onopen(that.pageId);
                },
                error: function (e1, e2, e3) { alert("Error in Razor WebSocket Connection"); }
            });
        }
    }
    else {
     window.api.log("HTML WEBSOCKET DETECTED ");
  
        this.pageId = pageid;
        var that = this;
        this.razor_websocket = new WebSocket(uri);
        this.razor_websocket.onopen = function (evt) {  that.onopen(that.pageId) };
        this.razor_websocket.onclose = function (evt) {
            if (that.onclose != null) {
                that.onclose(evt, that.pageId);
                that.razor_websocket.onmessage = null;
                that.razor_websocket.onerror = null;
                that.razor_websocket.onclose = null;
                that.razor_websocket.onopen = null;
                that.razor_websocket = null;
                that.send = null;
                that.close = null;
            }
        };
        this.razor_websocket.onmessage = function (evt) {  window.api.log("ONMESSAGE: " + evt.data );
that.onmessage(evt, that.pageId) };
        this.razor_websocket.onerror = function (evt) { that.onerror(evt, that.pageId) };
        this.send = function (evt) {  window.api.log("SEND: " + evt.data );
            that.razor_websocket.send(evt)
        };
        this.close = function (evt) { window.api.log("CLOSE REQUESTED");
             that.razor_websocket.close();
         };
    }
}

function RazorSocketCurrent_msg(msg, sessionId)
{
 //  window.api.log("RETURN MESSAGE: " + msg + " ["+sessionId+"]");
  
    if (OpenRazorSockets[sessionId]) {
        var evt = new Object;
        evt.data = msg;
        OpenRazorSockets[sessionId].msg(evt);
    } else
    { if (msg !== "!DISCONNECT")     
       window.api.log("NOT FOUND " + msg + " ["+sessionId+"]"); }
}
