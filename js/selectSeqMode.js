// selectSeqMode1.html和selectSeqMode2.html页面的js代码
const fs = require('fs');
const path = require('path');

// 同步读取 aaindex566.json
var aaindex566Json = readJsonSync(path.join(__dirname, 'txt', 'aaindex566.json'));
// 获取aaindex566.json 中的所有key，即所有理化性质的ID
var propertyKeys = getKeysFromObject(aaindex566Json);

function changeType() {
    let sequenceType = document.getElementById("sequenceType").value;
    switch (sequenceType) {
        case 'diDNA':
            controlShowOrHide("tr-valueType", "table-row");
            let didnaJson = readJsonSync(path.join(__dirname, 'txt', 'didna.json'));
            propertyKeys = didnaJson['name'];
            addcheckbox(propertyKeys);
            break;
        case 'triDNA':
            controlShowOrHide("tr-valueType", "table-row");
            let tridnaJson = readJsonSync(path.join(__dirname, 'txt', 'tridna.json'));
            propertyKeys = tridnaJson['name'];
            addcheckbox(propertyKeys);
            break;
        case 'diRNA':
            controlShowOrHide("tr-valueType", "table-row");
            let dirnaJson = readJsonSync(path.join(__dirname, 'txt', 'dirna.json'));
            propertyKeys = dirnaJson['name'];
            addcheckbox(propertyKeys);
            break;
        case 'Protein':
            controlShowOrHide("tr-valueType", "none");
            let aaindex566Json = readJsonSync(path.join(__dirname, 'txt', 'aaindex566.json'));
            propertyKeys = getKeysFromObject(aaindex566Json);
            addcheckbox(propertyKeys);
            break;
    }
}

function changeValueType() {
    let json;
    if($("#valueType").val() == "standard"){
        switch($("#sequenceType").val()){
            case 'diDNA':
                json = readJsonSync(path.join(__dirname, 'txt', 'didna.json'));
                break;
            case 'triDNA':
                json = readJsonSync(path.join(__dirname, 'txt', 'tridna.json'));    
                break;
            case 'diRNA':
                json = readJsonSync(path.join(__dirname, 'txt', 'dirna.json'));          
                break;
        }
    }
    else{
        switch($("#sequenceType").val()){
            case 'diDNA':
                json = readJsonSync(path.join(__dirname, 'txt', 'didna-UltraPse.json'));
                break;
            case 'triDNA':
                json = readJsonSync(path.join(__dirname, 'txt', 'tridna-UltraPse.json'));    
                break;
            case 'diRNA':
                json = readJsonSync(path.join(__dirname, 'txt', 'dirna-UltraPse.json'));          
                break;
        }
    }
    propertyKeys = json['name'];
    addcheckbox(propertyKeys);
} 

// 添加多选框（序列的理化性质ID），data：数组
function addcheckbox(data) {
    let sel = document.getElementById('checkboxes');
    let str = "";
    str += '<tr><td colspan="4">Select Physicochemical Properties:&nbsp;&nbsp;&nbsp;</td></tr>';
    for (let i = 0; i < data.length; i++) {
        if (i % 4 == 0) str += '<tr align="left">';
        str += '<td><input type="checkbox" name="cks" value="' + data[i] + '">' + data[i] + '</input></td>';
    }
    str += '</tr>';
    sel.innerHTML = str;
}

// 同步读取Json格式文件，返回一个Json对象，path:文件路径
function readJsonSync(path) {
    let stringJson = fs.readFileSync(path, 'utf-8');
    let objectJson = JSON.parse(stringJson);
    return objectJson;
}

// 从json格式的object对象中获得所有key，返回由key组成的数组
function getKeysFromObject(object) {
    let keys = [];
    for (var p1 in object) {
        if (object.hasOwnProperty(p1))
            keys.push(p1);
    }
    return keys;
}

// 改变控件的状态：显示/隐藏。controlId:控件ID, status：状态
function controlShowOrHide(controlId, status) {
    let control = document.getElementById(controlId);
    control.style.display = status;
  }