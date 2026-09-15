// One-off seed script for the watan master list - run manually
// (`node src/scripts/seedWatanMaster.js`), not on every server boot, so
// production data isn't silently reset by a deploy.
//
// This list is a reasonable starting set of common watans, not an
// authoritative one - edit WATANS below (or add through the DB directly)
// to match the real list before relying on it.
require('dotenv').config();
const mongoose = require('mongoose');
const config = require('../config/env');
const WatanMaster = require('../models/WatanMaster');
const logger = require('../utils/logger');

const WATANS = [
  'Surat',
  'Mumbai',
  'Ujjain',
  'Indore',
  'Burhanpur',
  'Sidhpur',
  'Ahmedabad',
  'Vadodara',
  'Jamnagar',
  'Rajkot',
  'Bharuch',
  'Navsari',
  'Rander',
  'Dahod',
  'Kapadvanj',
  'Petlad',
  'Patan',
  'Kheda',
  'Nadiad',
  'Anjar',
  'Bhavnagar',
  'Junagadh',
  'Porbandar',
  'Veraval',
  'Karachi',
  'Hyderabad',
  'Lahore',
  'Colombo',
  'Nairobi',
  'Dar es Salaam',
  'Zanzibar',
  'Pune',
  'Solapur',
  'Aurangabad',
  'Nagpur',
];

async function seed() {
  await mongoose.connect(config.mongo.uri);

  const result = await WatanMaster.bulkWrite(
    WATANS.map((name) => ({
      updateOne: {
        filter: { name },
        update: { $setOnInsert: { name } },
        upsert: true,
      },
    }))
  );

  logger.logInfo(1, 0, 'Watan master seed complete', {
    upserted: result.upsertedCount,
    matched: result.matchedCount,
  });

  await mongoose.disconnect();
}

seed().catch((err) => {
  logger.logException('Watan master seed failed', err);
  process.exit(1);
});
