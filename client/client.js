Meteor.subscribe("events");

Meteor.startup(function () {
  Handlebars.registerHelper('unixDate', function(timestamp) {
    return moment.unix(timestamp).format('Do MMMM YYYY, hh:mm:ss');
  });
  Meteor.autorun(function () {
    // if (! Session.get("selected_event")) {
    //   var event = Events.findOne();
    //   if (party)
    //     Session.set("selected", party._id);
    // }
  });
});



//Map section
Template.map.rendered = function () {
  
  var self = this;
  // self.node = self.find("svg");

  if (! self.handle) {
    // Создаем объект карты, связанный с контейнером:
    var map = new DG.Map('2gis-map');
    // Устанавливаем центр карты и коэффициент масштабирования:
    map.setCenter(new DG.GeoPoint(82.927810142519,55.028936234826),12);
    // Добавляем элемент управления коэффициентом масштабирования:
    map.controls.add(new DG.Controls.Zoom());
    // Session.set('selected',0);
    self.handle = Meteor.autorun(function () {
      var selected = Session.get('selected');
      // // var selectedParty = selected && Parties.findOne(selected);
      // var radius = function (party) {
      //   return 10 + Math.sqrt(attending(party)) * 10;
      // };

      // Draw a marker for each party
      map.markers.removeAll()
      Events.find().forEach(function(event) {
        var myMarker = new DG.Markers.Common({
            // Местоположение на которое указывает маркер:
            geoPoint: new DG.GeoPoint(event.lon, event.lat),
            // Функция, вызываемая при клике по маркеру
            clickCallback: function() {
                Session.set('selected', event._id);
                // if (! myMap.balloons.getDefaultGroup().contains(myBalloon)) {
                //     // Если балун еще не был добавлен на карту, добавляем его:
                //     myMap.balloons.add(myBalloon);
                // } else {
                //     // Показываем уже ранее добавленный на карту балун
                //     myBalloon.show();
                // }
            },
            hint: event.title,
            icon: new DG.Icon(selected === event._id ? '/red_marker.png' : '/yellow_marker.png',new DG.Size(26, 26)),
            // clickIcon: new DG.Icon('/red_marker.png', new DG.Size(26, 26))
        });
        map.markers.add(myMarker);
      });
    });
  }
};

Template.map.destroyed = function () {
  this.handle && this.handle.stop();
};

///////////////////////////////////////////////////////////////////////////////
// Party details sidebar

Template.details.event = function () {
  return Events.findOne(Session.get("selected"));
};

Template.details.anyEvents = function () {
  return Events.find().count() > 0;
};

Template.details.creatorName = function () {
  var owner = Meteor.users.findOne(this.owner);
  if (owner._id === Meteor.userId())
    return "Me";
  return displayName(owner);
};

Template.details.canRemove = function () {
  return this.owner === Meteor.userId() && attending(this) === 0;
};

Template.details.maybeChosen = function (what) {
  var myRsvp = _.find(this.rsvps, function (r) {
    return r.user === Meteor.userId();
  }) || {};

  return what == myRsvp.rsvp ? "chosen btn-inverse" : "";
};

Template.details.events({
  'click .rsvp_yes': function () {
    Meteor.call("rsvp", Session.get("selected"), "yes");
    return false;
  },
  'click .rsvp_maybe': function () {
    Meteor.call("rsvp", Session.get("selected"), "maybe");
    return false;
  },
  'click .rsvp_no': function () {
    Meteor.call("rsvp", Session.get("selected"), "no");
    return false;
  },
  'click .invite': function () {
    openInviteDialog();
    return false;
  },
  'click .remove': function () {
    Events.remove(this._id);
    return false;
  },
  'click #add-comment': function () {
    Meteor.call("addComment", Session.get("selected"), $("#new-comment").val());
    $("#new-comment").val('');
    return false;
  }
});

///////////////////////////////////////////////////////////////////////////////
// Party attendance widget

Template.attendance.rsvpName = function () {
  var user = Meteor.users.findOne(this.user);
  return displayName(user);
};

Template.attendance.outstandingInvitations = function () {
  var event = Events.findOne(this._id);
  return Meteor.users.find({$and: [
    {_id: {$in: event.invited}}, // they're invited
    {_id: {$nin: _.pluck(event.rsvps, 'user')}} // but haven't RSVP'd
  ]});
};

Template.attendance.invitationName = function () {
  return displayName(this);
};

Template.attendance.rsvpIs = function (what) {
  return this.rsvp === what;
};

Template.attendance.nobody = function () {
  return ! this.public && (this.rsvps.length + this.invited.length === 0);
};

Template.attendance.canInvite = function () {
  return ! this.public && this.owner === Meteor.userId();
};
