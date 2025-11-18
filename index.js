"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const mono_route_1 = __importDefault(require("./routes/mono.route"));
const shopify_route_1 = __importDefault(require("./routes/shopify.route"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cors_1.default)());
app.use("/mono", mono_route_1.default);
app.use("/auth", shopify_route_1.default);
app.listen(port, async () => {
    try {
        console.log(`✅ Server running at http://localhost:${port}`);
        // collectPayment()
    }
    catch (error) {
        console.log(error);
    }
});
