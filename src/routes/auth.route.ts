import { Router } from "express";
import { forgotPassword, loginCustomer, signupCustomer } from "../controllers/auth.controller";
const router = Router();

router.post("/login", loginCustomer);
router.post("/signup", signupCustomer);
router.get("/forgotPassword", forgotPassword);



export default router;