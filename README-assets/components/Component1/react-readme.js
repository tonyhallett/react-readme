"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
const React = __importStar(require("react"));
module.exports = {
    component: () => {
        return React.createElement("div", { style: { color: 'white' } }, "Component1");
    }
};