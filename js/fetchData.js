function fetchData() {
    Initialization();
    if ($("#seqType").val() == "Uniprot") {
        switch ($("#fetchMethod").val()) {
            case 'ID':
                if ($("#fetchTextArea").val().length == 0) {
                    nullTextError("Please input identifiers or entry names!");
                    break;
                }
                let idArr = $("#fetchTextArea").val().split(",");
                $("#priority").val() == "speedPriority" ? getDataByIdAsync(idArr, "Protein") : getDataById(idArr, "Protein");
                break;

            case 'Query':
                if ($("#fetchTextArea").val().length == 0) {
                    nullTextError("Please input query!");
                    break;
                }
                getDataByQuery("https://www.uniprot.org/uniprot/?query=" + $("#fetchTextArea").val());
                break;
        }
    }
    else {
        switch ($("#fetchMethod").val()) {
            case 'ID':
                if ($("#fetchTextArea").val().length == 0) {
                    nullTextError("Please input GI numbers or accession.version identifiers!");
                    break;
                }
                let idArr = $("#fetchTextArea").val().split(",");
                $("#priority").val() == "speedPriority" ? getDataByIdAsync(idArr, "DNA/RNA") : getDataById(idArr, "DNA/RNA");
                break;

            case 'Query':
                if ($("#fetchTextArea").val().length == 0) {
                    nullTextError("Please input query!");
                    break;
                }
                getDataByQuery("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?" + $("#fetchTextArea").val());
                break;
        }
    }

    // 若fetchTextArea的值为空，则显示nullTextFlag
    if ($("#nullTextFlag").text().length > 0)
        controlShowOrHide("nullTextFlag", "table-row");

    // 若不存在错误，则显示tr-fetchResult
    if ($("#networkErrorFlag").css("display") == "none" && $("#nullTextFlag").css("display") == "none") {
        // window.resizeTo(800,620);
        controlShowOrHide("tr-fetchResult", "table-row");
    }
}

// 当fetchTextArea的值为空时进行提示
function nullTextError(errorMessage) {
    $("#nullTextFlag").text(errorMessage);
    $("#fetchTextArea").focus();
}

// 初始化
function Initialization() {
    controlShowOrHide("tr-fetchResult", "none");
    controlShowOrHide("networkErrorFlag", "none");
    controlShowOrHide("nullTextFlag", "none");
    $("#fetchResultTextArea").val("");
    $("#networkErrorFlag").text("");
    $("#nullTextFlag").text("");
    $("#invalidId").text("");
}

// （同步）使用ID获取Protein数据
function getDataById(arr, seqType) {
    controlShowOrHide("loadingFlag", "inline");
    controlShowOrHide("loadingGif", "inline");
    let fetchResult = document.getElementById("fetchResultTextArea");
    let invalidId = document.getElementById("invalidId");
    // let result = "";
    let urlString = "";
    invalidId.innerHTML = "Invalid identifiers: none";
    for (let i = 0; i < arr.length; i++) {
        if (seqType == "Protein") {
            urlString = 'https://www.uniprot.org/uniprot/' + arr[i] + '.fasta';
        }
        else {
            urlString = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?rettype=fasta&retmode=text&db=nucleotide&id=' + arr[i];
            sleep(500); // ncbi限制每秒的请求数不超过3个
        }
        $.ajax({
            type: "GET",
            async: false,   // async: false, 多个请求同步：序列顺序正确; 多个请求异步：序列顺序与输入可能不符合
            timeout: 300000,
            url: urlString,
            headers: { Email: "wj0708@tju.edu.cn", Tool: "VisFeature" },
            success: function (data) {
                fetchResult.value += data;
            },
            error: function (XMLHttpRequest, textStatus, errorThrown) {
                if (XMLHttpRequest.readyState == 0) {   // 网络不正常
                    networkError();
                }
                else {
                    invalidId.innerHTML = invalidId.innerHTML.replace("none", "");
                    invalidId.innerHTML += '"' + arr[i] + '"' + " ";
                }
            },
            complete: function (XMLHttpRequest, textStatus) {
                if (i == arr.length - 1) {
                    controlShowOrHide("loadingFlag", "none");
                    controlShowOrHide("loadingGif", "none");
                }
            }
        });
    }
}

// （异步）使用ID获取Protein数据
function getDataByIdAsync(arr, seqType) {
    controlShowOrHide("loadingFlag", "inline");
    controlShowOrHide("loadingGif", "inline");
    let fetchResult = document.getElementById("fetchResultTextArea");
    let invalidId = document.getElementById("invalidId");
    let urlString = "";
    invalidId.innerHTML = "Invalid identifiers: none";
    for (let i = 0; i < arr.length; i++) {
        if (seqType == "Protein") {
            urlString = 'https://www.uniprot.org/uniprot/' + arr[i] + '.fasta';
        }
        else {
            urlString = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?rettype=fasta&retmode=text&db=nucleotide&id=' + arr[i];
            sleep(600); // ncbi限制每秒的请求数不超过3个
        }
        $.ajax({
            type: "GET",
            timeout: 300000,
            url: urlString,
            headers: { Email: "wj0708@tju.edu.cn", Tool: "VisFeature" },
            success: function (data) {
                fetchResult.value += data;
            },
            error: function (XMLHttpRequest, textStatus, errorThrown) {
                if (XMLHttpRequest.readyState == 0) {   // 网络不正常
                    networkError();
                }
                else {
                    invalidId.innerHTML = invalidId.innerHTML.replace("none", "");
                    invalidId.innerHTML += '"' + arr[i] + '"' + " ";
                }
            },
            complete: function (XMLHttpRequest, textStatus) {
                if (i == arr.length - 1) {
                    controlShowOrHide("loadingFlag", "none");
                    controlShowOrHide("loadingGif", "none");
                }
            }
        });
    }
}

// 使程序暂停d毫秒
function sleep(d) {
    for (var t = Date.now(); Date.now() - t <= d;);
}

// 使用Query获取Protein/DNA/RNA数据
function getDataByQuery(query) {
    controlShowOrHide("loadingFlag", "inline");
    controlShowOrHide("loadingGif", "inline");
    let fetchResult = document.getElementById("fetchResultTextArea");
    fetchResult.value = "";
    $.ajax({
        type: "GET",
        timeout: 300000,
        url: query,
        headers: { Email: "wj0708@tju.edu.cn", Tool: "VisFeature" },
        success: function (data) {
            fetchResult.value = data;
        },
        error: function (XMLHttpRequest, textStatus, errorThrown) {
            if (XMLHttpRequest.readyState == 0) // 网络不正常
                networkError();
            else
                alert(textStatus);
        },
        complete: function (XMLHttpRequest, textStatus) {
            controlShowOrHide("loadingFlag", "none");
            controlShowOrHide("loadingGif", "none");
        }
    });
}

// 网络不正常时进行提示
function networkError() {
    controlShowOrHide("tr-fetchResult", "none");
    controlShowOrHide("networkErrorFlag", "table-row");
    $("#networkErrorFlag").text("Network error or request timeout, please try again.");
}

function changeMethod() {
    $("#fetchTextArea").val("");
    if ($("#seqType").val() == "Uniprot") {
        switch ($("#fetchMethod").val()) {
            case 'ID':
                $("#fetchLabel").html("Input the identifiers or entry names of the sequence that you want to fetch:" + "<br>" + "( separated by commas )");
                controlShowOrHide("tr-priority", "table-row");
                controlShowOrHide("tr-time", "table-row");
                break;
            case 'Query':
                $("#fetchLabel").html("Input the query that you want to fetch:");
                controlShowOrHide("tr-priority", "none");
                controlShowOrHide("tr-time", "none");
                break;
        }
    }
    else {
        switch ($("#fetchMethod").val()) {
            case 'ID':
                $("#fetchLabel").html("Input the id of the sequence that you want to fetch:" + "<br>" + "( separated by commas )");
                controlShowOrHide("tr-priority", "table-row");
                controlShowOrHide("tr-time", "table-row");
                break;
            case 'Query':
                $("#fetchLabel").html("Input the query that you want to fetch:");
                controlShowOrHide("tr-priority", "none");
                controlShowOrHide("tr-time", "none");
                break;
        }
    }
}

function changeSeqType() {
    $("#timeLabel").html("0");
    $("#fetchTextArea").val("");
    if ($("#seqType").val() == "Uniprot") {
        $("#fetchMethod").html('<option value="ID">Identifier / Entry name</option><option value="Query">Query expression</option>');
        switch ($("#fetchMethod").val()) {
            case 'ID':
                $("#fetchLabel").html("Input the identifiers or entry names of the sequence that you want to fetch:" + "<br>" + "( separated by commas )");
                controlShowOrHide("tr-priority", "table-row");
                controlShowOrHide("tr-time", "table-row");
                break;
            case 'Query':
                $("#fetchLabel").html("Input the query that you want to fetch:");
                controlShowOrHide("tr-priority", "none");
                controlShowOrHide("tr-time", "none");
                break;
        }
    }
    else {
        $("#fetchMethod").html('<option value="ID">GI number / Accession.version identifier</option><option value="Query">Query expression</option>');
        switch ($("#fetchMethod").val()) {
            case 'ID':
                $("#fetchLabel").html("Input the GI numbers or accession.version identifiers of the sequence that you want to fetch:" + "<br>" + "( separated by commas )");
                controlShowOrHide("tr-priority", "table-row");
                controlShowOrHide("tr-time", "table-row");
                break;
            case 'Query':
                $("#fetchLabel").html("Input the query that you want to fetch:");
                controlShowOrHide("tr-priority", "none");
                controlShowOrHide("tr-time", "none");
                break;
        }
    }
}

// 改变控件的状态：显示/隐藏。controlId:控件ID, status：状态
function controlShowOrHide(controlId, status) {
    let control = document.getElementById(controlId);
    control.style.display = status;
}

// 生成示例参数
function exampleParameter() {
    if ($("#seqType").val() == "Uniprot") {
        switch ($("#fetchMethod").val()) {
            case 'ID':
                $("#fetchTextArea").val("P99999,P12345,P62979,P62258,ALBU_HUMAN");
                let seqArr = $("#fetchTextArea").val().split(",");
                $("#priority").val() == "speedPriority" ? $("#timeLabel").html((seqArr.length / 10).toFixed(2)) : $("#timeLabel").html((seqArr.length / 3).toFixed(2));
                break;
            case 'Query':
                $("#fetchTextArea").val("organism:9606+AND+antigen&format=fasta&limit=500");
                break;
        }
    }
    else {
        switch ($("#fetchMethod").val()) {
            case 'ID':
                $("#fetchTextArea").val("28864546,28800981,AABR02115360.1");
                let seqArr = $("#fetchTextArea").val().split(",");
                $("#priority").val() == "speedPriority" ? $("#timeLabel").html((seqArr.length / 1.6).toFixed(2)) : $("#timeLabel").html((seqArr.length / 1.2).toFixed(2));

                break;
            case 'Query':
                $("#fetchTextArea").val("db=nuccore&id=21614549&strand=1&seq_start=1&seq_stop=500&rettype=fasta&retmode=text");
                break;
        }
    }
    $("#invalidId").text("");
    controlShowOrHide("tr-fetchResult", "none");
    controlShowOrHide("networkErrorFlag", "none");
    controlShowOrHide("nullTextFlag", "none");
}

// 重置参数
function resetParameter() {
    $("#fetchTextArea").val("");
    $("#invalidId").text("");
    $("#timeLabel").html("0");
    controlShowOrHide("tr-fetchResult", "none");
    controlShowOrHide("networkErrorFlag", "none");
    controlShowOrHide("nullTextFlag", "none");
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

function changePriority() {
    let seqArr = $("#fetchTextArea").val().split(",");
    if ($("#fetchTextArea").val() == "")
        $("#timeLabel").html("0");
    else {
        switch ($("#seqType").val()) {
            case 'Uniprot':
                switch ($("#priority").val()) {
                    case 'speedPriority':
                        $("#timeLabel").html((seqArr.length / 10).toFixed(2));
                        break;
                    case 'orderPriority':
                        $("#timeLabel").html((seqArr.length / 3).toFixed(2));
                        break;
                }
                break;
            case 'GenBank':
                switch ($("#priority").val()) {
                    case 'speedPriority':
                        $("#timeLabel").html((seqArr.length / 1.6).toFixed(2));
                        break;
                    case 'orderPriority':
                        $("#timeLabel").html((seqArr.length / 1.2).toFixed(2));
                        break;
                }
                break;
        }
    }
}

// 关于Fetch Priority的提示
function explainFetchPriority() {
    alert('There are two options in "Fetch priority". They are "Speed priority" and "Order priority".\n(1) If you select “Speed priority”, this will make speed of fetch faster. There is no guarantee that the order of sequences of fetch result will be the same as the order of input.\n(2) If you select "Order priority", the order of sequences of fetch result will be the same as the order of input, but this result in a slower speed than "Speed priority".');
}

// 关于Fetch Input的提示
function explainFetchInput() {
    alert('The following resources may be useful when you write query expression. \nHow to fetch data by Uniprot API : https://www.uniprot.org/help/api \nHow to fetch data by NCBI API : https://www.ncbi.nlm.nih.gov/home/develop/api/');
}

// 保存抓取到的数据到本地
function saveData() {
    if ($("#fetchResultTextArea").val().length != 0) {
        const remote = require('electron').remote;
        const file = remote.dialog.showSaveDialog(remote.getCurrentWindow(), {
            filters: [
                { name: 'Fasta format', extensions: ['fas'] },
                { name: 'Text format', extensions: ['txt'] }]
        });
        if (file) {
            saveText($("#fetchResultTextArea").val(), file);
        }
    }
    else{
        alert("Save failed : The result of the fetch is empty. Please fetch first and then save it.");
    }
}

//保存文本内容到文件(同步)
function saveText(text, file) {
    const fs = require('fs');
    fs.writeFileSync(file, text);
    alert("Save successfully.\nLocation: " + file);
}



