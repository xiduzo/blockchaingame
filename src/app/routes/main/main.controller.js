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

    // Variables
    vm.fetchingRooms = true;
    vm.user = Global.getUser();

    // Extra logic
    function newUser() {
      ngDialog.open({
        template: 'app/routes/main/dialogs/register.html',
        className: 'ngdialog-theme-default',
        controller: ['$scope', function($scope) {
        }],
        controllerAs: 'registerCtrl',
        preCloseCallback: function(response) {
          if(!response.name) {
            toastr.error("Please fill in an username");
            newUser();
          } else {
            Users.api.post({
              name: response.name
            }).then(function(response) {
              localStorageService.set('user', response);
            });
          }
        }
      });
    }

    if(!vm.user._id) {
      newUser();
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
    function newRoom(name) {
      Rooms.api.post({
        name: name,
        dateTime: moment(),
        roomPin: parseInt(moment().format("m") + moment().format("H") + moment().format("SSS")),
        users: []
      }).then(function(response) {
        vm.roomName = null;
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
