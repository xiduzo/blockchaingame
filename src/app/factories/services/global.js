(function() {
  'use strict';

  angular
    .module('angulargame')
    .factory('Global', function(
      $log,
      localStorageService
    ) {
      var vm = this;

      vm.user = [];

      // methods
      vm.methods = {
        getUser: function() {
          return vm.user;
        },
        setUser: function(user) {
          vm.user = user;
        }
      }

      if(localStorageService.get('user')) {
        vm.methods.setUser(localStorageService.get('user'));
      }

      return vm.methods;
    });

})();
