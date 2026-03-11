"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
async function testLogin() {
    try {
        console.log("Testing login with admin@orbisvoice.app...");
        const response = await axios_1.default.post('http://localhost:4001/auth/login', {
            email: 'admin@orbisvoice.app',
            password: 'admin123'
        });
        console.log("Login Success:", response.data);
    }
    catch (error) {
        console.error("Login Failed:");
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", error.response.data);
        }
        else {
            console.error("Error:", error.message);
        }
    }
}
testLogin();
