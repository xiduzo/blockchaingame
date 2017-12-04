(function() {
  'use strict';

  angular
    .module('angulargame')
    .factory('Rooms', function(
      $rootScope,
      $log,
      $websocket,
      Restangular
    ) {
      // Open a WebSocket connection
      var ws = $websocket('ws://localhost:1337');

      // var collection = [];

      ws.onMessage(function(message) {
        var data = angular.fromJson(message.data);
        console.log(data);
        $rootScope.$broadcast(data.action, {data: data.data});
      });

      ws.onClose(function(event) {
        $log.log('Connection closed', event);
      });

      ws.onOpen(function() {
        $log.log('Connected to WS');
      });

      var methods = {
        api: Restangular.service('rooms'),
        // collection: collection,
        socket: function(action, data) {
          ws.send({
            action: action,
            data: data
          });
        }
      };

      return methods;
    });

})();
