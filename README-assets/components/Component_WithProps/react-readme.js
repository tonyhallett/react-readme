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
    component: ({ color }) => {
        return React.createElement("div", { style: { color: color } }, "Coloured by props");
    },
    props: [[{ color: 'red' }, { readme: 'Red props' }], [{ color: 'orange' }, { readme: 'Orange props' }], [{ color: 'green' }, { readme: 'Green props' }]]
};
