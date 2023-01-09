'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class poll extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      poll.belongsTo(models.manager, {
        foreignKey: "managerid",
        
      });
    }

    static async addelection({ title,adminId}) {
      return this.create({ title: title, status: false,launched:false,managerid:adminId});
    }
    static async newlyadded(id) {
      return this.findAll({
        where: {
          status: false,
          launched:false,
          managerid: id,
        },
      });
    }
  }
  poll.init({
    title: DataTypes.STRING,
    status: DataTypes.BOOLEAN,
    start: DataTypes.DATE,
    end: DataTypes.DATE,
    launched: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'poll',
  });
  return poll;
};