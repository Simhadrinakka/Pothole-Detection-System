let uploaded = document.getElementById("imageUpload")

uploaded.onchange = function(){

let file = uploaded.files[0]

document.getElementById("uploadedImage").src = URL.createObjectURL(file)

}

function detect(){

let potholes = Math.floor(Math.random()*6)+1

document.getElementById("potholeCount").innerText = potholes

document.getElementById("detectedImage").src = document.getElementById("uploadedImage").src

}

function scrollToDetect(){

document.getElementById("detect-section").scrollIntoView({

behavior: "smooth"

});

}