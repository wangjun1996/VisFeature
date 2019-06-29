// 使用echarts控件将曲线图显示在diagram div上

const BrowserWindow = require('electron').remote.BrowserWindow;
const ipcRenderer = require('electron').ipcRenderer;
const fs = require('fs');

// 若newWindowFlag值为0，表示新窗口不存在，值为1表示已存在
var newWindowFlag = 0;
var sequenceDic = {};

// 若当前页面是visMode1.html或visMode2.html
if (isHtml('visMode1.html') || isHtml('visMode2.html')) {
    // visMode1/visMode2页面就绪后，给主进程发送同步消息，将主进程回复的值赋给变量sequenceDic，在等待主进程返回中，会阻止其他操作
    var seqIdAndSeqDic = ipcRenderer.sendSync('visHtmlReady', '<ready> visMode.html is ready')
    var ifmode2 = seqIdAndSeqDic['ifmode2'];
    var checked = seqIdAndSeqDic['checked'];
    var valueType = seqIdAndSeqDic['valueType'];

    updateDiagram(ifmode2, seqIdAndSeqDic, {});
}

// 下拉框选项变化后，根据mode更新曲线图
function updateDiagram(ifmode2, seqIdAndSeqDic, clustalw2Result) {
    let seqId = seqIdAndSeqDic['seqId'];
    let seqType = seqIdAndSeqDic['sequenceType'];
    let selectSeq = [];
    if (ifmode2) {
        switch (document.getElementById('mode').value) {
            case 'default':
                for (let i = 0; i < seqId.length; i++) {
                    selectSeq.push(seqIdAndSeqDic['sequenceDic'][seqId[i]]);
                }
                break;
            case 'truncation':
                let minSeqLength = seqIdAndSeqDic['sequenceDic'][seqId[0]].length;
                let sequence = "";
                for (let i = 1; i < seqId.length; i++) {
                    if (seqIdAndSeqDic['sequenceDic'][seqId[i]].length < minSeqLength)
                        minSeqLength = seqIdAndSeqDic['sequenceDic'][seqId[i]].length;
                }
                for (let i = 0; i < seqId.length; i++) {
                    sequence = seqIdAndSeqDic['sequenceDic'][seqId[i]];
                    if (seqIdAndSeqDic['sequenceDic'][seqId[i]].length > minSeqLength)
                        sequence = sequence.substring(0, minSeqLength);
                    selectSeq.push(sequence);
                }
                break;
            case 'clustalw2':
                for (let i = 0; i < seqId.length; i++) {
                    selectSeq.push(clustalw2Result['alignmentResult'][seqId[i].substring(1)]);
                }
                break;
        }
    }
    else
        selectSeq = seqIdAndSeqDic['sequenceDic'][seqId];

    let seqJson = getJson(seqType);

    if (ifmode2) drawDiagrams(seqId, selectSeq, seqJson, seqType);
    else drawDiagram(seqId, selectSeq, seqJson, seqType);
}

// 根据选中的序列类型同步读取相应的 理化性质和对应数值 json文件
function getJson(seqType) {
    let json;
    if(valueType == "standard"){
        switch (seqType) {
            case 'Protein':
                json = readJsonSync(path.join(__dirname, 'txt', 'aaindex566.json'));
                break;
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
        switch (seqType) {
            case 'Protein':
                json = readJsonSync(path.join(__dirname, 'txt', 'aaindex566.json'));
                break;
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
    return json;
}

// 处理seqID:去除曲线图标题中序列ID前面的'>'
function handleSeqId(seqId) {
    let newSeqId = [];
    for (let i = 0; i < seqId.length; i++)
        newSeqId.push(seqId[i].substring(1));
    return newSeqId;
}

// 同步读取Json格式文件，返回Json对象，path:文件路径
function readJsonSync(path) {
    let stringJson = fs.readFileSync(path, 'utf-8');
    let objectJson = JSON.parse(stringJson);
    return objectJson;
}

// 将sequenceDic发给主进程，并创建一个弹出的新窗体。url:新窗体的url，parameter：窗体的参数
function createDiagram(url, parameter) {
    if (newWindowFlag == 0) {
        if (textArea == null)    // textArea == null 即：在可视化页面调用Fetch
            createWindow(url, parameter);
        else {
            sequenceList = textArea.value.split('>');
            sequenceDic = seqArrToDic(sequenceList);
            createWindow(url, parameter);
            // 将 sequenceDic 发送给主进程
            ipcRenderer.send('sequenceDic', sequenceDic);
        }
    }
    else {
        newWindow.focus();
    }
}

// 创建一个弹出的新窗体
function createWindow(windowUrl, windowParameter) {
    newWindow = new BrowserWindow(windowParameter);
    newWindow.loadFile(windowUrl);
    newWindowFlag = 1;

    // 关闭窗口时进行垃圾回收
    newWindow.on('close', function () {
        newWindow = null;
        newWindowFlag = 0;
    });

    // 当窗口失去焦点后的操作
    newWindow.on('blur', function () {

    });
}

// 将数组格式的序列转换为字典格式, key:序列ID, value:序列内容
function seqArrToDic(list) {
    let key;
    let value;
    let dic = {};

    for (i = 0; i < list.length; i++) {
        if (list[i].length > 0) {
            list[i] = '>' + list[i];
            for (j = 0; j < list[i].length; j++) {
                if (list[i][j] == '\n') {
                    key = list[i].substring(0, j);
                    key = key.split(" ")[0];        // 此行是2019.4.19后添加
                    value = list[i].substring(j);
                    value = value.replace(/[\r\n]/g, ""); // 去掉序列中的回车换行
                    dic[key] = value;
                    break;
                }
            }
        }
    }
    return dic
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

// 获得数字和序列元素组成的字典, key:序列元素, value:数字(0~19)
function getAaDic(seqType) {
    let dic = {};
    let arr = [];
    switch (seqType) {
        case 'Protein':
            arr = ["A", "C", "D", "E", "F", "G", "H", "I", "K", "L", "M", "N", "P", "Q", "R", "S", "T", "V", "W", "Y"];
            break;
        case 'diDNA':
            if(valueType == "standard")
                arr = ["Base stacking", "Protein induced deformability", "B-DNA twist", "Dinucleotide GC Content", "A-philicity", "Propeller twist", "Duplex stability:(freeenergy)", "Duplex tability(disruptenergy)", "DNA denaturation", "Bending stiffness", "Protein DNA twist", "Stabilising energy of Z-DNA", "Aida_BA_transition", "Breslauer_dG", "Breslauer_dH", "Breslauer_dS", "Electron_interaction", "Hartman_trans_free_energy", "Helix-Coil_transition", "Ivanov_BA_transition", "Lisser_BZ_transition", "Polar_interaction", "SantaLucia_dG", "SantaLucia_dH", "SantaLucia_dS", "Sarai_flexibility", "Stability", "Stacking_energy", "Sugimoto_dG", "Sugimoto_dH", "Sugimoto_dS", "Watson-Crick_interaction", "Twist", "Tilt", "Roll", "Shift", "Slide", "Rise", "Clash Strength", "Roll_roll", "Twist stiffness", "Tilt stiffness", "Shift_rise", "Adenine content", "Direction", "Twist_shift", "Enthalpy1", "Twist_twist", "Roll_shift", "Shift_slide", "Shift2", "Tilt3", "Tilt1", "Tilt4", "Tilt2", "Slide (DNA-protein complex)1", "Tilt_shift", "Twist_tilt", "Twist (DNA-protein complex)1", "Tilt_rise", "Roll_rise", "Stacking energy", "Stacking energy1", "Stacking energy2", "Stacking energy3", "Propeller Twist", "Roll11", "Rise (DNA-protein complex)", "Tilt_tilt", "Roll4", "Roll2", "Roll3", "Roll1", "Minor Groove Size", "GC content", "Slide_slide", "Enthalpy", "Shift_shift", "Slide stiffness", "Melting Temperature1", "Flexibility_slide", "Minor Groove Distance", "Rise (DNA-protein complex)1", "Tilt (DNA-protein complex)", "Guanine content", "Roll (DNA-protein complex)1", "Entropy", "Cytosine content", "Major Groove Size", "Twist_rise", "Major Groove Distance", "Twist (DNA-protein complex)", "Purine (AG) content", "Melting Temperature", "Free energy", "Tilt_slide", "Major Groove Width", "Major Groove Depth", "Wedge", "Free energy8", "Free energy6", "Free energy7", "Free energy4", "Free energy5", "Free energy2", "Free energy3", "Free energy1", "Twist_roll", "Shift (DNA-protein complex)", "Rise_rise", "Flexibility_shift", "Shift (DNA-protein complex)1", "Thymine content", "Slide_rise", "Tilt_roll", "Tip", "Keto (GT) content", "Roll stiffness", "Minor Groove Width", "Inclination", "Entropy1", "Roll_slide", "Slide (DNA-protein complex)", "Twist1", "Twist3", "Twist2", "Twist5", "Twist4", "Twist7", "Twist6", "Tilt (DNA-protein complex)1", "Twist_slide", "Minor Groove Depth", "Roll (DNA-protein complex)", "Rise2", "Persistance Length", "Rise3", "Shift stiffness", "Probability contacting nucleosome core", "Mobility to bend towards major groove", "Slide3", "Slide2", "Slide1", "Shift1", "Bend", "Rise1", "Rise stiffness", "Mobility to bend towards minor groove"];
            else
                arr = ["Base stacking", "Protein induced deformability", "B-DNA twist", "Dinucleotide GC Content", "A-philicity", "Propeller twist", "Duplex stability (freeenergy)", "Duplex stability (disruptenergy)", "DNA denaturation", "Bending stiffness", "Protein DNA twist", "Stabilising energy of Z-DNA", "Aida_BA_transition", "Breslauer_dG", "Breslauer_dH", "Breslauer_dS", "Electron_interaction", "Hartman_trans_free_energy", "Helix-Coil_transition", "Ivanov_BA_transition", "Lisser_BZ_transition", "Polar_interaction", "SantaLucia_dG", "SantaLucia_dH", "SantaLucia_dS", "Sarai_flexibility", "Stability", "Stacking_energy", "Sugimoto_dG", "Sugimoto_dH", "Sugimoto_dS", "Watson-Crick_interaction", "Twist", "Tilt", "Roll", "Shift", "Slide", "Rise", "Stacking energy", "Bend", "Tip", "Inclination", "Major Groove Width", "Major Groove Depth", "Major Groove Size", "Major Groove Distance", "Minor Groove Width", "Minor Groove Depth", "Minor Groove Size", "Minor Groove Distance", "PersistanceLength", "MeltingTemperature", "Mobilitytobendtowardsmajorgroove", "Mobilitytobendtowardsminorgroove", "PropellerTwist", "ClashStrength", "Enthalpy", "Shift(RNA)", "Hydrophilicity(RNA)", "Freeenergy", "Twist_twist", "Tilt_tilt", "Roll_roll", "Twist_tilt", "Twist_roll", "Tilt_roll", "Shift_shift", "Slide_slide", "Rise_rise", "Shift_slide", "Shift_rise", "Slide_rise", "Twist_shift", "Twist_slide", "Twist_rise", "Tilt_shift", "Tilt_slide", "Tilt_rise", "Roll_shift", "Roll_slide", "Roll_rise", "Slidestiffness", "Shiftstiffness", "Rollstiffness", "Risestiffness", "Tiltstiffness", "Twiststiffness", "Wedge", "Direction", "Flexibility_slide", "Flexibility_shift", "Entropy"];
            break;
        case 'triDNA':
            if(valueType == "standard")
                arr = ["Bendability (DNAse)", "Bendability (consensus)", "Trinucleotide GC Content", "Nucleosome positioning", "Consensus_roll", "Consensus-Rigid", "Dnase I", "Dnase I-Rigid", "MW-Daltons", "MW-kg", "Nucleosome", "Nucleosome-Rigid"];
            else
                arr = ["Bendability-DNAse", "Bendability-consensus", "Trinucleotide GC Content", "Nucleosome positioning", "Consensus_roll", "Consensus_Rigid", "Dnase I", "Dnase I-Rigid", "MW-Daltons", "MW-kg", "Nucleosome", "Nucleosome-Rigid"];
            break;
        case 'diRNA':
            if(valueType == "standard")
                arr = ["Slide (RNA)", "Adenine content", "Hydrophilicity (RNA)", "Tilt (RNA)", "Stacking energy (RNA)", "Twist (RNA)", "Entropy (RNA)", "Roll (RNA)", "Purine (AG) content", "Hydrophilicity (RNA)1", "Enthalpy (RNA)1", "GC content", "Entropy (RNA)1", "Rise (RNA)", "Free energy (RNA)", "Keto (GT) content", "Free energy (RNA)1", "Enthalpy (RNA)", "Guanine content", "Shift (RNA)", "Cytosine content", "Thymine content"];
            else
                arr = ["Shift", "Slide", "Rise", "Tilt", "Roll", "Twist", "Stacking energy", "Enthalpy", "Entropy", "Free energy", "Hydrophilicity"];
            break;
    }
    for (let i = 0; i < arr.length; i++) {
        dic[arr[i]] = i;

    }
    return dic;
}

// 获取Echarts中series下的data数组(y)
function getEchartsDataArr(seqList, valueList, aaDic, seqType, property, seqJson) {
    let dataArr = [];
    let data = "";
    let str = "";
    let num;
    let isProtein = true;
    if (seqType != 'Protein')
        isProtein = false;
    for (let i = 0; i < seqList.length; i++) {
        str = seqList[i];   // str:序列中的每个元素
        if (!isProtein) {
            valueList = seqJson[str];
            if (valueList == undefined) {
                dataArr.push("");
                continue;
            }
            num = aaDic[property];
            data = valueList[num];  // data:该元素对应的理化性质的值
            dataArr.push(data);
        }
        else {
            num = aaDic[str];   // num:每个元素对应的下标数字
            data = valueList[num];  // data:该元素对应的理化性质的值
            dataArr.push(data);
        }
    }
    return dataArr;
}

// 根据序列类型，获得由 单个/二连/三连 字符组成的数组
function getSeqDataArr(selectSeq, seqType) {
    let seqList = [];
    switch (seqType) {
        case 'Protein':
            seqList = selectSeq.split("");
            break;
        case 'diDNA':
            seqList = handleSeq(selectSeq, 2);
            break;
            break;
        case 'triDNA':
            seqList = handleSeq(selectSeq, 3);
            break;
            break;
        case 'diRNA':
            seqList = handleSeq(selectSeq, 2);
            break;
    }
    return seqList;
}

// 处理序列，返回一个由二连/三连字符串组成的数组
function handleSeq(selectSeq, num) {
    arr = []
    for (let i = 0; i < selectSeq.length - num + 1; i++) {
        arr.push(selectSeq.substring(i, i + num));
    }
    return arr;
}

// 画单条曲线图
// // seqId:所有选中的序列ID组成的数组，selectSeq:所有选中的序列内容组成的数组，seqJson:理化性质和对应数值组成的json文件，seqType:可视化的序列类型
function drawDiagram(seqId, selectSeq, seqJson, seqType) {
    var newSeqId = seqId.substring(1);
    var seqList = getSeqDataArr(selectSeq, seqType);
    var aaDic = getAaDic(seqType);


    // 基于准备好的dom，初始化echarts实例
    var myChart = echarts.init(document.getElementById('diagram'));

    var series = [];
    for (var i = 0; i < checked.length; i++) {
        if (seqType == 'Protein') {
            var valueList = seqJson[checked[i]];
            var EchartsDataArr = getEchartsDataArr(seqList, valueList, aaDic, seqType, '', seqJson);
        }
        else
            var EchartsDataArr = getEchartsDataArr(seqList, [], aaDic, seqType, checked[i], seqJson);
        series.push({
            name: checked[i],
            type: 'line', // 类型：线
            data: EchartsDataArr,
            smooth: true,  //true 为平滑曲线，false为直线
            markPoint: {
                symbol: 'pin',
                symbolSize: 20,
                // 特殊标注文字
                label: {
                    normal: {
                        show: true,
                        // 显示的文字
                        formatter: '{b}：{c}',
                    }
                },
                // 触发操作
                tooltip: {
                    show: false, // 是否显示
                    formatter: '{b}：{c}', // 内容格式器 a（系列名称），b（类目值），c（数值）, d（无）
                    trigger: 'item', // 触发类型，默认数据触发，见下图，可选为：'item' | 'axis'
                },
                data:[
                    {name:'max', type:'max'},
                    {name:'min', type: 'min'}
                ]
            },
            markLine:{
                data:[
                    {name:'average', type:'average'}
                ],
                lineStyle:{
                    type: 'dashed',
                    opacity: 0.5    // 透明度
                }
            }
        });
    }
    // 指定图表的配置项和数据
    var option = {
        // 工具栏
        toolbox: {
            itemSize: 13,
            padding: [1, 10, 1, 1],    // 工具箱内边距，单位px，默认各方向内边距为5，数组:上右下左边距
            feature: {
             // 数据缩放和数据缩放还原
                dataZoom:{
                    title:{
                        zoom: 'Zoom In Area',
                        back: 'Restore Zoom'
                    }
                },
                // 可切换折线图和柱状图
                magicType:{
                    type: ['line', 'bar'],
                    title:{
                        line: 'Line Chart',
                        bar: 'Bar Chart'
                    }
                },
                // 还原所有
                restore: {
                    title: 'Restore'
                },
                // 数据视图，可以展现当前图表所用的数据，编辑后可以动态更新。
                dataView: {
                    title: 'Data View',
                    lang: ['Data View', 'Close', 'Update'],
                    backgroundColor: '#F4F6CF',
                },
                // 保存图片到本地
                saveAsImage: {
                    title: 'Save'
                }
            }
        },
        // 标题：选择的序列ID
        title: {
            text: newSeqId,
            textStyle: {
                fontSize: 13,
                fontWeight: 600
            }
        },
        // 网格图的边距设置
        grid: {
            left: '5%',
            right: '5%',
            top: '10%',
            bottom: '10%',
        },
        // x轴：选择的序列ID所对应的序列
        xAxis: {
            data: seqList
        },
        // y轴
        yAxis: {
            type: 'value'
        },
        // 增加滚动条
        dataZoom: [
            // 为x轴增加滚动条
            {
                type: 'slider',
                show: true,
                xAxisIndex: [0],
                left: '5%',
                bottom: '2%',
                start: 10,
                end: 90,
                height: 30
            },
            // 为y轴增加滚动条
            {
                type: 'slider',
                show: true,
                yAxisIndex: [0],
                left: '97%',
                start: 0,
                end: 100,
                width: 20,
                showDataShadow: false
            },
            // 鼠标可拖动，鼠标滑轮可以放大,缩小x,y轴的滚动条
            {
                type: 'inside',
                xAxisIndex: 0,
                start: 10,
                end: 90
            },
            {
                type: 'inside',
                yAxisIndex: 0,
                start: 0,
                end: 100
            }
        ],
        // 提示框，鼠标悬浮交互时的信息提示
        tooltip: {
            show: true, // 是否显示
            trigger: 'axis', // 触发类型，默认数据触发，见下图，可选为：'item' | 'axis'
        },
        legend: {
            data: checked,
            type: 'scroll', // 当图例数量过多时，分页显示图例
            top: '4.5%',
            left: '55'
        },
        // 指定图标的类型
        series: series,
    };

    // 使用刚指定的配置项和数据显示图表。
    myChart.setOption(option);
}

// 画多个曲线图
// seqId:所有选中的序列ID组成的数组，selectSeq:所有选中的序列内容组成的数组，seqJson:理化性质和对应数值组成的json文件，seqType:可视化的序列类型
function drawDiagrams(seqId, selectSeq, seqJson, seqType) {
    var newSeqId = handleSeqId(seqId);
    var height = 320 * selectSeq.length + 50;
    $(".diagram").height(height);
    var seqList = [];   // X轴的横坐标组成的数组
    for (var i = 0; i < selectSeq.length; i++) {
        if (document.getElementById('mode').value == 'clustalw2')    // clustalw2结果的每行最后都多一个""，应该删除
            selectSeq[i] = selectSeq[i].replace(/\s*/g,"");     //去除字符串内所有的空格
        seqList.push(getSeqDataArr(selectSeq[i], seqType));
    }
    var aaDic = getAaDic(seqType);


    // 基于准备好的dom，初始化echarts实例
    var myChart = echarts.init(document.getElementById('diagram'));
    var grids = [];
    var xAxis = [];
    var yAxis = [];
    var series = [];
    var title = [];
    var dataZoom = [];
    for (var k = 0; k < seqList.length; k++) {
        dataZoom.push(
            // 为x轴增加滚动条
            {
                type: 'slider',
                show: true,
                xAxisIndex: [k],
                left: '5%',
                top: 320 * k + 300,
                start: 0,
                end: 100,
                height: 25
            },
            // 为y轴增加滚动条
            {
                type: 'slider',
                show: true,
                yAxisIndex: [k],
                left: '96%',
                start: 0,
                end: 100,
                width: 20,
                showDataShadow: false
            },
            // 鼠标可拖动，鼠标滑轮可以放大,缩小x,y轴的滚动条
            {
                type: 'inside',
                xAxisIndex: k,
                start: 10,
                end: 90
            },
            {
                type: 'inside',
                yAxisIndex: k,
                start: 0,
                end: 100
            });
        title.push({
            text: newSeqId[k],
            top: 320 * k,
            textStyle: {
                fontSize: 13,
                fontWeight: 600
            }
        })
        xAxis.push({
            data: seqList[k],
            gridIndex: k
        });
        yAxis.push({
            type: 'value',
            gridIndex: k
        });
        grids.push({
            left: '5%',
            right: '5%',
            top: 320 * k + 45,
            height: 250,
        });
        for (var i = 0; i < checked.length; i++) {
            if (seqType == 'Protein') {
                var valueList = seqJson[checked[i]];
                var EchartsDataArr = getEchartsDataArr(seqList[k], valueList, aaDic, seqType, '', seqJson);
            }
            else
                var EchartsDataArr = getEchartsDataArr(seqList[k], [], aaDic, seqType, checked[i], seqJson);   
            series.push({
                connectNulls: true,
                name: checked[i],
                type: 'line', // 类型：线
                data: EchartsDataArr,
                xAxisIndex: k,
                yAxisIndex: k,
                symbol:'none', //去掉折线图中的节点
                smooth: true,  //true 为平滑曲线，false为直线
                markPoint: {
                    symbol: 'pin',
                    symbolSize: 20,
                    // 特殊标注文字
                    label: {
                        normal: {
                            show: true,
                            //position: 'top', // 文字位置
                            // 显示的文字
                            formatter: '{b}：{c}',
                        }
                    },
                    // 触发操作
                    tooltip: {
                        show: false, // 是否显示
                        formatter: '{b}：{c}', // 内容格式器 a（系列名称），b（类目值），c（数值）, d（无）
                        trigger: 'item', // 触发类型，默认数据触发，见下图，可选为：'item' | 'axis'
                    },
                    data:[
                        {name:'max', type:'max'},
                        {name:'min', type: 'min'}
                    ]
                },
                markLine:{
                    data:[
                        {name:'average', type:'average'}
                    ],
                    lineStyle:{
                        type: 'dashed',
                        opacity: 0.5    // 透明度
                    }
                }
            });
        }
    }
    // 指定图表的配置项和数据
    var option = {
        // 工具栏
        toolbox: {
            itemSize: 13,
            padding: [1, 10, 1, 1],    // 工具箱内边距，单位px，默认各方向内边距为5，数组:上右下左边距
            feature: {
                // 数据缩放和数据缩放还原
                dataZoom:{
                    title:{
                        zoom: 'Zoom In Area',
                        back: 'Restore Zoom'
                    }
                },
                // 可切换折线图和柱状图
                magicType:{
                    type: ['line', 'bar'],
                    title:{
                        line: 'Line Chart',
                        bar: 'Bar Chart'
                    }
                },
                // 还原所有
                restore: {
                    title: 'Restore'
                },
                // 数据视图，可以展现当前图表所用的数据，编辑后可以动态更新。
                dataView: {
                    title: 'Data View',
                    lang: ['Data View', 'Close', 'Update'],
                    backgroundColor: '#F4F6CF',
                },
                // 保存图片到本地
                saveAsImage: {
                    title: 'Save'
                }
            }
        },
        // 标题：选择的序列ID
        title: title,
        // 网格图的边距设置
        grid: grids,
        // x轴：选择的序列ID所对应的序列
        xAxis: xAxis,
        // y轴
        yAxis: yAxis,
        // 增加滚动条
        dataZoom: dataZoom,
        // 提示框，鼠标悬浮交互时的信息提示
        tooltip: {
            show: true, // 是否显示
            trigger: 'axis', // 触发类型，默认数据触发，见下图，可选为：'item' | 'axis'
        },
        legend: {
            data: checked,
            type: 'scroll', // 当图例数量过多时，分页显示图例
            top: '20',
            left: '90'
        },
        // 指定图标的类型
        series: series,
    };

    // 使用刚指定的配置项和数据显示图表。
    myChart.setOption(option);
}
