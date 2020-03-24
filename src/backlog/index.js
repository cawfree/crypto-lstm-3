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

export const createBacklog = async (...args) => {
  if (typeCheck("(Boolean, String)", args)) {
    const [acc, format] = args;
    const backlog = {};
    return Object.freeze({
      push: createAddThunk(acc, format, backlog),
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