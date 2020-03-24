import { config as dotenv } from "dotenv";
import moment from "moment";

dotenv();

import { createBacklog, mergeBacklogs } from "./backlog";
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
  const { push: pushPrice, get: getPrice } = await createBacklog(false, "(Number, Number, Number, Number)");
  const { push: pushMerge, get: getMerge } = await createBacklog(false, "{prices:(Number,Number,Number,Number),words:[[String]]}");
  const { push: pushWords, get: getWords } = await createBacklog(true, "[String]");
  //const { getVectors } = await prepareModel();
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
      values.map(([t, ...ohlc]) => pushPrice(moment(t).toDate().getTime(), ohlc));
      Object.entries(await mergeBacklogs({ prices: getPrice, words: getWords }))
        .map(([t, v]) => pushMerge(Number.parseInt(t), v));
    },
  );
  /* hashtags */
  subscribeTo('bitcoin', processHashtag());
})();
