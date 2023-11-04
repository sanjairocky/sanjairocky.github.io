class Home extends EventEmitter {
    constructor(brokerUrl, clientId, username, password) {
      super();
      this.brokerUrl = brokerUrl;
      this.clientId = clientId;
      this.username = username;
      this.password = password;
      this.mqttClient = mqtt.connect(this.brokerUrl, {
        clientId: this.clientId,
        username: this.username,
        password: this.password,
        protocolVersion: 5,
      });

      this.mqttClient.on('connect', () => {
        console.log('Connected to MQTT broker');
        // Subscribe to all topics using the wildcard '#'
        this.mqttClient.subscribe('#', (err) => {
          if (!err) {
            console.log('Subscribed to all topics');
          } else {
            console.error('Subscription error:', err);
          }
        });
      });

      this.mqttClient.on('message', (topic, message) => {
        // Emit an event with the topic as the event name and the message as the data
        this.emit(topic, message.toString());
      });

      this.mqttClient.on('error', (error) => {
        console.error('MQTT error:', error);
      });
    }
    // New method to publish a message to a specific MQTT topic
    publish(topic, message) {
      this.mqttClient.publish(topic, message,{ retain : true});
    }

    subscribe(topic, callback){
      this.on(topic, callback);
    }
}
