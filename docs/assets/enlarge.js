var state=0;
var zInd = 0;
function enlargeImg(img, shift) {
  if (state == 0) {
    state=1;
    img.style.transform = "scale(2.5)";
    img.style.position = "relative";
    img.style.left = shift + "px";
    zInd++;
    img.style.zIndex = String(zInd);
  } else {
    state=0;
    img.style.transform = "scale(1.0)";
    img.style.left = "0px";
  }
}