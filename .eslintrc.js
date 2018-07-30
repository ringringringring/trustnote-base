module.exports = {
    "env": {
        "browser": true,
        "es6": true
    },
    "extends": "eslint-config-airbnb",
    "parserOptions": {
        "ecmaVersion": 2017,
        "sourceType": "module"
    },
    
    "rules": {
        "indent": ["warn", 4],
        "linebreak-style": ["error", "unix"],
        "quotes": ["error", "single"],
        "semi": ["warn", "never"],
        "no-param-reassign": ["off", "unix"],
        "import/no-dynamic-require": 0,
        "global-require": 0,
        "no-use-before-define": ["error", { "functions": false, "classes": false }],
        "no-plusplus": ["error", {"allowForLoopAfterthoughts": true}]
    }
};