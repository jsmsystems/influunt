'use strict';

(function(root) {
  if (!root.Paho) {
    return;
  }

  if (!root.Paho.MQTT) {
    root.Paho.MQTT = {};
  }

  root.Paho.MQTT.Client = root.Paho.MQTT.Client || root.Paho.Client;
  root.Paho.MQTT.Message = root.Paho.MQTT.Message || root.Paho.Message;
})(window);
