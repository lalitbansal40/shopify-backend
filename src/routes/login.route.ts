import { Router } from "express";
import { loginCustomer } from "../controllers/auth.controller";
const router = Router();

router.post("/login", loginCustomer);

export default router;