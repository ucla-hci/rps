var rps = rps || {};
let ui = {};

const RPS = ["rock", "paper", "scissors", "none"];

rps.totals = [0, 0, 0, 0];
rps.thumbDisplayed = {};

ui.init = function() {
  ui.isPaused = true;
  ui.idxPlay = ((Math.random() * 97) | 0) % 3;
  $("#imgPlay").attr("src", "./assets/" + RPS[ui.idxPlay] + ".png");

  // video
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

  $("#btnRock").button();
  $("#btnRock").on("mousedown", () => ui.handler(0));
  $("#btnRock").on("mouseup", () => (ui.isMouseDown = false));

  $("#btnPaper").button();
  $("#btnPaper").on("mousedown", () => ui.handler(1));
  $("#btnPaper").on("mouseup", () => (ui.isMouseDown = false));

  $("#btnScissors").button();
  $("#btnScissors").on("mousedown", () => ui.handler(2));
  $("#btnScissors").on("mouseup", () => (ui.isMouseDown = false));

  $("#btnNone").button();
  $("#btnNone").on("mousedown", () => ui.handler(3));
  $("#btnNone").on("mouseup", () => (ui.isMouseDown = false));
};

ui.updateComputerPlay = () => {
  if (ui.isPaused) return;
  ui.idxPlay = (ui.idxPlay + 1) % 3 || ((Math.random() * 97) | 0) % 3;
  $("#imgPlay").attr("src", "./assets/" + RPS[ui.idxPlay] + ".png");
  if (ui.isPaused) return;
  setTimeout(ui.updateComputerPlay, 100);
};

ui.onTrain = e => {
  rps.train();
};

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

ui.countDown = e => {
  $("#divCountdown").html(ui.counter--);
  if (ui.counter > 0) {
    setTimeout(() => {
      ui.countDown();
    }, 500);
  } else {
    $("#divCountdown").fadeOut(250);
    setTimeout(function() {
      rps.predict();
    }, 500);
  }
};

ui.setExampleHandler = handler => {
  ui.addExampleHandler = handler;
};

ui.handler = async label => {
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

ui.collectImages = e => {
  console.log($(e.currentTarget).attr("label"));
};

ui.drawThumb = (img, label) => {
  if (rps.thumbDisplayed[label] == null) {
    const thumbCanvas = $("#" + RPS[label] + "-thumb")[0];
    ui.draw(img, 96, 96, thumbCanvas);
  }
};

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

ui.judgePlay = classId => {
  console.log("you: " + RPS[classId] + "; computer: " + RPS[ui.idxPlay]);
  // compPlay = ui.computerPlay();
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

ui.computerPlay = () => {
  // let idxPlay = ((Math.random() * 97) | 0) % 3;
  console.info(RPS[idxPlay]);
  // $("#imgPlay").show();
  // $("#imgPlay").attr("src", "./assets/" + RPS[idxPlay] + ".png");
  return idxPlay;
};
