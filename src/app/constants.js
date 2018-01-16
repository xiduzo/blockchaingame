/* global malarkey:false, moment:false, _:true */
(function() {
  'use strict';

  angular
    .module('angulargame')
    .constant('malarkey', malarkey)
    .constant('moment', moment)


    .constant('API_URL', 'https://api.mlab.com/api/1/databases/blockchainz/collections/')
    .constant('API_KEY', 'BC6Nv1iEK_ZTzlp6IvIxF7jHRMEMREzz')
    .constant('SOCKETHOST', 'floating-meadow-66461.herokuapp.com/')
    .constant('ROOM_MEMBERS_NEEDED_TO_PLAY', 1)
    .constant('PIN_NUMBERS_TO_ENTER', 6)
    .constant('BASE_WALLET', {
      transaction_fee: 50,
      security: 10
    })
    .constant('PIN_NUMBERS', [
      { number: 0, verbose: 'queen', image: 'queen.png'},
      { number: 1, verbose: 'merchant', image: 'merchant_sheep.svg'},
      { number: 2, verbose: 'coin', image: 'money.svg'},
      { number: 3, verbose: 'cow', image: 'cow.svg'},
      { number: 4, verbose: 'pig', image: 'pig.svg'},
      { number: 5, verbose: 'sheep', image: 'sheep.svg'},
      { number: 6, verbose: 'milk', image: 'milk.svg'},
      { number: 7, verbose: 'bacon', image: 'bacon.svg'},
      { number: 8, verbose: 'wool', image: 'wool.svg'}
    ])
    .constant('CARDS', [
      {
        "type": 1,
        "verbose": "Attack",
        "effect": 2,
        "activeTime": 0,
        "text": "When used, this card will allow you to attack a random player's storage, with 4 power.",
        "image": "guard.svg"
      },
      {
        "type": 2,
        "verbose": "Security",
        "effect": 4,
        "activeTime": 90,
        "text": "You'll hire a guard who will add 4 extra security to your storage for 60 seconds",
        "image": "guard.svg"
      },
      {
        "type": 2,
        "verbose": "Security",
        "effect": 10,
        "activeTime": 60,
        "text": "Grandmother will watch over your storage for 60 seconds and will add 10 extra security to your storage",
        "image": "grandma.svg"
      }
    ])
    .constant('BASE_RECOURCES', (function() {
        var ASSETS = [
          {
            "assetType": 1,
            "name": "Sheep",
            "plural": "Sheep",
            "buyFor": 100,
            "sellForPercentage": 0.15,
            "image": "sheep.svg",
            "active": false,
            "merchant": "merchant_sheep.svg",
            "currencyProduction": { "min": 2, "max": 5},
            "currency": {
              "image": "wool.svg",
              "currencyType": 1,
              "name": "Wool",
              "plural": "Wool",
              "measure": "kg",
              "active": true,
              "buyFor": 20,
              "sellForPercentage": 0.04
            }
          },
          {
            "assetType": 2,
            "name": "Cow",
            "plural": "Cows",
            "buyFor": 150,
            "sellForPercentage": 0.20,
            "image": "cow.svg",
            "active": false,
            "merchant": "merchant_cow.svg",
            "currencyProduction": { "min": 2, "max": 5},
            "currency": {
              "image": "milk.svg",
              "currencyType": 2,
              "name": "Milk",
              "plural": "Milk",
              "measure": "lt",
              "active": false,
              "buyFor": 50,
              "sellForPercentage": 0.06,
              "volatility": 10
            }
          },
          {
            "assetType": 3,
            "name": "Pig",
            "plural": "Pigs",
            "buyFor": 225,
            "sellForPercentage": 0.25,
            "image": "pig.svg",
            "active": false,
            "merchant": "merchant_pig.svg",
            "currencyProduction": { "min": 2, "max": 5},
            "currency": {
              "image": "bacon.svg",
              "currencyType": 3,
              "name": "Bacon",
              "plural": "Bacon",
              "measure": "kg",
              "active": false,
              "buyFor": 115,
              "sellForPercentage": 0.08
            }
          }
        ];

        return {
          ASSETS: ASSETS,
          STORAGE: [
            { "assetType": 1, "currencyType": 1, "amount": 50, "oldAmount": 50, "active": true, "canUse": true, "currencyLink": _.findWhere(ASSETS, {assetType: 1}).currency },
            { "assetType": 2, "currencyType": 2, "amount": 0, "oldAmount": 0, "active": false, "canUse": false, "currencyLink": _.findWhere(ASSETS, {assetType: 2}).currency },
            { "assetType": 3, "currencyType": 3, "amount": 0, "oldAmount": 0, "active": false, "canUse": false, "currencyLink": _.findWhere(ASSETS, {assetType: 3}).currency }
          ],
          VAULT: [
            { "assetType": 1, "currencyType": 1, "amount": 0, "oldAmount": 0, "active": true, "currencyLink": _.findWhere(ASSETS, {assetType: 1}).currency },
            { "assetType": 2, "currencyType": 2, "amount": 0, "oldAmount": 0, "active": false, "currencyLink": _.findWhere(ASSETS, {assetType: 2}).currency },
            { "assetType": 3, "currencyType": 3, "amount": 0, "oldAmount": 0, "active": false, "currencyLink": _.findWhere(ASSETS, {assetType: 3}).currency }
          ],
          BARN: [
            { "assetType": 1, "amount": 0, "oldAmount": 0, "active": false, "assetLink": _.findWhere(ASSETS, {assetType: 1}) },
            { "assetType": 2, "amount": 0, "oldAmount": 0, "active": false, "assetLink": _.findWhere(ASSETS, {assetType: 2}) },
            { "assetType": 3, "amount": 0, "oldAmount": 0, "active": false, "assetLink": _.findWhere(ASSETS, {assetType: 3}) }
          ]
        }
      })())
    ; // end of constants

})();
