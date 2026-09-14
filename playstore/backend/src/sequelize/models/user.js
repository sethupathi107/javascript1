import { Model, DataTypes } from '@sequelize/core';

export default function defineUser(sequelize) {
  class User extends Model {
    static associate(models){
        User.hasMany(models.Application,{
            foreignKey:"userId",
            as:'application'
        })
        User.hasMany(models.Installed,{
            foreignKey:'userId',
            as:'installed'
        })
    }
  }

  User.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { notEmpty: true, len: [2, 50] },
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: { isEmail: true, notEmpty: true },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { notEmpty: true, len: [60, 60] },
      },
    },
    {
      sequelize,
      modelName: 'User',
      paranoid: true,
      timestamps: true,
    }
  );

  return User;
}