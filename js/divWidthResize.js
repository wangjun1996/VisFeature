// div实现拖拽效果，宽度发生变化

function bindResize(el) {
    //初始化参数
    var els = document.getElementById('left').style;
    //鼠标的 X 和 Y 轴坐标
    x = 0;
    $(el).mousedown(function (e) {
        //按下元素后，计算当前鼠标与对象计算后的坐标
        x = e.clientX - el.offsetWidth - $("#left").width();
        //在支持 setCapture 做些东东
        el.setCapture ? (
            //捕捉焦点
            el.setCapture(),
            //设置事件
            el.onmousemove = function (ev) {
                mouseMove(ev || event);
            },
            el.onmouseup = mouseUp
        ) : (
                //绑定事件
                $(document).bind("mousemove", mouseMove).bind("mouseup", mouseUp)
            );
        //防止默认事件发生
        e.preventDefault();
    });
    //移动事件
    function mouseMove(e) {
        //运算中...
        els.width = e.clientX - x + 'px';
    }
    //停止事件
    function mouseUp() {
        // 此处为后添加代码：记录用户拖动的 left div 位置
        require('electron').remote.getGlobal('sharedObject').leftDivWidth = document.getElementById('left').style.width;
        //在支持 releaseCapture 做些东东
        el.releaseCapture ? (
            //释放焦点
            el.releaseCapture(),
            //移除事件
            el.onmousemove = el.onmouseup = null
        ) : (
                //卸载事件
                $(document).unbind("mousemove", mouseMove).unbind("mouseup", mouseUp)
            );
    }
}
var divResize = function () {
    var totalHeight = $("html").height();
    var topHeight = $("#top").height()
    $("#left").height(totalHeight - topHeight);
    $("#rightbar").height(totalHeight - topHeight);
}
$(function () {
    divResize();
    $(window).resize(divResize);

    bindResize(document.getElementById('rightbar'));
});