// ICD-10 Common Reference Codes
export const ICD10_CODES = [
  { code: 'I10', description: 'Essential (primary) hypertension' },
  { code: 'E11.9', description: 'Type 2 diabetes mellitus without complications' },
  { code: 'J45.909', description: 'Unspecified asthma, uncomplicated' },
  { code: 'R00.0', description: 'Tachycardia, unspecified' },
  { code: 'R03.0', description: 'Elevated blood-pressure reading, without diagnosis of hypertension' },
  { code: 'J06.9', description: 'Acute upper respiratory infection, unspecified' },
  { code: 'Z00.00', description: 'Encounter for general adult medical examination without abnormal findings' }
];

// Drug-Allergy Conflict Mapping
const ALLERGY_DRUG_CONFLICTS = {
  penicillin: ['amoxicillin', 'ampicillin', 'penicillin', 'augmentin', 'piperacillin'],
  sulfa: ['bactrim', 'sulfamethoxazole', 'sulfasalazine', 'septra'],
  aspirin: ['aspirin', 'ibuprofen', 'naproxen', 'nsaid', 'ketorolac'],
  codeine: ['codeine', 'morphine', 'oxycodone', 'hydrocodone']
};

export const checkDrugAllergyConflicts = (prescriptions, patientAllergies = []) => {
  const warnings = [];

  for (const rx of prescriptions) {
    const medNameLower = rx.medicationName.toLowerCase();

    for (const allergy of patientAllergies) {
      const substanceLower = allergy.substance.toLowerCase();

      for (const [allergyKey, drugList] of Object.entries(ALLERGY_DRUG_CONFLICTS)) {
        if (substanceLower.includes(allergyKey)) {
          const match = drugList.some(d => medNameLower.includes(d));
          if (match) {
            warnings.push({
              medication: rx.medicationName,
              allergySubstance: allergy.substance,
              severity: allergy.severity || 'SEVERE',
              reaction: allergy.reaction || 'Potential allergic hypersensitivity reaction',
              message: `CRITICAL ALLERGY ALERT: Prescribing '${rx.medicationName}' conflicts with patient's documented allergy to '${allergy.substance}'!`
            });
          }
        }
      }
    }
  }

  return warnings;
};

// FHIR Bundle Export Builder (HL7 FHIR Release 4 standard)
export const exportToFHIRBundle = (patient, ehrRecords) => {
  const bundle = {
    resourceType: 'Bundle',
    type: 'collection',
    timestamp: new Date().toISOString(),
    entry: [
      {
        resource: {
          resourceType: 'Patient',
          id: patient._id?.toString() || 'patient-id',
          name: [{ text: patient.name }],
          gender: patient.gender?.toLowerCase() || 'unknown',
          birthDate: patient.dateOfBirth ? new Date(patient.dateOfBirth).toISOString().split('T')[0] : undefined
        }
      }
    ]
  };

  ehrRecords.forEach((record, idx) => {
    // Add Condition (Diagnosis)
    record.diagnoses?.forEach((diag, dIdx) => {
      bundle.entry.push({
        resource: {
          resourceType: 'Condition',
          id: `condition-${record._id}-${dIdx}`,
          clinicalStatus: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-clinical', code: 'active' }] },
          code: {
            coding: [{
              system: 'http://hl7.org/fhir/sid/icd-10-cm',
              code: diag.code,
              display: diag.description
            }]
          },
          subject: { reference: `Patient/${patient._id}` },
          recordedDate: record.visitDate
        }
      });
    });

    // Add MedicationRequest
    record.prescriptions?.forEach((rx, rxIdx) => {
      bundle.entry.push({
        resource: {
          resourceType: 'MedicationRequest',
          id: `medrx-${record._id}-${rxIdx}`,
          status: 'active',
          intent: 'order',
          medicationCodeableConcept: {
            text: rx.medicationName,
            coding: rx.rxNormCode ? [{ system: 'http://www.nlm.nih.gov/research/umls/rxnorm', code: rx.rxNormCode }] : []
          },
          dosageInstruction: [{ text: `${rx.dosage}, ${rx.frequency} for ${rx.durationDays} days. ${rx.instructions || ''}` }],
          authoredOn: rx.prescribedAt || record.visitDate
        }
      });
    });
  });

  return bundle;
};
