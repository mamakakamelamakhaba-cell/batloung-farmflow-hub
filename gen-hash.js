import bcrypt from 'bcrypt';

const adminHash = await bcrypt.hash('admin123', 10);
const vendorHash = await bcrypt.hash('vendor123', 10);
console.log('Admin hash:', adminHash);
console.log('Vendor hash:', vendorHash);

// Verify
const adminCheck = await bcrypt.compare('admin123', adminHash);
const vendorCheck = await bcrypt.compare('vendor123', vendorHash);
console.log('Admin verify:', adminCheck);
console.log('Vendor verify:', vendorCheck);