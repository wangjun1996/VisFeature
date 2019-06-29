const { app, BrowserWindow, Menu, dialog } = require('electron');
const ipcMain = require('electron').ipcMain
const path = require('path');

var mainWindow;
var safeExit = false;
var sequenceDic = {};
var seqIdAndSeqDic = {};
var upseParaObject;

function objectIsNull(object) {
  let bool = (JSON.stringify(object) == "{}");
  return bool;
}

// 当 Electron 完成了初始化并且准备创建浏览器窗口的时候,该方法被调用
app.on('ready', function () {
  mainWindow = new BrowserWindow({ width: 1024, height: 768, minWidth: 1024, minHeight: 768, icon: path.join(__dirname, 'img', 'icon.jpg') });
  mainWindow.loadFile('index.html');

  // 打开开发工具页面
  // mainWindow.webContents.openDevTools();

 //接收 index.html 子进程发来的消息
  ipcMain.on('sequenceDic', (event, arg) => {
    // console.log('<receive> receive sequenceDic from index.html')
    sequenceDic = arg;
  })

  //接收 selectSeqMode1.html 子进程就绪后发来的消息
  ipcMain.on('selectSeqHtmlready', (event, arg) => {
    // console.log(arg)
    // 把 sequenceDic 回复给 selectSeqMode1.html 子进程
    event.returnValue = sequenceDic;
  })

  //接收 visMode1.html 子进程就绪后发来的消息
  ipcMain.on('visHtmlReady', (event, arg) => {
    // console.log(arg)
    // 把 seqIdAndSeqDic 回复给 visMode1.html 子进程
    event.returnValue = seqIdAndSeqDic;
  })

  ipcMain.on('selectSeq-close', (event, arg) => {
    //接收 selectSeqMode1.html 子进程结束后发来的消息
    // console.log('<receive> receive seqIdAndSeqDic from selectSeqMode1.html');
    // console.log('<close> selectSeqMode1.html closed');
    seqIdAndSeqDic = arg;
    // 发送消息给 index.html，index.html 收到后会跳转到 visMode1.html
    mainWindow.webContents.send('jumpToVisMode1Html', '');  
  })

  ipcMain.on('selectSeq-close2', (event, arg) => {
    //接收 selectSeqMode2.html 子进程结束后发来的消息
    // console.log('<receive> receive seqIdAndSeqDic from selectSeqMode2.html');
    // console.log('<close> selectSeqMode2.html closed');
    seqIdAndSeqDic = arg;
    // 发送消息给 index.html，index.html 收到后会跳转到 visMode2.html
    mainWindow.webContents.send('jumpToVisMode2Html', '');
  })

  ipcMain.on('computeAndVis-close', (event, arg) => {
    //接收 computeAndVis.html 子进程结束后发来的消息
    // upseParaObject = arg;
    // 发送消息给 index.html，index.html 收到后会跳转到 visModeCompAndVis.html
    mainWindow.webContents.send('jumpToVisModeCompAndVis', arg);
  })

  //退出系统前发送确认信号
  mainWindow.on('close', (e) => {
    if(!safeExit){
      e.preventDefault();
      mainWindow.webContents.send('action', 'exiting');
    }
  });

});

    //与保存相关的信号
  ipcMain.on('reqaction', (event, arg) => {
    switch(arg){
      case 'exit':
        safeExit=true;
        app.quit();//退出程序
        break;
      //点击目录文件名打开文件
      case 'open':
        mainWindow.webContents.send('showfile', 'open');
        break;
    }
  });

// 当前打开文件对象
function newfile() {
  this.name = null;   // 文件路径
  this.value = null;  // 文件内容
  this.isSaved = true;  // 文件是否已经保存
}

// UltraPse参数对象
function ultraPseParameter(){
  this.inputFile = null;
  this.tdf = null;
  this.type = null;
  this.lambda = null;
  this.omega = null;
  this.outputFormat = null;
  this.outputPath = null;
}

//全局共享变量
global.sharedObject = {
  theFile : new newfile(),
  upsePara : new ultraPseParameter(),
  showfile : "check",
  leftDivWidth : "18%", // 初始状态 left div 宽度
  sequenceType : "None"  //初始序列类型为 None
};
