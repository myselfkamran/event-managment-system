import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database.js";

interface EventAttributes {
  id: number;
  name: string;
  description?: string;
  eventDate: Date;
  location?: string;
  onlineLink?: string;
  maxCapacity: number;
  availableSpots: number;
  creatorId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface EventCreationAttributes
  extends Optional<
    EventAttributes,
    "id" | "availableSpots" | "createdAt" | "updatedAt"
  > {}

class Event
  extends Model<EventAttributes, EventCreationAttributes>
  implements EventAttributes
{
  // Declare properties for TypeScript but don't use public class fields
  declare id: number;
  declare name: string;
  declare description?: string;
  declare eventDate: Date;
  declare location?: string;
  declare onlineLink?: string;
  declare maxCapacity: number;
  declare availableSpots: number;
  declare creatorId: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Instance method to check if event has available spots
  public hasAvailableSpots(): boolean {
    return this.availableSpots > 0;
  }

  // Instance method to reserve a spot
  public async reserveSpot(): Promise<boolean> {
    if (this.availableSpots > 0) {
      this.availableSpots -= 1;
      await this.save();
      return true;
    }
    return false;
  }

  // Instance method to cancel a spot
  public async cancelSpot(): Promise<void> {
    if (this.availableSpots < this.maxCapacity) {
      this.availableSpots += 1;
      await this.save();
    }
  }
}

Event.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 255],
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    eventDate: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        isDate: true,
        isAfter: new Date().toISOString(),
      },
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    onlineLink: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isUrl: true,
      },
    },
    maxCapacity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
      },
    },
    availableSpots: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    creatorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
  },
  {
    sequelize,
    tableName: "events",
    timestamps: true,
    hooks: {
      beforeCreate: (event: Event) => {
        // Set availableSpots to maxCapacity when creating
        if (!event.availableSpots) {
          event.availableSpots = event.maxCapacity;
        }
      },
    },
  }
);

export default Event;
