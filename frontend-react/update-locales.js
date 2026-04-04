import fs from 'fs';

const enNew = {
  'earnings_summary': 'Earnings Summary',
  'settlement_desc': 'Total revenue from delivered orders.',
  'pending_payouts': 'Pending Payouts',
  'potential_revenue': 'Potential Revenue',
  'latest_activity': 'Latest Activity',
  'check_orders_desc': 'Manage and track your latest incoming orders from retailers.',
  'manage_orders': 'Manage orders'
};

const hiNew = {
  'earnings_summary': 'कमाई का सारांश',
  'settlement_desc': 'वितरित ऑर्डर्स से कुल आय।',
  'pending_payouts': 'लंबित भुगतान',
  'potential_revenue': 'संभावित आय',
  'latest_activity': 'नवीनतम गतिविधि',
  'check_orders_desc': 'रिटेलर्स से आने वाले अपने नवीनतम ऑर्डर्स को मैनेज और ट्रैक करें।',
  'manage_orders': 'ऑर्डर मैनेज करें'
};

const knNew = {
  'earnings_summary': 'ಗಳಿಕೆಯ ಸಾರಾಂಶ',
  'settlement_desc': 'ತಲುಪಿಸಿದ ಆರ್ಡರ್‌ಗಳಿಂದ ಒಟ್ಟು ಆದಾಯ.',
  'pending_payouts': 'ಬಾಕಿ ಇರುವ ಪಾವತಿ',
  'potential_revenue': 'ಸಂಭಾವ್ಯ ಆದಾಯ',
  'latest_activity': 'ಇತ್ತೀಚಿನ ಚಟುವಟಿಕೆ',
  'check_orders_desc': 'ಚಿಲ್ಲರೆ ವ್ಯಾಪಾರಿಗಳಿಂದ ನಿಮ್ಮ ಇತ್ತೀಚಿನ ಒಳಬರುವ ಆರ್ಡರ್‌ಗಳನ್ನು ನಿರ್ವಹಿಸಿ ಮತ್ತು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ.',
  'manage_orders': 'ಆರ್ಡರ್‌ಗಳನ್ನು ನಿರ್ವಹಿಸಿ'
};

function updateFile(path, newKeys) {
  let data = JSON.parse(fs.readFileSync(path, 'utf8'));
  data = { ...data, ...newKeys };
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
}

updateFile('public/locales/en.json', enNew);
updateFile('public/locales/hi.json', hiNew);
updateFile('public/locales/kn.json', knNew);

console.log('Successfully updated locales for earnings tracker!');
