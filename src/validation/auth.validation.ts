import Joi from "joi";

export const loginSchema = Joi.object({
    email: Joi.string().email().required().message('Invalid email format'),
    password: Joi.string().min(6).required().message('Password must be at least 6 characters long'),
});