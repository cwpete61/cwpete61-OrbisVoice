"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcryptjs_1 = __importDefault(require("bcryptjs"));
async function generateHash() {
    const password = "Orbis@8214@@!!";
    const hash = await bcryptjs_1.default.hash(password, 10);
    console.log("Password hash:", hash);
}
generateHash().catch(console.error);
