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
    CARDS,
    PIN_NUMBERS_TO_ENTER,
    ADDONS
  ) {

    var vm = this;

    /*--------------------------
      Methods
    --------------------------*/
    vm.sellAnimal = sellAnimal;
    vm.buyAnimal = buyAnimal;
    vm.sellProduct = sellProduct;
    vm.buyProduct = buyProduct;
    vm.enterVault = enterVault;
    vm.buyOrSelectCard = buyOrSelectCard;
    vm.buyAddon = buyAddon;

    /*--------------------------
      Variables
    --------------------------*/
    vm.user = Global.getUser();
    vm.room = undefined;
    vm.stopAllTimers = false;
    vm.charts = [];

    vm.timeThisRound = 0;
    vm.currentTick = 0;
    vm.updateCurrenciesTick = 0;
    vm.updateRobbersTick = 0;

    vm.enteredVault = false;
    vm.myPincode = '';

    vm.addonsAvailable = true;
    vm.vaultAvailable = false;
    vm.cardsAvailable = false;
    vm.animalsAvailable = false;

    vm.assets = angular.copy(BASE_RECOURCES.ASSETS);
    vm.myStorage = angular.copy(BASE_RECOURCES.STORAGE);
    vm.myBarn = angular.copy(BASE_RECOURCES.BARN);
    vm.myVault = angular.copy(BASE_RECOURCES.VAULT);
    vm.wallet = angular.copy(BASE_WALLET);
    vm.addons = angular.copy(ADDONS);

    vm.oldCoins = 0; // Need this for fancy counter
    vm.myCoins = 0;

    vm.cards = [_.first(_.shuffle(CARDS)), undefined, undefined];
    vm.highlightedCard = {};

    /*--------------------------
      Broadcasts
    --------------------------*/
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
        vm.room.settings = response.data.roomSettings;
        console.log(vm.room.settings);
        ngDialog.closeAll();
        vm.myCoins = 10000;
        drawChart(_.first(vm.myBarn));
        countDownTimer();
        updateCurrenciesTimer();
        introduceAnimal(false);
      }
    });

    /*--------------------------
      Extra logic
    --------------------------*/
    Rooms.socket("roomJoin", {
      "user": vm.user,
      "room": $stateParams.roomId
    });

    $scope.$on("$destroy", function() {
      vm.stopAllTimers = true;
      // Remove the room when the player is the last on in the room
      if(vm.room && vm.room.users.length === 1) {
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
      if(vm.stopAllTimers) { return; }
      $timeout(function() {
        vm.timeThisRound--;
        vm.currentTick++;

        if(vm.currentTick % 30 === 0) { getCurrenciesFromMiners(); }
        // Introduce items in the game
        switch (vm.currentTick) {
          case vm.room.settings.introduce_sheep:
            introduceAnimal(1);
            break;
          case vm.room.settings.introduce_cows:
            introduceAnimal(2);
            _.findWhere(vm.addons, {addonType: 3}).addons[0].available = true;
            break;
          case vm.room.settings.introduce_pig:
            introduceAnimal(3);
            _.findWhere(vm.addons, {addonType: 3}).addons[1].available = true;
            break;
          case vm.room.settings.introduce_robbbers:
            introduceRobbers();
            break;
        }

        if(vm.timeThisRound > 0) {
          countDownTimer();
        } else {
          vm.stopAllTimers = true;
        }
      }, 1000);
    }

    function updateCurrenciesTimer() {
      if(vm.stopAllTimers) { return; }
      $timeout(function() {
        vm.updateCurrenciesTick++;
        updateCurrencies();
        updateCurrenciesTimer();
      }, 1000 * (vm.room.settings.currency_update_ticks[vm.updateCurrenciesTick] > vm.timeThisRound ? vm.timeThisRound : vm.room.settings.currency_update_ticks[vm.updateCurrenciesTick]));
    }

    function robbersAttemptTimer() {
      if(vm.stopAllTimers) { return; }
      $timeout(function() {
        vm.updateRobbersTick++;
        robbersAttempt();
        robbersAttemptTimer();
      }, 1000 * vm.room.settings.robbers_attempt_ticks[vm.updateRobbersTick]);
    }

    function waitForUsers() {
      ngDialog.closeAll();
      ngDialog.openConfirm({
        template: 'app/routes/room/dialogs/waitforusers.html',
        closeByDocument: false,
        className: 'c-dialog',
        controller: ['room', 'createdRoom', function(room, createdRoom) {

          var vm = this;

          vm.room = room;
          vm.createdRoom = createdRoom;

        }],
        controllerAs: 'waitForUsersCtrl',
        resolve: {
          room: function() { return vm.room; },
          createdRoom: function() { return _.first(vm.room.users)._id.$oid == vm.user._id.$oid ? true : false; },
        }
      })
      .then(function(response) {
        if(response && response.closedByButton) { return $state.go('home'); }

        var wool = generateRandomStockMarket(angular.copy(vm.timeThisRound), 20, 10, 100,
                    [{ length: 7, variance: 50, noise: 1, trend: 0},
                     { length: 365, variance: 30, noise: 2, trend: 5},
                     { length: 700, variance: 2, noise: 0, trend: 50}]);

        var milk = generateRandomStockMarket(angular.copy(vm.timeThisRound), 80, 40, 400,
                    [{ length: 7, variance: 90, noise: 2, trend: 0},
                     { length: 365, variance: 60, noise: 3, trend: 0},
                     { length: 700, variance: 4, noise: 0, trend: 100}]);

        var bacon = generateRandomStockMarket(angular.copy(vm.timeThisRound), 320, 160, 1600,
                    [{ length: 7, variance: 170, noise: 4, trend: 0},
                     { length: 365, variance: 110, noise: 6, trend: 0},
                     { length: 700, variance: 8, noise: 0, trend: 200}]);

        Rooms.socket("roomStarted", {
          "room": $stateParams.roomId,
          "roomSettings": {
            markets: [wool, milk, bacon],
            introduce_sheep: Math.round((Math.round(Math.random() * 5 + 5) / 100) * vm.timeThisRound),
            introduce_cows: Math.round((Math.round(Math.random() * 10 + 15) / 100) * vm.timeThisRound),
            introduce_pig: Math.round((Math.round(Math.random() * 20 + 40) / 100) * vm.timeThisRound),
            introduce_robbbers: Math.round((Math.round(Math.random() * 0 + 1) / 100) * vm.timeThisRound),
            currency_update_ticks: _.map(_.range(vm.timeThisRound), function() {
              return Math.round(Math.random() * 3 + 5);
            }),
            robbers_attempt_ticks: _.map(_.range(vm.timeThisRound), function() {
              return Math.round(Math.random() * 5 + 5);
            })
          }
        });
      })
      .catch(function(error) {
        ngDialog.openConfirm({
          template: 'app/routes/room/dialogs/areyousure.html',
          closeByDocument: false,
          className: 'c-dialog',
          controller: ['user', function(user) {

            var vm = this;

            vm.user = user;

          }],
          controllerAs: 'areYouSureCtrl',
          resolve: {
            user: function() { return vm.user; }
          }
        })
        .then(function(response) {
          vm.stopAllTimers;
          $state.go('home');
        })
        .catch(function(error) {
          waitForUsers();
        });
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

    function activeAnimal(animal) {
      _.findWhere(vm.assets, {assetType: animal.assetType}).active = true;
      _.findWhere(vm.assets, {assetType: animal.assetType}).currency.active = true;
      _.findWhere(vm.myBarn, {assetType: animal.assetType}).active = true;
      _.findWhere(vm.myStorage, {assetType: animal.assetType}).active = true;

      // Fix the charts on resize
      redrawCharts();
    }

    function redrawCharts() {
      $timeout(function() {
        _.each(vm.myBarn, function(animal) {
          if(animal.active) { drawChart(animal); }
        });
      }, 100);
    }

    function drawChart(animal) {
      var history = _.findWhere(vm.assets, {assetType: animal.assetType }).currency.history;
      $timeout(function() {
        var chart = Highcharts.chart('graph--'+animal.assetLink.currency.name, {
          title: { text: '' },
          chart: {
            type: "spline",
            backgroundColor: Highcharts.Color('#000000').setOpacity(0).get(),
            spacing: [0, 0, 5, 0]
          },

          yAxis: { visible: false },
          xAxis: { visible: false },
          legend: { enabled: false },
          credits: { enabled: false },

          plotOptions: {
            series: { animation: false },
            spline: { marker: { radius: 0 } }
          },

          series: [
            {
              name: animal.assetLink.currency.name,
              data: _.last(history, 20),
              color: Highcharts.Color('#000000').setOpacity(0.2).get()
            }
          ]
        });
        vm.charts[animal.assetType-1] = chart;
      }, 100);
    }

    function introduceAnimal(animal) {
      ngDialog.closeAll();
      if(animal) {
        animal = _.findWhere(vm.myBarn, {assetType: animal});
        animal.activate = true;
      } else {
        animal = angular.copy(_.findWhere(vm.myBarn, {assetType: 1}));
        animal.activate = false;
        animal.assetLink.merchant = "merchant.png";
        animal.assetLink.merchantText = "There is a new merchant in town who sells and buys <strong>wool</strong>.";
        animal.assetLink.merchantWarning = "Keep an eye on the wool prices as they change over time";
      }
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
        if(animal.activate) {
          vm.animalsAvailable = true;
          activeAnimal(animal);
        }
      })
      .catch(function() {
        if(animal.activate) {
          vm.animalsAvailable = true;
          activeAnimal(animal);
        }
      });
    }

    function introduceRobbers() {
      ngDialog.closeAll();
      ngDialog.openConfirm({
        template: 'app/routes/room/dialogs/robbers.html',
        closeByDocument: false,
        showClose: false,
        className: 'c-dialog c-dialog--no-close-button',
        controller: ['$scope', function($scope) {

          var vm = this;

          vm.screen = 'guard';
        }],
        controllerAs: 'introduceRobbersCtrl'
      })
      .then(function() {
        vm.addons[1].addons[0].available = true;
        robbersAttemptTimer();
        vm.vaultAvailable = true;
      })
      .catch(function() {
        vm.addons[1].addons[0].available = true;
        robbersAttemptTimer();
        vm.vaultAvailable = true;
      });
    }

    function robbersAttempt() {
      var robberyPower = Math.round(Math.random() * 90);
      if(robberyPower > vm.wallet.security + vm.wallet.security_increase) {
        console.log("robery successfull");
      }
    }

    /*--------------------------
      Serices
    --------------------------*/
    Rooms.api.one($stateParams.roomId).get()
    .then(function(response) {
      vm.room = response;
      vm.timeThisRound = 60 * response.time;

      // Only add yourself when not in the room
      // Prevents duplicate users
      if(!_.find(vm.room.users, function(user) {
        return user._id.$oid == vm.user._id.$oid;
      })) {
        vm.room.users.push(vm.user);
        vm.room.put();
      }

      waitForUsers();

    })
    .catch(function(error) {
      if(error.status === 404) {
        toastr.error("Can not find room");
        return $state.go('home');
      }
    });

    /*--------------------------
      Methods declarations
    --------------------------*/
    function buyAnimal(animal) {
      ngDialog.closeAll();
      ngDialog.openConfirm({
        template: 'app/routes/room/dialogs/buyanimal.html',
        controller: ['animal', 'coins', 'storage', function(animal, coins, storage) {

          var vm = this;

          // Methods
          vm.changeAmount = changeAmount;
          vm.parseAmount = parseAmount;

          // Variables
          vm.animal = animal;
          vm.coins = coins;
          vm.buyAmount = 0;
          vm.canUse = _.findWhere(storage, { currencyType: animal.currency.currencyType}).canUse;

          // Method declarations
          function parseAmount() {
            parseInt(vm.buyAmount, 10);
          }

          function changeAmount(increment) {
            if(increment) { vm.buyAmount++; }
            if(!increment && vm.buyAmount > 0) { vm.buyAmount--; }
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

        response.amountToBuy = parseInt(response.amountToBuy); // Just to be sure

        // Update game
        _.findWhere(vm.myBarn, { assetType: animal.assetType }).oldAmount = _.findWhere(vm.myBarn, { assetType: animal.assetType }).amount;
        _.findWhere(vm.myBarn, { assetType: animal.assetType }).amount += response.amountToBuy;
        vm.oldCoins = vm.myCoins
        vm.myCoins -= response.amountToBuy * animal.buyFor;
      })
      .catch(function(error) { $log.log(error); });

      vm.assets = angular.copy(vm.assets); // Have to do this stupid reset because the swipe lib is ratarded
    }

    function sellAnimal(animal) {
      ngDialog.closeAll();
      ngDialog.openConfirm({
        template: 'app/routes/room/dialogs/sellanimal.html',
        controller: ['animal', 'animalInBarn', function(animal, animalInBarn) {

          var vm = this;

          // Methods
          vm.changeAmount = changeAmount;
          vm.parseAmount = parseAmount;

          // Variables
          vm.animal = animal;
          vm.animalInBarn = animalInBarn;
          vm.sellAmount = 0;

          // Method declarations
          function parseAmount() { parseInt(vm.sellAmount, 10); }

          function changeAmount(increment) {
            if(increment) { vm.sellAmount++; }
            if(!increment && vm.sellAmount > 0) { vm.sellAmount--; }
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

        response.amountToSell = parseInt(response.amountToSell); // Just to be sure

        // Update the game
        _.findWhere(vm.myBarn, { assetType: animal.assetType }).oldAmount = _.findWhere(vm.myBarn, { assetType: animal.assetType }).amount;
        _.findWhere(vm.myBarn, { assetType: animal.assetType }).amount -= response.amountToSell;
        vm.oldCoins = vm.myCoins
        vm.myCoins += response.amountToSell * (animal.buyFor * (1 - animal.sellForPercentage));
      })
      .catch(function(error) { $log.log(error); });

      vm.assets = angular.copy(vm.assets); // Have to do this stupid reset because the swipe lib is ratarded
    }

    function buyProduct(product) {
      ngDialog.closeAll();
      ngDialog.openConfirm({
        template: 'app/routes/room/dialogs/buyproduct.html',
        controller: ['product', 'coins', 'canUse', function(product, coins, canUse) {

          var vm = this;

          // Methods
          vm.changeAmount = changeAmount;
          vm.parseAmount = parseAmount;

          // Variables
          vm.product = product;
          vm.coins = coins;
          vm.buyAmount = 0;
          vm.canUse = canUse;

          // Method declarations
          function parseAmount() { parseInt(vm.buyAmount, 10); }

          function changeAmount(increment) {
            if(increment) { vm.buyAmount++; }
            if(!increment && vm.buyAmount > 0) { vm.buyAmount--; }
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

        response.amountToBuy = parseInt(response.amountToBuy); // Just to be sure

        // Update game
        _.findWhere(vm.myStorage, { currencyType: product.currencyType }).oldAmount = _.findWhere(vm.myStorage, { currencyType: product.currencyType }).amount;
        _.findWhere(vm.myStorage, { currencyType: product.currencyType }).amount += response.amountToBuy;
        vm.oldCoins = vm.myCoins
        vm.myCoins -= response.amountToBuy * product.buyFor;
      })
      .catch(function(error) { $log.log(error); });
      vm.assets = angular.copy(vm.assets); // Have to do this stupid reset because the swipe lib is ratarded
      redrawCharts();
    }

    function sellProduct(product) {
      ngDialog.closeAll();
      ngDialog.openConfirm({
        template: 'app/routes/room/dialogs/sellproduct.html',
        controller: ['product', 'productInStorage', function(product, productInStorage) {

          var vm = this;

          // Methods
          vm.changeAmount = changeAmount;
          vm.parseAmount = parseAmount;

          // Variables
          vm.product = product;
          vm.productInStorage = productInStorage;
          vm.sellAmount = 0;

          // Method declarations
          function parseAmount() { parseInt(vm.sellAmount, 10); }

          function changeAmount(increment) {
            if(increment) { vm.sellAmount++; }
            if(!increment && vm.sellAmount > 0) { vm.sellAmount--; }
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

        response.amountToSell = parseInt(response.amountToSell); // Just to be sure

        // Update the game
        _.findWhere(vm.myStorage, { currencyType: product.currencyType }).oldAmount = _.findWhere(vm.myStorage, { currencyType: product.currencyType }).amount;
        _.findWhere(vm.myStorage, { currencyType: product.currencyType }).amount -= response.amountToSell;
        vm.oldCoins = vm.myCoins
        vm.myCoins += response.amountToSell * (product.buyFor * (1 - product.sellForPercentage));
      })
      .catch(function(error) { $log.log(error); });
      vm.assets = angular.copy(vm.assets); // Have to do this stupid reset because the swipe lib is ratarded
      redrawCharts();
    }

    function generatePinCode() {
      ngDialog.closeAll();
      ngDialog.openConfirm({
        template: 'app/routes/room/dialogs/pincode.html',
        className: 'c-dialog c-dialog--black',
        controller: ['$scope', function($scope) {

          var vm = this;

          // Methods
          vm.undoPinNumber = undoPinNumber;
          vm.addPinNumber = addPinNumber;
          vm.pinNumbersAvailable = _.range(PIN_NUMBERS_TO_ENTER);

          // Variables
          vm.pinNumbers = [];
          vm.title = "Create a pincode";
          vm.enteredPin = [];

          // Extra logic
          function generatePinNumbers() {
            vm.pinNumbers = [];
            _.each([1,2,3], function() {
              vm.pinNumbers.push(_.first( _.shuffle(_.without(PIN_NUMBERS, _.last(vm.enteredPin)))))
            });
          }

          generatePinNumbers();

          // Method declarations
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
      .catch(function(error) { $log.log(error); });
    }

    function enterVault() {
      ngDialog.closeAll();
      vm.enteredVault = false;
      if(vm.myPincode.length === 0) { return generatePinCode(); }

      ngDialog.openConfirm({
        template: 'app/routes/room/dialogs/pincode.html',
        className: 'c-dialog c-dialog--black',
        controller: ['pinNumbers', function(pinNumbers) {

          var vm = this;

          // Methods
          vm.undoPinNumber = undoPinNumber;
          vm.addPinNumber = addPinNumber;
          vm.pinNumbersAvailable = _.range(PIN_NUMBERS_TO_ENTER);

          // Variables
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
      .catch(function(error) { $log.log(error); });
    }

    function updateCurrencies() {
      // Update the assets
      _.each(vm.assets, function(asset, index) {
        if(asset.currency.active) {
          asset.currency.previousBuyFor = asset.currency.buyFor;
          asset.currency.buyFor = vm.room.settings.markets[asset.currency.currencyType-1][asset.currency.history.length-1];
          asset.currency.history.push(asset.currency.buyFor);

          // Also update your storage
          vm.myStorage[index].currencyLink = asset.currency;

          // Update the charts
          if(vm.charts[index]) { drawChart(vm.myBarn[index]); }
        }


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

    function buyOrSelectCard(card, index) {
      if(card) { return vm.highlightedCard = card; }

      if(vm.myCoins < 600 ) { return; }

      vm.cards[index] = angular.copy(_.first(_.shuffle(CARDS)));

      vm.oldCoins = vm.myCoins;
      vm.myCoins -= 600;
    }

    function buyAddon(addon, addonTree, index) {
      ngDialog.closeAll();
      if(addon.owned || !addon.available) { return false; }
      ngDialog.openConfirm({
        template: 'app/routes/room/dialogs/buyaddon.html',
        controller: ['addon', 'coins', function(addon, coins) {

          var vm = this;

          vm.addon = addon;
          vm.coins = coins;

        }],
        controllerAs: 'buyAddonCtrl',
        resolve: {
          addon: function() { return addon; },
          coins: function() { return vm.myCoins; }
        }
      })
      .then(function(response) {
        if(!response || !response.buyAddon) { return false; }

        addon.owned = true;
        vm.oldCoins = vm.coins;
        vm.coins -= addon.buyFor;

        console.log(addonTree.addons[index+1], addonTree.addonType);
        if(addonTree.addons[index+1] && addonTree.addonType != 3) {
          addonTree.addons[index+1].available = true;
        }

        switch (addonTree.addonType) {
          case 1:
            vm.wallet.transaction_fee_decrease += response.addon.effect;
            break;
          case 2:
            vm.wallet.security_increase += response.addon.effect;
            break;
          case 3:
            _.findWhere(vm.myStorage, {assetType: response.addon.animalType}).canUse = true;
            break;
        }
      })
      .catch(function(error) {
        $log.log(error);
      });
    }
  }
})();
