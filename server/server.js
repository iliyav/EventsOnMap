Meteor.startup(function () {
  Meteor.publish("events", function () {
    return Events.find(
      {$or: [{"public": true}, {invited: this.userId}, {owner: this.userId}]});
  });
});