/* global malarkey:false, moment:false, _:true */
(function() {
  'use strict';

  angular
    .module('angulargame')
    .constant('malarkey', malarkey)
    .constant('moment', moment)


    .constant('API_URL', 'https://api.mlab.com/api/1/databases/blockchainz/collections/')
    .constant('API_KEY', 'BC6Nv1iEK_ZTzlp6IvIxF7jHRMEMREzz')
    .constant('PIN_NUMBERS', [
      { number: 0, verbose: 'king'},
      { number: 1, verbose: 'merchant'},
      { number: 2, verbose: 'coin'},
      { number: 3, verbose: 'cow'},
      { number: 4, verbose: 'pig'},
      { number: 5, verbose: 'sheep'},
      { number: 6, verbose: 'milk'},
      { number: 7, verbose: 'bacon'},
      { number: 8, verbose: 'wool'},
      { number: 9, verbose: 'other'}
    ])
    .constant('BASE_RECOURCES', (function() {
        var ASSETS = [
          {
            "assetType": 1,
            "name": "Sheep",
            "buyFor": 100,
            "sellForPercentage": 0.15,
            "currency": {
              "currencyType": 1,
              "name": "Wool",
              "measure": "kg",
              "buyFor": 20,
              "sellForPercentage": 0.04,
            },
          },
          {
            "assetType": 2,
            "name": "Cow",
            "buyFor": 150,
            "sellForPercentage": 0.20,
            "currency": {
              "currencyType": 2,
              "name": "Milk",
              "measure": "l",
              "buyFor": 50,
              "sellForPercentage": 0.06,
              "volatility": 10,
            },
          },
          {
            "assetType": 3,
            "name": "Pig",
            "buyFor": 225,
            "sellForPercentage": 0.25,
            "currency": {
              "currencyType": 3,
              "name": "Bacon",
              "measure": "kg",
              "buyFor": 115,
              "sellForPercentage": 0.08,
            },
          },
        ];

        return {
          ASSETS: ASSETS,
          STORAGE: [
            { "assetType": 1, "currencyType": 1, "amount": 30.18, "currencyLink": _.findWhere(ASSETS, {assetType: 1}).currency },
            { "assetType": 2, "currencyType": 2, "amount": 5.18, "currencyLink": _.findWhere(ASSETS, {assetType: 2}).currency },
            { "assetType": 3, "currencyType": 3, "amount": 1.18, "currencyLink": _.findWhere(ASSETS, {assetType: 3}).currency },
          ],
          BARN: [
            { "assetType": 1, "amount": 5, "assetLink": _.findWhere(ASSETS, {assetType: 1}) },
            { "assetType": 2, "amount": 2, "assetLink": _.findWhere(ASSETS, {assetType: 2}) },
            { "assetType": 3, "amount": 1, "assetLink": _.findWhere(ASSETS, {assetType: 3}) },
          ]
        }
      })())
    ; // end of constants

})();
