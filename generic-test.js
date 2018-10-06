var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var identity = function (x) { return x; };
var strIdent = function (s) { return s.length; };
var explicit = function (x) { return x; };
var X = /** @class */ (function () {
    function X() {
    }
    return X;
}());
var Y = /** @class */ (function (_super) {
    __extends(Y, _super);
    function Y() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return Y;
}(X));
// interface abc<S, T> {
//     (s: S, t: T): T
// }
var _y = new Y();
function def(f) {
    return f;
}
function use() {
    var func = def(function (x, y) { console.log(x, y); return 10; });
    func('abc', 10);
}
