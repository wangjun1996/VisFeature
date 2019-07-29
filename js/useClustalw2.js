// 当VisMode2.html中的下拉框内容改变后所做的操作
function modeChanged() {
    let mode = document.getElementById('mode').value;
    switch (mode) {
        case 'default':
            alignmentResultShowOrHide("none");
            updateDiagram(true, seqIdAndSeqDic, {});
            break;

        case 'truncation':
            alignmentResultShowOrHide("none");
            updateDiagram(true, seqIdAndSeqDic, {});
            break;

        case 'clustalw2':
            if(handleInputFasta('clustalw2') == false){
                document.getElementById('mode').value = 'default';
                updateDiagram(true, seqIdAndSeqDic, {});
                break;
            }
            let clustalw2List = runClustalw2('input.fas');
            let clustalw2Result = getClustalw2Result(clustalw2List);
            showClustalw2Result(clustalw2List);
            updateDiagram(true, seqIdAndSeqDic, clustalw2Result);
            break;
    }
}

// (当mode为clustalw2)根据用户选择的序列ID，处理input.fas:只保留用户选择的序列，若mode为clustalw2且input.fas包含同名序列，则返回false
function handleInputFasta(mode){
    let result = [];
    let str = '';
    let filePath = path.join(__dirname, 'clustalw2', 'input.fas');
    let data = fs.readFileSync(filePath, 'utf-8');
    let array = data.split('>');
    let idArray = [];

    for(let i = 0; i < array.length; i++){
        let id = array[i].split('\n')[0];
        id = id.split(" ")[0];  // 根据clustal2对序列ID的处理规则处理ID
        if(array[i].length > 0 && ifSelect('>'+id))
            result.push(array[i]);
    }

    for(let j = 0; j < result.length; j++){
        let temp = result[j].split('\n');
        idArray.push(temp[0]);
        for(let k = 0; k < temp.length; k++){
            k == 0 ? str += '>' + temp[k] : str += temp[k];
            k == temp.length-1 ? str += '' : str += '\n';
        }
    }
    if (mode == 'clustalw2' && SameName(idArray))
        return false;
    fs.writeFileSync(filePath, str);
}

// 判断一个序列ID是否被用户选中
function ifSelect(id){
    let selectId = seqIdAndSeqDic['seqId'];
    for(let i = 0; i < selectId.length; i++){
        if(id == selectId[i])
            return true;
    }
    return false;
}

// 判断用户选择的序列ID中是否存在多条序列同名
function SameName(idArray) {
    var hash = {};
    for (var i in idArray) {
        if (hash[idArray[i]]){
            alert("Unable to call clustalw2, because multiple sequences found with same name.\n(found " + idArray[i] + " at least twice)");
            return true; 
        }
        hash[idArray[i]] = true;
    }
    return false;
}

// clustalw2模式下显示多序列比对结果，其他模式隐藏比对结果
function alignmentResultShowOrHide(status) {
    let div = document.getElementById('alignmentResult');
    div.style.display = status;
}

// 若下拉框中选择的是'clustalw2'，调用clustalw2进行多序列比对，结果存在/clustalw2/output.fas文件中，返回比对结果数组
function runClustalw2(file) {
    const fs = require('fs');
    let result = "";
    let resultList = [];
    let clustalw2List = [];
    let resultStart = 45;   // clustalw2结果的起始位置，windows下为45，linux下为42

    let cmdResult = runExecSync('clustalw2 -INFILE=' + file + ' -OUTFILE=output.fas -OUTORDER=INPUT ', path.join(__dirname, 'clustalw2'));
    
    let openFileName = path.join(__dirname, 'clustalw2', 'output.fas');

    let data = fs.readFileSync(openFileName, 'utf-8');  //同步读取clustalw2计算得出的结果
    alignmentResultShowOrHide("block");

    let dataList = data.split("");
    if(process.platform == "linux"){
        resultStart = 42;
    }
    for (let i = resultStart; i + 1 < dataList.length; i++) {
        if (dataList[i] == "\n" && dataList[i + 1] == " ") {
            result = data.substring(resultStart, dataList.length);
            break;
        }
    }

    resultList = result.split("\n");     // 将data按行分割成数组resultList

    let j = 0;
    let spaceStart;
    let spaceEnd;
    for (let i = 0; i < resultList.length; i++) {
        if (resultList[i].length > 1 && resultList[i][0] != " ") {
            spaceStart = 0;
            spaceEnd = 0;
            while (resultList[i][spaceStart] != " ")
                spaceStart++;
            spaceEnd = spaceStart;
            while (resultList[i][spaceEnd] == " ")
                spaceEnd++;
            clustalw2List[j] = resultList[i].substring(0, spaceStart);
            clustalw2List[j + 1] = resultList[i].substring(spaceEnd);
            j = j + 2;
        }
        if (resultList[i][0] == " ") {
            clustalw2List[j] = resultList[i].substring(spaceEnd);   // 将 序列ID、序列内容和相似性标志 拆分存入clustalw2List
            j = j + 1;
        }
    }
    return clustalw2List;
}

// 将Clustalw2的计算结果显示在visMode2Table
function showClustalw2Result(clustalw2List) {
    let visMode2Table = document.getElementById('visMode2Table');
    let html = "";
    let reg = /[0-9a-zA-Z]/i;

    visMode2Table.innerHTML = "";
    html += '<tr><th colspan="2">' + 'CLUSTAL 2.1 multiple sequence alignment result' + '</th></tr>';
    for (let i = 0; i < clustalw2List.length; i++) {
        if (reg.test(clustalw2List[i])) {
            html += "<tr><td>" + clustalw2List[i] + "</td><td>" + "&nbsp;&nbsp;&nbsp;" + clustalw2List[i + 1] + "</td></tr>";
            i++;
        }
        else
            html += "<tr><td></td><td>" + "&nbsp;&nbsp;&nbsp;" + clustalw2List[i] + "</td></tr>";
    }
    visMode2Table.innerHTML += html;
}

// 以字典格式返回clustalw2计算结果，alignmentResult：序列比对结果的字典,similarity:相似性数组
function getClustalw2Result(clustalw2List) {
    let alignmentResult = {};
    let similarity = [];
    for (let k = 0; k < clustalw2List.length; k++) {
        if (clustalw2List[k][0] == " " || clustalw2List[k][0] == "*" || clustalw2List[k][0] == ":" || clustalw2List[k][0] == ".")
            similarity.push(clustalw2List[k]);
        else {
            if (alignmentResult.hasOwnProperty(clustalw2List[k]))
                alignmentResult[clustalw2List[k]] = alignmentResult[clustalw2List[k]] + clustalw2List[k + 1];
            else
                alignmentResult[clustalw2List[k]] = clustalw2List[k + 1];
            k++;
        }
    }
    let clustalw2Result = { 'alignmentResult': alignmentResult, 'similarity': similarity };
    return clustalw2Result;
}

// （同步）执行命令行，command:命令，path:执行命令的路径
function runExecSync(command, path) {
    const execSync = require('child_process').execSync;
    // 如果当前系统平台是Linux，则要在command前加上./
    if(process.platform == "linux" && command.substr(0,1) !== "."){
        command = "./" + command;
    }
    // 执行命令行，如果命令不需要路径，或就是项目根目录，则不需要path参数：
    let cmdResult = execSync(command, { cwd: path });
    return cmdResult;
}

// （异步）执行命令行，command:命令，path:执行命令的路径
function runExec(command, path) {
    const exec = require('child_process').exec;
    let workerProcess;

    // 执行命令行，如果命令不需要路径，或就是项目根目录，则不需要cwd参数：
    workerProcess = exec(command, { cwd: path });
    // 不受child_process默认的缓冲区大小的使用方法，没参数也要写上{}：workerProcess = exec(cmdStr, {})

    // 打印正常的后台可执行程序输出
    workerProcess.stdout.on('data', function (data) {
        console.log('======stdout:====== \n' + data);
    });

    // 打印错误的后台可执行程序输出
    workerProcess.stderr.on('data', function (data) {
        console.log('stderr: ' + data);
    });

    // 退出之后的输出,code:子进程的退出码,除 0 以外的任何退出码都被视为出错
    workerProcess.on('close', function (code) {
        console.log('cmd exit code：' + code);
    })
}