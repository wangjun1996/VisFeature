// (menu 模块 渲染进程) 在渲染进程中使用模板api创建应用程序菜单栏:
const remote = require('electron').remote;
const dialog = require('electron').remote.dialog;
const app = require('electron').remote.app;
const Menu = require('electron').remote.Menu;


/********菜单栏模板**********/

const mainMenuTemplate = [
  {
    label: 'File',
    submenu: [
      {
        label: 'Open File',
        accelerator: process.platform == 'darwin' ? 'Command+O' : 'Ctrl+O',
        click() {
          const open = askSaveIfNeed();
          if (open == 1 || open == 0)
            openFile();
          if (textArea != null) {
            visualization();
          }
        }
      },
      {
        label: 'Open Folder',
        accelerator: process.platform == 'darwin' ? 'Command+Shift+O' : 'Ctrl+Shift+O',
        click: function (item, focusedWindow) {
          const open2 = askSaveIfNeed();
          if (open2 != 0 && open2 != 1) return;//若取消则保留在当前界面
          if (focusedWindow) {
            selectFolder = dialog.showOpenDialog({
              title: 'Please choose a folder',
              properties: ['openDirectory'],   // properties 可以包含 openFile, openDirectory, multiSelections and createDirectory
            })
            if (selectFolder != undefined && selectFolder != null && selectFolder != "") {
              window.location.href = encodeURI("index.html?selectFolder=" + selectFolder);
            }
          }
        }
      },
      {
        label: 'Open Example Folder',
        accelerator: process.platform == 'darwin' ? 'Command+Shift+E' : 'Ctrl+Shift+E',
        click: function (item, focusedWindow) {
          const open3 = askSaveIfNeed();
          let exampleFolder = path.join(__dirname, 'test');
          if (exampleFolder != undefined && exampleFolder != null && exampleFolder != "") {
            window.location.href = encodeURI("index.html?selectFolder=" + exampleFolder);
          }
        }
      },
      {
        label: 'Save',
        accelerator: process.platform == 'darwin' ? 'Command+S' : 'Ctrl+S',
        click() {
          // 单击后将textarea中的文件内容保存到当前文件
          saveCurrentDoc();
        }
      },
      {
        label: 'Quit',
        accelerator: process.platform == 'darwin' ? 'Command+Q' : 'Ctrl+Q',
        click() {
          app.quit();
        }
      }
    ]
  },
  {
    label: 'Edit',
    submenu: [
      {
        label: 'Undo',
        accelerator: process.platform == 'darwin' ? 'Command+Z' : 'Ctrl+Z',
        role: 'undo'
      },
      {
        label: 'Redo',
        accelerator: process.platform == 'darwin' ? 'Command+Y' : 'Ctrl+Y',
        role: 'redo'
      },
      {
        type: 'separator'
      },
      {
        label: 'Cut',
        accelerator: process.platform == 'darwin' ? 'Command+X' : 'Ctrl+X',
        role: 'cut'
      },
      {
        label: 'Copy',
        accelerator: process.platform == 'darwin' ? 'Command+C' : 'Ctrl+C',
        role: 'copy'
      },
      {
        label: 'Paste',
        accelerator: process.platform == 'darwin' ? 'Command+V' : 'Ctrl+V',
        role: 'paste'
      },
      {
        label: 'Select All',
        accelerator: process.platform == 'darwin' ? 'Command+A' : 'Ctrl+A',
        role: 'selectall'
      },
    ]
  },
  {
    label: 'Visualization',
    submenu: [
      {
        label: 'Main Page',
        accelerator: process.platform == 'darwin' ? 'Command+M' : 'Ctrl+M',
        click() {
          window.location.href = encodeURI("index.html?selectFolder=" + selectFolder + "&selectFile=" + selectFile);
        }
      }
    ]
  },
  {
    label: 'View',
    submenu: [
      {
        label: 'Toggle Full Screen',
        accelerator: process.platform == 'darwin' ? 'Command+Shift+F' : 'F11',
        click: function (item, focusedWindow) {
          if (focusedWindow)
            focusedWindow.setFullScreen(!focusedWindow.isFullScreen());
        }
      },
      {
        type: 'separator'
      },
      {
        label: 'Zoom In',
        accelerator: process.platform == 'darwin' ? 'Command+=' : 'Ctrl+=',
        role: 'zoomin'
      },
      {
        label: 'Zoom Out',
        accelerator: process.platform == 'darwin' ? 'Command+-' : 'Ctrl+-',
        role: 'zoomout'
      },
      {
        label: 'Reset Zoom',
        accelerator: process.platform == 'darwin' ? 'Command+0' : 'Ctrl+0',
        role: 'resetzoom'
      }
    ]
  },
  {
    label: 'Help',
    submenu: [
      {
        label: 'Document',
        click() {
          createDiagram('document.html', { width: 350, height: 150, autoHideMenuBar: true });
        }
      },
      {
        label: 'Learn More',
        click() {
          alert("Please visit our website at https://github.com/wangjun1996/VisFeature");
        }
      }
    ]
  }
];

// 如果当前页面是 index.html,在菜单栏添加菜单项
if (isHtml('index.html')) {
  mainMenuTemplate[2].submenu.push(
    {
      type: 'separator'
    },
    {
      label: 'Fetch Data',
      accelerator: process.platform == 'darwin' ? 'Command+F' : 'Ctrl+F',
      click() {
        createDiagram('fetchData.html', { width: 800, height: 680, autoHideMenuBar: true });
      }
    },
    {
      type: 'separator'
    },
    {
      // 单击该按钮后，输入参数(一条序列，多个理化性质)，生成曲线图
      label: 'Single Sequence Mode',
      accelerator: process.platform == 'darwin' ? 'Command+D' : 'Ctrl+D',
      click() {
        if (checkTextArea() != "textArea error")
          createDiagram('selectSeqMode1.html', { width: 1000, height: 600, autoHideMenuBar: true });
      }
    },
    {
      // 单击该按钮后，输入参数(多条序列，多个理化性质)，生成曲线图
      label: 'Multiple sequences Mode',
      accelerator: process.platform == 'darwin' ? 'Command+E' : 'Ctrl+E',
      click() {
        // 将当前textArea的内容保存到/clustalw2/input.fas，后面读取该文件进行多序列比对
        if (checkTextArea() != "textArea error") {
          saveText(document.getElementById('textArea').value, path.join(__dirname, 'clustalw2', 'input.fas'));
          createDiagram('selectSeqMode2.html', { width: 1000, height: 600, autoHideMenuBar: true });
        }
      }
    },
    {
      type: 'separator'
    },
    {
      // 单击该按钮后，输入参数，计算序列的特征向量，并可视化
      label: 'Compute And Visualization',
      accelerator: process.platform == 'darwin' ? 'Command+G' : 'Ctrl+G',
      click() {
        // 将当前textArea的内容保存到/UltraPse/input.fas，后面使用该文件作为输入文件调用UltraPse进行计算
        saveText(document.getElementById('textArea').value, path.join(__dirname, 'UltraPse', 'input.fas'));
        createDiagram('computeAndVis.html', { width: 1000, height: 400, autoHideMenuBar: true });
      }
    }
  );
}

// 判断当前页面是否等于 htmlName, 返回true/false
function isHtml(htmlName) {
  let url = decodeURI(window.location.href);
  let position = url.lastIndexOf('?');
  let name;
  if (position == -1)
    name = url.substring(url.lastIndexOf('/'));
  else
    name = url.substring(url.lastIndexOf('/'), url.lastIndexOf('?'));
  let curentHtmlName = name.substr(1);
  return curentHtmlName == htmlName ? true : false;
}

// 一个环境变量，用来确定当前所处的阶段,一般生产阶段设为product，开发阶段设为develop
process.env.NODE_ENV = 'product';
// 如果是开发模式下，则在菜单栏显示开发者工具
if (process.env.NODE_ENV == 'develop') {
  mainMenuTemplate.push({
    label: 'Developer Tools',
    submenu: [
      {
        label: 'Reload',
        accelerator: process.platform == 'darwin' ? 'Command+R' : 'Ctrl+R',
        click: function (item, focusedWindow) {
          if (focusedWindow)
            focusedWindow.reload();
        }
      },
      {
        label: 'Toggle DevTools',
        accelerator: process.platform == 'darwin' ? 'Command+I' : 'Ctrl+I',
        click: function (item, focusedWindow) {
          if (focusedWindow)
            focusedWindow.toggleDevTools();
        }
      }
    ]
  })
}

// 从模板生成菜单
const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
// 插入菜单
Menu.setApplicationMenu(mainMenu);

/********saveFile**********/

let textArea = document.getElementById("textArea"); //获得TextArea文本框的引用

//监控文本框内容是否改变
if (textArea != null) {
  textArea.oninput = (e) => {
    require('electron').remote.getGlobal('sharedObject').theFile.isSaved = false;
    require('electron').remote.getGlobal('sharedObject').theFile.value = textArea.value;//更新当前打开文件内容
  };
}

//保存文本内容到文件(同步)
function saveText(text, file) {
  const fs = require('fs');
  fs.writeFileSync(file, text);
}

//保存当前文档
function saveCurrentDoc() {
  if (!require('electron').remote.getGlobal('sharedObject').theFile.name) {
    const file = remote.dialog.showSaveDialog(remote.getCurrentWindow(), {
      filters: [
        { name: 'Fasta format', extensions: ['fas'] },
        { name: 'Text format', extensions: ['txt'] }]
    });
    if (file) {
      document.getElementById("FilePathLabel").innerText = file;
      require('electron').remote.getGlobal('sharedObject').theFile.name = file;
    }
  }
  if (require('electron').remote.getGlobal('sharedObject').theFile.name) {
    const txtSave = require('electron').remote.getGlobal('sharedObject').theFile.value;
    saveText(txtSave, require('electron').remote.getGlobal('sharedObject').theFile.name);
    require('electron').remote.getGlobal('sharedObject').theFile.isSaved = true;
    return 0;
  }
}

//如果需要保存，弹出保存对话框询问用户是否保存当前文档
function askSaveIfNeed() {
  let askMessage = "";
  if (require('electron').remote.getGlobal('sharedObject').theFile.isSaved) return 1;
  if (require('electron').remote.getGlobal('sharedObject').theFile.name != null)
    askMessage = 'Do you want to save the document\n"' + require('electron').remote.getGlobal('sharedObject').theFile.name + '"?';
  else
    askMessage = 'Do you want to save the current document?'
  const response = dialog.showMessageBox(remote.getCurrentWindow(), {
    message: askMessage,
    type: 'question',
    buttons: ['Yes', 'No']
  });
  if (response == 0) return saveCurrentDoc(); //点击Yes按钮后保存当前文档
  else return response;
}

//监听与主进程的通信
const ipcRenderer1 = require('electron').ipcRenderer;
ipcRenderer1.on('action', (event, arg) => {
  switch (arg) {
    //退出前确认保存
    case 'exiting':
      const save = askSaveIfNeed();
      if (save == 0 || save == 1)
        ipcRenderer1.sendSync('reqaction', 'exit');
      break;
  }
});

if (require('electron').remote.getGlobal('sharedObject').showfile == "opening") {
  const check = askSaveIfNeed();
  if (check == 1 || check == 0)
    ipcRenderer1.send('reqaction', 'open');
}

/*********openFile********/

//读取文本文件
function readText(file) {
  const fs = require('fs');
  return fs.readFileSync(file, 'utf8');
}

//打开文件
function openFile() {
  const fs = require('fs');
  const files = remote.dialog.showOpenDialog(remote.getCurrentWindow(), {
    title: 'Please choose a file in fasta format',
    filters: [
      { name: 'Fasta Files', extensions: ['fas', 'fasta'] },
      { name: 'All Files', extensions: ['*'] }],
    properties: ['openFile']
  });
  //更新和显示当前打开文件信息
  if (files) {
    fs.stat(files[0], function(err,stats){
      if(err){
        alert(err);
        return;
      }
      if(stats.size > 5242880){
        alert("The file is too large, it must be less than 5MB.");
        return;
      }
      else{
        document.getElementById("FilePathLabel").innerText = files[0];
        const txtRead = readText(files[0]);
        require('electron').remote.getGlobal('sharedObject').theFile.name = files[0];
        require('electron').remote.getGlobal('sharedObject').theFile.value = txtRead;
        require('electron').remote.getGlobal('sharedObject').theFile.isSaved = true;
        if (textArea == null) {
          window.location.href = encodeURI("index.html?selectFile=" + files[0]);
        }
        else {
          textArea.value = txtRead;
        }
      }
    })
  }
}

/*********给文本框增加右键菜单********/

const contextMenuTemplate = [
  { // 选择序列类型,对应不同的字母配色方案
    label: 'Sequence Type',
    submenu: [
      {
        label: 'None',
        click() {
          require('electron').remote.getGlobal('sharedObject').sequenceType = 'None';
          $("#colorSequence").css("display", "none");
          $('.textArea').css('-webkit-text-fill-color', 'black');
          $('.textArea').css('background-color', 'white');
          // visualization('None');
        }
      },
      {
        label: 'DNA',
        click() {
          require('electron').remote.getGlobal('sharedObject').sequenceType = 'DNA';
          showBackDiv();
          visualization('DNA');
        }
      },
      {
        label: 'RNA',
        click() {
          require('electron').remote.getGlobal('sharedObject').sequenceType = 'RNA';
          showBackDiv();
          visualization('RNA');
        }
      },
      {
        label: 'Protein',
        click() {
          require('electron').remote.getGlobal('sharedObject').sequenceType = 'Protein';
          showBackDiv();
          visualization('Protein');
        }
      }
    ]
  },
  { // 显示示例fasta文件
    label: 'Example Fasta',
    submenu: [
      {
        label: 'DNA',
        click() {
          require('electron').remote.getGlobal('sharedObject').sequenceType = 'DNA';
          example('DNA');
        }
      },
      {
        label: 'RNA',
        click() {
          require('electron').remote.getGlobal('sharedObject').sequenceType = 'RNA';
          example('RNA');
        }
      },
      {
        label: 'Protein',
        click() {
          require('electron').remote.getGlobal('sharedObject').sequenceType = 'Protein';
          example('Protein');
        }
      }
    ]
  },
  { type: 'separator' },
  { role: 'undo' },       //Undo菜单项
  { role: 'redo' },       //Redo菜单项
  { type: 'separator' },  //分隔线
  { role: 'cut' },        //Cut菜单项
  { role: 'copy' },       //Copy菜单项
  { role: 'paste' },      //Paste菜单项
  { role: 'delete' },     //Delete菜单项
  { type: 'separator' },  //分隔线
  { role: 'selectall' }   //Select All菜单项
];
const contextMenu = Menu.buildFromTemplate(contextMenuTemplate);
if (textArea != null) {
  textArea.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    contextMenu.popup(remote.getCurrentWindow());
  });
}

// 单击可视化界面的"Main Page"按钮，跳转到主界面
function backToMainPage() {
  window.location.href = encodeURI("index.html?selectFolder=" + selectFolder + "&selectFile=" + selectFile);
}

// 检查当前TextArea
function checkTextArea() {
  if ($("#textArea").val().length == 0) { // 如果TextArea内容为空弹框提示
    alert("The content of the input area is empty. Please input or open a file in FASTA format.");
    return "textArea error";
  }
  if ($("#textArea").val().indexOf(">") == -1) {  // 如果TextArea的格式不是fasta弹框提示
    alert("No sequence was found. Please ensure the format of input is fasta.");
    return "textArea error";
  }
}

// 检查当前打开的文件是不是fasta格式
function checkFileFormat(){
  if(selectFile == null)  // 若没打开文件，则默认为fasta格式
    return true;
  if(getFileExtensionName(selectFile) == "fas" || getFileExtensionName(selectFile) == "fasta")
    return true;
  else
    return false;
}

// 获取文件的扩展名（后缀）
function getFileExtensionName(filename) {
  let index1 = filename.lastIndexOf(".");
  let index2 = filename.length;
  let extensionName = filename.substring(index1 + 1, index2);
  return extensionName;
}

// 显示TextArea背后的div，再把TextArea的文字和背景设置成透明，实现序列字母上色
function showBackDiv() {
  $("#colorSequence").css("display", "inline");
  $('.textArea').css('-webkit-text-fill-color', 'transparent');
  $('.textArea').css('background-color', 'transparent');
}
