module.exports = {
    "env": {
        "browser": true,
        "es2021": true,
    },
    "extends": [
        // "eslint:recommended",
        // "plugin:react/recommended",
        // "plugin:react-hooks/recommended",
    ],
    "parserOptions": {
        "ecmaFeatures": {
            "jsx": true
        },
        "ecmaVersion": 12,
        "sourceType": "module"
    },
    "settings": {
        "react": {
            "version": "detect"
        }
    },
    "plugins": [
        "react",
    ],
    globals: {
        process: "readonly"
    },
    "rules": {
    },
    "overrides": [
        { // Typescript files
            "files": [
                "**/*.ts",
                "**/*.tsx"
            ],
            excludedFiles: ["**/*.test.*"],
            "extends": [
                "eslint:recommended",
                "plugin:react/recommended",
                "plugin:@typescript-eslint/recommended",
                "plugin:react-hooks/recommended"
            ],
            "parser": "@typescript-eslint/parser",
            "parserOptions": {
                "project": "./tsconfig.json"
            },
            "plugins": [
                "react",
                "@typescript-eslint",
                "react-hooks",
            ],
            "rules": {
                "react/react-in-jsx-scope": 0,
                "@typescript-eslint/no-unused-vars": 0,
                "@typescript-eslint/no-explicit-any": 0, //[1, { "ignoreRestArgs": true }],
                "prefer-const": 1,
            }
        },
        { // Jest files
            "files": [
                "**/*.test.ts",
                "**/*.test.tsx",
                "**/*.test.js",
                "**/*.test.jsx"
            ],
            env: {
                "jest": true,
                "node": true
            },
            "extends": [
                "eslint:recommended",
                "plugin:jest/recommended",
                // "plugin:@typescript-eslint/recommended", // annoying to work with until this is complete (uncomment to see why): https://github.com/DefinitelyTyped/DefinitelyTyped/issues/41179
                "plugin:testing-library/react",
                "plugin:jest-dom/recommended"
                
            ],
            "parser": "@typescript-eslint/parser",
            "parserOptions": {
                "project": "./tsconfig.json"
            },
            "plugins": [
                "jest",
                "testing-library",
                "jest-dom",
                "@typescript-eslint",
            ],
            "rules": {
            }
        }
    ]
};
