import { Model, DataTypes } from '@sequelize/core';

export default function defineInstalled(sequelize, { User, Application }) {
  class Installed extends Model {
    static associate(models){
        Installed.belongsTo(models.User,{
            foreignKey:'userId',
            as:"user",
        })
        Installed.belongsTo(models.Application,{
            foreignKey:"applicationId",
            as : "application"
        })
    }
  }

  Installed.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true,
        unique: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: User,
          key: 'id',
        },
        validate: { notEmpty: true },
      },
      applicationId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: Application,
          key: 'id',
        },
        validate: { notEmpty: true },
      },
    },
    {
      sequelize,
      modelName: 'Installed',
      timestamps: true,
      paranoid: true,
      underscored: true,
    }
  );

  return Installed;
}
