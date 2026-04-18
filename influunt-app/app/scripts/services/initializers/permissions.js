'use strict';

/**
 * @ngdoc service
 * @name influuntApp.permissions
 * @description
 * # mapCustomizations
 * Inicializa permissões do app
 */
angular.module('influuntApp')
  .run(['$urlRouter', 'PermissionsService', 'influuntBlockui',
    function ($urlRouter, PermissionsService, influuntBlockui) {

      var unblockRendering = function() {
        // Once permissions are set-up
        // kick-off router and start the application rendering.
        // This must also happen when the permissions request fails, otherwise
        // the app can remain on a blank screen before the first route renders.
        $urlRouter.sync();
        // Also enable router to listen to url changes
        $urlRouter.listen();
      };

      if (!localStorage.token) {
        unblockRendering();
        influuntBlockui.unblock();
        return;
      }

      PermissionsService.loadPermissions()
        .catch(function() {
          return null;
        })
        .finally(function() {
          unblockRendering();
          influuntBlockui.unblock();
        });

    }]);
