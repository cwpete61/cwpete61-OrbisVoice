"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
exports.env = {
    NODE_ENV: (process.env.NODE_ENV || "development"),
    PORT: parseInt(process.env.PORT || "4001"),
    API_URL: process.env.API_URL || "http://localhost:3000",
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
};
