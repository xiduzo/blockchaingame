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
      { number: 0, verbose: 'queen', image: 'queen.png'},
      { number: 1, verbose: 'merchant', image: 'merchant.png'},
      { number: 2, verbose: 'coin', image: 'money.png'},
      { number: 3, verbose: 'cow', image: 'cow.png'},
      { number: 4, verbose: 'pig', image: 'pig.png'},
      { number: 5, verbose: 'sheep', image: 'sheep.png'},
      { number: 6, verbose: 'milk', image: 'milk.png'},
      { number: 7, verbose: 'bacon', image: 'bacon.png'},
      { number: 8, verbose: 'wool', image: 'wool.png'},
      { number: 9, verbose: 'guard', image: 'guard.png'}
    ])
    .constant('BASE_RECOURCES', (function() {
        var ASSETS = [
          {
            "assetType": 1,
            "name": "Sheep",
            "buyFor": 100,
            "sellForPercentage": 0.15,
            "image": "sheep.png",
            "currency": {
              "image": "wool.png",
              "currencyType": 1,
              "name": "Wool",
              "measure": "kg",
              "buyFor": 20,
              "sellForPercentage": 0.04
            }
          },
          {
            "assetType": 2,
            "name": "Cow",
            "buyFor": 150,
            "sellForPercentage": 0.20,
            "image": "cow.png",
            "currency": {
              "image": "milk.png",
              "currencyType": 2,
              "name": "Milk",
              "measure": "lt",
              "buyFor": 50,
              "sellForPercentage": 0.06,
              "volatility": 10
            }
          },
          {
            "assetType": 3,
            "name": "Pig",
            "buyFor": 225,
            "sellForPercentage": 0.25,
            "image": "pig.png",
            "currency": {
              "image": "bacon.png",
              "currencyType": 3,
              "name": "Bacon",
              "measure": "kg",
              "buyFor": 115,
              "sellForPercentage": 0.08
            }
          }
        ];

        return {
          ASSETS: ASSETS,
          STORAGE: [
            { "assetType": 1, "currencyType": 1, "amount": 30.18, "currencyLink": _.findWhere(ASSETS, {assetType: 1}).currency },
            { "assetType": 2, "currencyType": 2, "amount": 5.18, "currencyLink": _.findWhere(ASSETS, {assetType: 2}).currency },
            { "assetType": 3, "currencyType": 3, "amount": 1.18, "currencyLink": _.findWhere(ASSETS, {assetType: 3}).currency }
          ],
          BARN: [
            { "assetType": 1, "amount": 5, "oldAmount": 0, "assetLink": _.findWhere(ASSETS, {assetType: 1}) },
            { "assetType": 2, "amount": 2, "oldAmount": 0, "assetLink": _.findWhere(ASSETS, {assetType: 2}) },
            { "assetType": 3, "amount": 1, "oldAmount": 0, "assetLink": _.findWhere(ASSETS, {assetType: 3}) }
          ]
        }
      })())
    ; // end of constants

})();
