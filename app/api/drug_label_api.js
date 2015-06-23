var request = require('superagent');

var baseApiUrl;
var apiKey;

var DrugLabelApi = {
  get baseApiUrl() { return baseApiUrl; },

  set baseApiUrl(u) { baseApiUrl = u; },

  get apiKey() { return apiKey; },

  set apiKey(u) { apiKey = u; },

  _makeRequest(params, results, resolve, reject) {
    request.get(DrugLabelApi._constructUrl(params))
      .end(function (err, res) {
        if (err || !res.ok) {
          if (res.status === 404) {
            return resolve([]);
          } else {
            return reject(err);
          }
        }
        results = results.concat(res.body.results);

        var numbers = res.body.meta.results;
        if (numbers.skip + numbers.limit < numbers.total) {
          params.skip = params.skip + params.limit;
          return DrugLabelApi._makeRequest(params, results, resolve);
        } else {
          resolve(results);
        }
      });
  },

  _constructUrl(params) {
    var paramsArray = Object.keys(params).map(function(key) {
      return `${key}=${params[key]}`;
    });
    return `${baseApiUrl}/drug/label.json?${paramsArray.join('&')}`;
  },

  search(options = {}) {
    var {name} = options;
    var results = [];

    var params = {
      skip: 0,
      limit: 50
    };

    if (apiKey) {
      params.api_key = encodeURIComponent(apiKey);
    }

    if (name) {
      params.search = `openfda.generic_name:${encodeURIComponent(name)}+openfda.brand_name:${encodeURIComponent(name)}`;
    }

    return new Promise(function (resolve, reject) {
      DrugLabelApi._makeRequest(params, results, resolve, reject);
    });
  }
};

module.exports = DrugLabelApi;
