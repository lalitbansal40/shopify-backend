import dotenv from 'dotenv'
import express, { Request, Response } from 'express';
const app = express();
import cors from "cors";
import productListRouter from "./routes/products.route"
import authRouter from "./routes/auth.route"




dotenv.config();
const PORT = process.env.PORT || 3000;


app.use(express.json());
app.use(cors());

app.get("/health-check", async (_req: Request, res: Response): Promise<void> => {
    res.status(200).send("Server is up and running.");
});

app.use('/api', productListRouter);
app.use('/api', authRouter);


process.on('uncaughtException', (error) => {
    console.log("Error: ", error);
});

process.on('unhandledRejection', (error) => {
    console.log("Error: ", error);
});

app.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
});

