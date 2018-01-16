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
    toastr,
    Rooms,
    Global,
    ngDialog,
    BASE_RECOURCES,
    BASE_WALLET,
    PIN_NUMBERS,
    ROOM_MEMBERS_NEEDED_TO_PLAY,
    CARDS,
    PIN_NUMBERS_TO_ENTER
  ) {

    var vm = this;

    // Methods
    vm.kickUser = kickUser;
    vm.sellAnimal = sellAnimal;
    vm.buyAnimal = buyAnimal;
    vm.sellProduct = sellProduct;
    vm.buyProduct = buyProduct;
    vm.enterVault = enterVault;
    vm.shufflePinNumbers = shufflePinNumbers;
    vm.makeEmptyArray = makeEmptyArray;
    vm.buyOrSelectCard = buyOrSelectCard;

    // Variables
    vm.user = Global.getUser();
    vm.room = undefined;
    vm.roomStarted = true;
    vm.addonsAvailable = false;

    vm.timeThisRound = 60 * 10;
    vm.currentTick = 0;
    vm.timesToUpdateMarket = angular.copy(vm.timeThisRound);

    vm.vaultAvailable = false;
    vm.enteredVault = false;
    vm.myPincode = '';

    vm.cardsAvailable = false;
    vm.animalsAvailable = false;

    vm.assets = angular.copy(BASE_RECOURCES.ASSETS);
    vm.myStorage = angular.copy(BASE_RECOURCES.STORAGE);
    vm.myBarn = angular.copy(BASE_RECOURCES.BARN);
    vm.myVault = angular.copy(BASE_RECOURCES.VAULT);
    vm.wallet = angular.copy(BASE_WALLET);

    vm.oldCoins = 0; // Need this for fancy counter
    vm.myCoins = 0;

    vm.cards = [_.first(_.shuffle(CARDS)), undefined, undefined];
    vm.highlightedCard = {};

    // Broadcasts
    $scope.$on('roomJoin', function(event, response) {
      if(response.data.room == $stateParams.roomId) {

        if(response.data.user._id.$oid != vm.user._id.$oid) {
          // Only add yourself when not in the room
          // Prevents duplicate users
          if(!_.find(vm.room.users, function(user) {
            return user._id.$oid == response.data.user._id.$oid;
          })) {
            vm.room.users.push(response.data.user);
          }
        }
      }
    });

    $scope.$on("roomLeave", function(event, response) {
      if(response.data.room == $stateParams.roomId) {
        vm.room.users = _.without(vm.room.users, _.find(vm.room.users, function(user) {
          return user._id.$oid == response.data.user._id.$oid;
        }));

        // Update
        vm.room.put();
      }
    });

    $scope.$on("roomStarted", function(event, response) {
      if(response.data.room == $stateParams.roomId) {
        console.log(response.data.roomSettings);
        vm.room.markets = response.data.roomSettings.markets;
        vm.introduce_sheep = response.data.roomSettings.introduce_sheep;
        vm.introduce_cows = response.data.roomSettings.introduce_cows;
        vm.introduce_pig = response.data.roomSettings.introduce_pig;
        ngDialog.closeAll();
        vm.myCoins = 10000;
        vm.roomStarted = true;
        countDownTimer();
      }
    })

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

        if(vm.currentTick % 10 === 0) { updateCurrencies(); }

        if(vm.currentTick % 30 === 0) { getCurrenciesFromMiners(); }


        // Introduce items in the game
        switch (vm.currentTick) {
          case vm.introduce_sheep:
            introduceAnimal(1);
            break;
          case vm.introduce_cows:
            introduceAnimal(2);
            break;
          case vm.introduce_pig:
            introduceAnimal(3);
            break;
        }

        if(vm.timeThisRound > 0) { countDownTimer(); }
      }, 1000);
    }

    // Wait to start game for users
    function waitForUsers() {
      ngDialog.openConfirm({
        template: 'app/routes/room/dialogs/waitforusers.html',
        showClose: false,
        closeByDocument: false,
        className: 'c-dialog c-dialog--no-close-button',
        controller: ['room', 'createdRoom', function(room, createdRoom) {

          var vm = this;

          vm.room = room;
          vm.roomMembersNeededToPlay = ROOM_MEMBERS_NEEDED_TO_PLAY;
          vm.createdRoom = createdRoom;

        }],
        controllerAs: 'waitForUsersCtrl',
        resolve: {
          room: function() { return vm.room; },
          createdRoom: function() { return _.first(vm.room.users)._id.$oid == vm.user._id.$oid ? true : false; }
        }
      })
      .then(function(response) {
        if(response && response.closedByButton) { return $state.go('home'); }

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

        Rooms.socket("roomStarted", {
          "room": $stateParams.roomId,
          "roomSettings": {
            markets: [wool, milk, bacon],
            introduce_sheep: Math.round((Math.round(Math.random() * 5 + 5) / 100) * vm.timeThisRound),
            introduce_cows: Math.round((Math.round(Math.random() * 10 + 15) / 100) * vm.timeThisRound),
            introduce_pig: Math.round((Math.round(Math.random() * 20 + 40) / 100) * vm.timeThisRound)

          }
        });
      })
      .catch(function(error) {
        $log.error(error);
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

    // Services
    Rooms.api.one($stateParams.roomId).get().then(function(response) {
      vm.room = response;

      // Only add yourself when not in the room
      // Prevents duplicate users
      if(!_.find(vm.room.users, function(user) {
        return user._id.$oid == vm.user._id.$oid;
      })) {
        vm.room.users.push(vm.user);
        vm.room.put();
      }

      waitForUsers();

    });

    function introduceAnimal(animal) {
      ngDialog.closeAll();
      animal = _.findWhere(vm.myBarn, {assetType: animal});
      ngDialog.openConfirm({
        template: 'app/routes/room/dialogs/merchant.html',
        closeByDocument: false,
        controller: ['animal', function(animal) {

          var vm = this;

          vm.animal = animal;
        }],
        controllerAs: 'introduceAnimalCtrl',
        resolve: {
          animal: function() { return animal; }
        }
      })
      .then(function() {
        vm.animalsAvailable = true;
        activeAnimal(animal);
      })
      .catch(function() {
        vm.animalsAvailable = true;
        activeAnimal(animal);
      });
    }

    function activeAnimal(animal) {
      _.findWhere(vm.assets, {assetType: animal.assetType}).active = true;
      _.findWhere(vm.assets, {assetType: animal.assetType}).currency.active = true;
      _.findWhere(vm.myBarn, {assetType: animal.assetType}).active = true;
      _.findWhere(vm.myStorage, {assetType: animal.assetType}).active = true;
    }

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
        controller: ['animal', 'coins', 'storage', function(animal, coins, storage) {

          var vm = this;

          vm.changeAmount = changeAmount;
          vm.parseAmount = parseAmount;

          vm.animal = animal;
          vm.coins = coins;
          vm.buyAmount = 0;
          vm.canUse = _.findWhere(storage, { currencyType: animal.currency.currencyType}).canUse;

          function parseAmount() {
            parseInt(vm.buyAmount, 10);
          }

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
          coins: function() { return vm.myCoins; },
          storage: function() { return vm.myStorage; }
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
          vm.parseAmount = parseAmount;

          vm.animal = animal;
          vm.animalInBarn = animalInBarn;
          vm.sellAmount = 0;

          function parseAmount() {
            parseInt(vm.sellAmount, 10);
          }

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
        controller: ['product', 'coins', 'canUse', function(product, coins, canUse) {

          var vm = this;

          vm.changeAmount = changeAmount;
          vm.parseAmount = parseAmount;

          vm.product = product;
          vm.coins = coins;
          vm.buyAmount = 0;
          vm.canUse = canUse;

          function parseAmount() {
            parseInt(vm.buyAmount, 10);
          }

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
          coins: function() { return vm.myCoins; },
          canUse: function() { return _.findWhere(vm.myStorage, { currencyType: product.currencyType }).canUse; }
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
          vm.parseAmount = parseAmount;

          vm.product = product;
          vm.productInStorage = productInStorage;
          vm.sellAmount = 0;

          function parseAmount() {
            parseInt(vm.sellAmount, 10);
          }

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

    function generatePinCode() {
      ngDialog.openConfirm({
        template: 'app/routes/room/dialogs/pincode.html',
        className: 'c-dialog c-dialog--black',
        controller: ['$scope', function($scope) {

          var vm = this;

          vm.undoPinNumber = undoPinNumber;
          vm.addPinNumber = addPinNumber;
          vm.pinNumbersAvailable = _.range(PIN_NUMBERS_TO_ENTER);

          vm.pinNumbers = [];
          vm.title = "Create a pincode";
          vm.enteredPin = [];

          generatePinNumbers();

          function generatePinNumbers() {
            vm.pinNumbers = [];
            _.each([1,2,3], function() {
              vm.pinNumbers.push(_.first( _.shuffle(_.without(PIN_NUMBERS, _.last(vm.enteredPin)))))
            });
          }

          function undoPinNumber() {
            if(vm.enteredPin.length === 0) { return; }

            vm.enteredPin.pop();
            generatePinNumbers();
          }

          function addPinNumber(number) {
            if(vm.enteredPin.length === PIN_NUMBERS_TO_ENTER) { return; }

            vm.enteredPin.push(number);
            generatePinNumbers();
          }

        }],
        controllerAs: 'enterVaultCtrl'
      })
      .then(function(response) {
        _.each(response.pincode, function(pinnumber) {
          vm.myPincode += pinnumber.number;
        });
        vm.enterVault();
      })
      .catch(function(error) {
        $log.log(error);
      });
    }

    function enterVault() {
      vm.enteredVault = false;
      if(vm.myPincode.length === 0) { return generatePinCode(); }

      ngDialog.openConfirm({
        template: 'app/routes/room/dialogs/pincode.html',
        className: 'c-dialog c-dialog--black',
        controller: ['pinNumbers', function(pinNumbers) {

          var vm = this;

          vm.undoPinNumber = undoPinNumber;
          vm.addPinNumber = addPinNumber;
          vm.pinNumbersAvailable = _.range(PIN_NUMBERS_TO_ENTER);

          vm.pinNumbers = pinNumbers;
          vm.title = "Vault pin";

          vm.enteredPin = [];

          function undoPinNumber() {
            if(vm.enteredPin.length === 0) { return; }

            vm.enteredPin.pop();
          }

          function addPinNumber(number) {
            if(vm.enteredPin.length === PIN_NUMBERS_TO_ENTER) { return; }

            vm.enteredPin.push(number);
          }

        }],
        controllerAs: 'enterVaultCtrl',
        resolve: {
          pinNumbers: function() { return _.shuffle(PIN_NUMBERS); }
        }
      })
      .then(function(response) {
        if(response.pincode.length < PIN_NUMBERS_TO_ENTER) { return toastr.error("I need a pincombination of " + PIN_NUMBERS_TO_ENTER + " items"); }

        var pincode = "";

        _.each(response.pincode, function(pinnumber) {
          pincode += pinnumber.number;
        });

        if(pincode != vm.myPincode) { return toastr.error("You shall not pass!"); }

        vm.enteredVault = true;
      })
      .catch(function(error) {
        $log.log(error);
      });
      // if(vm.enteredPin.length < 5) {
      //   return vm.guardText = "I need a pincombination of 5 items before I can check your code."
      // }
      //
      // var pincode = "";
      // var myPinCode = "005522";
      //
      // _.each(vm.enteredPin, function(pinnumber) {
      //   pincode += pinnumber.number;
      // });
      //
      // if(pincode !== myPinCode) {
      //   return vm.guardText = "You shall not pass!";
      // }
      //
      // vm.guardText = "Goodday, " + vm.user.name + ", glad to see you back";
      // vm.enteredVault = true;
    }

    function updateCurrencies() {
      _.each(vm.assets, function(asset) {
        asset.currency.buyFor = vm.room.markets[asset.currency.currencyType-1][vm.currentTick];
      });

      _.each(vm.myStorage, function(asset, index) {
        asset.currencyLink = vm.assets[index].currency;
      });
    }

    function getCurrenciesFromMiners() {
      // TODO:
      // Only get currencies if your wallet support
      _.each(vm.myStorage, function(currency, index) {
        if(!currency.canUse) { return; } // Do not update anything if your wallet does not support the currency
        currency.oldAmount = currency.amount;
        currency.amount += vm.myBarn[index].amount * (vm.myBarn[index].assetLink.currencyProduction.max * Math.random() + vm.myBarn[index].assetLink.currencyProduction.min);
      });
    }

    function shufflePinNumbers() {
      vm.guardText = "I need a passcode before I can let you into this vault";
      vm.enteredPin = [];
      vm.availablePinNumbers = _.shuffle(PIN_NUMBERS);
    }

    function makeEmptyArray(length) {
      return _.range(length);
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
