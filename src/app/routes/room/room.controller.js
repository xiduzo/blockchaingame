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
    vm.kickUser = kickUser;
    vm.sellAnimal = sellAnimal;
    vm.buyAnimal = buyAnimal;

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

    vm.oldCoins = 0;
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
          // Only add yourself when not in the room
          // Prevents duplicate users
          if(!_.find(vm.room.users, function(user) {
            return user._id.$oid = response.data.user._id.$oid;
          })) {
            vm.room.users.push(response.data.user);
          }
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
    function kickUser(user) {
      Rooms.socket("roomLeave", {
        "user": user,
        "room": $stateParams.roomId
      });
    }

    function buyAnimal(animal) {
      ngDialog.openConfirm({
        template: 'app/routes/room/dialogs/buyanimal.html',
        className: 'c-dialog',
        disableAnimation: true,
        overlay: false,
        showClose: false,
        closeByEscape: false,
        controller: ['animal', 'coins', function(animal, coins) {

          var vm = this;

          vm.animal = animal;
          vm.coins = coins;
        }],
        controllerAs: 'buyAnimalCtrl',
        resolve: {
          animal: function() { return animal; },
          coins: function() { return vm.myCoins; }
        }
      })
      .then(function(response) {
        if(!response.amountToBuy) { return; }

        response.amountToBuy = parseInt(response.amountToBuy);

        // Update game
        _.findWhere(vm.myBarn, { assetType: animal.assetType }).amount += response.amountToBuy;
        vm.oldCoins = vm.myCoins
        vm.myCoins -= response.amountToBuy * animal.buyFor;
      })
      .catch(function(error) {
        $log.log(error);
      });
      vm.assets = angular.copy(vm.assets); // Have to do this stupid reset because the swipe lib is ratarded
    }

    function sellAnimal(animal) {
      ngDialog.openConfirm({
        template: 'app/routes/room/dialogs/sellanimal.html',
        className: 'c-dialog',
        disableAnimation: true,
        overlay: false,
        showClose: false,
        closeByEscape: false,
        controller: ['animal', 'animalInBarn', function(animal, animalInBarn) {

          var vm = this;

          vm.animal = animal;
          vm.animalInBarn = animalInBarn;
        }],
        controllerAs: 'sellAnimalCtrl',
        resolve: {
          animal: function() { return animal; },
          animalInBarn: function() { return _.findWhere(vm.myBarn, { assetType: animal.assetType }); }
        }
      })
      .then(function(response) {
        if(!response.amountToSell) { return; }

        response.amountToSell = parseInt(response.amountToSell);

        // Update the game
        _.findWhere(vm.myBarn, { assetType: animal.assetType }).amount -= response.amountToSell;
        vm.oldCoins = vm.myCoins
        vm.myCoins += response.amountToSell * animal.sellFor;
      })
      .catch(function(error) {
        $log.log(error);
      });
      vm.assets = angular.copy(vm.assets); // Have to do this stupid reset because the swipe lib is ratarded
    }


  }
})();
