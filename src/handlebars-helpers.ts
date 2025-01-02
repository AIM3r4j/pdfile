import hbs from 'handlebars';

export const registerHandlebarsHelpers = (data: any, helpers?: any) => {
  hbs.registerHelper('ifCond', function(
    v1: any,
    operator: any,
    v2: any,
    options: any
  ) {
    switch (operator) {
      case '==':
        return v1 == v2 ? options.fn(data) : options.inverse(data);
      case '===':
        return v1 === v2 ? options.fn(data) : options.inverse(data);
      case '!=':
        return v1 != v2 ? options.fn(data) : options.inverse(data);
      case '!==':
        return v1 !== v2 ? options.fn(data) : options.inverse(data);
      case '<':
        return v1 < v2 ? options.fn(data) : options.inverse(data);
      case '<=':
        return v1 <= v2 ? options.fn(data) : options.inverse(data);
      case '>':
        return v1 > v2 ? options.fn(data) : options.inverse(data);
      case '>=':
        return v1 >= v2 ? options.fn(data) : options.inverse(data);
      case '&&':
        return v1 && v2 ? options.fn(data) : options.inverse(data);
      case '||':
        return v1 || v2 ? options.fn(data) : options.inverse(data);
      default:
        return options.inverse(options);
    }
  });

  if (helpers) {
    const parsedHelpers = JSON.parse(helpers);
    Object.entries(parsedHelpers).forEach(([name, funcBody]) => {
      const helperFunction = new Function(`return (${funcBody})`)(); // No eval, safer
      hbs.registerHelper(name, helperFunction);
    });
  } else {
    // Default helper functions registration
    hbs.registerHelper({
      eq: function(v1, v2) {
        return v1 === v2;
      },
      ne: function(v1, v2) {
        return v1 !== v2;
      },
      lt: function(v1, v2) {
        return v1 < v2;
      },
      gt: function(v1, v2) {
        return v1 > v2;
      },
      lte: function(v1, v2) {
        return v1 <= v2;
      },
      gte: function(v1, v2) {
        return v1 >= v2;
      },
      and: function(...args) {
        return args.every(Boolean);
      },
      or: function(...args) {
        return args.slice(0, -1).some(Boolean);
      },
    });
  }
};
