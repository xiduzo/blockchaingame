(function() {
  'use strict';

  angular
    .module('angulargame')
    .controller('RoomController', RoomController);

  /** @ngInject */
  function RoomController(
    $state,
    $scope,
    $log,
    $stateParams,
    $timeout,
    Rooms,
    Global,
    ngDialog,
    BASE_RECOURCES,
    PIN_NUMBERS,
    ROOM_MEMBERS_NEEDED_TO_PLAY,
    CARDS
  ) {

    var vm = this;

    // Methods
    vm.kickUser = kickUser;
    vm.sellAnimal = sellAnimal;
    vm.buyAnimal = buyAnimal;
    vm.sellProduct = sellProduct;
    vm.buyProduct = buyProduct;
    vm.enterVault = enterVault;
    vm.addPinNumber = addPinNumber;
    vm.shufflePinNumbers = shufflePinNumbers;
    vm.makeEmptyArray = makeEmptyArray;
    vm.buyOrSelectCard = buyOrSelectCard;

    // Variables
    vm.user = Global.getUser();
    vm.room = undefined;
    vm.roomStarted = true;
    vm.addonsAvailable = false;
    vm.vaultAvailable = true;
    vm.enteredVault = false;
    vm.cardsAvailable = false;
    vm.animalsAvailable = false;
    vm.timeThisRound = 60 * 45;
    vm.currentTick = 0;
    vm.timesToUpdateMarket = angular.copy(vm.timeThisRound);

    vm.assets = angular.copy(BASE_RECOURCES.ASSETS);
    vm.myStorage = angular.copy(BASE_RECOURCES.STORAGE);
    vm.myBarn = angular.copy(BASE_RECOURCES.BARN);
    vm.myVault = angular.copy(BASE_RECOURCES.VAULT);
    vm.wallet = {
      transaction_fee: 20,
      security: 10
    }

    vm.oldCoins = 0; // Need this for fancy counter
    vm.myCoins = 10000;

    vm.enteredPin = [];
    vm.availablePinNumbers = _.shuffle(PIN_NUMBERS);

    vm.cards = [_.first(_.shuffle(CARDS)), undefined, undefined];
    vm.highlightedCard = {};

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

    function countDownTimer() {
      $timeout(function() {
        vm.timeThisRound--;
        vm.currentTick++;

        if(vm.currentTick % 5 === 0) {
          updateCurrencies();
        }

        if(vm.currentTick % 20 === 0) {
          getCurrenciesFromMiners();
        }

        if(vm.timeThisRound > 0) {
          countDownTimer();
        }
      }, 1000);
    }

    countDownTimer();

    // Wait to start game for users
    function waitForUsers() {
      vm.roomStarted = true;
      vm.myCoins = 10000;
      return true;
      ngDialog.openConfirm({
        template: 'app/routes/room/dialogs/waitforusers.html',
        controller: ['room', function(room) {

          var vm = this;

          vm.room = room;
        }],
        controllerAs: 'waitForUsersCtrl',
        resolve: {
          room: function() { return vm.room; }
        }
      })
      .then(function(response) {
        vm.roomStarted = true;
        vm.myCoins = 10000;
      })
      .catch(function(error) {
        $state.go('home');
        $log.log(error);
      });
    }

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

    var wool = generateRandomStockMarket(vm.timesToUpdateMarket, 20, 10, 100,
                [{ length: 7, variance: 50, noise: 1, trend: 0},
                 { length: 365, variance: 30, noise: 2, trend: 5},
                 { length: 700, variance: 2, noise: 0, trend: 50}]);

    var milk = generateRandomStockMarket(vm.timesToUpdateMarket, 80, 40, 400,
                [{ length: 7, variance: 90, noise: 2, trend: 0},
                 { length: 365, variance: 60, noise: 3, trend: 0},
                 { length: 700, variance: 4, noise: 0, trend: 100}]);

    var bacon = generateRandomStockMarket(vm.timesToUpdateMarket, 320, 160, 1600,
                [{ length: 7, variance: 170, noise: 4, trend: 0},
                 { length: 365, variance: 110, noise: 6, trend: 0},
                 { length: 700, variance: 8, noise: 0, trend: 200}]);

    var marketData = [wool, milk, bacon];
    console.log(marketData);

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

      waitForUsers();

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

          vm.changeAmount = changeAmount;

          vm.animal = animal;
          vm.coins = coins;
          vm.buyAmount = 0;

          function changeAmount(increment) {
            if(increment) { vm.buyAmount++; }
            if(!increment && vm.buyAmount > 0) {
              vm.buyAmount--;
            }
          }

        }],
        controllerAs: 'buyAnimalCtrl',
        resolve: {
          animal: function() { return animal; },
          coins: function() { return vm.myCoins; }
        }
      })
      .then(function(response) {
        if(!response.amountToBuy) { return; }

        if(vm.myCoins < response.amountToBuy * animal.buyFor) { return; }

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

          vm.changeAmount = changeAmount;

          vm.animal = animal;
          vm.animalInBarn = animalInBarn;
          vm.sellAmount = 0;

          function changeAmount(increment) {
            if(increment) { vm.sellAmount++; }
            if(!increment && vm.sellAmount > 0) {
              vm.sellAmount--;
            }
          }

        }],
        controllerAs: 'sellAnimalCtrl',
        resolve: {
          animal: function() { return animal; },
          animalInBarn: function() { return _.findWhere(vm.myBarn, { assetType: animal.assetType }); }
        }
      })
      .then(function(response) {
        if(!response.amountToSell) { return; }

        if(response.amountToSell > _.findWhere(vm.myBarn, { assetType: animal.assetType }).amount) { return; }

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

    function buyProduct(product) {
      ngDialog.openConfirm({
        template: 'app/routes/room/dialogs/buyproduct.html',
        controller: ['product', 'coins', function(product, coins) {

          var vm = this;

          vm.changeAmount = changeAmount;

          vm.product = product;
          vm.coins = coins;
          vm.buyAmount = 0;

          function changeAmount(increment) {
            if(increment) { vm.buyAmount++; }
            if(!increment && vm.buyAmount > 0) {
              vm.buyAmount--;
            }
          }

        }],
        controllerAs: 'buyProductCtrl',
        resolve: {
          product: function() { return product; },
          coins: function() { return vm.myCoins; }
        }
      })
      .then(function(response) {
        if(!response.amountToBuy) { return; }

        if(vm.myCoins < response.amountToBuy * product.buyFor) { return; }

        response.amountToBuy = parseInt(response.amountToBuy);

        // Update game
        _.findWhere(vm.myStorage, { currencyType: product.currencyType }).oldAmount = _.findWhere(vm.myStorage, { currencyType: product.currencyType }).amount;
        _.findWhere(vm.myStorage, { currencyType: product.currencyType }).amount += response.amountToBuy;
        vm.oldCoins = vm.myCoins
        vm.myCoins -= response.amountToBuy * product.buyFor;
      })
      .catch(function(error) {
        $log.log(error);
      });
      vm.assets = angular.copy(vm.assets); // Have to do this stupid reset because the swipe lib is ratarded
    }

    function sellProduct(product) {
      ngDialog.openConfirm({
        template: 'app/routes/room/dialogs/sellproduct.html',
        controller: ['product', 'productInStorage', function(product, productInStorage) {

          var vm = this;

          vm.changeAmount = changeAmount;

          vm.product = product;
          vm.productInStorage = productInStorage;
          vm.sellAmount = 0;

          function changeAmount(increment) {
            if(increment) { vm.sellAmount++; }
            if(!increment && vm.sellAmount > 0) {
              vm.sellAmount--;
            }
          }

        }],
        controllerAs: 'sellProductCtrl',
        resolve: {
          product: function() { return product; },
          productInStorage: function() { return _.findWhere(vm.myStorage, { currencyType: product.currencyType }); }
        }
      })
      .then(function(response) {
        if(!response.amountToSell) { return; }

        if(response.amountToSell > _.findWhere(vm.myStorage, { currencyType: product.currencyType }).amount) { return; }

        response.amountToSell = parseInt(response.amountToSell);

        // Update the game
        _.findWhere(vm.myStorage, { currencyType: product.currencyType }).oldAmount = _.findWhere(vm.myStorage, { currencyType: product.currencyType }).amount;
        _.findWhere(vm.myStorage, { currencyType: product.currencyType }).amount -= response.amountToSell;
        vm.oldCoins = vm.myCoins
        vm.myCoins += response.amountToSell * (product.buyFor * (1 - product.sellForPercentage));
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
      vm.enteredVault = true;
    }

    function addPinNumber(number) {
      if(vm.enteredPin.length === 5) { return; }

      vm.enteredPin.push(number);
    }

    function updateCurrencies() {
      _.each(vm.assets, function(asset) {
        asset.currency.buyFor = marketData[asset.currency.currencyType-1][vm.currentTick];
      });

      _.each(vm.myStorage, function(asset, index) {
        asset.currencyLink = vm.assets[index].currency;
      });
    }

    function getCurrenciesFromMiners() {
      _.each(vm.myStorage, function(currency, index) {
        currency.oldAmount = currency.amount;
        currency.amount += vm.myBarn[index].amount * (vm.myBarn[index].assetLink.currencyProduction.max * Math.random() + vm.myBarn[index].assetLink.currencyProduction.min);
      });
    }

    function shufflePinNumbers() {
      vm.enteredVault = false;
      vm.guardText = "I need a passcode before I can let you into this vault";
      vm.enteredPin = [];
      vm.availablePinNumbers = _.shuffle(PIN_NUMBERS);
    }

    function makeEmptyArray(length) {
      return _.range(length);
    }

    function buyCard(index) {

    }

    function buyOrSelectCard(card, index) {
      if(card) { return vm.highlightedCard = card; }

      if(vm.myCoins < 600 ) { return; }

      vm.cards[index] = angular.copy(_.first(_.shuffle(CARDS)));

      vm.oldCoins = vm.myCoins;
      vm.myCoins -= 600;
    }

  }
})();
