"use strict";
module.exports = {
    separators: {
        first: '\n\n![alt text](https://via.placeholder.com/700x10/8c1925/8c1925 "")',
        last: `<img src="data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='10px' viewBox='0 0 100 10' preserveAspectRatio='none'%3e %3crect fill='cyan' width='100' height='10' /%3e %3c/svg%3e"/>\n\n`,
        //last:'<style type="text/css">p {color:red;}</style><p>okay</p>\n\n',
        componentSeparator: '![alt text](https://via.placeholder.com/700x10/80eb34/80eb34 "")\n\n',
        componentPropsSeparator: '![alt text](https://via.placeholder.com/700x10/effa20/effa20 "")\n\n',
        propsSeparator: '![alt text](https://via.placeholder.com/700x10/343ae3/343ae3 "")\n\n'
    }
};
