module.exports = {
    "env": {
        "browser": true,
        "es6": true
    },
    "extends": "eslint-config-airbnb",
    "parserOptions": {
        "ecmaVersion": 2015,
        "sourceType": "module"
    },
    "rules": {
        "indent": [
            "warn",
            4
        ],
        "linebreak-style": [
            "error",
            "unix"
        ],
        "quotes": [
            "error",
            "single"
        ],
        "semi": [
            "warn",
            "never"
        ],
        "no-param-reassign": [
            "off", 
            "unix"
        ]
    }
};