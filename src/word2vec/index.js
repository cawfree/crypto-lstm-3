import { tensor1d, zeros } from "@tensorflow/tfjs";
import { loadModel } from "word2vec";

export const W2V_LENGTH = 300;

// TODO: Throw on no words specified, or if the vector size isn't 300.
// TODO: Needs to be normalized (do this as part of set)
export const words2vec = (getVectors, words) => {
  if (!Array.isArray(words) || words.length === 0) {
    throw new Error(`Expected [String], encountered ${words}.`);
  }
  return getVectors(words)
    .map(({ values }) => values)
    .reduce(
      (a, values) => {
        const { length } = values;
        if (values.length !== W2V_LENGTH) {
          throw new Error(`Expected vectorized length ${W2V_LENGTH}, encountered ${length}.`);
        }
        const b = tensor1d(values);
        const c = a.add(b);
        a.dispose();
        b.dispose();
        return c;
      },
      zeros([W2V_LENGTH]),
    );
};
  
export const prepareModel = () => new Promise(
  (resolve, reject) => loadModel(
    // https://github.com/eyaler/word2vec-slim/blob/master/GoogleNews-vectors-negative300-SLIM.bin.gz?raw=true
    "./public/GoogleNews-vectors-negative300-SLIM.bin",
    (err, model) => ((!!err) && reject(err)) || resolve(model),
  ),
);
