import * as Bioportal from './bioportal'; 

it('should always return a result including the RXNORM code for "theanine Pill"', async () => {
    const expected = {
        code: "1233068",
        display: "theanine Pill",
        system: "http://www.nlm.nih.gov/research/umls/rxnorm",
        version: "03072022",
    }
    expect(await Bioportal.searchForText('theanine')).toContainEqual(expected);
})

it('should only return results from the SNOMEDCT ontology', async () => {
    const expected = {
        system: "http://snomed.info/sct",
        version: "20220301",
    }
    const result = await Bioportal.searchForText('pain', ['SNOMEDCT']);
    result.forEach(v => {
        expect(v).toMatchObject(expected)
    });
})

it('should return SNOMEDCT codes with concept "266710000" (Drugs not taken/completed)', async () => {
    const result = await Bioportal.searchForSNOMEDConcept('266710000');
    expect(result.length).toBeGreaterThan(10);
})
