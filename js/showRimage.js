function changeRmode() {
  switch ($("#Rmode").val()) {
    case "single":
      showSingleCompositionImg();
      break;

    case "multiple":
      showMultipleCompositionImg();
      break;
  }
}

// 显示单组分情况下的R图片
function showSingleCompositionImg() {
  let html = "";
  if(seqType == "Protein"){
    if (dimension != 20) {
      for (let i = 1; i <= dimension; i++) {
        html += `<img src="R-3.5.3/bin/SingleCompositionImg/Dimension${i}.svg"><br>`;
        html += `<a href="R-3.5.3/bin/SingleCompositionImg/Dimension${i}.svg" download="singleComposition-Dimension${i}.svg">Save</a><br><br>`
        $("#diagram").html(html);
      }
    }
    else {
      let arr = ['A', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'V', 'W', 'Y'];
      for (let j = 0; j < 20; j++) {
        html += `<img src="R-3.5.3/bin/SingleCompositionImg/${arr[j]}.svg"><br>`;
        html += `<a href="R-3.5.3/bin/SingleCompositionImg/${arr[j]}.svg" download="singleComposition-${arr[j]}.svg">Save</a><br><br>`
        $("#diagram").html(html);
      }
    }
  }
  else{
    for (let i = 1; i <= dimension; i++) {
      html += `<img src="R-3.5.3/bin/SingleCompositionImg/Dimension${i}.svg"><br>`;
      html += `<a href="R-3.5.3/bin/SingleCompositionImg/Dimension${i}.svg" download="singleComposition-Dimension${i}.svg">Save</a><br><br>`
      $("#diagram").html(html);
    }
  }

}

// 显示多组分情况下的R图片
function showMultipleCompositionImg() {
  let html = "";
  html += '<br>Display chart by colomn: <a href="R-3.5.3/bin/MultipleCompositionImg/multipleComposition1.svg" download="multipleCompositions-colomn.svg">Save</a><br>';
  html += '<img src="R-3.5.3/bin/MultipleCompositionImg/multipleComposition1.svg"><br><br>';
  html += 'Display chart by row: <a href="R-3.5.3/bin/MultipleCompositionImg/multipleComposition2.svg" download="multipleCompositions-row.svg">Save</a><br>';
  html += '<img src="R-3.5.3/bin/MultipleCompositionImg/multipleComposition2.svg"><br><br>';
  $("#diagram").html(html);
}