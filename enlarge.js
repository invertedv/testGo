<script>
    var state=0;
    function enlargeImg(x) {

    var text1 = "image".concat(String(x));
    img = document.getElementById(text1);
    if (state == 0) {
    state = 1;
    // Set image size to 1.5 times original
    img.style.transform = "scale(1.5)";
    // Animation effect
    img.style.transition = "transform 0.25s ease"
} else {
    state = 0;
    img.style.transform = "scale(1)";
    img.style.transition = "transform 0.25s ease";
}}
    // Function to reset image size
    function resetImg() {
    // Set image size to original
}
</script>
