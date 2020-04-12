import { tensor1d, zeros } from "@tensorflow/tfjs";
import { loadModel } from "word2vec";

export const prepareModel = () =>
  new Promise((resolve, reject) =>
    loadModel(
      // https://github.com/eyaler/word2vec-slim/blob/master/GoogleNews-vectors-negative300-SLIM.bin.gz?raw=true
      "./public/GoogleNews-vectors-negative300-SLIM.bin",
      (err, model) => (!!err && reject(err)) || resolve(model)
    )
  );
