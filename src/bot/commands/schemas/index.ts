import Joi from "joi";

export const ghUserOrganizationSchema = Joi.string()
  .trim()
  .min(1)
  .pattern(/^\S+$/)
  .required();

export const ghRepoSchema = Joi.string()
  .trim()
  .min(3)
  .pattern(/^\S+\/\S+$/)
  .required();
