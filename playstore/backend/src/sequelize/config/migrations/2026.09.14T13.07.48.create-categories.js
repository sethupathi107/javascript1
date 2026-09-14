import { DataTypes } from '@sequelize/core';
/** @type {import('umzug').MigrationFn<any>} */
export const up = async params => {
    const sequelize = params.context;
    const qi=sequelize.queryInterface;
    await qi.createTable('session',{
        id:{
            type : DataTypes.UUID,
            allowNull:false,
            unique:true,
            primaryKey:true        
        },
        userId:{
            type:DataTypes.UUID,
            allowNull:false,
            unique:true,
        },
        token:{
            type:DataTypes.STRING,
            allowNull:false,
            validate:{notEmpty:true},
        },
                createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
    })
};

/** @type {import('umzug').MigrationFn<any>} */
export const down = async params => {
    const sequelize = params.context;
    await sequelize.getQueryInterface().dropTable('application')
};
  