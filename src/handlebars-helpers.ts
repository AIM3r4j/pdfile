import hbs from 'handlebars';

export type HandlebarsHelper = (...args: any[]) => any;
export type HandlebarsHelpers = Record<string, HandlebarsHelper>;

const builtinHelpers: HandlebarsHelpers = {
  eq: (v1, v2) => v1 === v2,
  ne: (v1, v2) => v1 !== v2,
  lt: (v1, v2) => v1 < v2,
  gt: (v1, v2) => v1 > v2,
  lte: (v1, v2) => v1 <= v2,
  gte: (v1, v2) => v1 >= v2,
  'not-eq': (v1, v2) => v1 !== v2,
  and: (...args) => args.slice(0, -1).every(Boolean),
  or: (...args) => args.slice(0, -1).some(Boolean),
};

const ifCond: HandlebarsHelper = function(
  this: any,
  v1: any,
  operator: any,
  v2: any,
  options: any
) {
  switch (operator) {
    case '==':
      // eslint-disable-next-line eqeqeq
      return v1 == v2 ? options.fn(this) : options.inverse(this);
    case '===':
      return v1 === v2 ? options.fn(this) : options.inverse(this);
    case '!=':
      // eslint-disable-next-line eqeqeq
      return v1 != v2 ? options.fn(this) : options.inverse(this);
    case '!==':
      return v1 !== v2 ? options.fn(this) : options.inverse(this);
    case '<':
      return v1 < v2 ? options.fn(this) : options.inverse(this);
    case '<=':
      return v1 <= v2 ? options.fn(this) : options.inverse(this);
    case '>':
      return v1 > v2 ? options.fn(this) : options.inverse(this);
    case '>=':
      return v1 >= v2 ? options.fn(this) : options.inverse(this);
    case '&&':
      return v1 && v2 ? options.fn(this) : options.inverse(this);
    case '||':
      return v1 || v2 ? options.fn(this) : options.inverse(this);
    default:
      return options.inverse(this);
  }
};

/**
 * Parse a helpers JSON file whose values are stringified function bodies.
 * Uses `new Function` — only call on trusted input. Prefer the object-based
 * `helpers` option instead.
 *
 * @deprecated since v1.1 — pass `helpers` as a plain object instead.
 */
export const parseHelpersJson = (raw: string): HandlebarsHelpers => {
  const parsed = JSON.parse(raw) as Record<string, string>;
  const out: HandlebarsHelpers = {};
  for (const [name, body] of Object.entries(parsed)) {
    // eslint-disable-next-line no-new-func
    out[name] = new Function(`return (${body})`)() as HandlebarsHelper;
  }
  return out;
};

export const registerHandlebarsHelpers = (
  userHelpers?: HandlebarsHelpers
): void => {
  hbs.registerHelper('ifCond', ifCond);
  hbs.registerHelper(builtinHelpers);
  if (userHelpers) hbs.registerHelper(userHelpers);
};
