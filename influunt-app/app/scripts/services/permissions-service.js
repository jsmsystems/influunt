'use strict';

/**
 * @ngdoc service
 * @name influuntApp.permissionsService
 * @description
 * # permissionsService
 * Factory in the influuntApp.
 */
angular.module('influuntApp')
  .factory('PermissionsService', ['Restangular', 'PermRoleStore', 'PermPermissionStore', 'PermRole', '$q',
    function (Restangular, PermRoleStore, PermPermissionStore, PermRole, $q) {

      var getPermissions, loadPermissions, checkPermission, resetPermissions, getUsuario, podeVisualizarTodasAreas,
          isUsuarioRoot, setUsuario, refreshUsuario, enableRootRoleFallback, disableRootRoleFallback;

      var originalHasRoleDefinition = PermRoleStore.hasRoleDefinition.bind(PermRoleStore);
      var originalGetRoleDefinition = PermRoleStore.getRoleDefinition.bind(PermRoleStore);
      var rootRoleFallbackEnabled = false;

      getPermissions = function() {
        return Restangular.all('permissoes').customGET('roles');
      };

      enableRootRoleFallback = function() {
        if (rootRoleFallbackEnabled) {
          return;
        }

        PermRoleStore.hasRoleDefinition = function(roleName) {
          return originalHasRoleDefinition(roleName) || _.isString(roleName);
        };

        PermRoleStore.getRoleDefinition = function(roleName) {
          if (originalHasRoleDefinition(roleName)) {
            return originalGetRoleDefinition(roleName);
          }

          if (_.isString(roleName)) {
            return new PermRole(roleName, function() {
              return true;
            });
          }
        };

        rootRoleFallbackEnabled = true;
      };

      disableRootRoleFallback = function() {
        if (!rootRoleFallbackEnabled) {
          return;
        }

        PermRoleStore.hasRoleDefinition = originalHasRoleDefinition;
        PermRoleStore.getRoleDefinition = originalGetRoleDefinition;
        rootRoleFallbackEnabled = false;
      };

      loadPermissions = function() {
        return getPermissions()
          .then(function(response) {
            resetPermissions();

            if (isUsuarioRoot()) {
              enableRootRoleFallback();
            }

            var allPermissions = _.map(response.permissoes, 'chave');
            PermPermissionStore.defineManyPermissions(allPermissions, checkPermission);

            var allRoles = {};
            _.forEach(response.permissoesApp, function(role) {
              allRoles[role.chave] = _.map(role.permissoes, 'chave');
            });
            return PermRoleStore.defineManyRoles(allRoles);
          });
      };

      checkPermission = function(permissionName) {
        var usuario = getUsuario();
        if (usuario.root || permissionName === 'PUT /api/v1/usuarios/$id<[^/]+>') {
          return true;
        } else {
          return _.some(usuario.permissoes, function(permissao) {
            return permissao === permissionName;
          });
        }
      };

      resetPermissions = function() {
        disableRootRoleFallback();
        PermPermissionStore.clearStore();
        PermRoleStore.clearStore();
        getUsuario(true);
      };

      var usuarioLogado;
      getUsuario = function(refresh) {
        if (!usuarioLogado || !!refresh) {
          var dataUsuario = localStorage.usuario || '{}';
          usuarioLogado = JSON.parse(dataUsuario);
        }
        return usuarioLogado;
      };

      setUsuario = function(usuarioJson) {
        var usuario = _.pick(usuarioJson, ['id', 'login', 'email', 'root', 'permissoes']);
        if (usuarioJson.area) {
          usuario.area = { idJson: usuarioJson.area.idJson };
        }
        usuarioLogado = usuario;
        localStorage.setItem('usuario', JSON.stringify(usuario));
      };

      refreshUsuario = function() {
        var usuario = getUsuario(true);
        return Restangular.one('usuarios', usuario.id).get()
          .then(function(response) {
            setUsuario(response);
          });
      };

      podeVisualizarTodasAreas = function() {
        return checkPermission('visualizarTodasAreas');
      };

      isUsuarioRoot = function(){
        return !!getUsuario().root;
      };

      var checkRole = function(roleName) {
        if (_.isUndefined(roleName) || _.isNull(roleName) || roleName === '') {
          return $q.when(true);
        }

        if (isUsuarioRoot()) {
          return $q.when(true);
        }

        var role = PermRoleStore.getRoleDefinition(roleName);
        if (role) {
          return role.validateRole();
        }

        return $q.reject(false);
      };

      return {
        loadPermissions: loadPermissions,
        getPermissions: getPermissions,
        podeVisualizarTodasAreas: podeVisualizarTodasAreas,
        getUsuario: getUsuario,
        setUsuario: setUsuario,
        refreshUsuario: refreshUsuario,
        isUsuarioRoot: isUsuarioRoot,
        checkRole: checkRole
      };

    }]);
