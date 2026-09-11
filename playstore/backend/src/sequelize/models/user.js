import {Model, DataTypes } from 'sequelize'
class User extends Model {}

User.init(
  {
    id:{
        type: DataTypes.UUID,
        allowNull:false,
        unique:true,
        primaryKey:true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: false,
        primaryKey:false,
        validate:{notEmpty:true,len:[2,50]},
    },
    email: {
        type : DataTypes.STRING,
        allowNull:false,
        unique:true,
        primaryKey:false,
        autoIncrement:false,
        validate: {
            isEmail: true,
            notEmpty: true,
        },
    },
    passward: {
        type:DataTypes.STRING,
        allowNull:false,
        validate:{notEmpty:true,len:[60,60]},
    },
  },
  {
    sequelize,
    modelName: 'User', 
    paranoid:true,
    timestamps: true,
    paranoid: true,
  }
);

module.exports = User;