// 在页面左侧显示dtree样式的文件列表,在页面右侧显示文件内容

var searchUrl = decodeURI(window.location.href);
var selectFolder = getURLParameter('selectFolder');
var selectFile = getURLParameter('selectFile');
var dimension = getURLParameter("dimension");
var seqType = getURLParameter("seqType");

// 若用户选择了文件夹，则在页面左侧展示该文件夹下的所有文件和文件夹 
if (selectFolder != undefined && selectFolder != 'undefined' && selectFolder != null && selectFolder != "null" && selectFolder != ""){
    try{
        showDtree();
    }catch(err){
        alert(err);
    }
}

// 每次单击文件树中的一个文件，在页面右侧显示文件内容
if(selectFolder != null && selectFolder != 'undefined' && selectFolder != "null" && selectFile != null && selectFile != "null" && selectFile != undefined  && selectFile != ""){
    showFileContent();
}

// 解析url路径,获取参数
function getURLParameter(name) {
    return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20'))||null;
}

// 从filename中截取文件扩展名
function getFileSuffix(fileName){
    let fileSuffix = fileName.substring(fileName.lastIndexOf('.') + 1);
    return fileSuffix;
}

// 显示dtree
function showDtree(){
    start = Date.now();
    d = new dTree('d');
    if (selectFolder != null || selectFolder != "") {   // 获取当前路径中的最后一个文件夹名
        var projectName = selectFolder.substring(selectFolder.lastIndexOf("\\") + 1);
    }
    d.add(0, -1, projectName);
    var topDir = readFolder(selectFolder);
    var lastFolder="";
    showFolders(lastFolder, topDir, 0, 1);
    if(Date.now() - start > 5000){
        alert("The number of files and folders in the folder you choose exceeds the limit.\nPlease select a smaller folder.");
        return;
    }
    document.write(d);
}

// 为dtree添加结点
function showFolders(purl, dir, pid, cid){
    var id = cid;
    //将 projectName 下的文件夹添加到 dTree
    for (var i = 0; i < dir["directoryList"].length; i++) {
        d.add(id, pid, dir["directoryList"][i], '', '', '', 'img/folder.gif');
        var lasturl = purl + "\\" + dir["directoryList"][i];
		var url = selectFolder + lasturl;
        var lowerdir = readFolder(url);
        if (JSON.stringify(lowerdir) != "{}") {
            id = showFolders(lasturl, lowerdir, id, id + 1);
        }
    }

    let validFileSuffix = ["fas", "fasta", "txt", "csv"];
    //将 projectName 下的文件添加到 dTree
    for (var j = 0; j < dir["fileList"].length; j++) {
        if(validFileSuffix.indexOf(getFileSuffix(dir["fileList"][j])) > -1){
			var url = "index.html?selectFolder="+selectFolder+"&selectFile="+ purl + "\\" +dir["fileList"][j];
            d.add(id++, pid, dir["fileList"][j], encodeURI(url));
        }
    }
    return id;
}

// 显示文件内容
function showFileContent(){
     // 每次单击一个文件，在页面左侧关闭所有文件树
     d.closeAll();
    
     if(require('electron').remote.getGlobal('sharedObject').showfile=="check"){
         require('electron').remote.getGlobal('sharedObject').showfile = "opening";
     }  
 
     const ipcRenderer2 = require('electron').ipcRenderer;
     ipcRenderer2.on('showfile', (event, arg) => {
         //确认可以打开新文件
         if(arg=='open'){
             const fs=require('fs');
             openFileName = path.join(selectFolder, selectFile);
             if(process.platform == "linux"){
                openFileName = path.join(selectFolder, selectFile.slice(1)); 
             }
             fs.stat(openFileName, function(err,stats){
                if(err){
                  alert(err);
                  return;
                }
                if(stats.size > 5242880){
                  alert("The file is too large, it must be less than 5MB.");
                  return;
                }
                else{
                    let fileSizeM = Math.floor(stats.size / 1048576); // Math.floor向下整除，如4/3=1;
                    if(fileSizeM >= 1){
                      alert(`It will take about ${5*fileSizeM} seconds (the exact time required depends on your computer's performance) to open this file, please do not perform other operations during this period.`);
                    }
                    fs.readFile(openFileName, 'utf-8', function(err,data){
                        if(err){
                            alert(err);
                        }
                        else{
                            var textArea = document.getElementById("textArea");
                            var FilePathLabel = document.getElementById("FilePathLabel");
                            var colorSequence = document.getElementById("colorSequence");
                            textArea.innerText = data;
                            FilePathLabel.innerText = openFileName;
                            require('electron').remote.getGlobal('sharedObject').theFile.name=openFileName;
                            require('electron').remote.getGlobal('sharedObject').theFile.value=data;
                            require('electron').remote.getGlobal('sharedObject').theFile.isSaved=true;
                            visualization();
                            textArea.focus();
                        }
                    });
                    require('electron').remote.getGlobal('sharedObject').showfile = "check";
                }
            });
         }
     });   
}
