const router = require("express").Router();
const userService = require("../service/user");
const ApiResponse = require("../model/ApiResponse");

router.post("/save", (req, res, next) => {
  userService
    .save({ payload: req.body })
    .then((result) => {
      if (result) {
        res
          .status(200)
          .json(new ApiResponse("Registration successful!", { result }));
      }
    })
    .catch((err) => next(err));
});

router.post("/signin", (req, res, next) => {
  userService
    .signin({ payload: req.body })
    .then(({ token, currentUser }) => {
      if (token) {
        res
          .status(200)
          .header("authorization", token)
          .json(new ApiResponse("Sign in successful!", { currentUser }));
      }
    })
    .catch((err) => next(err));
});

module.exports = router;
