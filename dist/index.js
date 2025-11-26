"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const mono_route_1 = __importDefault(require("./routes/mono.route"));
const shopify_route_1 = __importDefault(require("./routes/shopify.route"));
const config_1 = require("./config");
const cron_1 = require("./functions/cron");
const app = (0, express_1.default)();
const port = config_1.PORT || 3000;
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cors_1.default)());
app.use("/mono", mono_route_1.default);
app.use("/auth", shopify_route_1.default);
app.listen(port, async () => {
    try {
        await (0, cron_1.initializeCronTasksFromDB)();
        console.log(`✅ Server running at http://${config_1.HOSTNAME}:${config_1.PORT}`);
    }
    catch (error) {
        console.log(error);
    }
});
