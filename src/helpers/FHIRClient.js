const axios = require('axios');
const _ = require('lodash');
// const config = require('../config');
import State from "../state";

const USERNAME = "apikey";

/**
* Gets the value set for the given oid,

* @param {string} oid - the VSAC oid you are after
* @param {string} username the VSAC user to authenticate as
* @param {string} password the VSAC user's password
* @returns {Promise<object>} an object containing the FHIR response for the OID
*/

const codeLookups = {
  'http://snomed.info/sct': 'SNOMEDCT',
  'http://hl7.org/fhir/sid/icd-9-cm': 'ICD9CM',
  'http://hl7.org/fhir/sid/icd-10': 'ICD10',
  'http://hl7.org/fhir/sid/icd-10-cm': 'ICD10CM',
  'http://ncimeta.nci.nih.gov': 'NCI',
  'http://loinc.org': 'LOINC',
  'http://www.nlm.nih.gov/research/umls/rxnorm': 'RXNORM',
  'http://unitsofmeasure.org': 'UCUM',
  'http://www.ama-assn.org/go/cpt': 'CPT',
  'http://hl7.org/fhir/sid/cvx': 'CVX'
};

function getValueSet(oid) {
  const username = USERNAME;
  const password = State.get().UMLSKey;
  const options = {
    method: 'GET',
    url: `${State.get().VSACEndpoint}/ValueSet/${oid}/$expand`,
    headers: {
      Accept: 'application/json',
      Authorization: `Basic ${new Buffer(`${username}:${password}`).toString('base64')}`
    }
  };

  return rpn(options).then(res => {
    const response = JSON.parse(res);
    return {
      oid: response.id,
      version: response.meta.versionId,
      displayName: response.name,
      codes: response.expansion.contains.map(c => {
        return {
          code: c.code,
          codeSystemURI: c.system,
          codeSystemName: codeLookups[c.system] || c.system,
          codeSystemVersion: c.version,
          displayName: c.display
        };
      })
    };
  });
}

function searchForValueSets(search) {
  const username = USERNAME;
  const password = State.get().UMLSKey;
  const options = {
    method: 'GET',
    url: `${State.get().VSACEndpoint}/ValueSet?name:contains=${search}`,
    crossOrigin: true,
    headers: {
      Accept: 'application/json',
      Authorization: `Basic ${new Buffer(`${username}:${password}`).toString('base64')}`
    }
  };

  return axios(options).then(res => {
    const response = res.data;

    const results = (response.entry || []).map((v, i) => {
      return {
        name: v.resource.name,
        steward: v.resource.publisher,
        oid: v.resource.id,
        codeSystem: [],
        codeCount: (v.resource.expansion || {}).total || 0
      };
    });
    return {
      _total: response.total,
      count: results.length,
      page: 1,
      results
    };
  });
}

function getCode(code, system) {
  return new Promise((resolve, reject) => {
    resolve({
      "system": "http://snomed.info/sct",
      "systemName": "SNOMEDCT",
      "systemOID": "2.16.840.1.113883.6.96",
      "version": "http://snomed.info/sct/731000124108/version/2021-09",
      "code": "29857009" + Math.random().toString(),
      "display": "Chest pain (finding)"
    });
  });
  const username = USERNAME;
  const password = State.get().UMLSKey;
  const options = {
    method: 'GET',
    url: `${State.get().VSACEndpoint}/CodeSystem/$lookup?code=${code}&system=${system}`,
    crossOrigin: true,
    headers: {
      Accept: 'application/json',
      Authorization: `Basic ${new Buffer(`${username}:${password}`).toString('base64')}`
    }
  };
  return axios(options).then(res => {
    let codeObject = _.zipObject(_.map(res.data.parameter, 'name'), _.map(res.data.parameter, 'valueString'));
    return {
      system,
      systemName: codeObject.name,
      systemOID: codeObject.Oid,
      version: codeObject.version,
      code,
      display: codeObject.display
    };
  }, error => {
    console.log(error);
    return null;
  });
}

// Used to test a given endpoint and UMLS API key
function getOneCode(VSACEndpoint, UMLSKey) {
  const code = "29857009";
  const system = "http://snomed.info/sct";
  const username = USERNAME;
  const password = UMLSKey;
  const options = {
    method: 'GET',
    url: `${VSACEndpoint}/CodeSystem/$lookup?code=${code}&system=${system}`,
    crossOrigin: true,
    headers: {
      Accept: 'application/json',
      Authorization: `Basic ${new Buffer(`${username}:${password}`).toString('base64')}`
    }
  };
  return axios(options).then(res => {
    let codeObject = _.zipObject(_.map(res.data.parameter, 'name'), _.map(res.data.parameter, 'valueString'));
    return {
      system,
      systemName: codeObject.name,
      systemOID: codeObject.Oid,
      version: codeObject.version,
      code,
      display: codeObject.display
    };
  }, error => {
    console.log(error);
    return null;
  });
}

function getOneValueSet() {
  const username = USERNAME;
  const password = State.get().UMLSKey;
  const oneCodeVSOID = '2.16.840.1.113762.1.4.1034.65';
  const options = {
    method: 'GET',
    url: `${State.get().VSACEndpoint}/ValueSet/${oneCodeVSOID}`,
    crossOrigin: true,
    headers: {
      Accept: 'application/json',
      Authorization: `Basic ${new Buffer(`${username}:${password}`).toString('base64')}`
    }
  };
  return axios(options).then(res => {
    return res.data;
  }, error => {
    console.log(error);
    return null;
  });
}

export {
  getValueSet,
  searchForValueSets,
  getCode,
  getOneCode,
  getOneValueSet
};
