//////////////////////////////////////////////////////////////////////////////////////////
//
//  rock-paper-scissors with the computer
//
//  main functions with tensorflow components
//  ref: https://js.tensorflow.org/tutorials/webcam-transfer-learning.html
//
//  xac@ucla.edu, 09/2018
//
//////////////////////////////////////////////////////////////////////////////////////////

var rps = rps || {};

let ui = {};

const RPS = ["rock", "paper", "scissors", "none"];

rps.totals = [0, 0, 0, 0];
rps.thumbDisplayed = {};

//
//  initialize ui
//
ui.init = function() {
  ui.isPaused = true;
  ui.idxPlay = ((Math.random() * 97) | 0) % 3;
  $("#imgPlay").attr("src", "./assets/" + RPS[ui.idxPlay] + ".png");

  // video to show camera images
  let posInfo = $("video")
    .parent()[0]
    .getBoundingClientRect();
  let width = posInfo.width;
  let height = posInfo.height;

  // train button
  $("#btnTrain").button();
  $("#btnTrain").click(ui.onTrain);

  // play button
  $("#btnPlay").button();
  $("#btnPlay").click(ui.onPlay);

  // buttons for each trained label
  $("#btnRock").button();
  $("#btnRock").on("mousedown", () => ui.collectExamples(0));
  $("#btnRock").on("mouseup", () => (ui.isMouseDown = false));

  $("#btnPaper").button();
  $("#btnPaper").on("mousedown", () => ui.collectExamples(1));
  $("#btnPaper").on("mouseup", () => (ui.isMouseDown = false));

  $("#btnScissors").button();
  $("#btnScissors").on("mousedown", () => ui.collectExamples(2));
  $("#btnScissors").on("mouseup", () => (ui.isMouseDown = false));

  $("#btnNone").button();
  $("#btnNone").on("mousedown", () => ui.collectExamples(3));
  $("#btnNone").on("mouseup", () => (ui.isMouseDown = false));
};

ui.updateComputerPlay = () => {
  if (ui.isPaused) return;
  ui.idxPlay = (ui.idxPlay + 1) % 3 || ((Math.random() * 97) | 0) % 3;
  $("#imgPlay").attr("src", "./assets/" + RPS[ui.idxPlay] + ".png");
  if (ui.isPaused) return;
  setTimeout(ui.updateComputerPlay, 100);
};

//
//  handler for train button
//
ui.onTrain = e => {
  rps.train();
};

//
//  handler for play button
//
ui.onPlay = e => {
  $("#spanStatus").html("");
  if (ui.isPaused) {
    ui.isPaused = false;
    ui.updateComputerPlay();
    rps.predict();
  } else {
    ui.isPaused = true;
  }
};

//
//  set which handler will collect examples
//
ui.setExampleHandler = handler => {
  ui.addExampleHandler = handler;
};

//
//  collect examples for each label
//
ui.collectExamples = async label => {
  ui.isMouseDown = true;
  const className = RPS[label];
  const button = document.getElementById(className);
  const total = $("#" + className + "-total");
  while (ui.isMouseDown) {
    ui.addExampleHandler(label);
    rps.dataActive = true;
    total.html(rps.totals[label]++);
    await tf.nextFrame();
  }
  rps.dataActive = false;
};

//
//  drawing a thumbnail on the button
//
ui.drawThumb = (img, label) => {
  if (rps.thumbDisplayed[label] == null) {
    const thumbCanvas = $("#" + RPS[label] + "-thumb")[0];
    ui.draw(img, 96, 96, thumbCanvas);
  }
};

//
//  draw a camera image on the main canvas
//
ui.draw = (image, w, h, canvas) => {
  const [width, height] = [224, 224];
  const ctx = canvas.getContext("2d");
  const imageData = new ImageData(width, height);
  const data = image.dataSync();
  for (let i = 0; i < height * width; ++i) {
    const j = i * 4;
    imageData.data[j + 0] = (data[i * 3 + 0] + 1) * 127;
    imageData.data[j + 1] = (data[i * 3 + 1] + 1) * 127;
    imageData.data[j + 2] = (data[i * 3 + 2] + 1) * 127;
    imageData.data[j + 3] = 255;
  }
  ctx.putImageData(imageData, 0, 0);
};

//
//  judge who wins
//
ui.judgePlay = classId => {
  console.log("you: " + RPS[classId] + "; computer: " + RPS[ui.idxPlay]);
  let result;
  if (ui.idxPlay == classId) {
    result = "Tie";
  } else if ((ui.idxPlay + 1) % 3 == classId) {
    result = "You win!";
  } else {
    result = "You lose!";
  }
  $("#spanStatus").html(result);
};

//
//  update game status
//
ui.updateStatus = (msg) => {
  $('#spanStatus').html(msg);
}
