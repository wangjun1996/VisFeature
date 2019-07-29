// 单击"Example"按钮，在textArea中显示示例序列

function example(sequenceType){
    document.getElementById("FilePathLabel").innerText = 'Example ' + sequenceType + ' Fasta';
    switch (sequenceType) {
        case "DNA":
            exampleDNA();
            break;
        case "RNA":
            exampleRNA();
            break;
        case "Protein":
            exampleProtein();
            break;
    }
}

function exampleDNA(){
    let sequence = ">Example1\nAGTCAGTTATGACATGACAAT\n>Example2\nGAGTATGTCAGTACATAC\n";
    textArea.value = sequence;
    showBackDiv();
    visualization('DNA');
}

function exampleRNA(){
    let sequence = ">Example1\nGCAUCCGGGUUGAGGUAGUAGGUUGUAUGGUUUAGAGUU\n>Example2\nUGUAUGGGCGUAGUAGGUAUCCGGGUUGAGUUUAGA\n";
    textArea.value = sequence;
    showBackDiv();
    visualization('RNA');
}

function exampleProtein(){
    let sequence = ">SEQ_0\nMGDVEKGKKIFIMKCSQCHTVEKGGKHKTGPDTN\n>SEQ_1\nMQIFVKTLTGKTITLEVEPSDTIENVKAKIQ\n";
    textArea.value = sequence;
    showBackDiv();
    visualization('Protein');
}

// 显示TextArea背后的div，实现序列字母上色
function showBackDiv() {
    $("#colorSequence").css("display", "inline");
    $('.textArea').css('-webkit-text-fill-color', 'transparent');
    $('.textArea').css('background-color', 'transparent');
}