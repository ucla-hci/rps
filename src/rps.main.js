var rps = rps || {};

const webcam = new Webcam(document.getElementById("webcam"));

const NUM_CLASSES = 4;

const controllerDataset = new ControllerDataset(NUM_CLASSES);

let mobilenet;
let model;
let isPredicting = false;

async function loadMobilenet() {
  const mobilenet = await tf.loadModel(
    "https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json"
  );

  // Return a model that outputs an internal activation.
  const layer = mobilenet.getLayer("conv_pw_13_relu");
  return tf.model({ inputs: mobilenet.inputs, outputs: layer.output });
}

ui.setExampleHandler(label => {
  tf.tidy(() => {
    const img = webcam.capture();
    controllerDataset.addExample(mobilenet.predict(img), label);

    // Draw the preview thumbnail.
    ui.drawThumb(img, label);
  });
});

rps.train = async () => {
  if (controllerDataset.xs == null) {
    throw new Error("Add some examples before training!");
  }

  model = tf.sequential({
    layers: [
      tf.layers.flatten({ inputShape: [7, 7, 256] }),
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

  const optimizer = tf.train.adam(0.0001);
  // const optimizer = tf.train.adam(ui.getLearningRate());
  model.compile({ optimizer: optimizer, loss: "categoricalCrossentropy" });

  const batchSize = Math.floor(
    // controllerDataset.xs.shape[0] * ui.getBatchSizeFraction()
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
    epochs: 20, //ui.getEpochs(),
    callbacks: {
      onBatchEnd: async (batch, logs) => {
        console.info("Loss: " + logs.loss.toFixed(5));
      }
    }
  });
};

rps.predict = async () => {
  while (!ui.isPaused) {
    const predictedClass = tf.tidy(() => {
      const img = webcam.capture();
      const activation = mobilenet.predict(img);
      const predictions = model.predict(activation);
      return predictions.as1D().argMax();
    });

    const classId = (await predictedClass.data())[0];
    predictedClass.dispose();

    if (classId < 3) {
      ui.isPaused = true;
      ui.judgePlay(classId);
    }
  }
};

async function init() {
  ui.init();

  try {
    await webcam.setup();
  } catch (e) {
    console.error("webcam setup error!");
  }
  mobilenet = await loadMobilenet();

  tf.tidy(() => mobilenet.predict(webcam.capture()));
}

// Initialize the application.
init();
