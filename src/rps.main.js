//////////////////////////////////////////////////////////////////////////////////////////
//
//  rock-paper-scissors with the computer
//
//  main functions with tensorflow components
//  for an up-to-date reference: https://js.tensorflow.org/tutorials/webcam-transfer-learning.html
//
//  v1.1 xac@ucla.edu, 04/2021
//
//////////////////////////////////////////////////////////////////////////////////////////

var rps = rps || {};

const webcam = new Webcam(document.getElementById("webcam"));
const NUM_CLASSES = 4;
const controllerDataset = new ControllerDataset(NUM_CLASSES);

let mobilenet;
let model;
let isPredicting = false;

//
//  load mobilenet -- a pre-trained model
//
async function loadMobilenet() {
  // loading a pretrained model
  const mobilenet = await tf.loadModel(
    "https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json"
  );

  // Return a model that outputs an internal activation.
  const layer = mobilenet.getLayer("conv_pw_13_relu");
  return tf.model({
    inputs: mobilenet.inputs,
    outputs: layer.output
  });
}

//
// ui to show training data as thumbnails
//
ui.setExampleHandler(label => {
  tf.tidy(() => {
    const img = webcam.capture();
    controllerDataset.addExample(mobilenet.predict(img), label);

    // Draw the preview thumbnail.
    ui.drawThumb(img, label);
  });
});

//
//  train collected example using tensorflow
//
rps.train = async () => {
  if (controllerDataset.xs == null) {
    ui.updateStatus("Add examples first!");
    throw new Error("Add some examples before training!");
  }

  model = tf.sequential({
    layers: [
      tf.layers.flatten({
        inputShape: [7, 7, 256]
      }),
      // Layer 1
      tf.layers.dense({
        units: 100, //ui.getDenseUnits(),
        activation: "relu",
        kernelInitializer: "varianceScaling",
        useBias: true
      }),
      // Layer 2. The number of units of the last layer should correspond
      // to the number of classes we want to predict.
      tf.layers.dense({
        units: NUM_CLASSES,
        kernelInitializer: "varianceScaling",
        useBias: false,
        activation: "softmax"
      })
    ]
  });

  // Adam Optimizer https://js.tensorflow.org/api/latest/#train.adam to optimize the parameters of the network
  // learning rate: 0.0001
  const optimizer = tf.train.adam(0.0001);
  model.compile({
    optimizer: optimizer,
    loss: "categoricalCrossentropy"
  });

  const batchSize = Math.floor(
    // batch size fraction: 0.4 (a fraction of the input data x's 1st dimension)
    controllerDataset.xs.shape[0] * 0.4
  );
  if (!(batchSize > 0)) {
    throw new Error(
      `Batch size is 0 or NaN. Please choose a non-zero fraction.`
    );
  }

  // Train the model! Model.fit() will shuffle xs & ys so we don't have to.
  model.fit(controllerDataset.xs, controllerDataset.ys, {
    batchSize,
    epochs: 20, 
    callbacks: {
      onBatchEnd: async (batch, logs) => {
        console.info("Loss: " + logs.loss.toFixed(5));
      }
    }
  });
};

//
//  continuously predicting labels based on camera feed
//
rps.predict = async () => {
  // if mobilenet is not loaded
  if (mobilenet == undefined) {
    ui.isPaused = true;
    ui.updateStatus("Mobilenet not loaded!");
    return;
  }

  // if the model has not been trained
  if (model == undefined) {
    ui.isPaused = true;
    ui.updateStatus("Train a model first!");
    return;
  }

  // keep predicting until rock, paper or scissors occurs
  while (!ui.isPaused) {
    const predictedClass = tf.tidy(() => {
      const img = webcam.capture();
      const activation = mobilenet.predict(img);
      const predictions = model.predict(activation);
      return predictions.as1D().argMax();
    });

    const classId = (await predictedClass.data())[0];
    predictedClass.dispose();

    // some play happens
    if (classId < 3) {
      ui.isPaused = true;
      ui.judgePlay(classId);
    }
  }
};

//
//  initialize the system
//
async function init() {
  ui.init();

  ui.updateStatus("Setting up webcam ...");
  try {
    await webcam.setup();
  } catch (e) {
    console.error("webcam setup error!");
  }

  ui.updateStatus("Loading Mobilenet ...");
  mobilenet = await loadMobilenet();

  ui.updateStatus("Getting ready ...");
  tf.tidy(() => mobilenet.predict(webcam.capture()));

  ui.updateStatus("Ready now.");
}

init();