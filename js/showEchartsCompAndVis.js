// 计算序列的特征向量，并可视化
const dialog = require('electron').remote.dialog;
const exec = require('child_process').exec;
const electron = require('electron');
const path = require('path');
const fs = require('fs');

// 子进程名称
let workerProcess;
var userdefine = false; //标志位，区分用户定义序列和普通序列两种形式，false代表普通序列，true为用户定义
var existed_prop = [];  //保存添加的理化性质的id，检查是否有所重复，并提示
var definePropertyonly = false;//标志位，确实是否是仅添加性质，而不定义新序列
var maxVisualDimension = 30;  //可视化的默认最大维度

var proteinArr = ['A', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'V', 'W', 'Y'];
var dnaArr = ['A', 'C', 'G', 'T'];
var didnaArr = ["AA","AC","AG","AT","CA","CC","CG","CT","GA","GC","GG","GT","TA","TC","TG","TT"];
var tridnaArr = ["AAA","AAC","AAG","AAT","ACA","ACC","ACG","ACT","AGA","AGC","AGG","AGT","ATA","ATC","ATG","ATT","CAA","CAC","CAG","CAT","CCA","CCC","CCG","CCT","CGA","CGC","CGG","CGT","CTA","CTC","CTG","CTT","GAA","GAC","GAG","GAT","GCA","GCC","GCG","GCT","GGA","GGC","GGG","GGT","GTA","GTC","GTG","GTT","TAA","TAC","TAG","TAT","TCA","TCC","TCG","TCT","TGA","TGC","TGG","TGT","TTA","TTC","TTG","TTT"];
var rnaArr = ['A', 'C', 'G', 'U'];
var dirnaArr = ["AA","AC","AG","AU","CA","CC","CG","CU","GA","GC","GG","GU","UA","UC","UG","UU"];

// 为最大可视化维度下拉框添加item
function addMaxDimension(){
  let maxDimension = document.getElementById('maxDimension');
  let str = "";
  for(let i = 1; i <= 200; i++){
    if(i == 30)
      str += '<option selected>' + i +'</option>';
    else
      str += '<option>' + i +'</option>';
  }
  maxDimension.innerHTML = str;
}

// 设置参数对象的值，调用UltraPse计算结果
function submit() {
  if (checkParameterValid() == "invalid")
    return;
  let inputData = fs.readFileSync(path.join(__dirname, 'UltraPse', 'input.fas'), 'utf-8');
  if (inputData.length == 0 && $("#inputPathLabel").text() == "") {
    alert("Please input the content or upload a file in FASTA format.");
    chooseInputPath();
    return;
  }
  let method = $("#method").val();
  let type = $("input[name='type']:checked").val();
  setParameterObject(type);
  switch (method) {
    case 'TDF':
      if ($("#TdfPathLabel").text() == "") {
        alert("Please upload a task definition file (TDF).");
        $("#chooseTdfBtn").focus();
        return;
      }
      compute(type);
      break;
    case 'Self-defined':
      if (checkParameterComplete() == "error")
        return;
      commandPhy();
      break;
  }
  document.getElementById("showSelfdefinedProp").value = "";
  //每次提交一次，则重置一切全局变量
  existed_prop = [];
  definePropertyonly = false;
  userdefine = false;
  clearLua();
}

// 检查必须的参数是否完整
function checkParameterComplete() {
  if ($("#tr-lambda").css("display") != "none" && $("#lambda").val() == "") {
    alert("Please input " + $("#td-lambda").text());
    $("#lambda").focus();
    return "error";
  }
  if ($("#tr-omega").css("display") != "none" && $("#omega").val() == "") {
    alert("Please input " + $("#td-omega").text());
    $("#omega").focus();
    return "error";
  }
}

// 检查输入的参数是否有效
function checkParameterValid() {
  if ($("#tr-lambda").css("display") != "none" && $("#lambda").val() != "" && !isIntNum($("#lambda").val())) {
    if ($("#td-lambda").text() == "λ:" || $("#td-lambda").text() =="(optional) λ:")
      alert("The value of λ(lambda) must be an integer larger than 0 and smaller than the length of the longest input sequence.");
    else if ($("#td-lambda").text() == "lag:")
      alert("The value of lag must be an integer larger than 0 and smaller than the length of the longest input sequence.");
    else
      alert("The value of max delay must be an integer larger than 0 and smaller than the length of the longest input sequence.");
    $("#lambda").focus();
    return "invalid";
  }
  if ($("#tr-omega").css("display") != "none" && $("#omega").val() != "" && (isNaN(parseFloat($("#omega").val())) || parseFloat($("#omega").val()) < 0 || parseFloat($("#omega").val()) > 1)) {
    alert("The value of w(weight) must be a number between 0 and 1.");
    $("#omega").focus();
    return "invalid";
  }
}

// 判断val是不是一个非负整数
function isIntNum(val) {
  var expression = /^\d+$/; // 非负整数
  if (expression.test(val))
    return true;
  else
    return false;
}

//改变method，根据用户自定义还是上传tdf显示相应的界面
function changeMethod() {
  $("#upseResultTextArea").val("");
  let method = $("#method").val();;
  switch (method) {
    case 'Self-defined':
      controlShowOrHide("tr-TDF", "none");
      controlShowOrHide("tr-mode", "table-row");
      controlShowOrHide("tr-note", "table-row");
      controlShowOrHide("tr-PhyControl", "none");
      controlShowOrHide("tr-Phy", "none");
      controlShowOrHide("tr-lambda", "none");
      controlShowOrHide("tr-omega", "none");
      controlShowOrHide("tr-sequenceType", "table-row");
      controlShowOrHide("tr-type", "none");
      controlShowOrHide("tr-CTD", "none");
      $("#sequenceType").val("DNA");
      $("#showProperty").css("display", "inline");
      $("#td-lambda").text("λ:");
      $("#td-omega").text("w:");
      changeMode();
      break;
    case 'TDF':
      controlShowOrHide("tr-TDF", "table-row");
      controlShowOrHide("tr-mode", "none");
      controlShowOrHide("tr-note", "none");
      controlShowOrHide("tr-PhyControl", "none");
      controlShowOrHide("tr-Phy", "none");
      controlShowOrHide("tr-lambda", "table-row");
      controlShowOrHide("tr-omega", "table-row");
      controlShowOrHide("tr-sequenceType", "none");
      controlShowOrHide("tr-type", "table-row");
      controlShowOrHide("tr-location", "table-row");
      controlShowOrHide("tr-output", "table-row");
      controlShowOrHide("tr-CTD", "none");
      $("#showProperty").css("display", "none");
      $("#td-lambda").text("(optional) λ:");
      $("#td-omega").text("(optional) w:");
      break;
  }
}

// 改变控件的状态：显示/隐藏。controlId:控件ID, status：状态
function controlShowOrHide(controlId, status) {
  let control = document.getElementById(controlId);
  control.style.display = status;
}

// 重置参数设置页面上的参数数据
function resetParameter() {
  $("#lambda").val("");
  $("#omega").val("");
  $("#inputPathLabel").text("");
  $("#outputPathLabel").text("");
  $("#TdfPathLabel").text("");
  $("#type1").attr("checked", false);
  $("#type2").attr("checked", false);
  $("#upseResultTextArea").val("");
  controlShowOrHide("resultTable", "none");
  $("#showSelfdefinedProp").val("");
  clearLua();
  generatePhy();
}


// 根据序列类型改变Mode下拉框的值
function changeMode() {
  let sequenceType = document.getElementById("sequenceType").value;
  let arr = [];
  switch (sequenceType) {
    case 'DNA':
      arr = ['Composition based', 'Covariance based', 'Pseudo-factor based'];
      generateHtml(arr);
      break;

    case 'RNA':
      arr = ['Composition based', 'Covariance based', 'Pseudo-factor based'];
      generateHtml(arr);
      break;

    case 'Protein':
      arr = ['Composition based', 'Covariance based', 'Pseudo-factor based', 'Evolution based', 'Correlation coefficients based'];
      // arr = ['Composition based', 'Covariance based', 'Pseudo-factor based', 'Correlation coefficients based'];
      generateHtml(arr);
      break;
  }
  changeNote();
  generatePhy();
}
//当mode改变时，其对应的note，参数显示等也发生相应的改变
function changeNote() {
  let mode = document.getElementById("mode").value;
  let sequenceType = document.getElementById("sequenceType").value;

  let arr = [];
  switch (sequenceType) {
    case 'DNA':
      switch (mode) {
        case 'comp':
          arr = ['DNA compositions', 'DNA-Di-nucleotide compositions', 'DNA-Tri-nucleotide compositions'];
          generateNote(arr);
          $("#td-lambda").html("λ:<img src='./img/explanation.jpg'  alt='explain' style='height:18px;width:18px;cursor:pointer' onclick='explainLambda()'/>");
          break;
        case 'cov':
          arr = ['DNA-Di-nucleotide Auto covariance', 'DNA-Tri-nucleotide Auto covariance',
            'DNA-Di-nucleotide Cross covariance', 'DNA-Tri-nucleotide Cross covariance',
            'DNA-Di-nucleotide Auto-cross covariance', 'DNA-Tri-nucleotide Auto-cross covariance'];
          generateNote(arr);
          $("#td-lambda").html("lag:<img src='./img/explanation.jpg'  alt='explain' style='height:18px;width:18px;cursor:pointer' onclick='explainLag()'/>");
          break;
        case 'pse':
          arr = ['Di-nucleotide Type I General PseKNC', 'Di-nucleotide Type II General PseKNC',
            'Tri-nucleotide Type I General PseKNC', 'Tri-nucleotide Type II General PseKNC'];
          generateNote(arr);
          $("#td-lambda").html("λ:<img src='./img/explanation.jpg'  alt='explain' style='height:18px;width:18px;cursor:pointer' onclick='explainLambda()'/>");
          break;
      }
      break;

    case 'RNA':
      switch (mode) {
        case 'comp':
          arr = ['RNA compositions', 'RNA-Di-nucleotide compositions'];
          generateNote(arr);
          $("#td-lambda").html("λ:<img src='./img/explanation.jpg'  alt='explain' style='height:18px;width:18px;cursor:pointer' onclick='explainLambda()'/>");
          break;
        case 'cov':
          arr = ['RNA-Di-nucleotide Auto covariance',
            'RNA-Di-nucleotide Cross covariance',
            'RNA-Di-nucleotide Auto-cross covariance'];
          generateNote(arr);
          $("#td-lambda").html("lag:<img src='./img/explanation.jpg'  alt='explain' style='height:18px;width:18px;cursor:pointer' onclick='explainLag()'/>");
          break;
        case 'pse':
          arr = ['Type I General PseDNC', 'Type II General PseDNC'];
          generateNote(arr);
          $("#td-lambda").html("λ:<img src='./img/explanation.jpg'  alt='explain' style='height:18px;width:18px;cursor:pointer' onclick='explainLambda()'/>");
          break;
      }
      break;

    case 'Protein':
      switch (mode) {
        case 'comp':
          arr = ['Amino acid compositions', 'Di-peptide compositions'];
          generateNote(arr);
          $("#td-lambda").html("λ:<img src='./img/explanation.jpg'  alt='explain' style='height:18px;width:18px;cursor:pointer' onclick='explainLambda()'/>");

          break;
        case 'cov':
          arr = ['Auto covariance',
            'Cross covariance',
            'Auto-cross covariance'];
          generateNote(arr);
          $("#td-lambda").html("lag:<img src='./img/explanation.jpg'  alt='explain' style='height:18px;width:18px;cursor:pointer' onclick='explainLag()'/>");

          break;
        case 'pse':
          arr = ['Type I General PseAAC', 'Type II General PseAAC', 'Quasi-sequence order'];
          generateNote(arr);
          $("#td-lambda").html("λ:<img src='./img/explanation.jpg'  alt='explain' style='height:18px;width:18px;cursor:pointer' onclick='explainLambda()'/>");

          break;
        case 'evo':
          arr = ['PsePSSM'];
          generateNote(arr);
          $("#td-lambda").text("λ:");
          break;
        case 'cor':
          arr = ['Moran auto-correlation', 'Normalized Moreu-Broto auto correlation', 'Geary auto correlation', 'Composition-Transition-Distributions'];
          // arr = ['Composition-Transition-Distributions'];
          generateNote(arr);
          $("#td-lambda").text("max_delay:");
          break;
      }
      break;
  }
  controlShowOrHide("showProperty", "table-row");
  $("#btnadddprop").css("display", "inline");
  $("#showSelfdefinedProp").css("display", "inline");
  if(mode == 'cor'){
    $("#btnadddprop").css("display", "none");
    $("#showSelfdefinedProp").css("display", "none");
  }
  $("#phyprop").text("Physicochemical properties:");
  let note = document.getElementById("note").value;
  if (note == "DNA compositions" || note == "DNA-Di-nucleotide compositions" || note == "DNA-Tri-nucleotide compositions" || note == "RNA compositions" || note == "Amino acid compositions" || note == "RNA-Di-nucleotide compositions" || note == "PsePSSM") {
    controlShowOrHide("tr-PhyControl", "none");
    controlShowOrHide("tr-Phy", "none");
  }

  else
    controlShowOrHide("tr-PhyControl", "table-row");
  switch (note) {
    case 'Di-nucleotide Type I General PseKNC':
    case 'Di-nucleotide Type II General PseKNC':
    case 'Tri-nucleotide Type I General PseKNC':
    case 'Tri-nucleotide Type II General PseKNC':
    case 'Type I General PseDNC':
    case 'Type II General PseDNC':
      controlShowOrHide("tr-lambda", "table-row");
      controlShowOrHide("tr-omega", "table-row");
    case 'Type I General PseAAC':
    case 'Type II General PseAAC':
      $("#td-lambda").html("λ:<img src='./img/explanation.jpg'  alt='explain' style='height:18px;width:18px;cursor:pointer' onclick='explainLambda()'/>");
      controlShowOrHide("tr-lambda", "table-row");
      controlShowOrHide("tr-omega", "table-row");
      break;
    case 'Moran auto-correlation':
    case 'Normalized Moreu-Broto auto correlation':
    case 'Geary auto correlation':
    case 'Composition-Transition-Distributions':
      //当在这几种模式下，λ的名字改为max delay
      $("#td-lambda").html("max delay:<img src='./img/explanation.jpg'  alt='explain' style='height:18px;width:18px;cursor:pointer' onclick='explainMaxDelay()'/>");
      controlShowOrHide("tr-lambda", "table-row");
      controlShowOrHide("tr-omega", "none");
      break;

    case 'Quasi-sequence order':
      $("#td-lambda").html("max delay::<img src='./img/explanation.jpg'  alt='explain' style='height:18px;width:18px;cursor:pointer' onclick='explainMaxDelay()'/>");
      controlShowOrHide("tr-lambda", "table-row");
      controlShowOrHide("tr-omega", "table-row");

      break;
    case 'DNA-Di-nucleotide Auto covariance':
    case 'DNA-Di-nucleotide Cross covariance':
    case 'DNA-Di-nucleotide Auto-cross covariance':
    case 'DNA-Tri-nucleotide Auto covariance':
    case 'DNA-Tri-nucleotide Cross covariance':
    case 'DNA-Tri-nucleotide Auto-cross covariance':
    case 'RNA-Di-nucleotide Auto covariance':
    case 'RNA-Di-nucleotide Cross covariance':
    case 'RNA-Di-nucleotide Auto-cross covariance':
    case 'Auto covariance':
    case 'Cross covariance':
    case 'PsePSSM':
      controlShowOrHide("tr-lambda", "table-row");
      controlShowOrHide("tr-omega", "none");
      break;
    default:
      controlShowOrHide("tr-lambda", "none");
      controlShowOrHide("tr-omega", "none");
  }
  showCTDmode();
  generatePhy();
}

//改变note会使理化性质的现实，lambda，w等参数的显示发生改变
function changeNote2() {
  let note = document.getElementById("note").value;
  if (note == "DNA compositions" || note == "DNA-Di-nucleotide compositions" || note == "DNA-Tri-nucleotide compositions" || note == "RNA compositions" || note == "Amino acid compositions" || note == "RNA-Di-nucleotide compositions" || note == "Di-peptide compositions" || note == "PsePSSM") {
    controlShowOrHide("tr-PhyControl", "none");
    controlShowOrHide("tr-Phy", "none");
  }
  else {
    controlShowOrHide("tr-PhyControl", "table-row");
    generatePhy();
  }
  //针对note控制lambda和w的显示
  $("#btnadddprop").css("display", "inline");
  $("#showSelfdefinedProp").css("display", "inline");
  $("#phyprop").text("Physicochemical properties:");
  controlShowOrHide("showProperty", "table-row");
  switch (note) {
    case 'Di-nucleotide Type I General PseKNC':
    case 'Di-nucleotide Type II General PseKNC':
    case 'Tri-nucleotide Type I General PseKNC':
    case 'Tri-nucleotide Type II General PseKNC':
    case 'Type I General PseDNC':
    case 'Type II General PseDNC':
      controlShowOrHide("tr-lambda", "table-row");
      controlShowOrHide("tr-omega", "table-row");
    case 'Type I General PseAAC':
    case 'Type II General PseAAC':
      $("#td-lambda").html("λ:<img src='./img/explanation.jpg'  alt='explain' style='height:18px;width:18px;cursor:pointer' onclick='explainLambda()'/>");
      controlShowOrHide("tr-lambda", "table-row");
      controlShowOrHide("tr-omega", "table-row");
      break;
    case 'Moran auto-correlation':
    case 'Normalized Moreu-Broto auto correlation':
    case 'Geary auto correlation':
      $("#td-lambda").html("max delay:<img src='./img/explanation.jpg'  alt='explain' style='height:18px;width:18px;cursor:pointer' onclick='explainMaxDelay()'/>");
      controlShowOrHide("tr-lambda", "table-row");
      controlShowOrHide("tr-omega", "none");
      $("#btnadddprop").css("display", "none");
      $("#showSelfdefinedProp").css("display", "none");
      break;
    case 'Quasi-sequence order':
      $("#td-lambda").html("max delay:<img src='./img/explanation.jpg'  alt='explain' style='height:18px;width:18px;cursor:pointer' onclick='explainMaxDelay()'/>");
      $("#phyprop").text("Order:");
      $("#btnadddprop").css("display", "none");
      $("#showSelfdefinedProp").css("display", "none");
      controlShowOrHide("tr-lambda", "table-row");
      controlShowOrHide("tr-omega", "table-row");
      controlShowOrHide("showProperty", "none");
      break;
    case 'Composition-Transition-Distributions':
      $("#btnadddprop").css("display", "none");
      $("#showSelfdefinedProp").css("display", "none");
      controlShowOrHide("tr-lambda", "none");
      controlShowOrHide("tr-omega", "none");
      break;
    case 'DNA-Di-nucleotide Auto covariance':
    case 'DNA-Di-nucleotide Cross covariance':
    case 'DNA-Di-nucleotide Auto-cross covariance':
    case 'DNA-Tri-nucleotide Auto covariance':
    case 'DNA-Tri-nucleotide Cross covariance':
    case 'DNA-Tri-nucleotide Auto-cross covariance':
    case 'RNA-Di-nucleotide Auto covariance':
    case 'RNA-Di-nucleotide Cross covariance':
    case 'RNA-Di-nucleotide Auto-cross covariance':
    case 'Auto covariance':
    case 'Cross covariance':
    case 'Auto-cross covariance':
    case 'PsePSSM':
      controlShowOrHide("tr-lambda", "table-row");
      controlShowOrHide("tr-omega", "none");
      break;
    default:
      controlShowOrHide("tr-lambda", "none");
      controlShowOrHide("tr-omega", "none");
  }
  showCTDmode();
}

//如果选择ctd模式，那么还要选择Composition，Transition，Distributions确定调用的函数
function showCTDmode() {

  var nn = document.getElementById("note").value;
  if(nn == "Composition-Transition-Distributions"){
    controlShowOrHide("tr-CTD", "table-row");
    controlShowOrHide("tr-lambda", "none");
    controlShowOrHide("tr-omega", "none");
    $("#btnadddprop").css("display", "none");
    $("#showSelfdefinedProp").css("display", "none");
  }
  else controlShowOrHide("tr-CTD", "none");
}

//生成note下拉框的html
function generateNote(arr) {
  let html = "";
  for (let i = 0; i < arr.length; i++) {
    html += "<option>" + arr[i] + "</option>";
  }
  document.getElementById("note").innerHTML = html;
}

// 生成下拉框选项的html
function generateHtml(arr) {
  let html = "";
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] == "Composition based")
      html += "<option" + " value=\"comp\" " + ">" + arr[i] + "</option>";
    else if (arr[i] == "Covariance based")
      html += "<option" + " value=\"cov\" " + ">" + arr[i] + "</option>";
    else if (arr[i] == "Pseudo-factor based")
      html += "<option" + " value= \"pse\" " + ">" + arr[i] + "</option>";
    else if (arr[i] == "Evolution based")//psepssm
      html += "<option" + " value= \"evo\" " + ">" + arr[i] + "</option>";
    else if (arr[i] == "Correlation coefficients based")
      html += "<option" + " value= \"cor\" " + ">" + arr[i] + "</option>";
  }
  $("#mode").html(html);
}

// 弹出一个文件夹选择框，该文件夹是输出文件的存储位置
function chooseOutputPath() {
  var selectPath = dialog.showOpenDialog({
    title: 'Please choose a location of output file',
    properties: ['openDirectory'],
  })
  if (selectPath != undefined && selectPath != null && selectPath != "") {
    document.getElementById("outputPathLabel").innerText = selectPath;
  }
}

// 弹出一个文件选择框，选择一个TDF文件(lua脚本)
function chooseTdf() {
  const files = dialog.showOpenDialog({
    title: 'Please choose a TDF file',
    filters: [
      { name: 'Lua Files', extensions: ['lua'] }],
    properties: ['openFile']
  });
  //更新和显示当前打开文件信息
  if (files) {
    document.getElementById("TdfPathLabel").innerText = files[0];
  }
}

// 弹出一个文件选择框，选择序列的标签索引文件
function chooseLabelFile() {
  const files = dialog.showOpenDialog({
    title: 'Please choose a label file',
    filters: [
      { name: 'csv Files', extensions: ['csv'] },
      { name: 'All Files', extensions: ['*'] }],
    properties: ['openFile']
  });
  //更新和显示当前打开文件信息
  if (files) {
    document.getElementById("labelPathLabel").innerText = files[0];
  }
}

// 弹出一个文件选择框，选择作为输入的文件
function chooseInputPath() {
  const files = dialog.showOpenDialog({
    title: 'Please choose a file in FASTA format',
    filters: [
      { name: 'FASTA Files', extensions: ['fasta', 'fas'] },
      { name: 'All Files', extensions: ['*'] }],
    properties: ['openFile']
  });
  //更新和显示当前打开文件信息
  if (files) {
    document.getElementById("inputPathLabel").innerText = files[0];
  }
}

// 根据用户输入的UltraPse参数，创建一个对象存储参数值
function setParameterObject(type) {
  const remote = require('electron').remote;
  const path = require('path');
  let upsePara = remote.getGlobal('sharedObject').upsePara;
  if ($("#method").val() == "TDF") {
    upsePara.lambda = $("#lambda").val();
    upsePara.omega = $("#omega").val();
    upsePara.tdf = $("#TdfPathLabel").text();
  }
  if ($("#method").val() == "Self-defined") {
    upsePara.lambda = $("#lambda").val();
    upsePara.omega = $("#omega").val();
  }

  // upsePara.inputFile = 'input.fas';
  if ($("#inputPathLabel").text() != "")
    upsePara.inputFile = $("#inputPathLabel").text();
  else
    upsePara.inputFile = 'input.fas';

  upsePara.outputFormat = $("#outputFormat").val();
  upsePara.outputPath = $("#outputPathLabel").text();
  if (type != undefined)
    upsePara.type = type;
  else
    upsePara.type = null;

  upsePara.mode = $("#mode").val();
  upsePara.note = $("#note").val();
  // return upsePara;
}

// 获取参数，拼接成命令行，调用UltraPse执行命令行
function compute(type) {
  const remote = require('electron').remote;
  const path = require('path');
  const fs = require('fs');
  let upsePara = remote.getGlobal('sharedObject').upsePara;
  var openFileNam = "";
  var command = 'upse -v -i ' + upsePara.inputFile + ' -u ' + upsePara.tdf + ' -f ' + upsePara.outputFormat + ' -o ' + path.join(upsePara.outputPath, 'VisFeatureOutput.txt');
  if (type != null)
    command += ' -t ' + upsePara.type;
  if ($("#lambda").val() != "")
    command += ' -l ' + upsePara.lambda;
  if ($("#omega").val() != "")
    command += ' -w ' + upsePara.omega;

  upsePara.outputPath != "" ? openFileName = path.join(upsePara.outputPath, 'VisFeatureOutput.txt') : openFileName = path.join(__dirname, 'UltraPse', 'VisFeatureOutput.txt');

  if (fs.existsSync(openFileName) && upsePara.outputPath != "") {
    alert('The output file: "' + openFileName + '" already exists.\nPlease modify the path of the output file!');
    return;
  }
  
  if (runExecSync(command, path.join(__dirname, 'UltraPse')) != "error") {
    try {
      var data = fs.readFileSync(openFileName, 'utf-8');  //同步读取UltraPse计算得出的结果
    } catch (err) {
      alert("Read File " + err);
      return;
    }

    $("#upseResultTextArea").val(data);
    controlShowOrHide("parameterTable", "none");
    controlShowOrHide("resultTable", "table");
  }
  // 若未选择输出文件路径，则在调用UltraPse后删除临时生成的输出文件
  if (fs.existsSync(openFileName) && upsePara.outputPath == "")
    deleteFile(openFileName);
}

// 删除文件
function deleteFile(fileName) {
  const fs = require('fs');
  fs.unlink(fileName, function (err) {
    if (err) {
      alert(err);
      return;
    }
  });
}

// （同步）执行命令行，command:命令，path:执行命令的路径
function runExecSync(command, path) {
  const execSync = require('child_process').execSync;
  // 执行命令行，如果命令不需要路径，或就是项目根目录，则不需要cwd参数：
  try {
    execSync(command, { cwd: path });
  } catch (err) {
    alert("Run " + err);
    return "error";
  }
}

// （异步）执行命令行，command:命令，path:执行命令的路径
function runExec(command, path) {
  // 执行命令行，如果命令不需要路径，或就是项目根目录，则不需要cwd参数：
  try {
    workerProcess = exec(command, { cwd: path });
  } catch (err) {
    alert(err);
    return "error";
  }
  // 不受child_process默认的缓冲区大小的使用方法，没参数也要写上{}：workerProcess = exec(cmdStr, {})

  // 打印正常的后台可执行程序输出
  workerProcess.stdout.on('data', function (data) {
    console.log('>stdout: \n' + data);
  });

  // 打印错误的后台可执行程序输出
  workerProcess.stderr.on('data', function (data) {
    console.log('>stderr: ' + data);
  });

  // 退出之后的输出,code:子进程的退出码,除 0 以外的任何退出码都被视为出错
  workerProcess.on('close', function (code) {
    console.log('>out code：' + code);
  })
}

// 生成示例参数
function exampleParameter() {
  document.getElementById('lambda').value = '10';
  document.getElementById('omega').value = '0.05';
  document.getElementById('type1').checked = true;
  if ($(":checkbox")[0] != undefined) {
    $(":checkbox")[0].checked = true;
  }
}

//给控件文本框增加右键菜单
function addContextMenu(controlId) {
  const Menu = require('electron').remote.Menu;
  const remote = require('electron').remote;
  const contextMenuTemplate = [
    { role: 'copy' },       //Copy菜单项
    { role: 'paste' },      //Paste菜单项
    { role: 'selectall' }   //Select All菜单项
  ];
  const contextMenu = Menu.buildFromTemplate(contextMenuTemplate);
  let TextArea = document.getElementById(controlId);
  if (TextArea != null) {
    TextArea.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      contextMenu.popup(remote.getCurrentWindow());
    });
  }
}

// 从UltraPse结果显示界面回到参数设置界面
function back() {
  $("#upseResultTextArea").val("");
  $("#labelPathLabel").text("");
  controlShowOrHide("resultTable", "none");
  controlShowOrHide("parameterTable", "table");
  var tips = document.getElementById("tips");
  tips.innerHTML = "";
}
//对自定义模式下的命令行进行拼接与计算
function computesd() {
  const remote = require('electron').remote;
  const path = require('path');
  const fs = require('fs');
  let upsePara = remote.getGlobal('sharedObject').upsePara;
  var openFileName = "";

  //整合命令行
  if (userdefine == true) {
    upsePara.phy = "";
  }
  var jj = upsePara.phy;
  if (upsePara.note == "DNA compositions")
    var command = 'upse -v -i ' + upsePara.inputFile + ' -n stddna ' + ' -m ' + upsePara.mode + ' -f ' + upsePara.outputFormat + ' -o ' + path.join(upsePara.outputPath, 'VisFeatureOutput.txt');
  else if (upsePara.note == "DNA-Di-nucleotide compositions")
    var command = 'upse -v -i ' + upsePara.inputFile + ' -m ' + upsePara.mode + ' -n didna' + ' -f ' + upsePara.outputFormat + ' -o ' + path.join(upsePara.outputPath, 'VisFeatureOutput.txt');
  else if (upsePara.note == "DNA-Tri-nucleotide compositions")
    var command = 'upse -v -i ' + upsePara.inputFile + ' -m ' + upsePara.mode + ' -n tridna' + ' -f ' + upsePara.outputFormat + ' -o ' + path.join(upsePara.outputPath, 'VisFeatureOutput.txt');
  else if (upsePara.note == "DNA-Di-nucleotide Auto covariance") {
    if (alert_to_choose_one(jj)) return;
    var command = 'upse -v -i ' + upsePara.inputFile + ' -m ' + upsePara.mode + upsePara.phy + ' -l ' + upsePara.lambda + ' -n didna' + ' -t 1' + ' -f ' + upsePara.outputFormat + ' -o ' + path.join(upsePara.outputPath, 'VisFeatureOutput.txt');
  }
  else if (upsePara.note == "DNA-Tri-nucleotide Auto covariance") {
    if (alert_to_choose_one(jj)) return;
    var command = 'upse -v -i ' + upsePara.inputFile + ' -m ' + upsePara.mode + upsePara.phy + ' -l ' + upsePara.lambda + ' -n tridna' + ' -t 1' + ' -f ' + upsePara.outputFormat + ' -o ' + path.join(upsePara.outputPath, 'VisFeatureOutput.txt');
  }
  else if (upsePara.note == "DNA-Di-nucleotide Cross covariance") {
    if (alert_to_choose_one(jj)) return;
    var command = 'upse -v -i ' + upsePara.inputFile + ' -m ' + upsePara.mode + upsePara.phy + ' -l ' + upsePara.lambda + ' -n didna' + ' -t 2' + ' -f ' + upsePara.outputFormat + ' -o ' + path.join(upsePara.outputPath, 'VisFeatureOutput.txt');
  }
  else if (upsePara.note == "DNA-Tri-nucleotide Cross covariance") {
    if (alert_to_choose_one(jj)) return;
    var command = 'upse -v -i ' + upsePara.inputFile + ' -m ' + upsePara.mode + upsePara.phy + ' -l ' + upsePara.lambda + ' -n tridna' + ' -t 2' + ' -f ' + upsePara.outputFormat + ' -o ' + path.join(upsePara.outputPath, 'VisFeatureOutput.txt');
  }
  else if (upsePara.note == "DNA-Di-nucleotide Auto-cross covariance") {
    if (alert_to_choose_one(jj)) return;
    var command = 'upse -v -i ' + upsePara.inputFile + ' -m ' + upsePara.mode + upsePara.phy + ' -l ' + upsePara.lambda + ' -n didna' + ' -t 3' + ' -f ' + upsePara.outputFormat + ' -o ' + path.join(upsePara.outputPath, 'VisFeatureOutput.txt');
  }
  else if (upsePara.note == "DNA-Tri-nucleotide Auto-cross covariance") {
    if (alert_to_choose_one(jj)) return;
    var command = 'upse -v -i ' + upsePara.inputFile + ' -m ' + upsePara.mode + upsePara.phy + ' -l ' + upsePara.lambda + ' -n tridna' + ' -t 3' + ' -f ' + upsePara.outputFormat + ' -o ' + path.join(upsePara.outputPath, 'VisFeatureOutput.txt');
  }
  else if (upsePara.note == "Di-nucleotide Type I General PseKNC") {
    if (alert_to_choose_one(jj)) return;
    var command = 'upse -v -i ' + upsePara.inputFile + ' -m ' + upsePara.mode + upsePara.phy + ' -n didna' + ' -l ' + upsePara.lambda + ' -w ' + upsePara.omega + ' -t 1' + ' -f ' + upsePara.outputFormat + ' -o ' + path.join(upsePara.outputPath, 'VisFeatureOutput.txt');
  } else if (upsePara.note == "Di-nucleotide Type II General PseKNC") {
    if (alert_to_choose_one(jj)) return;
    var command = 'upse -v -i ' + upsePara.inputFile + ' -m ' + upsePara.mode + upsePara.phy + ' -n didna' + ' -l ' + upsePara.lambda + ' -w ' + upsePara.omega + ' -t 2' + ' -f ' + upsePara.outputFormat + ' -o ' + path.join(upsePara.outputPath, 'VisFeatureOutput.txt');
  }
  else if (upsePara.note == "Tri-nucleotide Type I General PseKNC") {
    if (alert_to_choose_one(jj)) return;
    var command = 'upse -v -i ' + upsePara.inputFile + ' -m ' + upsePara.mode + upsePara.phy + ' -n tridna' + ' -l ' + upsePara.lambda + ' -w ' + upsePara.omega + ' -t 1' + ' -f ' + upsePara.outputFormat + ' -o ' + path.join(upsePara.outputPath, 'VisFeatureOutput.txt');
  } else if (upsePara.note == "Tri-nucleotide Type II General PseKNC") {//此处及以上为DNA的模式
    if (alert_to_choose_one(jj)) return;
    var command = 'upse -v -i ' + upsePara.inputFile + ' -m ' + upsePara.mode + upsePara.phy + ' -n tridna' + ' -l ' + upsePara.lambda + ' -w ' + upsePara.omega + ' -t 2' + ' -f ' + upsePara.outputFormat + ' -o ' + path.join(upsePara.outputPath, 'VisFeatureOutput.txt');
  }

  else if (upsePara.note == "RNA compositions")
    var command = 'upse -v -i ' + upsePara.inputFile + ' -n stdrna ' + ' -m ' + upsePara.mode + ' -f ' + upsePara.outputFormat + ' -o ' + path.join(upsePara.outputPath, 'VisFeatureOutput.txt');
  else if (upsePara.note == "RNA-Di-nucleotide compositions")
    var command = 'upse -v -i ' + upsePara.inputFile + ' -m ' + upsePara.mode + upsePara.phy + ' -n dirna' + ' -f ' + upsePara.outputFormat + ' -o ' + path.join(upsePara.outputPath, 'VisFeatureOutput.txt');
  else if (upsePara.note == "RNA-Di-nucleotide Auto covariance") {
    if (alert_to_choose_one(jj)) return;
    var command = 'upse -v -i ' + upsePara.inputFile + ' -n dirna' + ' -m ' + upsePara.mode + upsePara.phy + ' -l ' + upsePara.lambda + ' -t 1' + ' -f ' + upsePara.outputFormat + ' -o ' + path.join(upsePara.outputPath, 'VisFeatureOutput.txt');
  }
  else if (upsePara.note == "RNA-Di-nucleotide Cross covariance") {
    if (alert_to_choose_one(jj)) return;
    var command = 'upse -v -i ' + upsePara.inputFile + ' -n dirna' + ' -m ' + upsePara.mode + upsePara.phy + ' -l ' + upsePara.lambda + ' -t 2' + ' -f ' + upsePara.outputFormat + ' -o ' + path.join(upsePara.outputPath, 'VisFeatureOutput.txt');
  }
  else if (upsePara.note == "RNA-Di-nucleotide Auto-cross covariance") {
    if (alert_to_choose_one(jj)) return;
    var command = 'upse -v -i ' + upsePara.inputFile + ' -n dirna' + ' -m ' + upsePara.mode + upsePara.phy + ' -l ' + upsePara.lambda + ' -t 3' + ' -f ' + upsePara.outputFormat + ' -o ' + path.join(upsePara.outputPath, 'VisFeatureOutput.txt');
  }
  else if (upsePara.note == "Type I General PseDNC") {
    if (alert_to_choose_one(jj)) return;
    var command = 'upse -v -i ' + upsePara.inputFile + ' -m ' + upsePara.mode + ' -n dirna' + upsePara.phy + ' -l ' + upsePara.lambda + ' -w ' + upsePara.omega + ' -t 1' + ' -f ' + upsePara.outputFormat + ' -o ' + path.join(upsePara.outputPath, 'VisFeatureOutput.txt');
  }
  else if (upsePara.note == "Type II General PseDNC") {//此处及以上为RNA模式
    if (alert_to_choose_one(jj)) return;
    var command = 'upse -v -i ' + upsePara.inputFile + ' -m ' + upsePara.mode + ' -n dirna' + upsePara.phy + ' -l ' + upsePara.lambda + ' -w ' + upsePara.omega + ' -t 2' + ' -f ' + upsePara.outputFormat + ' -o ' + path.join(upsePara.outputPath, 'VisFeatureOutput.txt');
  }

  else if (upsePara.note == "Amino acid compositions")
    var command = 'upse -v -i ' + upsePara.inputFile + ' -m ' + upsePara.mode + ' -n stdprot' + ' -f ' + upsePara.outputFormat + ' -o ' + path.join(upsePara.outputPath, 'VisFeatureOutput.txt');
  else if (upsePara.note == "Di-peptide compositions")
    var command = 'upse -v -i ' + upsePara.inputFile + ' -m dpc -n stdprot' + ' -f ' + upsePara.outputFormat + ' -o ' + path.join(upsePara.outputPath, 'VisFeatureOutput.txt');
  else if (upsePara.note == "Auto covariance") {
    if (alert_to_choose_one(jj)) return;
    var command = 'upse -v -i ' + upsePara.inputFile + ' -m ' + upsePara.mode + upsePara.phy + ' -l ' + upsePara.lambda + ' -t 1' + ' -f ' + upsePara.outputFormat + ' -o ' + path.join(upsePara.outputPath, 'VisFeatureOutput.txt');
  }
  else if (upsePara.note == "Cross covariance") {
    if (alert_to_choose_one(jj)) return;
    var command = 'upse -v -i ' + upsePara.inputFile + ' -m ' + upsePara.mode + upsePara.phy + ' -l ' + upsePara.lambda + ' -t 2' + ' -f ' + upsePara.outputFormat + ' -o ' + path.join(upsePara.outputPath, 'VisFeatureOutput.txt');
  }
  else if (upsePara.note == "Auto-cross covariance") {
    if (alert_to_choose_one(jj)) return;
    var command = 'upse -v -i ' + upsePara.inputFile + ' -m ' + upsePara.mode + upsePara.phy + ' -l ' + upsePara.lambda + ' -t 3' + ' -f ' + upsePara.outputFormat + ' -o ' + path.join(upsePara.outputPath, 'VisFeatureOutput.txt');
  }
  else if (upsePara.note == "Type I General PseAAC") {
    if (alert_to_choose_one(jj)) return;
    var command = 'upse -v -i ' + upsePara.inputFile + ' -m ' + upsePara.mode + upsePara.phy + ' -l ' + upsePara.lambda + ' -w ' + upsePara.omega + ' -t 1' + ' -f ' + upsePara.outputFormat + ' -o ' + path.join(upsePara.outputPath, 'VisFeatureOutput.txt');
  }
  else if (upsePara.note == "Type II General PseAAC") {
    if (alert_to_choose_one(jj)) return;
    var command = 'upse -v -i ' + upsePara.inputFile + ' -m ' + upsePara.mode + upsePara.phy + ' -l ' + upsePara.lambda + ' -w ' + upsePara.omega + ' -t 2' + ' -f ' + upsePara.outputFormat + ' -o ' + path.join(upsePara.outputPath, 'VisFeatureOutput.txt');
  }
  else if (upsePara.note == "Quasi-sequence order") {
    var obj = document.getElementsByName("quasiorder");
    var check_val = [];
    for (var k in obj) {
      if (obj[k].checked) {
        check_val.push(obj[k].value);
      }
    }
    if (check_val.length == 0) {
      alert("Please choose a kind of order.");
      showPhy();
      return;
    }
    if (check_val.length > 1) {
      alert("error");
      return;
    }
    var str = "local propy_quasi = propyQuasiSequanceOrder(pr_seq, \"" + check_val[0] + "\", pseb_opt_l, pseb_opt_w)";
    var luapath = path.join(__dirname, 'UltraPse/input_tdfs', 'pseb-propy.lua');
    var temppath = path.join(__dirname, 'UltraPse/input_tdfs', 'temp.lua');
    var zz = fs.readFileSync(luapath, 'utf8').split('\n');
    zz.splice(187, 0, str);
    fs.writeFileSync(temppath, zz.join('\n'), 'utf8');

    var command = 'upse -v -i ' + upsePara.inputFile + ' -u ' + temppath + ' -l ' + upsePara.lambda + ' -w ' + upsePara.omega + ' -f ' + upsePara.outputFormat + ' -o ' + path.join(upsePara.outputPath, 'VisFeatureOutput.txt');
  }
  else if (upsePara.note == "PsePSSM") {
    if(!checkPsePSSMdb())
      return;
    var luapath = path.join(__dirname, 'UltraPse/input_tdfs', 'psepssm.lua');
    // var command = 'upse -v -i ' + upsePara.inputFile + ' -u ' + luapath + ' -l ' + upsePara.lambda + ' -f ' + upsePara.outputFormat + ' -o ' + path.join(upsePara.outputPath, 'VisFeatureOutput.txt');
    var command = 'upse -v -i ' + upsePara.inputFile + ' -u ' + 'psepssm.lua' + ' -l ' + upsePara.lambda + ' -f ' + upsePara.outputFormat + ' -o ' + path.join(upsePara.outputPath, 'VisFeatureOutput.txt');
  }
  else if (upsePara.note == "Moran auto-correlation") {
    var obj = document.getElementsByName("choosemode");
    var check_val = [];
    for (var k in obj) {
      if (obj[k].checked) {
        check_val.push(obj[k].value);
      }
    }
    if (check_val.length == 0) {
      alert("Please choose or add at least 1 Physicochemical Property.");
      showPhy();
      return;
    }
    if (check_val.length > 1) {
      alert("Only one Physicochemical property can be chosen in this sub-mode.");
      showPhy();
      return;
    }

    var str = "local propy_quasi = MoranCoef(pr_seq, pseb_opt_l, \"" + check_val[0] + "\")";
    var luapath = path.join(__dirname, 'UltraPse/input_tdfs', 'pseb-propy.lua');
    var temppath = path.join(__dirname, 'UltraPse/input_tdfs', 'temp.lua');
    var zz = fs.readFileSync(luapath, 'utf8').split('\n');
    zz.splice(171, 0, "  AddProperty(" + "\"" + check_val[0] + "\"" + ") \n ");
    zz.splice(188, 0, str);
    fs.writeFileSync(temppath, zz.join('\n'), 'utf8');
    var command = 'upse -v -i ' + upsePara.inputFile + ' -u ' + temppath + ' -l ' + upsePara.lambda + ' -f ' + upsePara.outputFormat + ' -o ' + path.join(upsePara.outputPath, 'VisFeatureOutput.txt');
  }
  else if (upsePara.note == "Normalized Moreu-Broto auto correlation") {
    var obj = document.getElementsByName("choosemode");
    var check_val = [];
    for (var k in obj) {
      if (obj[k].checked) {
        check_val.push(obj[k].value);
      }
    }
    if (check_val.length == 0) {
      alert("Please choose or add at least 1 Physicochemical Property.");
      showPhy();
      return;
    }
    if (check_val.length > 1) {
      alert("Only one Physicochemical property can be chosen in this sub-mode.");
      showPhy();
      return;
    }
    var str = "local propy_quasi = MoreauBrotoCoef(pr_seq, pseb_opt_l, \"" + check_val[0] + "\")";
    var luapath = path.join(__dirname, 'UltraPse/input_tdfs', 'pseb-propy.lua');
    var temppath = path.join(__dirname, 'UltraPse/input_tdfs', 'temp.lua');
    var zz = fs.readFileSync(luapath, 'utf8').split('\n');
    zz.splice(171, 0, "  AddProperty(" + "\"" + check_val[0] + "\"" + ") \n ");
    zz.splice(188, 0, str);
    fs.writeFileSync(temppath, zz.join('\n'), 'utf8');
    var command = 'upse -v -i ' + upsePara.inputFile + ' -u ' + temppath + ' -l ' + upsePara.lambda + ' -w ' + upsePara.omega + ' -f ' + upsePara.outputFormat + ' -o ' + path.join(upsePara.outputPath, 'VisFeatureOutput.txt');
  }
  else if (upsePara.note == "Geary auto correlation") {
    var obj = document.getElementsByName("choosemode");
    var check_val = [];
    for (var k in obj) {
      if (obj[k].checked) {
        check_val.push(obj[k].value);
      }
    }
    if (check_val.length == 0) {
      alert("Please choose or add at least 1 Physicochemical Property.");
      showPhy();
      return;
    }
    if (check_val.length > 1) {
      alert("Only one Physicochemical property can be chosen in this sub-mode.");
      showPhy();
      return;
    }
    var str = "local propy_quasi = GearyCoef(pr_seq, pseb_opt_l,\"" + check_val[0] + "\")";
    var luapath = path.join(__dirname, 'UltraPse/input_tdfs', 'pseb-propy.lua');
    var temppath = path.join(__dirname, 'UltraPse/input_tdfs', 'temp.lua');
    var zz = fs.readFileSync(luapath, 'utf8').split('\n');
    zz.splice(171, 0, "  AddProperty(" + "\"" + check_val[0] + "\"" + ") \n ");
    zz.splice(188, 0, str);
    fs.writeFileSync(temppath, zz.join('\n'), 'utf8');
    var command = 'upse -v -i ' + upsePara.inputFile + ' -u ' + temppath + ' -l ' + upsePara.lambda + ' -w ' + upsePara.omega + ' -f ' + upsePara.outputFormat + ' -o ' + path.join(upsePara.outputPath, 'VisFeatureOutput.txt');
  }
  else if (upsePara.note == "Composition-Transition-Distributions") {
    var obj = document.getElementsByName("prop_ctd");
    var check_val = [];
    for (var k in obj) {
      if (obj[k].checked) {
        check_val.push(obj[k].value);
      }
    }
    if (check_val.length == 0) {
      alert("Please choose or add at least 1 Physicochemical Property.");
      showPhy();
      return;
    }
    if (check_val.length > 1) {
      alert("Only one Physicochemical property can be chosen in this sub-mode.");
      showPhy();
      return;
    }
    var ctd = document.getElementById("CTDmode").value;
    if (ctd == "CTD_Composition")
      var str = 'local propy_quasi = propyCTD_Composition(pr_seq, "' + check_val[0] + '")';
    else if (ctd == "CTD_Transition")
      var str = 'local propy_quasi = propyCTD_Transition(pr_seq, "' + check_val[0] + '")';
    else
      var str = 'local propy_quasi = propyCTD_Distribution(pr_seq, "' + check_val[0] + '")';
    var luapath = path.join(__dirname, 'UltraPse/input_tdfs', 'pseb-propy.lua');
    var temppath = path.join(__dirname, 'UltraPse/input_tdfs', 'temp.lua');
    var zz = fs.readFileSync(luapath, 'utf8').split('\n');
    zz.splice(187, 0, str);
    fs.writeFileSync(temppath, zz.join('\n'), 'utf8');
    var command = 'upse -v -i ' + upsePara.inputFile + ' -u ' + temppath + ' -f ' + upsePara.outputFormat + ' -o ' + path.join(upsePara.outputPath, 'VisFeatureOutput.txt');
  }
  var userdepath = path.join(__dirname, "UltraPse/input_tdfs", "userDefined.lua");

  if (userdefine == true) {
    command = command + " -u " + userdepath;
    userdefine = false;
  }

  if (definePropertyonly) {
    command += " -u " + userdepath;
    definePropertyonly = false;
  }

  upsePara.phy = null;
  upsePara.outputPath != "" ? openFileName = path.join(upsePara.outputPath, 'VisFeatureOutput.txt') : openFileName = path.join(__dirname, 'UltraPse', 'VisFeatureOutput.txt');

  if (fs.existsSync(openFileName) && upsePara.outputPath != "") {
    alert('The output file: "' + openFileName + '" already exists.\nPlease modify the path of the output file!');
    return;
  }

  if (runExecSync(command, path.join(__dirname, 'UltraPse')) != "error") {
    try {
      var data = fs.readFileSync(openFileName, 'utf-8');  //同步读取UltraPse计算得出的结果
    } catch (err) {
      alert(err);
      return;
    }

    $("#upseResultTextArea").val(data);
    controlShowOrHide("parameterTable", "none");
    controlShowOrHide("tab-addProperty", "none");
    controlShowOrHide("resultTable", "table");
  }
  // 若未选择输出文件路径，则在调用UltraPse后删除临时生成的输出文件
  if (fs.existsSync(openFileName) && upsePara.outputPath == "")
    deleteFile(openFileName);
}

//提醒用户至少选择一个性质
function alert_to_choose_one(qq) {
  var bollean = (qq != "" || definePropertyonly || userdefine);
  if (!bollean) { alert("Please choose or add at least 1 Physicochemical Property."); showPhy(); return true; }
  else return false;

}

//检查PsePSSM模式所需的数据库文件是否存在，若不存在，提示用户
function checkPsePSSMdb(){
  const fs= require("fs");
  const path= require("path");
  let phrPath = path.join(__dirname, 'UltraPse', 'uniprot.phr');
  let pinPath = path.join(__dirname, 'UltraPse', 'uniprot.pin');
  let psqPath = path.join(__dirname, 'UltraPse', 'uniprot.psq');
  if(fs.existsSync(phrPath) && fs.existsSync(pinPath) && fs.existsSync(psqPath)){
    return true;
  }
  else{
    alert('No database was found for searching. Please make sure the sequence database for searching is properly configured before executing this sub-mode.\n You should prepare three database files with the prefix "uniprot" in the "VisFeature-win32-x64\\resources\\app\\UltraPse" directory, namely "uniprot.phr", "uniprot.pin" and "uniprot.psq".');
    return false;
  }
}

var aaindex1Json = readJsonSync(path.join(__dirname, 'txt', 'aaindex566.json'));
var propertyKeys = getKeysFromObject(aaindex1Json);
//根据用户选的mode和note生成对应的理化性质列表
function generatePhy() {
  var aaindex1Json = readJsonSync(path.join(__dirname, 'txt', 'aaindex566.json'));
  var propertyKeys = getKeysFromObject(aaindex1Json);
  let note = document.getElementById("note").value;
  switch (note) {
    case 'DNA-Di-nucleotide compositions':
    case 'DNA-Di-nucleotide Auto covariance':
    case 'DNA-Di-nucleotide Cross covariance':
    case 'DNA-Di-nucleotide Auto-cross covariance':
    case 'Di-nucleotide Type I General PseKNC':
    case 'Di-nucleotide Type II General PseKNC'://添加didna的性质到列表
      let didnaIdMapJson = readJsonSync(path.join(__dirname, 'txt', 'didnaIdMap.json'));
      propertyKeys = getKeysFromObject(didnaIdMapJson);
      addcheckbox(propertyKeys, didnaIdMapJson);
      break;
    case 'DNA-Tri-nucleotide compositions':
    case 'DNA-Tri-nucleotide Auto covariance':
    case 'DNA-Tri-nucleotide Cross covariance':
    case 'DNA-Tri-nucleotide Auto-cross covariance':
    case 'Tri-nucleotide Type I General PseKNC':
    case 'Tri-nucleotide Type II General PseKNC'://添加tridna的性质到列表
      let tridnaIdMapJson = readJsonSync(path.join(__dirname, 'txt', 'tridnaIdMap.json'));
      propertyKeys = getKeysFromObject(tridnaIdMapJson);
      addcheckbox(propertyKeys, tridnaIdMapJson);
      break;
    case 'RNA-Di-nucleotide compositions':
    case 'RNA-Di-nucleotide Auto covariance':
    case 'RNA-Di-nucleotide Cross covariance':
    case 'RNA-Di-nucleotide Auto-cross covariance':
    case 'Type I General PseDNC':
    case 'Type II General PseDNC'://添加dirna的性质到列表
      let dirnaIdMapJson = readJsonSync(path.join(__dirname, 'txt', 'dirnaIdMap.json'));
      propertyKeys = getKeysFromObject(dirnaIdMapJson);
      addcheckbox(propertyKeys, dirnaIdMapJson);
      break;
    case 'Di-peptide compositions':
    case 'Auto covariance':
    case 'Cross covariance':
    case 'Auto-cross covariance':
    case 'Type I General PseAAC':
    case 'Type II General PseAAC':
    case 'Normalized Moreu-Broto auto correlation':
    case 'Moran auto-correlation':
    case 'Geary auto correlation'://添加protein的性质到列表
      let aaindex1Json = readJsonSync(path.join(__dirname, 'txt', 'aaindex566.json'));
      propertyKeys = getKeysFromObject(aaindex1Json);
      addcheckbox(propertyKeys, {});
      break;
    case 'Quasi-sequence order'://添加quasi-sequence的3种性质
      addcheckbox_order();
      break;
    case 'Composition-Transition-Distributions':
      addcheckbox_proplist();
      break;
  }
}
//生成ctd模式的理化性质列表
function addcheckbox_proplist() {
  //ctd的7种性质
  var arr = ['Hydrophobicity', 'Polarizability', 'SolventAccessibility', 'SecondaryStr', 'Charge', 'Polarity', 'NormalizedVDWV'];
  var str = "";
  let sel = document.getElementById('checkboxes');
  for (var i = 0; i < 7; i++) {
    if (i == 4) str += '<tr align="left">';
    str += '<td id = "modeSelect"><input type="checkbox" name="prop_ctd" onclick="choose(this)" value="' + arr[i] + '">' + arr[i] + '</input></td>';
  }
  str += '</tr>';
  sel.innerHTML = str;
}
//生成Quasiorder模式的理化性质列表
function addcheckbox_order() {
  var arr = ['SWOrder', 'GrantOrder', 'GrantOrderLikePropy'];
  var str = "";
  let sel = document.getElementById('checkboxes');
  for (var i = 0; i < 3; i++)
    str += '<td id = "modeSelect"><input type="checkbox" name="quasiorder" onclick="choose(this)" value="' + arr[i] + '">' + arr[i] + '</input></td>';
  str += '</tr>';
  sel.innerHTML = str;
}

// 添加理化性质多选框，data是所有理化性质的ID，dic是理化性质字典文件
function addcheckbox(data, dic) {
  let sel = document.getElementById('checkboxes');
  let str = "";
  if (isEmptyObject(dic)) {
    for (let i = 0; i < data.length; i++) {
      if (i % 4 == 0) str += '<tr align="left">';
      str += '<td id = "modeSelect"><input type="checkbox" name="choosemode" value="' + data[i] + '">' + data[i] + '</input></td>';
    }
  }
  else {
    for (let i = 0; i < data.length; i++) {
      if (i % 4 == 0) str += '<tr align="left">';
      str += '<td id = "modeSelect"><input type="checkbox" name="choosemode" value="' + dic[data[i]] + '">' + data[i] + '</input></td>';
    }
  }
  str += '</tr>';
  sel.innerHTML = str;
}
//在ctd，quasiorder等模式中，仅能选择一种性质
function choose(a) {
  var cc = document.getElementsByName("prop_ctd");
  var ss = document.getElementsByName("quasiorder");
  for (var i = 0; i < ss.length; i++) {//对性质列表进行遍历，取消已选的性质，保证只能选择一种性质
    ss[i].checked = false;
  }
  for (var i = 0; i < cc.length; i++) {
    cc[i].checked = false;
  }
  a.checked = true;
}

// 判断一个对象是否为空
function isEmptyObject(obj) {
  for (var key in obj) {
    return false;
  }
  return true;
}

// 同步读取一个文件
function readJsonSync(path) {
  let stringJson = fs.readFileSync(path, 'utf-8');
  let objectJson = JSON.parse(stringJson);
  return objectJson;
}

// 获得一个对象中的key
function getKeysFromObject(object) {
  //alert("111");
  let keys = [];
  for (var p1 in object) {
    if (object.hasOwnProperty(p1))
      keys.push(p1);
  }
  return keys;
}

//拼接理化性质选择的命令行
function commandPhy() {
  var obj = document.getElementsByName("choosemode");
  var check_val = [];
  var count = 0;
  for (var k in obj) {
    if (obj[k].checked) {
      check_val.push(obj[k].value);//把选择的性质保存到check_val[]中
      count++;
    }
  }
  if (count > 10) {//选择大于10个性质，则提示
    alert("Amount of system data is exceedingly huge, you can't choose more than 10 Physicochemical properties.");
    return;
  }

  let commandphy = "";//依次把已选性质与"-p"结合，并存到commandphy
  for (let i = 0; i < check_val.length; i++) {
    commandphy = commandphy + ' -p ' + check_val[i];
  }

  const remote = require('electron').remote;
  let upsePara = remote.getGlobal('sharedObject').upsePara;
  upsePara.phy = commandphy;
  computesd();
}
//控制性质列表的隐藏
function hidePhy() {
  controlShowOrHide("tr-Phy", "none");
}
//控制性质列表的显示
function showPhy() {
  controlShowOrHide("tr-Phy", "table-row");
}

//输入信息之后点击add打开面板,同时写入到tdf文件中
function showProperty() {
  $("#showSelfdefinedProp").val("");
  userdefine = true;
  clearLua();
  generatePhy();
  controlShowOrHide("parameterTable", "none");
  controlShowOrHide("usertypeTable", "table");
}
//从自定义序列的面板返回，并清空base,length等
function backToPara() {
  controlShowOrHide("usertypeTable", "none");
  controlShowOrHide("parameterTable", "table");
  $("#base").val("");
  $("#length").val("");
  $("#reduce").val("");
  userdefine = false;//返还到初始面板，把自定义序列标志位置false
}
//清空tdf文件
function clearLua() {
  existed_prop = [];
  definePropertyonly = false;
  var _path = path.join(__dirname, "UltraPse/input_tdfs", "userDefined.lua");
  fs.writeFile(_path, "", function (err) {
    if (!err)
      console.log("clear the lua"); 
  });
}
//全局变量，用来保存当前添加的性质的名字
var objprop = [];
//向tdf文件中添加自定义性质
function addProperty() {
  //若必填的内容有空的，则提示
  if (document.getElementById("values").value == "" || document.getElementById("PropObj").value == "") {
    alert('You must enter "Property Name" and "Values" in this mode.')
    $("#tips").html("");
    return;
  }
  var PropObj = document.getElementById("PropObj").value;
  var template = document.getElementById("template").value;
  //var id = document.getElementById("id").value;
  var values = document.getElementById("values").value;
  var comments = document.getElementById("comments").value;
  //遍历添加的性质id，如果当前的id重复，则提示并终止
  for (var ii = 0; ii < existed_prop.length; ii++) {
    if (existed_prop[ii] == PropObj) {
      alert("ID cannot be repeated.")
      $("#tips").html("");
      return;
    }

  }
  objprop.push(PropObj);//保存性质的名字和id，以便最终形成addmoudle函数
  existed_prop.push(PropObj);
  var _path = path.join(__dirname, "UltraPse/input_tdfs", "userDefined.lua");
  var str = "";
  str = str + PropObj + ' = { \nTemplate="' + template + '" ; \nID = "CPSE' + PropObj + '"; \nValues = {' + values + '};\nComment = "' + comments +
    '";\n};\n';
  //写入tdf文件
  fs.appendFileSync(_path, str, function (err) {
    if (!err) {
      console.log("succeed add to tdf");
    }
  });
  var tips = document.getElementById("tips");
  tips.innerHTML = PropObj + " has been added successfully.";
  //成功写入文件后，将各个输入框清空
  $("#PropObj").val("");
  $("#template").val("");
  $("#values").val("");
  $("#comments").val("");
}


// 自定义序列类型和理化性质生成的tdf文件
function generateTdf() {
  var nationObject = document.getElementById("notationObject").value;
  var base = document.getElementById("base").value;
  var length = document.getElementById("length").value;
  var reduce = document.getElementById("reduce").value;

  var str = "";
  str = str + nationObject + ' = { \nName = "MOD_TYPE";\nBase = "' + base + '";\nLength = ' + length + ';\nReduceMap = "' + reduce + '";\n};\n';


  str += "DefineNotation(" + nationObject + ")\n";
  str += 'SetNotation("MOD_TYPE")\n';

  for (var i = 0; i < objprop.length; i++) {
    str += "DefineProperty(" + objprop[i] + ")\n";
  }
  for (var j = 0; j < objprop.length; j++) {
    str += 'AddProperty("CPSE' + objprop[j] + '")\n';
  }
  writeintoTDf(str);
  $("#base").val("");
  $("#length").val("");
  $("#reduce").val("");
  objprop = [];

  var dd = document.getElementById("tips");
  dd.innerHTML = "";
  submit();
}

function upseVisualization() {
  maxVisualDimension = $("#maxDimension option:selected").text();
  try {
    if ($("#labelPathLabel").text() == "") {  // 若没有上传序列label文件，弹框提示
      alert("Please Upload a label index file!");
      $("#uploadLabelBtn").focus();
      return;
    }
    let labelDic = getLabelDic();
    let separator;
    switch ($("#outputFormat").val()) {
      case "csv":
        separator = ",";
        break;

      case "tsv":
        separator = "\t";
        break;

      case "svm":
        separator = " ";
        break;
    }
    upseVisSingleComposition(labelDic, separator);
    upseVisMultipleComposition(labelDic, separator);
  } catch (err) {
    alert(err);
    return;
  }
}

function getLabelDic() {
  const fs = require('fs');
  let labelDic = {};
  let keyValueArr = [];
  let labelData = fs.readFileSync($("#labelPathLabel").text(), 'utf-8');    // 同步读取用户上传的标签文件
  let labelArr = labelData.split("\n");
  for (let i = 0; i < labelArr.length; i++) {
    if (labelArr[i].length > 1) {
      keyValueArr = labelArr[i].split(",");
      labelDic[keyValueArr[0]] = keyValueArr[1];
    }
  }
  return labelDic;
}

// 创建单组分情况下的R输入文件、R脚本，并调用R处理R脚本，在指定文件夹生成图片
function upseVisSingleComposition(labelDic, separator) {
  const path = require('path');
  const ipcRenderer = require('electron').ipcRenderer;
  let mode = 'SingleComposition';
  let RfileName = path.join(__dirname, "R-3.5.3", "bin", "VisFeature-Rinput-SingleComposition.csv");
  let RscriptName = path.join(__dirname, "R-3.5.3", "bin", "VisFeature-Rscript-SingleComposition.R");
  let RfileDic = createRfile(labelDic, RfileName, mode, separator);
  createRscript("VisFeature-Rinput-SingleComposition.csv", RscriptName, RfileDic["headerStr"], mode, separator);

  let Rcommand = "Rscript VisFeature-Rscript-SingleComposition.R";
  deleteFiles(path.join(__dirname, "R-3.5.3", "bin", "SingleCompositionImg"));
  if (runExecSync(Rcommand, path.join(__dirname, 'R-3.5.3', 'bin')) == "error") {
    return;
  }
}

// 创建多组分情况下的R输入文件、R脚本，并调用R处理R脚本，在指定文件夹生成图片
function upseVisMultipleComposition(labelDic, separator) {
  const path = require('path');
  const ipcRenderer = require('electron').ipcRenderer;
  let mode = 'MultipleComposition';
  let RfileName = path.join(__dirname, "R-3.5.3", "bin", "VisFeature-Rinput-MultipleComposition.csv");
  let RscriptName = path.join(__dirname, "R-3.5.3", "bin", "VisFeature-Rscript-MultipleComposition.R");
  let RfileDic = createRfile(labelDic, RfileName, mode, separator);
  createRscript("VisFeature-Rinput-MultipleComposition.csv", RscriptName, RfileDic["headerStr"], mode, separator);

  let Rcommand = "Rscript VisFeature-Rscript-MultipleComposition.R";
  deleteFiles(path.join(__dirname, "R-3.5.3", "bin", "MultipleCompositionImg"));
  if (runExecSync(Rcommand, path.join(__dirname, 'R-3.5.3', 'bin')) != "error") {
    // 通知主进程 computeAndVis.html 已关闭，将向量的dimension发送给主进程，让主进程进行后续操作
    ipcRenderer.send('computeAndVis-close', { "dimension": RfileDic["vectorDimension"], "seqType": $("#sequenceType").val() });
    window.close();
  }
}

// 使用csv格式的结果生成需要的文件：格式为 第一个元素为序列ID,后面为数字,最后一个为序列的标签。作为R脚本的输入文件
function createRfile(labelDic, fileName, mode, separator) {
  const fs = require('fs');
  let resultData = $("#upseResultTextArea").val();
  let resultArr = resultData.split('\n');
  let str = "";
  let dimension = 0;
  if (separator == " ") {
    resultArr[0].split(separator).length - 4 > maxVisualDimension ? dimension = maxVisualDimension : dimension = resultArr[0].split(separator).length - 4;   // 可视化的向量维度最多为maxVisualDimension维，超过则按maxVisualDimension维计算
  }
  else {
    resultArr[0].split(separator).length - 2 > maxVisualDimension ? dimension = maxVisualDimension : dimension = resultArr[0].split(separator).length - 2;   // 可视化的向量维度最多为maxVisualDimension维，超过则按maxVisualDimension维计算
  }
  let headerStr = createRfileHeader(resultArr[0], dimension, mode, separator);
  str += headerStr;

  switch (mode) {
    case 'SingleComposition':
      if (separator == " ") {  // 结果为svm格式
        for (let i = 0; i < resultArr.length; i++) {
          if (resultArr[i] != "") {
            let featureArr = resultArr[i].split(" ");
            let seqId = featureArr[featureArr.length - 1];
            str += seqId + ",";
            for (let j = 2; j < featureArr.length - 1; j++) {
              if (j == featureArr.length - 2) {
                str += `Group:${labelDic[seqId]}`;
                break;
              }
              if (parseInt(featureArr[j].split(":")[0]) <= maxVisualDimension){
                str += featureArr[j].split(":")[1] + ",";
              }
            }
          }
          if (i != resultArr.length - 1)
            str += '\n';
        }
      }
      else {  // 结果为csv/tsv格式
        for (let i = 0; i < resultArr.length; i++) {
          if (resultArr[i] != "") {
            let commaIndex = nthIndexOf(resultArr[i], separator, dimension);   // 查找每条结果中第dimension个separator的位置
            let seqId = resultArr[i].split(separator)[0];
            if (separator == ",") {
              str += resultArr[i].substring(0, commaIndex + 1) + `Group:${labelDic[seqId]}`;
            }
            else {
              str += resultArr[i].substring(0, commaIndex + 1).replace(/\t/g, ",") + `Group:${labelDic[seqId]}`;
            }
            if (i != resultArr.length - 1)
              str += '\n';
          }
        }
      }
      break;

    case 'MultipleComposition':
      if (separator == " ") { // 结果为svm格式
        for (let i = 0; i < resultArr.length; i++) {
          if (resultArr[i] != "") {
            let featureArr = resultArr[i].split(" ");
            let seqId = featureArr[featureArr.length - 1];

            for (let j = 2; j < featureArr.length - 2; j++) {
              let tempArr = featureArr[j].split(":");
              if(parseInt(tempArr[0]) <= maxVisualDimension){
                if (j == 2)
                  str += seqId + ",";
                else
                  str += ",";
                if ($("#sequenceType").val() == 'Protein' && $("#note option:selected").text() == 'Amino acid compositions'){ 
                  str += `${tempArr[1]},${proteinArr[tempArr[0] - 1]},Group:${labelDic[seqId]}\n`;
                }
                else if($("#sequenceType").val() == 'DNA' && $("#note option:selected").text() == 'DNA compositions'){
                  str += `${tempArr[1]},${dnaArr[tempArr[0] - 1]},Group:${labelDic[seqId]}\n`;
                }
                else if($("#sequenceType").val() == 'DNA' && $("#note option:selected").text() == 'DNA-Di-nucleotide compositions'){
                  str += `${tempArr[1]},${didnaArr[tempArr[0] - 1]},Group:${labelDic[seqId]}\n`;
                }
                else if($("#sequenceType").val() == 'DNA' && $("#note option:selected").text() == 'DNA-Tri-nucleotide compositions'){
                  str += `${tempArr[1]},${tridnaArr[tempArr[0] - 1]},Group:${labelDic[seqId]}\n`;
                }
                else if($("#sequenceType").val() == 'RNA' && $("#note option:selected").text() == 'RNA compositions'){
                  str += `${tempArr[1]},${rnaArr[tempArr[0] - 1]},Group:${labelDic[seqId]}\n`;
                }
                else if($("#sequenceType").val() == 'RNA' && $("#note option:selected").text() == 'RNA-Di-nucleotide compositions'){
                  str += `${tempArr[1]},${dirnaArr[tempArr[0] - 1]},Group:${labelDic[seqId]}\n`;
                }
                else
                  str += `${tempArr[1]},Dimension${tempArr[0]},Group:${labelDic[seqId]}\n`;
              }
            }
          }
        }
      }
      else { // 结果为csv/tsv格式
        for (let i = 0; i < resultArr.length; i++) {
          if (resultArr[i] != "") {
            for (let j = 1; j <= dimension; j++) {
              let commaIndex = nthIndexOf(resultArr[i], separator, dimension);   // 查找每条结果中第dimension个逗号的位置
              let seqId = resultArr[i].split(separator)[0];
              if(j == 1)
                str += seqId + ",";
              else
                str += ",";
              if($("#sequenceType").val() == 'Protein' && $("#note option:selected").text() == 'Amino acid compositions'){
                str += resultArr[i].split(separator)[j] + `,${proteinArr[j - 1]},` + `Group:${labelDic[seqId]}\n`;
              } 
              else if($("#sequenceType").val() == 'DNA' && $("#note option:selected").text() == 'DNA compositions'){
                str += resultArr[i].split(separator)[j] + `,${dnaArr[j - 1]},` + `Group:${labelDic[seqId]}\n`;
              }
              else if($("#sequenceType").val() == 'DNA' && $("#note option:selected").text() == 'DNA-Di-nucleotide compositions'){
                str += resultArr[i].split(separator)[j] + `,${didnaArr[j - 1]},` + `Group:${labelDic[seqId]}\n`;
              }
              else if($("#sequenceType").val() == 'DNA' && $("#note option:selected").text() == 'DNA-Tri-nucleotide compositions'){
                str += resultArr[i].split(separator)[j] + `,${tridnaArr[j - 1]},` + `Group:${labelDic[seqId]}\n`;
              }
              else if($("#sequenceType").val() == 'RNA' && $("#note option:selected").text() == 'RNA compositions'){
                str += resultArr[i].split(separator)[j] + `,${rnaArr[j - 1]},` + `Group:${labelDic[seqId]}\n`;
              }
              else if($("#sequenceType").val() == 'RNA' && $("#note option:selected").text() == 'RNA-Di-nucleotide compositions'){
                str += resultArr[i].split(separator)[j] + `,${dirnaArr[j - 1]},` + `Group:${labelDic[seqId]}\n`;
              }
              else
                str += resultArr[i].split(separator)[j] + `,Dimension${j},` + `Group:${labelDic[seqId]}\n`;
            }
          }
        }
      }
      break;
  }
  fs.writeFileSync(fileName, str);
  return { "headerStr": headerStr, "vectorDimension": dimension };
}

// 创建数据文件VisFeature-Rinput-SingleComposition.csv的标题行，作为R脚本的输入
function createRfileHeader(resultLine, dimension, mode, separator) {
  let headerStr = "";
  switch (mode) {
    case 'SingleComposition':
      if ($("#sequenceType").val() == 'Protein') {  // Protein
        if (resultLine != ""  && $("#note option:selected").text() == 'Amino acid compositions') {    // 如果蛋白质的特征向量的长度等于20，则用固定字母表示每个组分
          headerStr = "ID,";
          for (let j = 0; j <= dimension-1; j++) {
            headerStr += proteinArr[j] + ",";
            if (j == dimension-1)
              headerStr += "Group\n";
          }
        }
        else {
          headerStr = "ID,";
          for (let j = 1; j <= dimension; j++) {
            headerStr += "Dimension" + j + ",";
            if (j == dimension)
              headerStr += "Group\n";
          }
        }
      }
      else if($("#sequenceType").val() == 'DNA'){ // DNA
        if (resultLine != "" && $("#note option:selected").text() == 'DNA compositions') {
          headerStr = "ID,";
          for (let j = 0; j <= dimension-1; j++) {
            headerStr += dnaArr[j] + ",";
            if (j == dimension-1)
              headerStr += "Group\n";
          }
        }
        else if(resultLine != "" && $("#note option:selected").text() == 'DNA-Di-nucleotide compositions'){
          headerStr = "ID,";
          for (let j = 0; j <= dimension-1; j++) {
            headerStr += didnaArr[j] + ",";
            if (j == dimension-1)
              headerStr += "Group\n";
          }
        }
        else if(resultLine != "" && $("#note option:selected").text() == 'DNA-Tri-nucleotide compositions'){
          headerStr = "ID,";
          for (let j = 0; j <= dimension-1; j++) {
            headerStr += tridnaArr[j] + ",";
            if (j == dimension-1)
              headerStr += "Group\n";
          }
        }
        else{
          headerStr = "ID,";
          for (let j = 1; j <= dimension; j++) {
            headerStr += "Dimension" + j + ",";
            if (j == dimension)
              headerStr += "Group\n";
          }
        }
      }
      else{  // RNA
        if (resultLine != "" && $("#note option:selected").text() == 'RNA compositions') {
          headerStr = "ID,";
          for (let j = 0; j <= dimension-1; j++) {
            headerStr += rnaArr[j] + ",";
            if (j == dimension-1)
              headerStr += "Group\n";
          }
        }
        else if(resultLine != "" && $("#note option:selected").text() == 'RNA-Di-nucleotide compositions'){
          headerStr = "ID,";
          for (let j = 0; j <= dimension-1; j++) {
            headerStr += dirnaArr[j] + ",";
            if (j == dimension-1)
              headerStr += "Group\n";
          }
        }
        else{
          headerStr = "ID,";
          for (let j = 1; j <= dimension; j++) {
            headerStr += "Dimension" + j + ",";
            if (j == dimension)
              headerStr += "Group\n";
          }
        }
      }
      break;

    case 'MultipleComposition':
      if ($("#sequenceType").val() == 'Protein' && $("#note option:selected").text() == 'Amino acid compositions')
        headerStr = 'ID,Composition,Amino acids,Group\n';
      else
        headerStr = 'ID,Composition,Dimension,Group\n';
      break;
  }
  return headerStr;
}

// 创建R脚本文件VisFeature-Rscript-SingleComposition.R，用于R可视化
function createRscript(inputFileName, RscriptFileName, headerStr, mode, separator) {
  const fs = require('fs');
  let headerStrArr = headerStr.split(",");
  let str = "";
  str += "library('ggplot2');\n";
  str += `data <- read.csv('${inputFileName}', header=TRUE, sep=',');\n`;
  switch (mode) {
    case 'SingleComposition':
      // 由于R的限制，单组分模式最大可视化维度设置为60维
      let singleCompositionMaxDimension = headerStrArr.length - 2 > 60 ? 60 : headerStrArr.length - 2;
      for (let i = 1; i <= singleCompositionMaxDimension; i++) {
        str += `svg("SingleCompositionImg/Dimension${i}.svg", width=8, height=6);\n`;
        str += generateCommand("data", headerStrArr[i], "Group", "0.3");
      }
      break;

    case 'MultipleComposition':
      if ($("#sequenceType").val() == 'Protein'  && $("#note option:selected").text() == 'Amino acid compositions') {
        str += `svg("MultipleCompositionImg/multipleComposition1.svg", width=12, height=6);\n`;
        str += "ggplot(data,aes(x=Composition,fill=Amino.acids)) + geom_density(alpha = 0.5) + facet_grid(.~Group) + facet_wrap( ~ Group, ncol=2);\n";
        str += `svg("MultipleCompositionImg/multipleComposition2.svg", width=12, height=9);\n`;
        str += "ggplot(data,aes(x=Composition,fill=Amino.acids)) + geom_density(alpha = 0.5) + facet_grid(Group~.);";
      }
      else {
        str += `svg("MultipleCompositionImg/multipleComposition1.svg", width=12, height=6);\n`;
        str += "ggplot(data,aes(x=Composition,fill=Dimension)) + geom_density(alpha = 0.5) + facet_grid(.~Group) + facet_wrap( ~ Group, ncol=2);\n";
        str += `svg("MultipleCompositionImg/multipleComposition2.svg", width=11, height=9);\n`;
        str += "ggplot(data,aes(x=Composition,fill=Dimension)) + geom_density(alpha = 0.5) + facet_grid(Group~.);"; 
      }
      break;
  }
  fs.writeFileSync(RscriptFileName, str);
}

// 生成一行ggplot的命令
function generateCommand(dataName, xName, fillName, alphaValue) {
  return `ggplot(${dataName},aes(x=${xName},fill=${fillName})) + geom_density(alpha=${alphaValue});\n`;
}

// 获取一个字符串中指定字符c第n次出现的位置
function nthIndexOf(str, c, n) {
  let x = str.indexOf(c);
  for (let i = 0; i < n; i++) {
    x = str.indexOf(c, x + 1);
  }
  return x;
}

// 删除folderPath文件夹下的所有文件（用于在每次生成R图片前删除img文件夹下的旧的R图片）
function deleteFiles(folderPath) {
  const fs = require('fs');
  const path = require('path');
  let forlder_exists = fs.existsSync(folderPath);
  if (forlder_exists) {
    let fileList = fs.readdirSync(folderPath);
    fileList.forEach(function (fileName) {
      fs.unlinkSync(path.join(folderPath, fileName));
    });
  }
}
//aa的内容写入tdf中
function writeintoTDf(aa) {
  var _path = path.join(__dirname, "UltraPse/input_tdfs", "userDefined.lua");
  fs.appendFileSync(_path, aa, function (err) {
    if (!err) {
      console.log("success add to tdf");
    }
  });

}
//转到添加性质的界面
function ToTableAddProperty() {
  //如果length和base为空，那么提示用户shuru
  if (document.getElementById("length").value == "" || document.getElementById("base").value == "") {
    alert('You must enter "Base" and "Length" in this mode.')
    return;
  }

  controlShowOrHide("usertypeTable", "none");
  controlShowOrHide("tab-addProperty", "table");
  $("#submit2").css("display", "inline");
}
//返回定义序列的界面
function backToUserType() {
  $("#PropObj").val("");
  $("#template").val("");
  $("#values").val("");
  $("#comments").val("");
  //如果definePropertyonly标志位为true，则直接返回parameterTable
  if (definePropertyonly) {
    var str = "";
    for (var i = 0; i < objprop.length; i++) {
      str += "DefineProperty(" + objprop[i] + ")\n";
    }
    for (var j = 0; j < objprop.length; j++) {
      str += 'AddProperty("CPSE' + objprop[j] + '")\n';
    }
    writeintoTDf(str);
    var tt = document.getElementById("showSelfdefinedProp");
    var ss = "";
    for (var k = 0; k < objprop.length; k++) {
      ss += objprop[k] + "  ";
    }
    tt.value += ss;
    objprop = [];
    controlShowOrHide("parameterTable", "table");
    controlShowOrHide("tab-addProperty", "none");
    if (existed_prop.length == 0) {
      definePropertyonly = false;
    }

  }
  else {
    controlShowOrHide("usertypeTable", "table");
    controlShowOrHide("tab-addProperty", "none");
    clearLua();
  }

  var tips = document.getElementById("tips");
  tips.innerHTML = "";

}

function showAddtable() {
  controlShowOrHide("parameterTable", "none");
  controlShowOrHide("tab-addProperty", "table");
  $("#submit2").css("display", "none");
  definePropertyonly = true;
  userdefine = false;
  var dd = document.getElementById("showSelfdefinedProp");
}

// 关于计算方法的提示
function explainMethod() {
  alert("There are two compute methods. They are self-defined parameters and task definition file (TDF). A TDF in VisFeature is a Lua script. Details about TDF can be found here: https://github.com/pufengdu/UltraPse/blob/master/doc/manual.pdf.");
}

// 关于λ的提示
function explainLambda() {
  alert("λ(lambda) represents the counted rank (or tier) of the correlation along a biological sequence. λ must be non-negative integer and smaller than L-k , where L is the length of the query sequence and k is the length of the selected oligomer mode. Generally, the greater the λ is, the more sequence-order information is incorporated. However, large λ would result in redundant information and may lead to lower predictive performance and longer running time.");
}

// 关于lag的提示
function explainLag() {
  alert("Lag represents the distance between two nucleotides, amino acids, or oligomers along a sequence. ");
}

// 关于max delay的提示
function explainMaxDelay() {
  alert("Max delay is one of the parameters of quasi-sequence order.Actual, you can also deal with this by computing pseaac type 1.");
}

// 关于w的提示
function explainOmega() {
  alert("W(weight) is the weight factor for the sequence-order effects and used to put weight to the additional pseudo components with respect to the conventional sequence components. You can set the weight factor value in the range 0.1 to 1.0.");
}

// 关于输出格式的提示
function explainOutputFormat() {
  alert("VisFeature support three different output formats, csv format ( comma separated ), tsv format ( tab separated ) and libSVM format.");
}

// 关于TDF的提示
function explainTDF() {
  alert("A task definition file (TDF) in VisFeature is a Lua script and it can alter all sort of definitions, options and parameters. It can also configure computational engine, physicochemical properties, sequence notation definitions. A TDF can provide functions, so that some computational modules can call these functions to implement user-defined representation modes. Details about TDF can be found here: https://github.com/pufengdu/UltraPse/blob/master/doc/manual.pdf.");
}

// 关于输入的提示
function explainInput() {
  alert("It is optional to upload a file in FASTA format on the page of parameter. If you do not upload a file, program will take the contents of the input area as input.If you upload a file, program will take this file as input. If both methods are used, program will take the file that you upload as input. If your FASTA file is large, please upload it on this page. Because open a large file is slow, upload a large file on this page is very fast. ");
}

// 关于输出文件保存位置的提示
function explainOutputLocation() {
  alert("It is optional to specify the output file location. \nYou can choose a location for storing the results(VisFeatureOutput.txt). \nIf you do not choose a location, the results will be written on screen.");
}

// 关于Type的提示
function explainType() {
  alert("It is optional to specify the type. If you want to use Type-I or Type-II descriptors in pseknc or pseaac, type should be selected. Ⅰ is for Type-Ⅰ descriptors, and Ⅱ is for Type-Ⅱ descriptors.");
}

// 关于Define a new sequence type的提示
function explainDefineSequence() {
  alert("Function: add a user-defined seuqence type. For example, for di-nucleotide sequence type, you write Base = ACGT, Length = 2; while for tri-nucleotide sequence type, you should write Base=ACGT, Length = 3.");
}

//关于base的提示
function explainBase() {
  alert("Base is a string. It contains all the letters that will appear in a sequence.");
}

// 关于Length的提示
function explainLength() {
  alert("Length is an integer. It defines how many letter in the sequences should be regarded as a unit.");
}

//关于reduce的提示
function explainReduce() {
  alert("ReduceMap is a string. It is the reducing rule when sequences are analyzed. For example, if you specify ReduceMap = AAACAGAT in a di-nucleotide sequence type, the AA, AC, AG and AT will be treated equally as AA.");
}
//关于value的提示
function explainValue() {
  alert('Values deﬁnes all physicochemical property values. The member name in Values table must conform to the sequence type deﬁnition. Neither extra nor missing member is allowed. \nYou should note that variables must be separated by ";".');
}

// 关于Define a physicochemical property的提示
function explainDefineProperty() {
  alert('Function: add a user-defined physicochemical property. For example, if Base is "ACDEFGHIKLMNPQRSTVWY@", then you should type the following characters in Values: \nA = 15; C = 47; D = 59; E = 73; F = 91; \nG = 1; H = 82; I = 57; K = 73; L = 57; \nM = 75; N = 58; P = 42; Q = 72; R = 101; \nS = 31; T = 45; V = 43; W = 130; Y = 107; ["@"] = 109; ');
}

// 关于PropertyName的提示
function explainPropertyName() {
  alert("Property name is a string. It is the unique identifier of the physicochemical property.");
}

//关于templete的提示
function explainTemplate() {
  alert('Template is identiﬁer of the existing physicochemical properties that should be used as the template for this new physicochemical properties. Besides the values altered in the Values section, all the other values of the new physicochemical properties will be the same as the template. If Template is null, Values section must specify values for all notations in current sequence types.');
}

//关于Comments的提示
function explainComments() {
  alert('Comment is a string. It explains what this property actually offer. If you do not need that, just leave it as null.');
}

//关于最大可视化维度的提示
function explainMaxDimension() {
  alert('This item is used to set the maximum dimension of the visual feature vector, exceeded parts will be ignored. Please note: The maximum dimension of the visual feature vector in "single composition" sub-mode is 60, and this value in "multiple compositions" sub-mode is 200.');
}

//针对所选的mode给出base和length的实例
function propexample() {
  var sequenceType = document.getElementById("sequenceType").value;
  var base = document.getElementById("base");

  if (sequenceType == "DNA") base.value = "AGCTW";
  else if (sequenceType == "RNA") base.value = "AGCUW";
  else base.value = "ACDEFGHIKLMNPQRSTVWY@";

  var nn = document.getElementById("note").value;
  switch (nn) {
    case 'DNA-Di-nucleotide compositions':
    case 'DNA-Di-nucleotide Auto covariance':
    case 'DNA-Di-nucleotide Cross covariance':
    case 'DNA-Di-nucleotide Auto-cross covariance':
    case 'Di-nucleotide Type I General PseKNC':
    case 'Di-nucleotide Type II General PseKNC':
    case 'RNA-Di-nucleotide compositions':
    case 'RNA-Di-nucleotide Auto covariance':
    case 'RNA-Di-nucleotide Cross covariance':
    case 'RNA-Di-nucleotide Auto-cross covariance':
    case 'Type I General PseDNC':
    case 'Type II General PseDNC':
      document.getElementById("length").value = 2;
      break;

    case 'DNA-Tri-nucleotide Auto covariance':
    case 'DNA-Tri-nucleotide Cross covariance':
    case 'DNA-Tri-nucleotide Auto-cross covariance':
    case 'Tri-nucleotide Type I General PseKNC':
    case 'Tri-nucleotide Type II General PseKNC':
    case 'DNA-Tri-nucleotide compositions':
      document.getElementById("length").value = 3;
      break;

    case 'Di-peptide compositions':
      document.getElementById("length").value = 2;
      break;
    default:
      document.getElementById("length").value = 1;


  }
}
//针对所选的mode，如果只添加新性质而不定义新序列，给出value的实例
function showvalueexample() {
  if (userdefine == true) {
    showvalueexample2();
    return;
  }
  var nn = document.getElementById("note").value;
  switch (nn) {
    case 'DNA-Di-nucleotide Auto covariance':
    case 'DNA-Di-nucleotide Cross covariance':
    case 'DNA-Di-nucleotide Auto-cross covariance':
    case 'Di-nucleotide Type I General PseKNC':
    case 'Di-nucleotide Type II General PseKNC':
    case 'DNA-Di-nucleotide compositions':
      var data = 'AA = 0.668; AC = -1.369; AT = 0.833; AG = 1.019;\nCA = -0.918; CC = 1.19; CT = 1.65; CG = -0.24;\nTA = 1.23; TC = -0.21; TT = 0.16; TG = 0.488;\nGA = 0.359; GC = 1.61; GT = 1.03; GG = -1.03;';
      document.getElementById("values").value = data;
      break;

    case 'DNA-Tri-nucleotide Auto covariance':
    case 'DNA-Tri-nucleotide Cross covariance':
    case 'DNA-Tri-nucleotide Auto-cross covariance':
    case 'Tri-nucleotide Type I General PseKNC':
    case 'Tri-nucleotide Type II General PseKNC':
    case 'DNA-Tri-nucleotide compositions':
      var data = 'AAA = -2.087; AAC = -1.509; AAG = -0.506; AAT = -2.126; \nACA = 0.111; ACC = -0.121; ACG = -0.121; ACT = -1.354;\nAGA = 0.381; AGC = 0.304; AGG = -0.313; AGT = -1.354; \nATA = 1.615; ATC = -0.737; ATG = 1.229; ATT = -2.126;\nCAA = 0.265; CAC = 0.496; CAG = 1.576; CAT = 1.229; \nCCA = -1.856; CCC = 0.072; CCG = -0.969; CCT = -0.313;\nCGA = 0.111; CGC = -0.468; CGG = -0.969; CGT = -0.121; \nCTA = 0.882; CTC = 0.419; CTG = 1.576; CTT = -0.506;\nGAA = -0.159; GAC = 0.034; GAG = 0.419; GAT = -0.737; \nGCA = 0.766; GCC = 1.036; GCG = -0.468; GCT = 0.304;\nGGA = 0.265; GGC = 1.036; GGG = 0.072; GGT = -0.121; \nGTA = 0.342; GTC = 0.034; GTG = 0.496; GTT = -1.509;\nTAA = 0.689; TAC = 0.342; TAG = 0.882; TAT = 1.615; \nTCA = 1.730; TCC = 0.265; TCG = 0.111; TCT = 0.381;\nTGA = 1.730; TGC = 0.766; TGG = -1.856; TGT = 0.111; \nTTA = 0.689; TTC = -0.159; TTG = 0.265; TTT = -2.087;';
      document.getElementById("values").value = data;
      break;

    case 'RNA-Di-nucleotide Auto covariance':
    case 'RNA-Di-nucleotide Cross covariance':
    case 'RNA-Di-nucleotide Auto-cross covariance':
    case 'Type I General PseDNC':
    case 'Type II General PseDNC':
    case 'RNA-Di-nucleotide compositions':
      var data = 'AA = 0.668; AC = -1.369; AU = 0.833; AG = 1.019;\nCA = -0.918; CC = 1.19; CU = 1.65; CG = -0.24;\nUA = 1.23; UC = -0.21; UU = 0.16; UG = 0.488;\nGA = 0.359; GC = 1.61; GU = 1.03; GG = -1.03;';
      document.getElementById("values").value = data;
      break;

    case 'DNA compositions':
      var data = 'A = 0.668; C = -1.369; T = 0.833; G = 1.019;';
      document.getElementById("values").value = data;
      break;

    case 'RNA compositions':
      var data = 'A = 0.668; C = -1.369; U = 0.833; G = 1.019;';
      document.getElementById("values").value = data;
      break;

    default:
      if ($("#sequenceType".val == 'Protein')) {
        data = 'A = 0.62; C = 0.29; D = -0.9; E = -0.74;\nF = 1.19; G = 0.48; H = -0.4; I = 1.38;\nK = -1.5; L = 1.06; M = 0.64; N = -0.78;\nP = 0.12; Q = -0.85; R = -2.53; S = -0.18;\nT = -0.05; V = 1.08; W = 0.81; Y = 0.26;';
        document.getElementById("values").value = data;
      }
  }

  document.getElementById("PropObj").value = "EXAMPLE1";
}

//既定义了新序列，又添加了新性质那么要针对新的字符“ACTGW”“ACTG@”等给出value实例
function showvalueexample2() {
  var nn = document.getElementById("note").value;
  switch (nn) {
    case 'DNA-Di-nucleotide Auto covariance':
    case 'DNA-Di-nucleotide Cross covariance':
    case 'DNA-Di-nucleotide Auto-cross covariance':
    case 'Di-nucleotide Type I General PseKNC':
    case 'Di-nucleotide Type II General PseKNC':
    case 'DNA-Di-nucleotide compositions':
      var data = 'AA = 0.668; AC = -1.369; AT = 0.833; AG = 1.019; AW = -1.53;\nCA = -0.918; CC = 1.19; CT = 1.65; CG = -0.24; CW = 1.11;\nTA = 1.23; TC = -0.21; TT = 0.16; TG = 0.488; TW = -0.75; \nGA = 0.359; GC = 1.61; GT = 1.03; GG = -1.03; GW = 0.47;\nWA = -0.77; WC = -1.74; WT = -0.3; WG = -0.55; WW = -0.64;';
      document.getElementById("values").value = data;
      break;

    case 'DNA-Tri-nucleotide Auto covariance':
    case 'DNA-Tri-nucleotide Cross covariance':
    case 'DNA-Tri-nucleotide Auto-cross covariance':
    case 'Tri-nucleotide Type I General PseKNC':
    case 'Tri-nucleotide Type II General PseKNC':
    case 'DNA-Tri-nucleotide compositions':
      var data = 'AAA = -2.087; AAC = -1.509; AAG = -0.506; AAT = -2.126; AAW = 0.304;\nACA = 0.111; ACC = -0.121; ACG = -0.121; ACT = -1.354; ACW = 0.304;\nAGA = 0.381; AGC = 0.304; AGG = -0.313; AGT = -1.354; AGW = 0.304;\nATA = 1.615; ATC = -0.737; ATG = 1.229; ATT = -2.126; ATW = 0.304;\nAWA = 0.304; AWC = 0.304; AWG = 0.304;AWT = 0.304; AWW = 0.304;\nCAA = 0.265; CAC = 0.496; CAG = 1.576; CAT = 1.229; CAW = 0.304;\nCCA = -1.856; CCC = 0.072; CCG = -0.969; CCT = -0.313; CCW = 0.304;\nCGA = 0.111; CGC = -0.468; CGG = -0.969; CGT = -0.121; CGW = 0.304;\nCTA = 0.882; CTC = 0.419; CTG = 1.576; CTT = -0.506; CTW = 0.304;\nCWA = 0.304; CWC = 0.304; CWG = 0.304; CWT = 0.304; CWW = 0.304;  \nGAA = -0.159; GAC = 0.034; GAG = 0.419; GAT = -0.737; GAW = 0.304;\nGCA = 0.766; GCC = 1.036; GCG = -0.468; GCT = 0.304; GCW = 0.304;\nGGA = 0.265; GGC = 1.036; GGG = 0.072; GGT = -0.121; GGW = 0.304;\nGTA = 0.342; GTC = 0.034; GTG = 0.496; GTT = -1.509;GTW = 0.304;\nGWA = 0.304; GWC = 0.304; GWG = 0.304; GWT = 0.304; GWW = 0.304;\nTAA = 0.689; TAC = 0.342; TAG = 0.882; TAT = 1.615; TAW = 0.304;\nTCA = 1.730; TCC = 0.265; TCG = 0.111; TCT = 0.381; TCW = 0.304;\nTGA = 1.730; TGC = 0.766; TGG = -1.856; TGT = 0.111; TGW = 0.304;\nTTA = 0.689; TTC = -0.159; TTG = 0.265; TTT = -2.087; TTW = 0.304;\nTWA = 0.304; TWC = 0.304; TWT = 0.304; TWG = 0.304; TWW = 0.304;\nWAA = 0.689; WAC = 0.342;WAG = 0.882; WAT = 1.615; WAW = 0.304;\nWCA = 1.730; WCC = 0.265; WCG = 0.111; WCT = 0.381; WCW = 0.304;\nWGA = 1.730; WGC = 0.766; WGG = -1.856; WGT = 0.111; WGW = 0.304;\nWTA = 0.689; WTC = -0.159; WTG = 0.265; WTT = -2.087; WTW = 0.304;\nWWA = 0.304; WWC = 0.304; WWT = 0.304; WWG = 0.304; WWW = 0.304;';
      document.getElementById("values").value = data;
      break;

    case 'RNA-Di-nucleotide Auto covariance':
    case 'RNA-Di-nucleotide Cross covariance':
    case 'RNA-Di-nucleotide Auto-cross covariance':
    case 'Type I General PseDNC':
    case 'Type II General PseDNC':
    case 'RNA-Di-nucleotide compositions':
      var data = 'AA = 0.668; AC = -1.369; AU = 0.833; AG = 1.019; AW = -1.53;\nCA = -0.918; CC = 1.19; CU = 1.65; CG = -0.24; CW = 1.11;\nUA = 1.23; UC = -0.21; UU = 0.16; UG = 0.488; UW = -0.75; \nGA = 0.359; GC = 1.61; GU = 1.03; GG = -1.03; GW = 0.47;\nWA = -0.77; WC = -1.74; WU = -0.3; WG = -0.55; WW = -0.64;';
      document.getElementById("values").value = data;
      break;

    case 'DNA compositions':
      var data = 'A = 0.668; C = -1.369; T = 0.833; G = 1.019; W = 1.216;';
      document.getElementById("values").value = data;
      break;

    case 'RNA compositions':
      var data = 'A = 0.668; C = -1.369; U = 0.833; G = 1.019; W = 1.216;';
      document.getElementById("values").value = data;
      break;

    case 'Di-peptide compositions':
      var data = 'GW = 0.923; GV = 0.464; GT = 0.272; GS = 0.158; GR = 1.0; GQ = 0.467; GP = 0.323; GY = 0.728; GG = 0.0; GF = 0.727; GE = 0.807; GD = 0.776; GC = 0.312; GA = 0.206; GN = 0.381; GM = 0.557; GL = 0.591; GK = 0.894; GI = 0.592; GH = 0.769; ME = 0.879; MD = 0.932; MG = 0.569; MF = 0.182; MA = 0.383; MC = 0.276; MM = 0.0; ML = 0.062; MN = 0.447; MI = 0.058; MH = 0.648; MK = 0.884; MT = 0.358; MW = 0.391; MV = 0.12; MQ = 0.372; MP = 0.285; MS = 0.417; MR = 1.0; MY = 0.255; FP = 0.42; FQ = 0.459; FR = 1.0; FS = 0.548; FT = 0.499; FV = 0.252; FW = 0.207; FY = 0.179; FA = 0.508; FC = 0.405; FD = 0.977; FE = 0.918; FF = 0.0; FG = 0.69; FH = 0.663; FI = 0.128; FK = 0.903; FL = 0.131; FM = 0.169; FN = 0.541; SY = 0.615; SS = 0.0; SR = 1.0; SQ = 0.358; SP = 0.181; SW = 0.827; SV = 0.342; ST = 0.174; SK = 0.883; SI = 0.478; SH = 0.718; SN = 0.289; SM = 0.44; SL = 0.474; SC = 0.185; SA = 0.1; SG = 0.17; SF = 0.622; SE = 0.812; SD = 0.801; YI = 0.23; YH = 0.678; YK = 0.904; YM = 0.268; YL = 0.219; YN = 0.512; YA = 0.587; YC = 0.478; YE = 0.932; YD = 1.0; YG = 0.782; YF = 0.202; YY = 0.0; YQ = 0.404; YP = 0.444; YS = 0.612; YR = 0.995; YT = 0.557; YW = 0.244; YV = 0.328; LF = 0.139; LG = 0.596; LD = 0.944; LE = 0.892; LC = 0.296; LA = 0.405; LN = 0.452; LL = 0.0; LM = 0.062; LK = 0.893; LH = 0.653; LI = 0.013; LV = 0.133; LW = 0.341; LT = 0.397; LR = 1.0; LS = 0.443; LP = 0.309; LQ = 0.376; LY = 0.205; RT = 0.808; RV = 0.914; RW = 1.0; RP = 0.796; RQ = 0.668; RR = 0.0; RS = 0.86; RY = 0.859; RD = 0.305; RE = 0.225; RF = 0.977; RG = 0.928; RA = 0.919; RC = 0.905; RL = 0.92; RM = 0.908; RN = 0.69; RH = 0.498; RI = 0.929; RK = 0.141; VH = 0.649; VI = 0.135; EM = 0.83; EL = 0.854; EN = 0.599; EI = 0.86; EH = 0.406; EK = 0.143; EE = 0.0; ED = 0.133; EG = 0.779; EF = 0.932; EA = 0.79; EC = 0.788; VM = 0.12; EY = 0.837; VN = 0.38; ET = 0.682; EW = 1.0; EV = 0.824; EQ = 0.598; EP = 0.688; ES = 0.726; ER = 0.234; VP = 0.212; VQ = 0.339; VR = 1.0; VT = 0.305; VW = 0.472; KC = 0.871; KA = 0.889; KG = 0.9; KF = 0.957; KE = 0.149; KD = 0.279; KK = 0.0; KI = 0.899; KH = 0.438; KN = 0.667; KM = 0.871; KL = 0.892; KS = 0.825; KR = 0.154; KQ = 0.639; KP = 0.757; KW = 1.0; KV = 0.882; KT = 0.759; KY = 0.848; DN = 0.56; DL = 0.841; DM = 0.819; DK = 0.249; DH = 0.435; DI = 0.847; DF = 0.924; DG = 0.697; DD = 0.0; DE = 0.124; DC = 0.742; DA = 0.729; DY = 0.836; DV = 0.797; DW = 1.0; DT = 0.649; DR = 0.295; DS = 0.667; DP = 0.657; DQ = 0.584; QQ = 0.0; QP = 0.272; QS = 0.461; QR = 1.0; QT = 0.389; QW = 0.831; QV = 0.464; QY = 0.522; QA = 0.512; QC = 0.462; QE = 0.861; QD = 0.903; QG = 0.648; QF = 0.671; QI = 0.532; QH = 0.765; QK = 0.881; QM = 0.505; QL = 0.518; QN = 0.181; WG = 0.829; WF = 0.196; WE = 0.931; WD = 1.0; WC = 0.56; WA = 0.658; WN = 0.631; WM = 0.344; WL = 0.304; WK = 0.892; WI = 0.305; WH = 0.678; WW = 0.0; WV = 0.418; WT = 0.638; WS = 0.689; WR = 0.968; WQ = 0.538; WP = 0.555; WY = 0.204; PR = 1.0; PS = 0.196; PP = 0.0; PQ = 0.228; PV = 0.244; PW = 0.72; PT = 0.161; PY = 0.481; PC = 0.179; PA = 0.22; PF = 0.515; PG = 0.376; PD = 0.852; PE = 0.831; PK = 0.875; PH = 0.696; PI = 0.363; PN = 0.231; PL = 0.357; PM = 0.326; CK = 0.887; CI = 0.304; CH = 0.66; CN = 0.324; CM = 0.277; CL = 0.301; CC = 0.0; CA = 0.114; CG = 0.32; CF = 0.437; CE = 0.838; CD = 0.847; CY = 0.457; CS = 0.176; CR = 1.0; CQ = 0.341; CP = 0.157; CW = 0.639; CV = 0.167; CT = 0.233; IY = 0.213; VA = 0.275; VC = 0.165; VD = 0.9; VE = 0.867; VF = 0.269; VG = 0.471; IQ = 0.383; IP = 0.311; IS = 0.443; IR = 1.0; VL = 0.134; IT = 0.396; IW = 0.339; IV = 0.133; II = 0.0; IH = 0.652; IK = 0.892; VS = 0.322; IM = 0.057; IL = 0.013; VV = 0.0; IN = 0.457; IA = 0.403; VY = 0.31; IC = 0.296; IE = 0.891; ID = 0.942; IG = 0.592; IF = 0.134; HY = 0.821; HR = 0.697; HS = 0.865; HP = 0.777; HQ = 0.716; HV = 0.831; HW = 0.981; HT = 0.834; HK = 0.566; HH = 0.0; HI = 0.848; HN = 0.754; HL = 0.842; HM = 0.825; HC = 0.836; HA = 0.896; HF = 0.907; HG = 1.0; HD = 0.629; HE = 0.547; NH = 0.78; NI = 0.615; NK = 0.891; NL = 0.603; NM = 0.588; NN = 0.0; NA = 0.424; NC = 0.425; ND = 0.838; NE = 0.835; NF = 0.766; NG = 0.512; NY = 0.641; NP = 0.266; NQ = 0.175; NR = 1.0; NS = 0.361; NT = 0.368; NV = 0.503; NW = 0.945; TY = 0.596; TV = 0.345; TW = 0.816; TT = 0.0; TR = 1.0; TS = 0.185; TP = 0.159; TQ = 0.322; TN = 0.315; TL = 0.453; TM = 0.403; TK = 0.866; TH = 0.737; TI = 0.455; TF = 0.604; TG = 0.312; TD = 0.83; TE = 0.812; TC = 0.261; TA = 0.251; AA = 0.0; AC = 0.112; AE = 0.827; AD = 0.819; AG = 0.208; AF = 0.54; AI = 0.407; AH = 0.696; AK = 0.891; AM = 0.379; AL = 0.406; AN = 0.318; AQ = 0.372; AP = 0.191; AS = 0.094; AR = 1.0; AT = 0.22; AW = 0.739; AV = 0.273; AY = 0.552; VK = 0.889;'
      document.getElementById("values").value = data;
      break;
    default:
      if ($("#sequenceType".val == 'Protein')) {
        data = 'A = 0.62; C = 0.29; D = -0.9; E = -0.74;\nF = 1.19; G = 0.48; H = -0.4; I = 1.38;\nK = -1.5; L = 1.06; M = 0.64; N = -0.78;\nP = 0.12; Q = -0.85; R = -2.53; S = -0.18;\nT = -0.05; V = 1.08; W = 0.81; Y = 0.26;\n["@"] = 1.7;';
        document.getElementById("values").value = data;
      }
  }

  document.getElementById("PropObj").value = "EXAMPLE2";
}
