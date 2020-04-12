# crypto-lstm-3
💵 Using [Twitter](https://twitter.com) and [word2vec](https://en.wikipedia.org/wiki/Word2vec) to predict trends in cryptocurrency. Normalized human sentiment goes in, the future of [Bitcoin](https://bitcoin.org/en/) comes out.

<a href="#badge">
  <img alt="code style: prettier" src="https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square">
</a>

## Foreward

The application of deep learning to financial forecasting is nothing new. When fed raw historical pricing data, a neural network can propose future trends [based on the time-variant fluctuations](https://machinelearningmastery.com/how-to-develop-lstm-models-for-time-series-forecasting/) of the past. In particular, [Long Short Term Memory Recurrent Networks]() have been proven to be [unreasonably effective](http://karpathy.github.io/2015/05/21/rnn-effectiveness/) at this task.

But alas, **Economics is the science of _choice_.**

The vast complexity of financial forecasting simply cannot be expressed by discrete pricing data, since there is an overwhelming _human_ element. Passion, regret, life and death stand at the prescipice of every peak, and slump at the upset of every trough.

We live in an unprecedented informational era, where the entire breadth of human expression can be freely accessed via an API call. Here, we leverage Twitter to continuously gather and extract ongoing public sentiment, then use this to stimulate a neural network which fights to determine the cross-correlation with the future value of a given crypto.

Just as _fake news_ [quantifiably diminishes the public perception of truth](https://www.sciencedirect.com/science/article/abs/pii/S2214804319303398), tweets about crypto **can and will** transmute [bears into bulls](https://en.wikipedia.org/wiki/Market_trend). After all, Twitter is the Wall Street of blockchain currency.

## Usage

This project relies upon defining a [`.env`](https://www.npmjs.com/package/dotenv) file to define your access credentials to Twitter. It takes the following form:

```bash
TWITTER_CONSUMER_KEY=XXXXX
TWITTER_CONSUMER_SECRET=XXXXX
TWITTER_ACCESS_TOKEN_KEY=XXXXX
TWITTER_ACCESS_TOKEN_SECRET=XXXXX
```

You can find more info [here](https://www.npmjs.com/package/twitter#for-application-only-based-authentication).

After this, you need to [`gunzip`]() the [word2vec-slim](https://github.com/eyaler/word2vec-slim) model to the `public/` directory of your local clone.

Lastly, use `yarn` or `npm install` to initialize the project dependencies. Then execute the `start` script to begin training. After every training window, a prediction of the next cryptocurrency price will be made for the future.

## Configurable Properties

  - `backlogMinutes`: The amount of time tweets and values need to be collected to satisfy a training data window.
  - `predictionMinutes`: The amount of time into the future the network should forecast.
  - `subscribeTo`: Define the kind of hastags to listen out for.

**Note**: The network will not start making predictions until `backlogMinutes + predictionMinutes` has elapsed.

## FAQ

**Q: Is this project just for predicting bitcoin?**
A: Any cryptocurrency served via the [Coindesk API]() can be used as a prediction target; you just have to specify the [ISO]() (i.e. `"ETH"`), and define the [hashtags]() you think will be in some way related to the rise and fall of the currency's value.

## ✌️ License
[MIT](https://opensource.org/licenses/MIT)

<p align="center">
  <a href="https://www.buymeacoffee.com/cawfree">
    <img src="https://cdn.buymeacoffee.com/buttons/default-orange.png" alt="Buy @cawfree a coffee" width="232" height="50" />
  </a>
</p>
