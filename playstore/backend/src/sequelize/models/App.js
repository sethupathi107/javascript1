import { Model, DataTypes } from '@sequelize/core';

export default function defineApplication(sequelize, { User, Category }) {
  class Application extends Model {
    static associate(models){
        Application.belongsTo(models.Category, {
            foreignKey:'categoryId',
            as:'category',
        })
        Application.belongsTo(models.User,{
            foreignKey:"userId",
            as:'user'
        })
        Application.hasMany(models.Installed,{
            foreignKey:'applicationId',
            as:'installed'
        })
    }
  }
  Application.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        unique: true,
        primaryKey: true,
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
      categoryId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: Category,
          key: 'id',
        },
        validate: { notEmpty: true },
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { notEmpty: true, len: [2, 50] },
      },
      installCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      sequelize,
      modelName: 'Application',
      timestamps: true,
      paranoid: true,
      underscored: true,
    }
  );

  return Application;
}
