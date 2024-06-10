const app = require("./app");
const { sequelize } = require("./models");

init();

async function init() {
  try {
    await sequelize.sync();
    app.listen(3001, () => {
      console.log("Express App Listening on Port 3001");
    });
  } catch (error) {
    console.error(`An error occurred: ${JSON.stringify(error)}`);
    process.exit(1);
  }
}
