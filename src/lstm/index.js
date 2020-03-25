import * as tf from '@tensorflow/tfjs';

const defaultOptions = Object.freeze({
  learningRate: 1e-3,
});

const createModel = () => {
  const model = tf.sequential();
};

// TODO: Need to enforce sample logging
// [sample, numberOfSamplesInWindow, actualSampleSize];
// TODO: Expects that we have a fixed intervals of data.
export const createLstm = async (getVectors, options = defaultOptions) => {
  const {
    learningRate,
    backlogMinutes,
    predictionMinutes,
  } = { ...defaultOptions, ...options };
  //const model = createModel();
  //model.add(
  //  tf.layers.lstm({
  //    // XXX: Windows whose elements are intervals of twitter sentiment.
  //    inputShape: [windowLength, lut.length], 
  //    returnSequences: true,
  //    units: 128,
  // }),
  //);
  //model.add(
  //  tf.layers.lstm({
  //    returnSequences: true,
  //    units: 128,
  // }),
  //);
  //model.add(
  //  tf.layers.lstm({
  //    units: 128,
  // }),
  //);
  //model.add(
  //  tf.layers.dense({ units: 1 }),
  //);

  //model.compile({
  //  optimizer: tf.train.rmsprop(learningRate),
  //  loss: "meanSquaredError",
  //  metrics: ['mae'],
  //});
  return {
    nextEpoch: (data) => {
      const { length: numberOfSegments } = Object.keys(data);
      const maxSegments = (backlogMinutes + predictionMinutes + 1);
      if (numberOfSegments !== maxSegments) {
        throw new Error(`Expected ${maxSegments} segments, encountered ${numberOfSegments}.`);
      }
      console.log('looks good');
    },
    predict: () => null,
  };
};
