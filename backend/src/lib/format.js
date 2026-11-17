export const baht = (n) => n.toLocaleString('th-TH', { style: 'currency', currency: 'THB' });

export const roundMoney = (n) => Math.round(n * 100) / 100;
