const {describe, it} = global;
import {expect} from 'chai';
import DataModelChanges from '../data_model_changes';
import {default as model20} from './files/data_models/2.0.js';
import {default as model21} from './files/data_models/2.1.js';
import {default as model22} from './files/data_models/2.2.js';
import {default as model23} from './files/data_models/2.3.js';
import {default as model24} from './files/data_models/2.4.js';
import {default as model25} from './files/data_models/2.5.js';
import {default as model30} from './files/data_models/3.0.js';

// Expect the errors to contain one error that matches the reErrorMsg regex.
function errorInCollection(reErrorMsg, ChangeLists) {
  let errorInCollection = false;
  for(let error in ChangeLists.errors() )
  {
    console.log('YO: '+ ChangeLists.errors()[error]['message']);
    if(reErrorMsg.test(ChangeLists.errors()[error]['message']))
      errorInCollection = true;//expect(error['message']).to.match(reErrorMsg);
  }
  return errorInCollection;
}

// Expect the warnings to contain one warning that matches the reWarningMsg regex.
const dataModelChangesWarningTest = (model, reWarningMsg) => {
  const ChangeLists = new DataModelChanges({});
  ChangeLists.changes(model);
  expect(ChangeLists.warnings().length).to.be.at.least(1);
  expect(ChangeLists.warnings()[ChangeLists.warnings().length - 1]['message']).to.match(reWarningMsg);
};

const dataModelChangesErrorTest = (model, reErrorMsg) => {
  const ChangeLists = new DataModelChanges({});
  ChangeLists.changes(model);
  //console.log("YO: " + ChangeLists.errors()[0]['message']);
  expect(ChangeLists.errors().length).to.be.at.least(1);
  //expect(ChangeLists.errors()[ChangeLists.errors().length - 1]['message']).to.match(reErrorMsg);
  let errorFound = errorInCollection(reErrorMsg, ChangeLists);
  expect(errorFound).to.equal(true);
};

// Expect no errors.
const dataModelChangesNoErrorTest = (model) => {
  const ChangeLists = new DataModelChanges({});
  ChangeLists.changes(model);
  expect(ChangeLists.errors().length).to.equal(0);
};

// Expect no errors and check against expected JSON.
const dataModelChangesModelTest = (model, modelExpectedChanges) => {
  const ChangeLists = new DataModelChanges({});
  const modelChanges = ChangeLists.changes(model);
  expect(ChangeLists.errors().length).to.equal(0);
  expect(modelChanges).to.deep.equal(modelExpectedChanges);
};

describe('magic.actions.data_model_changes', () => {

  // Test getting changes from an invalid model.
  describe('when getting changes from an invalid model', () => {

    it('should reject getting changes from an empty model', () => {
      dataModelChangesErrorTest(null, /the model argument .* is empty/i);
      dataModelChangesErrorTest(undefined, /the model argument .* is empty/i);
      dataModelChangesErrorTest({}, /the model argument .* is empty/i);
    });

    it('should reject when no MagIC version is found', () => {
      const model = {
        no_magic_version: '3.0',
        tables: {}
      };
      dataModelChangesErrorTest(model, /has no "magic_version" property/i);
    });

    it('should reject when no tables list is found', () => {
      const model = {
        magic_version: '3.0',
        no_tables: {}
      };
      dataModelChangesErrorTest(model, /has no "tables" property/i);
    });

    it('should reject when no columns are in a table', () => {
      const model = {
        magic_version: '3.0',
        tables: {
          contribution: {
            no_columns: {}
          }
        }
      };
      dataModelChangesErrorTest(model, /failed to find the columns list for table: .*/i);
    });

    it('should reject when the previous columns list is invalid', () => {
      const noTableModel = {
        magic_version: '3.0',
        tables: {
          contribution: {
            columns: {
              magic_version: {
                previous_columns: [{
                  no_table: '',//no_table
                  column: ''
                }]
              }
            }
          }
        }
      };
      const noColumnModel = {
        magic_version: '3.0',
        tables: {
          contribution: {
            columns: {
              magic_version: {
                previous_columns: [{
                  table: '',
                  no_column: ''
                }]
              }
            }
          }
        }
      };
      dataModelChangesErrorTest(noTableModel, /failed to find the previous table name for column/i);
      dataModelChangesErrorTest(noColumnModel, /failed to find the previous column name for column/i);
    });


    it('should reject when the next columns list is invalid', () => {
      const noTableModel = {
        magic_version: '3.0',
        tables: {
          contribution: {
            columns: {
              magic_version: {
                next_columns: [{
                  no_table: '',
                  column: ''
                }]
              }
            }
          }
        }
      };
      dataModelChangesErrorTest(noTableModel, /failed to find the next table name for column .* in table .*/i);
      const noColumnModel = {
        magic_version: '3.0',
        tables: {
          contribution: {
            columns: {
              magic_version: {
                next_columns: [{
                  table: '',
                  no_column: ''
                }]
              }
            }
          }
        }
      };
      dataModelChangesErrorTest(noColumnModel, /failed to find the next column name for column .* in table .*/i);
    });

  });

  // Test making lists of changes from a valid model.
  describe('when making lists of changes from a valid model', () => {

    it('should ignore unchanged columns', () => {
      const model = {
        magic_version: '2.5',
        tables: {
          contribution: {
            columns: {
              magic_version: {
                not_previous_not_next_columns: ''
              }
            }
          }
        }
      };
      const modelChanges = {};
      dataModelChangesModelTest(model, modelChanges);
    });

    it('should make a list of deleted columns', () => {
      const model = {
        magic_version: '2.5',
        tables: {
          contribution: {
            columns: {
              magic_version: {
                previous_columns: [{
                  table: 'contribution',
                  column: 'magic_version'
                }]
              }
            }
          }
        }
      };
      const modelChanges = {
        deleted_columns: [{
          table: 'contribution',
          column: 'magic_version'
        }]
      };
      dataModelChangesModelTest(model, modelChanges);
    });

    it('should make a list of inserted columns', () => {
      const model = {
        magic_version: '2.5',
        tables: {
          contribution: {
            columns: {
              magic_version: {
                next_columns: [{
                  table: 'contribution',
                  column: 'magic_version'
                }]
              }
            }
          }
        }
      };
      const modelChanges = {
        inserted_columns: [{
          table: 'contribution',
          column: 'magic_version'
        }]
      };
      dataModelChangesModelTest(model, modelChanges);
    });

    it('should make a list of renamed columns', () => {
      const model = {
        magic_version: '2.5',
        tables: {
          contribution: {
            columns: {
              magic_version: {
                previous_columns: [{
                  table: 'contribution',
                  column: 'version'
                }],
                next_columns: [{
                  table: 'contribution',
                  column: 'magic_version'
                }]
              }
            }
          }
        }
      };
      const modelChanges = {
        renamed_columns: [{
          table: 'contribution',
          column: 'magic_version',
          previous_column: {
            table: 'contribution',
            column: 'version'
          }
        }]
      };
      dataModelChangesModelTest(model, modelChanges);
    });

    it('should make a list of renaming columns', () => {
      const model = {
        magic_version: '2.5',
        tables: {
          contribution: {
            columns: {
              magic_version: {
                previous_columns: [{
                  table: 'contribution',
                  column: 'magic_version'
                }],
                next_columns: [{
                  table: 'location',
                  column: 'version'
                }]
              }
            }
          }
        }
      };
      const modelChanges = {
        renaming_columns: [{
          table: 'contribution',
          column: 'magic_version',
          next_column: {
            table: 'location',
            column: 'version'
          }
        }]
      };
      dataModelChangesModelTest(model, modelChanges);
    });

    it('should make a list of merged columns', () => {
      const model = {
        magic_version: '2.5',
        tables: {
          contribution: {
            columns: {
              magic_version: {
                previous_columns: [{
                  table: 'contribution',
                  column: 'magic_version_1'
                }, {
                  table: 'contribution',
                  column: 'magic_version_2'
                }],
                next_columns: [{
                  table: 'contribution',
                  column: 'magic_version'
                }]
              }
            }
          }
        }
      };
      const modelChanges = {
        merged_columns: [{
          table: 'contribution',
          column: 'magic_version',
          previous_columns: [{
            table: 'contribution',
            column: 'magic_version_1'
          }, {
            table: 'contribution',
            column: 'magic_version_2'
          }]
        }]
      };
      dataModelChangesModelTest(model, modelChanges);
    });

    it('should make a list of splitting columns', () => {
      const model = {
        magic_version: '2.5',
        tables: {
          contribution: {
            columns: {
              magic_version: {
                previous_columns: [{
                  table: 'contribution',
                  column: 'magic_version'
                }],
                next_columns: [{
                  table: 'contribution',
                  column: 'magic_version_1'
                }, {
                  table: 'contribution',
                  column: 'magic_version_2'
                }]
              }
            }
          }
        }
      };
      const modelChanges = {
        splitting_columns: [{
          table: 'contribution',
          column: 'magic_version',
          next_columns: [{
            table: 'contribution',
            column: 'magic_version_1'
          }, {
            table: 'contribution',
            column: 'magic_version_2'
          }]
        }]
      };
      dataModelChangesModelTest(model, modelChanges);
    });

    it('should make lists of changes with the 2.0 model', () => {
      dataModelChangesNoWarningNoErrorTest(model20);
    });

    it('should make lists of changes with the 2.1 model', () => {
      dataModelChangesNoWarningNoErrorTest(model21);
    });

    it('should make lists of changes with the 2.2 model', () => {
      dataModelChangesNoWarningNoErrorTest(model22);
    });

    it('should make lists of changes with the 2.3 model', () => {
      dataModelChangesNoWarningNoErrorTest(model23);
    });

    it('should make lists of changes with the 2.4 model', () => {
      dataModelChangesNoWarningNoErrorTest(model24);
    });

    it('should make lists of changes with the 2.5 model', () => {
      dataModelChangesNoWarningNoErrorTest(model25);
    });

    it('should make lists of changes with the 3.0 model', () => {
      dataModelChangesNoWarningNoErrorTest(model30);
    });

  });

});