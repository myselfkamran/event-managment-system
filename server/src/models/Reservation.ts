import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database.js";
import { ReservationStatus } from "../types/index.js";

interface ReservationAttributes {
  id: number;
  eventId: number;
  userId: number;
  reservationDate: Date;
  status: ReservationStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ReservationCreationAttributes
  extends Optional<
    ReservationAttributes,
    "id" | "reservationDate" | "status" | "createdAt" | "updatedAt"
  > {}

class Reservation
  extends Model<ReservationAttributes, ReservationCreationAttributes>
  implements ReservationAttributes
{
  // Declare properties for TypeScript but don't use public class fields
  declare id: number;
  declare eventId: number;
  declare userId: number;
  declare reservationDate: Date;
  declare status: ReservationStatus;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Instance method to cancel reservation
  public async cancel(): Promise<void> {
    this.status = ReservationStatus.CANCELED;
    await this.save();
  }

  // Instance method to confirm reservation
  public async confirm(): Promise<void> {
    this.status = ReservationStatus.CONFIRMED;
    await this.save();
  }

  // Instance method to check if reservation is active
  public isActive(): boolean {
    return this.status === ReservationStatus.CONFIRMED;
  }
}

Reservation.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    eventId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "events",
        key: "id",
      },
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    reservationDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    status: {
      type: DataTypes.ENUM("confirmed", "canceled"),
      allowNull: false,
      defaultValue: ReservationStatus.CONFIRMED,
    },
  },
  {
    sequelize,
    tableName: "reservations",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["eventId", "userId"],
        where: {
          status: "confirmed",
        },
        name: "unique_active_reservation_per_user_per_event",
      },
    ],
  }
);

export default Reservation;
