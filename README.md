# crypto-lstm-3
💵 Using [Twitter]() and [word2vec]() to predict trends in cryptocurrency. Normalized human sentiment goes in, the future of [Bitcoin]() comes out.

![]() # sick graph

## Foreward

The application of deep learning to financial forecasting is nothing new. When fed raw historical pricing data, a neural network can propose future trends [based on the time-variant fluctuations]() of the past. In particular, [Long Short Term Memory Recurrent Networks]() have been proven to be [particularly effective]() at this task.

But alas, **Economics is the science of _choice_.**

The vast complexity of financial forecasting simply cannot be expressed by discrete pricing data, since there is an overwhelming _human_ element. Passion, regret, life and death stand at the prescipice of every peak, and slump at the upset of every trough.

We live in an unprecedented informational era, where the entire breadth of human expression can be freely accessed via an API call. Here, we leverage [Twitter]() to continuously gather and extract ongoing public sentiment, then use this to stimulate a neural network which fights to determine the cross-correlation with the future value of a given crypto.

Just as _fake news_ [quantifiably diminishes the public perception of truth](), tweets about crypto **can and will** transmute [bears into bulls](). After all, Twitter is the [Wall Street]() of blockchain currency.

## Donations

If this project has helped you, please consider sustaining my open source work with a small donation.

## Usage

```shell
npx crypto-lstm
```

### Options

// TODO: Find a good options layout for the cli.

```shell
-g # --gpu (default: false)
```

## Frequently Asked Questions

**Q: Is this project just for predicting bitcoin?**
A: Any cryptocurrency served via the [Coindesk API]() can be used as a prediction target; you just have to specify the [ISO]() (i.e. `"ETH"`), and define the [hashtags]() you think will be in some way related to the rise and fall of the currency's value.
