'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class users extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      users.belongsTo(models.poll, {
        foreignKey: "pollid",
      });
    }
    static async addvoters(pollid,email,password){
      // const hashedpassword = await bcrypt.hash(password, saltRounds);
      console.log("email ", pollid.email);
      console.log("password ", pollid.Password);
      console.log("electionid ", pollid.pollid);
      return this.create({userid:pollid.email,Password:pollid.Password,pollid:pollid.pollid})
    }
  }
  users.init({
    usersid: DataTypes.STRING,
    Password: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'users',
  });
  return users;
};