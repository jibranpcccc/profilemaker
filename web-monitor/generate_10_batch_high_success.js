"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = require("fs");
var automation_1 = require("./src/lib/automation");
var settings_1 = require("./src/lib/settings");
function generateTestBatch() {
    return __awaiter(this, void 0, void 0, function () {
        var settings, apiKeys, rawDataStr, rawData, highSuccessData, targetDataset, targets, promises, results;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    settings = (0, settings_1.loadSettings)();
                    apiKeys = {
                        twoCaptcha: settings.TwoCaptchaApiKey,
                        deepSeek: settings.DeepSeekApiKey,
                        geezekBaseUrl: settings.GeezekBaseUrl
                    };
                    rawDataStr = fs_1.default.readFileSync('./platform_dataset.json', 'utf8');
                    rawData = JSON.parse(rawDataStr);
                    highSuccessData = rawData.filter(function (d) {
                        return ['WordPress', 'Moodle', 'CKAN'].includes(d.platform) ||
                            (!d.platform && d.signup_url && d.signup_url.includes('wp-login'));
                    });
                    targetDataset = highSuccessData.sort(function () { return 0.5 - Math.random(); }).slice(0, 10);
                    targets = targetDataset.map(function (d) { return d.domain; });
                    console.log("Starting isolated batch of 10 HIGH-SUCCESS targets: \n".concat(targets.join(', '), "\n"));
                    promises = targetDataset.map(function (entry, idx) { return __awaiter(_this, void 0, void 0, function () {
                        var domain, signup, siteTask, identId, identity, res, e_1;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    domain = entry.domain;
                                    signup = entry.signup_url || "https://".concat(domain, "/register");
                                    siteTask = {
                                        Id: 90000 + idx, SiteName: domain, TargetDomain: domain, Status: 'Pending',
                                        SignupUrl: signup, ProfileEditUrl: "https://".concat(domain, "/account"), DomainUrl: "https://".concat(domain),
                                        Username: '', Password: '', Email: '', CurrentStep: '', ExecutionLog: ''
                                    };
                                    identId = Math.floor(Math.random() * 100000);
                                    identity = {
                                        displayName: 'Anna Smith',
                                        firstName: 'Anna' + identId,
                                        lastName: 'Smith' + identId,
                                        username: 'anna' + identId,
                                        password: 'Pass' + Math.floor(Math.random() * 1000) + '!Mx',
                                        email: 'anna' + identId + '@geezek.com',
                                        bio: 'I love reviewing top web platforms like megawin.',
                                        websiteUrl: 'https://megawin188.id/',
                                        backlink: '<a href="https://megawin188.id/">megawin188</a>'
                                    };
                                    return [4 /*yield*/, (0, automation_1.automateSite)(siteTask, identity, apiKeys)];
                                case 1:
                                    res = _a.sent();
                                    return [2 /*return*/, { domain: domain, user: identity.username, url: res.profileUrl, status: res.backlinkStatus }];
                                case 2:
                                    e_1 = _a.sent();
                                    return [2 /*return*/, { domain: entry.domain, error: e_1.message }];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    return [4 /*yield*/, Promise.all(promises)];
                case 1:
                    results = _a.sent();
                    console.log('\n=== FINAL 10 HIGH-SUCCESS BATCH URLs ===');
                    results.forEach(function (r) {
                        console.log("DOMAIN: ".concat(r.domain, " | USERNAME: ").concat(r.user || 'N/A', " | STATUS: ").concat(r.status || 'ERR', " | URL: ").concat(r.url || 'None', " | ERR: ").concat(r.error || ''));
                    });
                    return [2 /*return*/];
            }
        });
    });
}
generateTestBatch().catch(console.error);
