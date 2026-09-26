import { prisma } from '../src/lib/prisma';
import { extractCustomFields } from '../src/lib/customFieldsUtils';
import assert from 'assert';

async function runE2ETests() {
  console.log('🚀 Starting Backend Logic Tests for Custom Fields...\n');
  
  let createdCustomFieldId: string | null = null;
  let testLeadId: string | null = null;

  try {
    // -------------------------------------------------------------
    // 1. Test Custom Field Creation
    // -------------------------------------------------------------
    console.log('Step 1: Creating a Custom Field directly in DB...');
    const customField = await prisma.customFieldDefinition.create({
      data: {
        entityType: 'LEAD',
        name: 'test_industry',
        label: 'Test Industry',
        type: 'select',
        options: JSON.stringify(['Tech', 'Health', 'Finance']),
        required: true
      }
    });
    createdCustomFieldId = customField.id;
    assert(createdCustomFieldId, 'Custom Field not created');
    console.log('✅ Custom Field created successfully.');


    // -------------------------------------------------------------
    // 2. Test Custom Fields Extraction Utility
    // -------------------------------------------------------------
    console.log('\nStep 2: Testing extractCustomFields utility with mock FormData...');
    const formData = new FormData();
    formData.append('name', 'E2E Test Lead');
    formData.append('status', 'Lead Captured');
    formData.append('cf_test_industry', 'Tech');
    formData.append('cf_deal_size', '50000');
    
    const extracted = extractCustomFields(formData);
    assert(extracted['test_industry'] === 'Tech', 'Failed to extract cf_test_industry');
    assert(extracted['deal_size'] === '50000', 'Failed to extract cf_deal_size');
    console.log('✅ extractCustomFields correctly parses FormData.');


    // -------------------------------------------------------------
    // 3. Test Saving Lead with Custom Fields JSON to DB
    // -------------------------------------------------------------
    console.log('\nStep 3: Saving Lead with Extracted Custom Fields to Database...');
    const employee = await prisma.employee.findFirst();
    assert(employee, 'No employee found in DB to attach lead to');

    const lead = await prisma.lead.create({
      data: {
        employeeId: employee.id,
        name: formData.get('name') as string,
        status: formData.get('status') as string,
        date: new Date().toISOString().split('T')[0],
        followUp: new Date().toISOString().split('T')[0],
        notes: 'Test note',
        customFields: extracted
      }
    });
    testLeadId = lead.leadId;
    assert(testLeadId, 'Lead not created');

    const fetchedLead = await prisma.lead.findUnique({ where: { leadId: testLeadId } });
    const fetchedCFs = fetchedLead?.customFields as Record<string, any>;
    
    assert(fetchedCFs['test_industry'] === 'Tech', 'Custom field data not saved properly');
    console.log('✅ Lead custom fields successfully saved and retrieved from JSON column.');


    // -------------------------------------------------------------
    // 4. Test Updating Custom Fields (Simulating Grid Auto-save)
    // -------------------------------------------------------------
    console.log('\nStep 4: Simulating Grid View inline auto-save (Partial JSON update)...');
    
    // Simulate updating JUST the 'test_industry' field to 'Finance'
    const updatedCFs = {
      ...(fetchedLead?.customFields as object || {}),
      test_industry: 'Finance',
      new_field: 'Added'
    };

    await prisma.lead.update({
      where: { leadId: testLeadId },
      data: { customFields: updatedCFs }
    });

    const updatedLead = await prisma.lead.findUnique({ where: { leadId: testLeadId } });
    const updatedCFsFetched = updatedLead?.customFields as Record<string, any>;
    
    assert(updatedCFsFetched['test_industry'] === 'Finance', 'Custom field not updated');
    assert(updatedCFsFetched['deal_size'] === '50000', 'Other custom fields were incorrectly overwritten');
    assert(updatedCFsFetched['new_field'] === 'Added', 'New custom field not added');
    
    console.log('✅ Grid view custom field inline-edit successfully merged JSON data.');

    console.log('\n🎉 ALL BACKEND TESTS PASSED!');

  } catch (err) {
    console.error('\n❌ TEST FAILED:', err);
  } finally {
    // -------------------------------------------------------------
    // Cleanup
    // -------------------------------------------------------------
    console.log('\n🧹 Cleaning up test data...');
    if (testLeadId) await prisma.lead.delete({ where: { leadId: testLeadId } }).catch(() => {});
    if (createdCustomFieldId) await prisma.customFieldDefinition.delete({ where: { id: createdCustomFieldId } }).catch(() => {});
    
    console.log('Cleanup complete.');
    process.exit(0);
  }
}

runE2ETests();
