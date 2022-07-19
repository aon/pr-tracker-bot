import Joi from "joi";

export const ghRepoUserOrganizationSchema = Joi.string()
  .trim()
  .min(1)
  .pattern(/^\S*$/)
  .required();
