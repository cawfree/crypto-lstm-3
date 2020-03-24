import klona from "klona";
import { typeCheck } from "type-check";

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

const createDiscardThunk = backlog => (...args) => {
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
      get: () => klona(backlog),
    });
  }
  throw new Error(`Expected (Boolean), encountered ${args}.`);
};

export const mergeBacklogs = async (...args) => {
  if (typeCheck("(Object)", args)) {
    const [obj] = args;
    const getters = Object.entries(obj);
    if (typeCheck("[(String,Function)]", getters)) {
      const results = getters
        .reduce(
          (obj, [name, fn]) => {
            const values = fn();
            return Object.entries(values)
              .reduce(
                (o, [t, data]) => {
                  o[t] = o[t] || {};
                  o[t][name] = data;
                  return o;
                },
                obj,
              );
          },
          {},
        );
      return Object.fromEntries(
        Object.entries(results)
          .filter(
            ([k, r]) => (Object.keys(r).length === Object.keys(obj).length),
          ),
      );
      return results;
    }
  }
  throw new Error(`Expected (Object), encountered ${args}.`);
};

// XXX: Returns the valid minimum and maximum
export const getBounds = async (...args) => {
  if (typeCheck("[Function]", args) && args.length > 0) {
    const global = args.map(
      (getData) => {
        const t = Object.keys(getData())
          .map(k => Number.parseInt(k));
        return {
          min: Math.min(...t),
          max: Math.max(...t),
        };
      },
    );
    return {
      min: Math.max(...global.map(({ min }) => min)),
      max: Math.min(...global.map(({ max }) => max)),
    };
  }
  throw new Error(`Expected [Function], encountered ${args}.`);
};
