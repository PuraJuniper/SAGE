# SAGE - FRED on CPG 

## What is SAGE?
FRED is an open source web application that enables users to edit JSON [FHIR resources](https://www.hl7.org/fhir/resourcelist.html) and [FHIR bundles](https://www.hl7.org/fhir/bundle.html). Built as an HTML5 app, FRED runs entirely within your web browser - no data is sent to a server. *Note - the project is currently under active development. Code is rough, there are bugs and features may change or be removed!*  
SAGE is an extension of FRED, built with a focus on CPGs (Clinical Practice Guideline), allowing users to create and edit JSON CPG resources as specified under FHIR. 

## Current features and changes
- Mandatory fields are automatically loaded in when creating a resource
- Values that must come from a fixed set are selectable from dropdowns
- Fields with fixed values have been prefilled
- ID, URL, Name, and Title are autopopulated
- CPG resources have been added
- Simplified display of all editable fields
- Tree view of resources, with drag n' drop features to bind resources to each other


## API
| Url Parameter | Value | Action |
| ------------- | ----- | ------ |
| resource | Escaped url for FHIR resource on CORS enabled server (including open FHIR servers) | Launches with resource open. |
| profiles | Escaped url for summarized FHIR profiles (see building resource profiles below) on a CORS enabled server. Included are ```/profiles/dstu2.json``` (DSTU2) and ```/profiles/connect12.json``` (May 2016 connectathon) | Configures SAGE to support for a particular version of FHIR.|
| remote | 0 or 1 | Supports controlling SAGE from another web application (using postMessage) when set to ```1``` ([demo](http://docs.smarthealthit.org/fred/messaging-demo.html)). |
| warn | 0 or 1 | If set to ```0```, will suppress a warning when navigating away from the page. Useful when developing with auto-reloading. |

## Tech
- App:
    - [React - UI Rendering](https://facebook.github.io/react/)
    - [React Bootstrap - UI widgets](https://react-bootstrap.github.io/)
    - [FreezerJs - Immutable data store](https://github.com/arqex/freezer)

- Build:
    - [NodeJs - Runtime](https://nodejs.org/)
    - [CoffeeScript - Language](http://coffeescript.org/)
    - [Webpack - Build tool](https://webpack.github.io/)
    - [Mocha - Testing library](https://mochajs.org/)

## Install SAGE locally
1. Install NodeJs from https://nodejs.org

2. Clone this repository
    
    ```
    git clone https://github.com/PuraJuniper/SAGE
    cd SAGE
    ```
    
3. Install the dependencies
    
    ```
    npm install
    ```
    
4. Run the dev server

    ```
    npm run dev
    ```
    
5. Browse to ```http://localhost:8080```

## Commands
| Action | Command |
| ------ | ------- |
| Start Dev Server | ```npm run dev``` |
| Build Static JS Bundle | ```npm run build``` |
| Run Tests | ```npm run test``` |
| Run Tests on Edit | ```npm run test-watch``` |

## Building Resource Profiles
To reduce load time, SAGE uses a simplified copy of the (>15mb!) JSON FHIR resource profiles. To convert the FHIR resource profiles into this format, ensure the desired profile bundles and valueset bundles are in the fhir_profiles subdirectory and run ```npm run build-profiles```

## About
SAGE is based on FRED, which is a project of [SMART Health IT](http://smarthealthit.org), a joint effort of the not-for-profit institutions, Boston Children’s Hospital Computational Health Informatics Program and the Harvard Medical School Department for Biomedical Informatics.

To stay updated on the project follow [@gotdan](https://twitter.com/intent/user?screen_name=gotdan) and [@smarthealthit](https://twitter.com/intent/user?screen_name=smarthealthit) on twitter!
