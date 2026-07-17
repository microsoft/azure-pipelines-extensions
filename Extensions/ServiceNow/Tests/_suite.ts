// ServiceNow Extension - Test Suite Aggregator
//
// This file imports all task-wise test modules.
// Run with: npx mocha "_build/Extensions/ServiceNow/Tests/_suite.js" --timeout 10000

import './Tasks/CreateAndQueryChangeRequest/createTaskTests';
import './Tasks/UpdateChangeRequest/updateTaskTests';
import './manifestTests';
import './ciScriptsTests';
import './validationTests';
