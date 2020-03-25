import { config as dotenv } from "dotenv";
import moment from "moment";

dotenv();

import { createBacklog, mergeBacklogs, getBounds, getBetween } from "./backlog";
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

(async () => {
  
  // to generate a prediction, we will use backlogMinutes of data
  const backlogMinutes = 2;
  // the amount of minutes into the future we will be predicting
  const predictionMinutes = 2;

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
      const t = moment(created).startOf("minute").toDate().getTime();
      return pushWords(t, words);
    }
    return undefined;
  };
  await createSync(
    "BTC",
    async (values, meta) => {
      values.map(([t, ...ohlc]) => pushPrice(moment(t).startOf("minute").toDate().getTime(), ohlc));

      Object.entries(mergeBacklogs({ prices: getPrice, words: getWords }))
        .map(([t, v]) => pushMerge(Number.parseInt(t), v));

      // TODO: Should do some threaded intensive processing here.
      //       Must defer processing until a current round of training is over.
      const { min, max } = await getBounds(getMerge);
      // XXX: The amount of data we've got in the buffer allows us to make a prediction
      //      into the future.
      // XXX: We use +1 minute so that we have a minute of previous information to enter the frame with (this aids comparison).
      const dt = (backlogMinutes + predictionMinutes + 1) * 60 * 1000;
      if ((max - min) >= dt) {

        // XXX: getBetween is inclusive, so we include the top-most data.
        const data = getBetween(getMerge, min, min + dt);

        // XXX: Train the network.
        await nextEpoch(data);

        // TODO: Should probably re-instate another training loop after we've finished.

        // XXX:  Here, discard all of the data we would have processed within this frame.
        //       We **do not** however throw away the most recent entry, since this will
        //       serve as the reference input for the next frame. This is possible because 
        //       discardPrice is not min-inclusive.
        await discardPrice(min + dt - (60 * 1000));
        await discardMerge(min + dt - (60 * 1000));
        await discardWords(min + dt - (60 * 1000));
      }
    },
  );
  /* hashtags */
  subscribeTo('bitcoin', processHashtag());
  subscribeTo('blockchain', processHashtag());
})();
