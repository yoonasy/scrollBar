/**
 * 
 * @authors Your Name (you@example.org)
 * @date    2017-09-27 15:09:49
 * @version $Id$
 */

// 添加事件
function addEvent(Element, type, handler) {
    if(type.substring(0, 2) === "on") type = type.substring(2);
    Element.addEventListener ? Element.addEventListener(type, handler, false) : Element.attachEvent("on"+type, handler);
}

// 鼠标滚轮事件
function mouseWheel(Element, handler) {
    addEvent(Element, "mousewheel", function(e) {
        // 获取滚动方向
        var data = getWheelData(e);

        handler(data);

    });

    // 火狐滚动事件
    addEvent(Element, "DOMMouseScroll", function(e) {

        // 获取滚动方向
        var data = getWheelData(e);
        handler(data);
    });

    function getWheelData(event) {
        event = event || window.event;

        // 阻止默认事件行为
        event.preventDefault ? event.preventDefault() : window.event.returnValue = false;
        return event.wheelDelta ? -event.wheelDelta : event.detail*40;
    }
}

function getStyle(Element, attr) {
    return Element.currentStyle ? Element.currentStyle[attr] : getComputedStyle(Element)[attr];
}

function AddScrollBar() {
    this.init.apply(this, arguments);
}

AddScrollBar.prototype = {
    drag: -1,
    // 初始化
    init: function(mainWrap, content, thumbName) {
        var mainBox = document.getElementById(mainWrap);
        var content = document.getElementById(content);
        var thumb = this._createScroll( mainBox, content, thumbName );
        var track = thumb.parentNode;
        this._selectText(thumb, mainBox, content, track);
        this._dragScroll(thumb, mainBox, content, track);
        this._clickFollow(thumb, mainBox, content, track);
        this._wheelChange(thumb, mainBox, content, track);
    },
    // 文字选中 =============================================================
    _selectText: function(thumb, mainBox, content) {
        var track = thumb.parentNode;
        content.setAttribute("tabIndex", 1);
        var _stopSelect = [];
        _stopSelect.push("-webkit-user-select");
        _stopSelect.push("-moz-user-select");
        _stopSelect.push("-ms-user-select");
        _stopSelect.push("-o-user-select");
        _stopSelect.push("user-select");

        // 添加禁止样式，只有在content中按下才能选择 当前功能不兼容IE
        for (var i=0; i<_stopSelect.length; i++) {
            content.style[_stopSelect[i]] = thumb.style[_stopSelect[i]] = track.style[_stopSelect[i]] = "none";
        }

        content.onmousedown = function() {
            for (var i=0; i<_stopSelect.length; i++) {
                content.style[_stopSelect[i]] = "";
            }
        }

        content.onblur = function() {
            for (var i=0; i<_stopSelect.length; i++) {
                content.style[_stopSelect[i]] = thumb.style[_stopSelect[i]] = track.style[_stopSelect[i]] = "none";
            }
            window.getSelection ? window.getSelection().removeAllRanges() : document.selection.empty();
        }
        
    },
    // 创建滚动条并调整初始样式 ===========================================
    _createScroll: function(mainBox, content, thumbName) {
        var thumb = document.createElement("div");
        var track = document.createElement("div");

        if (typeof thumbName === "string") {
            thumb.className = thumbName;

        } else if(typeof thumbName == "object") {
            for (var key in thumbName) {
                if (key === "className") {
                    thumb.className = thumbName.className;
                }
                thumb.style[key] = thumbName[key];
            }
            track.style.width = "18px";
            track.style.right = 0;
            track.style.position = "absolute";
            track.style.transition = "top 50ms linear";
            track.style.backgroundColor = "#ccc";
        } else {
            thumb.style.width = "18px";
            thumb.style.position = "absolute";
            thumb.style.borderRadius = "9px";
            thumb.style.backgroundColor = "#666";
            track.style.width = "18px";
            track.style.right = 0;
            track.style.position = "absolute";
            track.style.transition = "top 50ms linear";
            track.style.backgroundColor = "#ccc";
        }
        
        track.appendChild(thumb);
        mainBox.appendChild(track);

        track.style.height = mainBox.offsetHeight + "px";

        var cPadding = parseInt(getStyle(content, "padding-left"))+parseInt(getStyle(content, "padding-right"));
        // 调整位置
        content.style.width = mainBox.offsetWidth - track.offsetWidth - cPadding + "px";
        var scrollHeight = parseInt( (mainBox.offsetHeight / content.offsetHeight * mainBox.offsetHeight).toFixed(2) );
        if (scrollHeight >= mainBox.offsetHeight) {
            track.style.display = "none";
            content.style.width = "";
        }

        thumb.style.height = scrollHeight+"px";
        console.log(scrollHeight);


        return thumb;
    },
    // 拖拽滚动条 =======================================================
    _dragScroll: function(thumb, mainBox, content, track) {
        thumb.onmousedown = function(e){
            e = e || event;
            // 初始位置
            var init_ThumbTop = thumb.offsetTop;

            var init_Y = e.clientY;

            document.onmousemove = function(e) {
                e = e || event;
                // 变化量
                var changeY = e.clientY - init_Y;
                // 最终top值
                var top = changeY + init_ThumbTop;

                // 判断边界
                if (top > mainBox.offsetHeight - thumb.offsetHeight) {
                    top = track.offsetHeight - thumb.offsetHeight;
                }
                if (top <= 0) top = 0;

                thumb.style.top = top + "px";

                // 内容区域联动     求往上滚动的x      x : 全长 = top : 可视
                content.style.top = -top * content.offsetHeight / mainBox.offsetHeight + "px";
                
                this.drag = top;

            }

            document.onmouseup = function() {
                document.onmousemove = null;
            }
        }
    },
    // 按下导轨滑块跟随
    _clickFollow: function(thumb, mainBox, content, track) {
        track.onmousedown = function(e) {
            e = e || event;

            // 获取当前网页滚动的高度
            var pageTop = document.documentElement.scrollTop ? document.documentElement.scrollTop : document.body.scrollTop;

            // 折进去的高度         滚上去的高度加clientY ==> top值
            var hide = pageTop - mainBox.offsetTop;

            // 滚上去的高度加clientY ==> top值     再减去滑块高度的一半让滑块到点击中间
            var top = e.clientY+hide - thumb.offsetHeight/2;

            // 判断边界
            if(top <= 0) top = 0
            if (top >= mainBox.offsetHeight - thumb.offsetHeight) {
                top = mainBox.offsetHeight - thumb.offsetHeight;
            }

            // IE9+ target     IE10- src.Element
            var targetElement = e.target || e.srcElement;

            if(targetElement !== thumb ) { 
                thumb.style.top = top+"px";
                // 内容联动
                content.style.top = -top * content.offsetHeight / mainBox.offsetHeight + "px";
                this.drag = top;
            }


        }

        thumb.onmouseover = function() {
            this.style.backgroundColor = "rgba(0, 0, 0, 0.67)";
        }
        thumb.onmouseout = function() {
            this.style.backgroundColor = "rgb(102, 102, 102)";
        }
    },
    // 滚动
    _wheelChange: function(thumb, mainBox, content, track) {
        var scrollSign = 0;
        var _top = 0;
        mouseWheel(mainBox, function(data) {
            // 记录滚动叠加的滚动值  120为单位
            scrollSign+= data;

            // 判断是否拖拽或点击导轨   需要处理拖拽或点击的值
            if (this.drag>=0) {
                // 点击或拖拽滚动条的值加上当前的一次值 避免延迟滚动一格
                scrollSign = (this.drag*12) + data;
                // 最终top值
                _top = scrollSign/12;
                // 处理完拖拽或点击的数据   还原this.drag
                this.drag = -1;

            } else {
                _top = scrollSign/12;
            }

            // 判断边界
            if(_top<=0) {
                _top = 0;
                scrollSign = 0;
            }
            if (_top>=mainBox.offsetHeight-thumb.offsetHeight) {
                _top = mainBox.offsetHeight-thumb.offsetHeight;
                scrollSign = (mainBox.offsetHeight-thumb.offsetHeight)*12;
            }

            thumb.style.top = _top + "px";
            content.style.top = -_top*content.offsetHeight / mainBox.offsetHeight + "px";
        });

    }

}