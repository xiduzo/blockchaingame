(function() {
  'use strict';

  angular
    .module('angulargame')
    .controller('RoomController', RoomController);

  /** @ngInject */
  function RoomController(
    $scope,
    $log,
    $stateParams,
    Rooms,
    Global,
    ngDialog
  ) {

    var vm = this;

    // Methods
    vm.kickPlayer = kickPlayer;
    vm.openMarket = openMarket;

    // Variables
    vm.user = Global.getUser();

    vm.assets = [
      {
        "assetType": 1,
        "name": "Sheep",
        "buyFor": 200,
        "sellFor": 80,
        "currecy": {
          "currencyType": 1,
          "name": "wool",
          "measure": "kg",
          "buyFor": 20,
          "sellFor": 18
        }
      }
    ];

    vm.myCoins = 10000;
    vm.myStorage = [
      {
        "assetType": 1,
        "currencyType": 1,
        "amount": 30.18,
        "currencyLink": _.findWhere(vm.assets, {assetType: 1}).currecy
      }
    ];
    vm.myBarn = [
      {
        "assetType": 1,
        "amount": 5,
        "assetLink": _.findWhere(vm.assets, {assetType: 1})
      }
    ];

    // Broadcasts
    $scope.$on('roomJoin', function(event, response) {
      if(response.data.room == $stateParams.roomId) {

        if(response.data.user._id.$oid != vm.user._id.$oid) {
          vm.room.users.push(response.data.user);
        }
      }
    });

    $scope.$on("roomLeave", function(event, response) {
      if(response.data.room == $stateParams.roomId) {
        vm.room.users = _.without(vm.room.users, _.find(vm.room.users, function(user) {
          return user._id.$oid = response.data.user._id.$oid;
        }));

        // Update
        vm.room.put();
      }
    });

    // Extra logic
    Rooms.socket("roomJoin", {
      "user": vm.user,
      "room": $stateParams.roomId
    });

    $scope.$on("$destroy", function(){
      // Remove the room when the player is the last on in the room
      if(vm.room.users.length === 1) {
        Rooms.api.one(vm.room._id.$oid).remove().then(function() {
          Rooms.socket("roomDelete", {
            "room": $stateParams.roomId
          });
        });
      } else {
        Rooms.socket("roomLeave", {
          "user": vm.user,
          "room": $stateParams.roomId
        });
      }
    });

    // Services
    Rooms.api.one($stateParams.roomId).get().then(function(response) {
      vm.room = response;

      // Only add yourself when not in the room
      // Prevents duplicate users
      if(!_.find(vm.room.users, function(user) {
        return user._id.$oid = vm.user._id.$oid;
      })) {
        vm.room.users.push(vm.user);
        vm.room.put();
      }

    });

    // Method declarations
    function kickPlayer(user) {
      Rooms.socket("roomLeave", {
        "user": user,
        "room": $stateParams.roomId
      });
    }

    function openMarket() {
      ngDialog.open({
        template: 'app/routes/room/dialogs/market.html',
        className: 'ngdialog-theme-default',
        controller: ['assets', 'coins', 'animals', 'products', 'toastr', function(assets, coins, animals, products, toastr) {

          var vm = this;
          vm.assets = assets;
          vm.coins = coins;
          vm.animals = animals;
          vm.products = products;


          // Methods
          vm.buyProduct = buyProduct;
          vm.buyAnimal = buyAnimal;

          // Method declarations
          function buyProduct(productToBuy, amountToBuy) {
            amountToBuy = parseInt(amountToBuy);

            if((productToBuy.buyFor * amountToBuy) > vm.coins) {
              toastr.error("Can not buy " + productToBuy.name + ', you need ' + ((productToBuy.buyFor * amountToBuy) - vm.coins) + " more coins!");
            } else {
              vm.products = _.map(vm.products, function(myProduct) {
                if(productToBuy.currencyType == myProduct.currencyType) {
                  vm.coins -= (productToBuy.buyFor * amountToBuy);
                  myProduct.amount += amountToBuy;
                }
                return myProduct;
              });
            }
          }

          function buyAnimal(animalToBuy, amountToBuy) {
            amountToBuy = parseInt(amountToBuy);

            if((animalToBuy.buyFor * amountToBuy) > vm.coins) {
              toastr.error("Can not buy " + animalToBuy.name + ', you need ' + ((animalToBuy.buyFor * amountToBuy) - vm.coins) + " more coins!");
            } else {
              vm.animals = _.map(vm.animals, function(myAnimal) {
                if(animalToBuy.assetType == myAnimal.assetType) {
                  vm.coins -= (animalToBuy.buyFor * amountToBuy);
                  myAnimal.amount += amountToBuy;
                }
                return myAnimal;
              });
            }
          }
        }],
        controllerAs: 'marketCtrl',
        resolve: {
          assets: function() { return vm.assets; },
          coins: function() { return vm.myCoins; },
          animals: function() { return vm.myBarn; },
          products: function() { return vm.myStorage; }
        }
      });
    }


  }
})();
