import klona from "klona";
import { typeCheck } from "type-check";

const sortByTime = (obj) =>
  Object.fromEntries(
    Object.entries(obj).sort(
      ([t1], [t2]) => Number.parseInt(t1) - Number.parseInt(t2)
    )
  );

const createAddThunk = (acc, format, backlog) => (...args) => {
  if (typeCheck(`(Number,${format})`, args)) {
    const [t, value] = args;
    if (acc) {
      backlog[t] = backlog[t] || [];
      backlog[t].push(value);
    } else {
      backlog[t] = value;
    }
    return undefined;
  }
  throw new Error(`Expected (Number, *), encountered ${args}.`);
};

const createDiscardThunk = (backlog) => (...args) => {
  if (typeCheck("(Number)", args)) {
    const [t] = args;
    for (const k in backlog) {
      if (Number.parseInt(k) < t) {
        delete backlog[k];
      }
    }
    return undefined;
  }
  throw new Error(`Expected (Number), encountered ${args}.`);
};

export const createBacklog = async (...args) => {
  if (typeCheck("(Boolean, String)", args)) {
    const [acc, format] = args;
    const backlog = {};
    return Object.freeze({
      push: createAddThunk(acc, format, backlog),
      discard: createDiscardThunk(backlog),
      // XXX: Ensure the records are in order when they are returned.
      //      (This makes them easier to reason about.)
      get: () => sortByTime(klona(backlog)),
    });
  }
  throw new Error(`Expected (Boolean), encountered ${args}.`);
};

export const mergeBacklogs = (...args) => {
  if (typeCheck("(Object)", args)) {
    const [obj] = args;
    const getters = Object.entries(obj);
    if (typeCheck("[(String,Function)]", getters)) {
      const results = getters.reduce((obj, [name, fn]) => {
        const values = fn();
        return Object.entries(values).reduce((o, [t, data]) => {
          o[t] = o[t] || {};
          o[t][name] = data;
          return o;
        }, obj);
      }, {});
      return sortByTime(
        Object.fromEntries(
          Object.entries(results).filter(
            ([k, r]) => Object.keys(r).length === Object.keys(obj).length
          )
        )
      );
    }
  }
  throw new Error(`Expected (Object), encountered ${args}.`);
};

// XXX: Ensures that only records consisting of entries divisible by exactly one
//      second may persist in the backlog.
const ensureSequential = (obj, step = 60 * 1000) => {
  const [...keys] = Object.keys(obj).map((e) => Number.parseInt(e));
  const { length } = keys;
  if (length <= 1) {
    return obj;
  }
  const diffs = [];
  for (let i = 1; i < length; i += 1) {
    diffs.push(keys[i] - keys[i - 1]);
  }
  const max = Math.max(...diffs);
  // XXX: Enforces that the maximum difference must be a single minute between each record.
  if (max !== step) {
    // XXX: Find the index with the biggest distance. Between the first and last.
    const i = diffs.indexOf(max);
    return ensureSequential(
      Object.fromEntries(Object.entries(obj).filter((_, j) => j > i))
    );
  }
  return obj;
};

// XXX: Returns the valid minimum and maximum sequential records across all backlogs.
export const getBounds = async (...args) => {
  if (typeCheck("[Function]", args) && args.length > 0) {
    const global = args.map((getData) => {
      const t = Object.keys(ensureSequential(getData())).map((k) =>
        Number.parseInt(k)
      );
      return {
        min: Math.min(...t),
        max: Math.max(...t),
      };
    });
    return {
      min: Math.max(...global.map(({ min }) => min)),
      max: Math.min(...global.map(({ max }) => max)),
    };
  }
  throw new Error(`Expected [Function], encountered ${args}.`);
};

export const getBetween = (...args) => {
  if (typeCheck("(Function, Number, Number)", args)) {
    const [getData, min, max] = args;
    return Object.fromEntries(
      Object.entries(getData()).filter(
        ([k]) => Number.parseInt(k) >= min && Number.parseInt(k) < max
      )
    );
  }
  throw new Error(`Expected (Function, Number, Number), encountered ${args}.`);
};
