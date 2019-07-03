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
  let singleCompositionMaxDimension = dimension > 60 ? 60 : dimension;
    for (let i = 1; i <= singleCompositionMaxDimension; i++) {
      html += `<img src="R-3.5.3/bin/SingleCompositionImg/Dimension${i}.svg"><br>`;
      html += `<a href="R-3.5.3/bin/SingleCompositionImg/Dimension${i}.svg" download="singleComposition-Dimension${i}.svg">Save</a><br><br>`
      $("#diagram").html(html);
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
