import * as tf from '@tensorflow/tfjs';
import { mean, stdev } from "stats-lite";

const defaultOptions = Object.freeze({
  learningRate: 1e-3,
});

const stats = inputs => [mean(inputs), stdev(inputs)];

const scaleFeatures = (data, mean, std) => {
  const i = 1 / (std || 1);
  return new Float32Array(data.map(e => (e - mean) * i));
};

const sumAndNormalize = (arrayOfData) => {
  const t = arrayOfData
    .map(values => tf.tensor1d(values))
    .reduce(
      (t, v) => {
        const a = t.add(v);
        t.dispose();
        v.dispose();
        return a;
      },
      tf.zeros([300]),
    );
  const [...rawData] = t.dataSync();
  t.dispose();
  const [mean, std] = stats(rawData);
  return scaleFeatures(rawData, mean, std);
};

export const createSegment = (getVectors, stimuli) => {
  const { words: bagOfWords } = stimuli;
  const normals = bagOfWords
    .map(([...words]) => sumAndNormalize(getVectors(words).map(({ values }) => values)));
  return tf.tensor1d(sumAndNormalize(normals));
};

const createSeries = data => Object.entries(data)
  .map(([k, v]) => [Number.parseInt(k), v])
  .sort(([t1], [t2]) => (t1 - t2))
  .map(([_, data]) => data);

const seriesToTensor = (series, getVectors, backlogMinutes) => {
  const segments = [...Array(backlogMinutes)]
    .map((_, i) => createSegment(getVectors, series[i]));
  return tf.stack([tf.stack(segments)]);
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

  const model = tf.sequential();
  model.add(
    tf.layers.lstm({
      // XXX: Windows whose elements are intervals of twitter sentiment.
      inputShape: [backlogMinutes, 300], 
      returnSequences: true,
      units: 128,
   }),
  );
  model.add(
    tf.layers.lstm({
      returnSequences: true,
      units: 128,
   }),
  );
  model.add(
    tf.layers.lstm({
      units: 128,
   }),
  );
  model.add(
    tf.layers.dense({ units: 1 }),
  );

  model.compile({
    optimizer: tf.train.rmsprop(learningRate),
    loss: "meanSquaredError",
    metrics: ['mae'],
  });

  return {
    nextEpoch: async (data) => {
      const { length: numberOfSegments } = Object.keys(data);
      const maxSegments = (backlogMinutes + predictionMinutes);

      if (numberOfSegments !== maxSegments) {
        throw new Error(`Expected ${maxSegments} segments, encountered ${numberOfSegments}.`);
      }

      const [...series] = createSeries(data);
      const { length: len, [0]: { prices: [o] }, [len - 1]: { prices: [_, h, l, c] } } = series;

      // XXX: Compute the total relative change in price for the prediction period.
      const dp = (c - o) / o;
      const xs = seriesToTensor(series, getVectors, backlogMinutes);
      const ys = tf.stack([tf.tensor1d(new Float32Array([dp]))]);

      // XXX: Fit the model against the new sample data.
      await model.fit(xs, ys, { epochs: 1 });

      xs.dispose();
      ys.dispose();
    },
    predict: async (data) => {
      const [...series] = createSeries(data);
      const xs = seriesToTensor(series, getVectors, backlogMinutes);
      const ys = model.predict(xs);
      const [...results] = ys.dataSync();
      xs.dispose();
      ys.dispose();
      return results;
    },
  };
};
