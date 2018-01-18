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
      transaction_fee_decrease: 0,
      security: 10,
      security_increase: 0
    })
    .constant('PIN_NUMBERS', [
      { number: 0, verbose: 'queen', image: 'queen.png'},
      { number: 1, verbose: 'merchant', image: 'merchant_sheep.png'},
      { number: 2, verbose: 'coin', image: 'money.png'},
      { number: 3, verbose: 'cow', image: 'cow.png'},
      { number: 4, verbose: 'pig', image: 'pig.png'},
      { number: 5, verbose: 'sheep', image: 'sheep.png'},
      { number: 6, verbose: 'milk', image: 'milk.png'},
      { number: 7, verbose: 'bacon', image: 'bacon.png'},
      { number: 8, verbose: 'wool', image: 'wool.png'}
    ])
    .constant('ADDONS', [
      {
        "name": "transactions",
        "image": "transaction_fee_clean.png",
        "addonType": 1,
        "addons": [
          {
            "effect": 5,
            "image": "transaction_fee_5.png",
            "text": "Reduce transaction fee by 5%",
            "owned": false,
            "available": true,
            "buyFor": 500
          },
          {
            "effect": 10,
            "image": "transaction_fee_10.png",
            "text": "Reduce transaction fee by 10%",
            "owned": false,
            "available": false,
            "buyFor": 500
          },
          {
            "effect": 15,
            "image": "transaction_fee_15.png",
            "text": "Reduce transaction fee by 15%",
            "owned": false,
            "available": false,
            "buyFor": 500
          },
        ]
      },
      {
        "name": "security",
        "image": "guard_clean.png",
        "addonType": 2,
        "addons": [
          {
            "effect": 1,
            "image": "eye.png",
            "text": "Increase security rating by 1",
            "owned": false,
            "available": false,
            "buyFor": 500
          },
          {
            "effect": 5,
            "image": "guard.png",
            "text": "Increase security rating by 5",
            "owned": false,
            "available": false,
            "buyFor": 500
          },
          {
            "effect": 10,
            "image": "grandma.png",
            "text": "Increase security rating by 10",
            "owned": false,
            "available": false,
            "buyFor": 500
          },
        ]
      },
      {
        "name": "storage",
        "image": "animals_clean.png",
        "addonType": 3,
        "addons": [
          {
            "animalType": 2,
            "image": "cow.png",
            "text": "Build a cow sheld to buy and sell milk",
            "owned": false,
            "available": false,
            "buyFor": 500
          },
          {
            "animalType": 3,
            "image": "pig.png",
            "text": "Build a pig pen to buy and sell bacon",
            "owned": false,
            "available": false,
            "buyFor": 500
          }
        ]
      }
    ])
    .constant('CARDS', [
      {
        "type": 1,
        "verbose": "Attack",
        "effect": 2,
        "activeTime": 0,
        "text": "When used, this card will allow you to attack a random player's storage, with 4 power.",
        "image": "guard.png"
      },
      {
        "type": 2,
        "verbose": "Security",
        "effect": 4,
        "activeTime": 90,
        "text": "You'll hire a guard who will add 4 extra security to your storage for 60 seconds",
        "image": "guard.png"
      },
      {
        "type": 2,
        "verbose": "Security",
        "effect": 10,
        "activeTime": 60,
        "text": "Grandmother will watch over your storage for 60 seconds and will add 10 extra security to your storage",
        "image": "grandma.png"
      }
    ])
    .constant('BASE_RECOURCES', (function() {
        var ASSETS = [
          {
            "assetType": 1,
            "name": "Sheep",
            "plural": "Sheep",
            "buyFor": 1000,
            "sellForPercentage": 0.15,
            "image": "sheep.png",
            "image_clean": "sheep_clean.png",
            "active": false,
            "merchant": "merchant_sheep.png",
            "currencyProduction": { "min": 2, "max": 5},
            "currency": {
              "image": "wool.png",
              "image_clean": "wool_clean.png",
              "currencyType": 1,
              "name": "Wool",
              "plural": "Wool",
              "measure": "kg",
              "active": true,
              "buyFor": 20,
              "previousBuyFor": 20,
              "history": [20],
              "sellForPercentage": 0.04
            }
          },
          {
            "assetType": 2,
            "name": "Cow",
            "plural": "Cows",
            "buyFor": 1500,
            "sellForPercentage": 0.20,
            "image": "cow.png",
            "image_clean": "cow_clean.png",
            "active": false,
            "merchant": "merchant_cow.png",
            "currencyProduction": { "min": 1, "max": 4},
            "currency": {
              "image": "milk.png",
              "image_clean": "milk_clean.png",
              "currencyType": 2,
              "name": "Milk",
              "plural": "Milk",
              "measure": "lt",
              "active": false,
              "buyFor": 80,
              "previousBuyFor": 80,
              "history": [80],
              "sellForPercentage": 0.06
            }
          },
          {
            "assetType": 3,
            "name": "Pig",
            "plural": "Pigs",
            "buyFor": 2250,
            "sellForPercentage": 0.25,
            "image": "pig.png",
            "image_clean": "pig_clean.png",
            "active": false,
            "merchant": "merchant_pig.png",
            "currencyProduction": { "min": 0, "max": 3},
            "currency": {
              "image": "bacon.png",
              "image_clean": "bacon_clean.png",
              "currencyType": 3,
              "name": "Bacon",
              "plural": "Bacon",
              "measure": "kg",
              "active": false,
              "buyFor": 160,
              "previousBuyFor": 160,
              "history": [160],
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
