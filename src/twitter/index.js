import Twitter from "twitter";
import { typeCheck } from "type-check";

const PATTERN_HASHTAG = /(^|\s)(#[a-z\d-]+)/gi;
const PATTERN_MENTION = /(^|\s)(@[a-z\d-]+)/gi;
const PATTERN_EMAIL = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
const PATTERN_URL = /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/gi;

export const toSingleLine = (text) =>
  text
    .trim()
    .toLowerCase()
    .replace(PATTERN_HASHTAG, " ")
    .replace(PATTERN_MENTION, " ")
    .replace(PATTERN_EMAIL, " ")
    .replace(PATTERN_HASHTAG, " ")
    .replace(PATTERN_URL, " ")
    .replace(/\s\s+/g, " ")
    .replace(/[^\w\s]/gi, "")
    .replace(/\r/g, " ")
    .replace(/\n/g, " ")
    .trim();

export const toWords = (singleLine) =>
  singleLine.split(" ").filter((e) => !!e && e.length > 0);

export const createClient = (options) =>
  Promise.resolve(new Twitter(options)).then((client) => ({
    subscribeTo: (track, callback) =>
      client
        .stream("statuses/filter", { track })
        .on(
          "data",
          (obj) => typeCheck("{text:String,...}", obj) && callback(obj)
        ),
  }));
