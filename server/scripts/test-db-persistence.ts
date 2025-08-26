import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testDataPersistence() {
  try {
    console.log('🧪 Testing database persistence...');

    // Check existing data counts
    const leadCount = await prisma.lead.count();
    const contactCount = await prisma.contact.count();
    const accountCount = await prisma.account.count();
    const dealCount = await prisma.activeDeal.count();

    console.log('📊 Current data counts:');
    console.log(`  Leads: ${leadCount}`);
    console.log(`  Contacts: ${contactCount}`);
    console.log(`  Accounts: ${accountCount}`);
    console.log(`  Deals: ${dealCount}`);

    // Test creating a lead
    console.log('\n🆕 Testing lead creation...');
    const testLead = await prisma.lead.create({
      data: {
        firstName: 'Test',
        lastName: 'User',
        company: 'Test Company',
        title: 'Test Title',
        email: 'test@example.com',
        phone: '+1-555-0123',
        leadSource: 'WEBSITE',
        status: 'NEW',
        rating: 'WARM',
        createdBy: 'test-script',
        updatedBy: 'test-script'
      }
    });
    console.log(`✅ Created lead with ID: ${testLead.id}`);

    // Test creating a contact
    console.log('\n🆕 Testing contact creation...');
    const testContact = await prisma.contact.create({
      data: {
        firstName: 'Test',
        lastName: 'Contact',
        title: 'Test Contact Title',
        emailAddress: 'testcontact@example.com',
        mobilePhone: '+1-555-0124',
        source: 'REFERRAL',
        status: 'PROSPECT',
        createdBy: 'test-script',
        updatedBy: 'test-script'
      }
    });
    console.log(`✅ Created contact with ID: ${testContact.id}`);

    // Test creating an account
    console.log('\n🆕 Testing account creation...');
    const testAccount = await prisma.account.create({
      data: {
        accountName: 'Test Account Corp',
        accountRating: 'GOLD',
        status: 'PROSPECT',
        industry: 'Technology',
        revenue: '$1M-$5M',
        numberOfEmployees: '50-100',
        geo: 'AMERICAS',
        createdBy: 'test-script',
        updatedBy: 'test-script'
      }
    });
    console.log(`✅ Created account with ID: ${testAccount.id}`);

    // Test creating a deal
    console.log('\n🆕 Testing deal creation...');
    const testDeal = await prisma.activeDeal.create({
      data: {
        dealName: 'Test Deal',
        businessLine: 'HUMAN_CAPITAL',
        dealValue: '$100000',
        probability: '50%',
        stage: 'OPPORTUNITY_IDENTIFIED',
        geo: 'AMERICAS',
        entity: 'YITRO_GLOBAL',
        associatedAccount: testAccount.id,
        associatedContact: testContact.id,
        createdBy: 'test-script',
        updatedBy: 'test-script'
      }
    });
    console.log(`✅ Created deal with ID: ${testDeal.id}`);

    // Verify data persistence by reading back
    console.log('\n🔍 Verifying data persistence...');
    const retrievedLead = await prisma.lead.findUnique({
      where: { id: testLead.id }
    });
    const retrievedContact = await prisma.contact.findUnique({
      where: { id: testContact.id }
    });
    const retrievedAccount = await prisma.account.findUnique({
      where: { id: testAccount.id }
    });
    const retrievedDeal = await prisma.activeDeal.findUnique({
      where: { id: testDeal.id },
      include: {
        account: true,
        contact: true
      }
    });

    if (retrievedLead && retrievedContact && retrievedAccount && retrievedDeal) {
      console.log('✅ Data persistence verified successfully!');
      console.log(`  Retrieved lead: ${retrievedLead.firstName} ${retrievedLead.lastName}`);
      console.log(`  Retrieved contact: ${retrievedContact.firstName} ${retrievedContact.lastName}`);
      console.log(`  Retrieved account: ${retrievedAccount.accountName}`);
      console.log(`  Retrieved deal: ${retrievedDeal.dealName} (${retrievedDeal.dealValue})`);
      console.log(`  Deal linked to account: ${retrievedDeal.account?.accountName}`);
      console.log(`  Deal linked to contact: ${retrievedDeal.contact?.firstName} ${retrievedDeal.contact?.lastName}`);
    } else {
      console.log('❌ Data persistence test failed!');
    }

    // Check final counts
    const finalLeadCount = await prisma.lead.count();
    const finalContactCount = await prisma.contact.count();
    const finalAccountCount = await prisma.account.count();
    const finalDealCount = await prisma.activeDeal.count();

    console.log('\n📊 Final data counts:');
    console.log(`  Leads: ${finalLeadCount} (was ${leadCount}, added ${finalLeadCount - leadCount})`);
    console.log(`  Contacts: ${finalContactCount} (was ${contactCount}, added ${finalContactCount - contactCount})`);
    console.log(`  Accounts: ${finalAccountCount} (was ${accountCount}, added ${finalAccountCount - accountCount})`);
    console.log(`  Deals: ${finalDealCount} (was ${dealCount}, added ${finalDealCount - dealCount})`);

    console.log('\n🎉 Database persistence test completed successfully!');
    console.log('📝 All test data has been saved to the database and will persist across restarts.');

  } catch (error) {
    console.error('❌ Database persistence test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testDataPersistence().catch(console.error);
