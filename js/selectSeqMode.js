// selectSeqMode1.html和selectSeqMode2.html页面的js代码
const fs = require('fs');
const path = require('path');

// 同步读取 aaindex566.json
var aaindex566Json = readJsonSync(path.join(__dirname, 'txt', 'aaindex566.json'));
// 获取aaindex566.json 中的所有key，即所有理化性质的ID
var propertyKeys = getKeysFromObject(aaindex566Json);

// 不同的序列类型对应不同的理化性质
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

// 值的类型有2种：标准化的和未标准化的
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

// 当选择的最大理化性质数量大于10，提示程序所需的渲染时间会变长
function changeMaxProperty() {
    let maxProperty = $("#maxProperty option:selected").text();
    if(maxProperty > 10){
        alert("Note:\n(1) The excessive number of physicochemical properties selected will result in too many curves on the page of visualization, which will affect the visual effect.\n(2) When the number of physicochemical properties selected is large, the rendering speed of curves will become slower and the delay of the operation will increase.");
    }
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

// 关于最大可选理化性质数量的提示
function explainMaxProperty(){
    alert('This item is used to set the maximum number of selectable physicochemical properties. Note:\n(1) The excessive number of physicochemical properties selected will result in too many curves on the page of visualization, which will affect the visual effect.\n(2) When the number of sequences or the number of physicochemical properties selected is large, the rendering speed of curves will become slower and the delay of the operation will increase.');
}