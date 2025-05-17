const bcrypt = require("bcryptjs");
const db = require("../config/db");

const users = [
  {
    username: "admin",
    password: "adminpassword",
    role: "Admin",
  },
  {
    username: "user",
    password: "userpassword",
    role: "User",
  },
];

users.forEach((user) => {
  bcrypt.genSalt(10, (err, salt) => {
    if (err) throw err;
    bcrypt.hash(user.password, salt, (err, hash) => {
      if (err) throw err;
      const query =
        "INSERT INTO Users (username, password, role) VALUES (?, ?, ?)";
      db.query(query, [user.username, hash, user.role], (err, result) => {
        if (err) {
          if (err.code === "ER_DUP_ENTRY") {
            console.log(`User '${user.username}' already exists.`);
          } else {
            console.error(err);
          }
        } else {
          console.log(`User '${user.username}' created successfully.`);
        }
      });
    });
  });
});
