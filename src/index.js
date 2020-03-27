import { config as dotenv } from "dotenv";
import moment from "moment";

dotenv();

import { createBacklog, mergeBacklogs, getBounds, getBetween, ensureSequential } from "./backlog";
import { createLstm } from "./lstm";
import { createSync } from "./price";
import { createClient, toSingleLine, toWords } from "./twitter";
import { prepareModel } from "./word2vec";

const {
  TWITTER_CONSUMER_KEY: consumer_key,
  TWITTER_CONSUMER_SECRET: consumer_secret,
  TWITTER_ACCESS_TOKEN_KEY: access_token_key,
  TWITTER_ACCESS_TOKEN_SECRET: access_token_secret,
} = process.env;

const forceMinutes = t => (
  moment(t).startOf("minute").toDate().getTime()
);

const roundToMinute = t => Math.ceil(t / (60 * 1000)) * 60 * 1000;
      
(async () => {
  // to generate a prediction, we will use backlogMinutes of data
  const backlogMinutes = 30;
  // the amount of minutes into the future we will be predicting
  const predictionMinutes = 30;

  // this implies that we need to cut off the top 5 (full) minutes to make a prediction
  // it also implies that we need at least (5 + 30) *valid* minutes of time data to start training (5 minutes predicts the first 30 minute input)
  
  const { push: pushPrice, get: getPrice, discard: discardPrice } = await createBacklog(false, "(Number, Number, Number, Number)");
  const { push: pushMerge, get: getMerge, discard: discardMerge } = await createBacklog(false, "{prices:(Number,Number,Number,Number),words:[[String]]}");
  const { push: pushWords, get: getWords, discard: discardWords } = await createBacklog(true, "[String]");
  const { getVectors } = await prepareModel();
  const { predict, nextEpoch } = await createLstm(
    getVectors,
    { backlogMinutes, predictionMinutes },
  );
  const { subscribeTo } = await createClient(
    {
      consumer_key,
      consumer_secret,
      access_token_key,
      access_token_secret,
    },
  );
  const processHashtag = () => ({ text, created_at: created }) => {
    const words = toWords(toSingleLine(text));
    if (words.length > 0) {
      return pushWords(forceMinutes((created)), words);
    }
    return undefined;
  };
  await createSync(
    "BTC",
    async (values, meta) => {
      values.map(([t, ...ohlc]) => pushPrice(
        // XXX: Coerce to nearest minute. (Price data can deviate.)
        forceMinutes(roundToMinute(t)),
        ohlc,
      ));

      Object.entries(mergeBacklogs({ prices: getPrice, words: getWords }))
        .map(([t, v]) => pushMerge(Number.parseInt(t), v));

      // The minium and maximum are for *sequential* data only. Any non-sequential data is discarded.
      const { min, max } = await getBounds(getMerge);
      // XXX: The amount of data we've got in the buffer allows us to make a prediction
      //      into the future.
      // XXX: We use +1 minute so that we have a minute of previous information to enter the frame with (this aids comparison).
      const dt = (backlogMinutes + predictionMinutes) * 60 * 1000;
      // XXX: Checking for exact bounds causes range errors.
      if (max >= (min + dt)) {
        // XXX: getBetween is inclusive, so we include the top-most data.
        const data = getBetween(getMerge, min, min + dt);
        const { length: numberOfSegments } = Object.entries(data);

        // XXX: Train the network.
        await nextEpoch(data);
        // XXX:  Here, discard all of the data we would have processed within this frame.
        //       We **do not** however throw away the most recent entry, since this will
        //       serve as the reference input for the next frame. This is possible because 
        //       discardPrice is not min-inclusive. We also throw away the samples we
        //       haven't directly trained against; these just get used as reference sets
        //       for making predictions.
        await discardPrice(min + (backlogMinutes * 60 * 1000));
        await discardMerge(min + (backlogMinutes * 60 * 1000));
        await discardWords(min + (backlogMinutes * 60 * 1000));
        // XXX: To make a prediction, take the most recent backlogMinutes worth of data.
        //      We use this as a stimuli to force the network to predict the future
        //      predictionMinutes of data.
        // XXX: The time of the prediction is offset from the time at the beginning of
        //      our top samples + (predictionMinutes + backlogMinutes).
        const future = getBetween(getMerge, max - (backlogMinutes * 60 * 1000), max);
        const [nextScale] = await predict(future);
        // TODO: Can likely elevate this to remove from the manual implementation inside
        //       getSeries?
        const [{ prices: [o] }] = Object.values(future);
        // XXX: We compute a _relative_ price change.
        const predictedPrice = o * (1 + nextScale);
        const t = moment(max + (predictionMinutes * 60 * 1000));
        // TODO: Configurable price representation.
        return console.log(`${t.format('HH:mm')}, $${predictedPrice}`);
      }
    },
  );
  /* hashtags */
  subscribeTo('bitcoin', processHashtag());
  subscribeTo('blockchain', processHashtag());
})();
