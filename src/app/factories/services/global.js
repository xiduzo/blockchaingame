(function() {
  'use strict';

  angular
    .module('angulargame')
    .factory('Global', function(
      $log
    ) {
      var vm = this;

      vm.user = [];

      // methods
      vm.methods = {
        getUser: function() {
          return vm.user;
        },
        setUser: function(user) {
          vm. user = user;
        }
      }

      $log.log(vm.methods);

      return vm.methods;
    });

})();
