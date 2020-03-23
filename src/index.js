import { config as dotenv } from "dotenv";

dotenv();

import { createClient, toSingleLine, toWords } from "./twitter";
import { prepareModel, words2vec } from "./word2vec";

const {
  TWITTER_CONSUMER_KEY: consumer_key,
  TWITTER_CONSUMER_SECRET: consumer_secret,
  TWITTER_ACCESS_TOKEN_KEY: access_token_key,
  TWITTER_ACCESS_TOKEN_SECRET: access_token_secret,
} = process.env;

(async () => {
  const { getVectors } = await prepareModel();
  const { subscribeTo } = await createClient(
    {
      consumer_key,
      consumer_secret,
      access_token_key,
      access_token_secret,
    },
  );
  subscribeTo(
    'bitcoin',
    ({ text }) => {
      const words = toWords(toSingleLine(text));
      if (words.length > 0) {
        console.log(words2vec(getVectors, words));
      }
    },
  );
})();
