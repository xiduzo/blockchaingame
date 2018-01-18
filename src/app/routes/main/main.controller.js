(function() {
  'use strict';

  angular
    .module('angulargame')
    .controller('MainController', MainController);

  /** @ngInject */
  function MainController(
    $scope,
    $state,
    $log,
    Rooms,
    Global,
    Users,
    ngDialog,
    toastr,
    localStorageService
  ) {

    var vm = this;

    // Methods
    vm.newRoom = newRoom;
    vm.removeRoom = removeRoom;
    vm.createUser = createUser;

    // Variables
    vm.fetchingRooms = true;
    vm.user = Global.getUser();
    vm.newUserName = null;
    vm.roomName = null;
    vm.roomTime = null;
    vm.roomPlayers = null;
    vm.rooms = [];
    vm.roomHeaderTitle = 'Welcome';
    vm.waitingForData = false;
    vm.currentStep = 0;
    vm.showSteps = vm.user.name ? false : true;

    // Extra logic
    function createUser() {
      vm.waitingForData = true;
      if(!vm.newUserName) { return; }

      Users.api.post({
        name: vm.newUserName,
        isSuperUser: vm.newUserName.toLowerCase() == 'xiduzo' ? true : false
      }).then(function(response) {
        vm.waitingForData = false;
        localStorageService.set('user', response);
        Global.setUser(response);
        vm.user = response;
        vm.screen = 'intro_1';
        vm.roomHeaderTitle = "Get ready"
      });
    }

    // Broadcasts
    $scope.$on('addRoom', function(event, response) {
      vm.rooms.push(response.data);
    });

    $scope.$on('removeRoom', function(event, response) {
      vm.rooms = _.without(vm.rooms, _.find(vm.rooms, function(room) {
        return room._id.$oid == response.data._id.$oid;
      }));
    });

    $scope.$on("roomDelete", function(event, response) {
      vm.rooms = _.without(vm.rooms, _.find(vm.rooms, function(room) {
        return room._id.$oid == response.data.room;
      }));
    })

    // Services
    Rooms.api.getList().then(function(rooms) {
      vm.rooms = rooms;
      vm.fetchingRooms = false;
    });

    // Method declarations
    function newRoom() {
      Rooms.api.post({
        name: vm.roomName,
        time: vm.roomTime,
        players: vm.roomPlayers,
        dateTime: moment(),
        roomPin: parseInt(moment().format("m") + moment().format("H") + moment().format("SSS")),
        users: []
      }).then(function(response) {
        Rooms.socket("addRoom", response);
        $state.go("room", { roomId: response._id.$oid });
      });
    }

    function removeRoom(room) {
      Rooms.api.one(room._id.$oid).remove().then(function(response) {
        Rooms.socket("removeRoom", response);
      });
    }

  }
})();
