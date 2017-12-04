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
    Rooms
  ) {

    var vm = this;

    // Methods

    // Variables
    vm.usersInRoom = 0;

    vm.currencies = [
      {
        "currencyType": 1,
        "name": "Sheep",
        "cost": 200,
        "product": {
          "productType": 1,
          "name": "wool",
          "cost": 20
        }
      }
    ];

    vm.myVault = [
      {
        "productType": 1,
        "amount": 0
      }
    ];

    vm.myAssets = [
      {
        "currencyType": 1,
        "amount": 5
      }
    ];

    // Extra logic
    $scope.$on('roomJoin', function(event, response) {
      if(response.data.room == $stateParams.roomId) {
        vm.usersInRoom++;
      }
    });

    $scope.$on("roomLeave", function(event, response) {
      if(response.data.room == $stateParams.roomId) {
        vm.usersInRoom--;
      }
    });

    Rooms.socket("roomJoin", {
      "user": 1,
      "room": $stateParams.roomId
    });

    // TODO: fix this when the user quits the tab
    $scope.$on("$destroy", function(){
      Rooms.socket("roomLeave", {
        "user": 1,
        "room": $stateParams.roomId
      })
    });

    // Services
    Rooms.api.one($stateParams.roomId).get().then(function(response) {
      vm.room = response;
    });

    // Method declarations


  }
})();
