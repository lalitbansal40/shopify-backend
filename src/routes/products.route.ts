import { Router } from "express";
import { getProductsList, getProductsListByCollection } from "../controllers/products.controller";
const router = Router();

router.get("/productList", getProductsList);
router.get("/productListByCollection/:collectionHandle", getProductsListByCollection);




export default router;