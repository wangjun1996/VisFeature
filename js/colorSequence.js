// 单击"Visualization"按钮后，根据序列类型在colorSequence div中显示改变颜色后的序列
function visualization(sequenceType) {
    // 默认序列类型为DNA
    if(sequenceType == null){
        sequenceType = require('electron').remote.getGlobal('sharedObject').sequenceType;
    }
    changeSequenceColor(textArea.value, sequenceType);
}

// 生成有颜色字母的html
function createColorHtml(color, letter) {
    let htmlTemplate = '<font color="' + color + '">' + letter + '</font>';
    return htmlTemplate;
}

// 根据字母和序列类型，获取对应的字母颜色
function getLetterColor(letter, sequenceType) {
    let dicDna = { 'A': 'red', 'T': '#FF8000', 'C': 'blue', 'G': 'green' }
    let dicRna = { 'A': 'red', 'U': '#FF8000', 'C': 'blue', 'G': 'green' }
    let dicProtein = {
        'A': "#6C6C6C", 'C': '#AE0000', 'D': '#F00078', 'E': '#D200D2', 'F': '#8600FF',
        'G': '#2828FF', 'H': '#0072E3', 'I': '#00CACA', 'K': '#02DF82', 'L': '#00DB00',
        'M': '#8CEA00', 'N': '#C4C400', 'P': '#D9B300', 'Q': '#FF8000', 'R': '#F75000',
        'S': '#B87070', 'T': '#AFAF61', 'V': '#6FB7B7', 'W': '#9999CC', 'Y': '#B766AD'
    }
    if (dicDna.hasOwnProperty(letter) && sequenceType == 'DNA') {
        return dicDna[letter];
    }
    else if (dicRna.hasOwnProperty(letter) && sequenceType == 'RNA') {
        return dicRna[letter];
    }
    else if (dicProtein.hasOwnProperty(letter) && sequenceType == 'Protein')
        return dicProtein[letter];
    else{
        return "";
    }
}

// 判断一个字符是否是英文大写字母
function isCapital(character) {
    for (var i = 0; i < character.length; i++) {
        var c = character.charAt(i);
        if (c < 'A' || c > 'Z')
            return false;
    }
    return true;
}

// 改变序列颜色，在colorSequence div中显示
function changeSequenceColor(data, sequenceType) {
    let html = '';
    dataList = data.split("\n");
    for (let m = 0; m < dataList.length; m++) {
        if (dataList[m][0] == ">") {
            html += '>';
            for (let n = 1; n < dataList[m].length; n++) {
                html += dataList[m][n];
            }
            html += "<br />";
        }
        else {
            for (let n = 0; n < dataList[m].length; n++) {
                let character = dataList[m][n];
                // 若字符是英文大写字母
                if (isCapital(character)) {
                    html += createColorHtml(getLetterColor(character, sequenceType), character);
                }
                else if (character == '>' && m != 0) {
                    html += '<br />';
                }
                else {
                    html += character;
                }
            }
            html += '<br />';
        }
    }
    var colorSequenceDiv = document.getElementById("colorSequence");
    colorSequenceDiv.innerHTML = html;
}
