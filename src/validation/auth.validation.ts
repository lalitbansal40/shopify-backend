import Joi from "joi";

export const loginSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.email': 'Invalid email format',
        'any.required': 'Email is required',
    }),
    password: Joi.string().min(6).required().messages({
        'string.min': 'Password must be at least 6 characters long',
        'any.required': 'Password is required',
    }),
});

export const signupSchema = Joi.object({
    first_name: Joi.string().required().messages({
        'any.required': 'First name is required',
    }),
    last_name: Joi.string().required().messages({
        'any.required': 'Last name is required',
    }),
    email: Joi.string().email().required().messages({
        'string.email': 'Invalid email format',
        'any.required': 'Email is required',
    }),
    phone: Joi.string().required().messages({
        'any.required': 'Phone is required',
    }),
    verified_email: Joi.boolean().required().messages({
        'any.required': 'Verified email flag is required',
    }),
    password: Joi.string().min(6).required().messages({
        'string.min': 'Password must be at least 6 characters',
        'any.required': 'Password is required',
    }),
    password_confirmation: Joi.string().valid(Joi.ref('password')).required().messages({
        'any.only': 'Passwords do not match',
        'any.required': 'Password confirmation is required',
    }),
});