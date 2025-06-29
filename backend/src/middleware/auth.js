const jwt = require("jsonwebtoken");
// const { getEventByEventIdnClubId } = require("../service/team");

const auth = (req, res, next) => {
    const token = req.header("authorization");
    if (!token) return res.status(401).json({message: "Access denied"});
    try {
        const {currentUser} = jwt.verify(token, process.env.TOKEN_SECRET);
        req.currentUser = currentUser;
        next();
    } catch (error) {
        return res.status(400).json({message: "Invalid token"});
    }
};

const isAdmin = (req, res, next) => {
    const currentUser = req.currentUser;
    if (!currentUser) res.status(400).json({message: "Invalid request"});
    try {
        if (Number.parseInt(currentUser.role) === 10) next();
    } catch (error) {
        return res.status(400).json({message: "Invalid request"});
    }
};

const isAuthenticated = (req, res, next) => {
    req.isLoggedIn = false;
    req.currentUser = null;

    const authHeader = req.header("authorization"); // Use authHeader for clarity
    const token =
        authHeader && authHeader.startsWith("Bearer ")
            ? authHeader.split(" ")[1]
            : authHeader;

    if (!token) {
        return next();
    }
    try {
        const decodedPayload = jwt.verify(token, process.env.TOKEN_SECRET);
        req.currentUser = decodedPayload.currentUser;
        req.isLoggedIn = true;
        return next();
    } catch (error) {
        return next();
    }
};
// const isAdminEventAuthor = async (req, res, next) => {
//   const currentUser = req.currentUser;
//   if (!currentUser) res.status(400).json({ message: "Invalid request" });
//   if (currentUser.role === "sudo") return true;
//
//   const eventId =
//       req.query?.eventId || req.body?.eventId || req.body?.payload?.eventId;
//
//   const clubId = currentUser.clubId;
//   try {
//     const [event] = await getEventByEventIdnClubId({ eventId, clubId });
//     if (!event || !event.id)
//       return res.status(401).json({ message: "Access denied" });
//
//     next();
//   } catch (error) {
//     return res.status(400).json({ message: "Invalid request" });
//   }
// };

module.exports = {
    auth,
    isAdmin,
    isAuthenticated,
    // isAdminEventAuthor,
};
