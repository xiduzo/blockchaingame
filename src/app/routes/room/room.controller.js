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
    $timeout,
    Rooms,
    Global,
    ngDialog,
    BASE_RECOURCES,
    PIN_NUMBERS
  ) {

    var vm = this;

    // Methods
    vm.kickUser = kickUser;
    vm.sellAnimal = sellAnimal;
    vm.buyAnimal = buyAnimal;
    vm.enterVault = enterVault;
    vm.addPinNumber = addPinNumber;
    vm.nextRound = nextRound;
    vm.shufflePinNumbers = shufflePinNumbers;

    // Variables
    vm.user = Global.getUser();

    vm.assets = BASE_RECOURCES.ASSETS;
    vm.myStorage = BASE_RECOURCES.STORAGE;
    vm.myBarn = BASE_RECOURCES.BARN;

    vm.oldCoins = 0; // Need this for fancy counter
    vm.myCoins = 10000;

    vm.enteredPin = [];
    vm.availablePinNumbers = _.shuffle(PIN_NUMBERS);

    vm.currentRound = 0;

    vm.guardText = "I need a passcode before I can let you into this vault"

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

    function generateRandomStockMarket(numberOfPoints, center, min, max, cycles) {
      var result = [];
      // var phase = Math.random() * Math.PI;
      var y = center;

      function randomPlusMinus() { return (Math.random() * 2) - 1; }

      _.each(cycles, function(cycle) {
        cycle.phase = Math.random() * Math.PI;
        cycle.increment = Math.PI / cycle.length;
      });

      _.each(_.range(numberOfPoints), function() {
        _.each(cycles, function(cycle) {
          cycle.phase += cycle.increment * randomPlusMinus();
          y += (Math.sin(cycle.phase) * (cycle.variance / cycle.length) * (randomPlusMinus() * cycle.noise)) + (cycle.trend / cycle.length);
        });

        if (min) y = Math.max(y,min);
        if (max) y = Math.min(y,max);

        result.push(Math.round(y));
      });

      return result;
    }

    var nop = 2500;
    var wool = generateRandomStockMarket(nop,20,10,100,
                [{ length: 7, variance: 50, noise: 1, trend: 0},
                 { length: 365, variance: 30, noise: 2, trend: 5},
                 { length: 700, variance: 2, noise: 0, trend: 50}]);

    var milk = generateRandomStockMarket(nop,80,40,400,
                [{ length: 7, variance: 90, noise: 2, trend: 0},
                 { length: 365, variance: 60, noise: 3, trend: 0},
                 { length: 700, variance: 4, noise: 0, trend: 100}]);

    var bacon = generateRandomStockMarket(nop,320,160,1600,
                [{ length: 7, variance: 170, noise: 4, trend: 0},
                 { length: 365, variance: 110, noise: 6, trend: 0},
                 { length: 700, variance: 8, noise: 0, trend: 200}]);

    var woolAverage = _.reduce(wool, function(memo, num) { return memo + num; }, 0) / wool.length;
    var milkAverage = _.reduce(milk, function(memo, num) { return memo + num; }, 0) / milk.length;
    var baconAverage = _.reduce(bacon, function(memo, num) { return memo + num; }, 0) / bacon.length;

    var marketData = [wool, milk, bacon];

    // new Highcharts.Chart({
    //   title: { text: "market" },
    //   chart: {
    //     renderTo: 'chart',
    //     animation: false,
    //     zoomType: 'x'
    //   },
    //
    //   tooltip: {
    //     yDecimals: 2
    //   },
    //
    //   yAxis: {
    //     plotLines: [
    //       { color: '#2930db', value: woolAverage, width: '1', zIndex: 5 },
    //       { color: '#969696', value: milkAverage, width: '1', zIndex: 5 },
    //       { color: '#f51600', value: baconAverage, width: '1', zIndex: 5 }
    //     ]
    //   },
    //
    //   series: [
    //     { data: wool, name: "wool", color: '#2930db' },
    //     { data: milk, name: "milk", color: '#969696' },
    //     { data: bacon, name: "bacon", color: '#f51600' }
    //   ]
    //
    // });

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
        _.findWhere(vm.myBarn, { assetType: animal.assetType }).oldAmount = _.findWhere(vm.myBarn, { assetType: animal.assetType }).amount;
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
        _.findWhere(vm.myBarn, { assetType: animal.assetType }).oldAmount = _.findWhere(vm.myBarn, { assetType: animal.assetType }).amount;
        _.findWhere(vm.myBarn, { assetType: animal.assetType }).amount -= response.amountToSell;
        vm.oldCoins = vm.myCoins
        vm.myCoins += response.amountToSell * (animal.buyFor * (1 - animal.sellForPercentage));
      })
      .catch(function(error) {
        $log.log(error);
      });
      vm.assets = angular.copy(vm.assets); // Have to do this stupid reset because the swipe lib is ratarded
    }

    function enterVault() {
      if(vm.enteredPin.length < 5) {
        return vm.guardText = "I need a pincombination of 5 items before I can check your code."
      }

      var pincode = "";
      var myPinCode = "00552";

      _.each(vm.enteredPin, function(pinnumber) {
        pincode += pinnumber.number;
      });

      if(pincode !== myPinCode) {
        return vm.guardText = "You shall not pass!";
      }

      vm.guardText = "Goodday, " + vm.user.name + ", glad to see you back";
    }

    function addPinNumber(number) {
      if(vm.enteredPin.length === 5) { return; }

      vm.enteredPin.push(number);
    }

    function nextRound() {
      _.each(vm.assets, function(asset) {
        $log.log(vm.currentRound);
        asset.currency.buyFor = marketData[asset.currency.currencyType-1][vm.currentRound];
      })
      vm.currentRound++;
    }

    function shufflePinNumbers() {
      vm.guardText = "I need a passcode before I can let you into this vault";
      vm.enteredPin = [];
      vm.availablePinNumbers = _.shuffle(PIN_NUMBERS);
    }

  }
})();
