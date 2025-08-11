import User from "./User.js";
import Event from "./Event.js";
import Reservation from "./Reservation.js";

// Define associations
User.hasMany(Event, {
  foreignKey: "creatorId",
  as: "createdEvents",
});

Event.belongsTo(User, {
  foreignKey: "creatorId",
  as: "creator",
});

User.hasMany(Reservation, {
  foreignKey: "userId",
  as: "reservations",
});

Reservation.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

Event.hasMany(Reservation, {
  foreignKey: "eventId",
  as: "reservations",
});

Reservation.belongsTo(Event, {
  foreignKey: "eventId",
  as: "event",
});

export { User, Event, Reservation };
